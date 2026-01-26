import mongoose from "mongoose";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Meal from "../models/Meal.js";
import User from "../models/User.js";

function toNumberEnv(key, fallback) {
  const n = Number(process.env[key]);
  return Number.isFinite(n) ? n : fallback;
}

//delivery is not implemented yet
function calculateDeliveryFee(distanceKm) {
  const baseFee = toNumberEnv("DELIVERY_BASE_FEE", 0);
  const perKm = toNumberEnv("DELIVERY_COST_PER_KM", 0);
  const minFee = toNumberEnv("DELIVERY_MIN_FEE", 0);

  const raw = baseFee + distanceKm * perKm;
  return Math.max(raw, minFee);
}

function getNextStatusesFor(current) {
  switch (current) {
    case "ordered":
      return ["preparing"];
    case "preparing":
      return ["delivered"];
    case "delivered":
      return [];
    default:
      return [];
  }
}


export const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, fulfillment, deliveryAddress, distanceKm } = req.body;

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ message: "Invalid restaurantId" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items must be a non-empty array" });
    }

    if (!["pickup", "delivery"].includes(fulfillment)) {
      return res.status(400).json({ message: "fulfillment must be pickup or delivery" });
    }


    //  !!Delivery is not supported at this moment!!
    if (fulfillment !== "pickup") {
      return res.status(400).json({
        message: "Delivery is currently disabled. Only pickup orders are allowed.",
      });
    }

    if (fulfillment === "delivery") {
      if (!deliveryAddress || typeof deliveryAddress !== "string" || !deliveryAddress.trim()) {
        return res.status(400).json({ message: "deliveryAddress is required for delivery orders" });
      }
    }

    const restaurant = await Restaurant.findById(restaurantId).select("menuItems name");
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const menuMap = new Map(
      (restaurant.menuItems || []).map((it) => [it.mealId.toString(), Number(it.price)])
    );

    const userId = req.user.id;
    const user = await User.findById(userId);

    //payment method validation
    const resolvedPaymentMethod = user?.payment?.method;


    if (!resolvedPaymentMethod) {
      return res.status(400).json({
        code: "PAYMENT_METHOD_MISSING",
        message: "Payment method is required to place an order. Set it in your profile."
      });
    }

    //items validation
    const normalized = [];
    const requestedMealIds = [];

    for (const it of items) {
      if (!it?.mealId || !mongoose.Types.ObjectId.isValid(it.mealId)) {
        return res.status(400).json({ message: "Each item must include a valid mealId" });
      }
      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: "Each item must include a valid quantity (>= 1)" });
      }

      const key = it.mealId.toString();

      if (!menuMap.has(key)) {
        return res.status(400).json({
          message: "One or more meals are not in the restaurant menu",
          mealId: key,
        });
      }

      const objId = new mongoose.Types.ObjectId(it.mealId);
      normalized.push({ mealId: objId, quantity: qty });
      requestedMealIds.push(objId);
    }

    const meals = await Meal.find({ _id: { $in: requestedMealIds } }).select("_id name");
    const nameMap = new Map(meals.map((m) => [m._id.toString(), m.name]));

    if (meals.length !== requestedMealIds.length) {
      return res.status(404).json({ message: "One or more meals were not found" });
    }

    let subtotal = 0;
    const orderItems = normalized.map((it) => {
      const idStr = it.mealId.toString();
      const price = menuMap.get(idStr);
      const name = nameMap.get(idStr);

      subtotal += price * it.quantity;

      return {
        mealId: it.mealId,
        nameSnapshot: name,
        priceSnapshot: price,
        quantity: it.quantity,
      };
    });

    const total = subtotal;

    const prepMinutes = toNumberEnv("PREP_MINUTES_PER_ORDER", 10);

    const queueCount = await Order.countDocuments({
      restaurantId: restaurant._id,
      status: { $in: ["ordered", "preparing"] },
    });

    const waitMinutes = (queueCount + 1) * prepMinutes;

    const estimatedReadyAt = new Date(Date.now() + waitMinutes * 60 * 1000);

    const order = await Order.create({
      customerId: req.user.id,
      restaurantId: restaurant._id,
      items: orderItems,
      fulfillment,
      subtotal,
      deliveryFee: 0,
      total,
      paymentMethod: resolvedPaymentMethod,
      estimatedReadyAt,
      status: "ordered",
    });

    return res.status(201).json({ order });
  } catch (err) {
    console.error("CREATE_ORDER_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = { customerId: req.user.id };

    if (type === "active") {
      filter.status = { $ne: "delivered" };
    } else if (type === "past") {
      filter.status = "delivered";
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "restaurantId", select: "name city address" });

    return res.json({ orders });
  } catch (err) {
    console.error("GET_MY_ORDERS_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = await Order.findById(id)
      .populate({ path: "restaurantId", select: "name city address sellerId" })
      .populate({ path: "customerId", select: "email firstName lastName" });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.user.role === "customer" && String(order.customerId?._id) === String(req.user.id)) {
      return res.json({ order });
    }

    if (
      req.user.role === "seller" &&
      order.restaurantId &&
      String(order.restaurantId.sellerId) === String(req.user.id)
    ) {
      return res.json({ order });
    }

    return res.status(403).json({ message: "Forbidden" });
  } catch (err) {
    console.error("GET_ORDER_BY_ID_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMyRestaurantOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const restaurant = await Restaurant.findOne({ sellerId: req.user.id }).select("_id name");
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const filter = { restaurantId: restaurant._id };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "customerId", select: "email firstName lastName" });

    return res.json({ orders });
  } catch (err) {
    console.error("GET_MY_RESTAURANT_ORDERS_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: nextStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Order not found" });
    }

    //delivry is not enabled at the moment
    if (nextStatus === "delivering") {
      return res.status(400).json({ message: "Delivery is currently disabled." });
    }

    if (!["ordered", "preparing", "delivered"].includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const restaurant = await Restaurant.findById(order.restaurantId).select("sellerId");
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    if (String(restaurant.sellerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allowedNext = getNextStatusesFor(order.status);

    if (!allowedNext.includes(nextStatus)) {
      return res.status(400).json({
        message: `Invalid status transition from ${order.status} to ${nextStatus}`,
      });
    }

    if (order.fulfillment === "pickup" && nextStatus === "delivering") {
      return res.status(400).json({ message: "Pickup orders cannot be set to delivering" });
    }

    order.status = nextStatus;
    await order.save();

    return res.json({ order });
  } catch (err) {
    console.error("UPDATE_ORDER_STATUS_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const confirmDelivered = async (req, res) => {
  return res.status(400).json({ message: "Delivery is currently disabled." });
  
  //delivery is not implemented yet
};
