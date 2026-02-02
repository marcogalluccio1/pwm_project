import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";

export const getMyRestaurantStats = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ sellerId: req.user.id }).select("_id name");
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const restaurantObjectId = new mongoose.Types.ObjectId(restaurant._id);

    const totalsAgg = await Order.aggregate([
      { $match: { restaurantId: restaurantObjectId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          revenueTotal: { $sum: "$total" },
        },
      },
    ]);

    const totalOrders = totalsAgg[0]?.totalOrders ?? 0;
    const revenueTotal = totalsAgg[0]?.revenueTotal ?? 0;
    const avgOrderValue = totalOrders > 0 ? revenueTotal / totalOrders : 0;

    const byStatusAgg = await Order.aggregate([
      { $match: { restaurantId: restaurantObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const ordersByStatus = {
      ordered: 0,
      preparing: 0,
      delivering: 0,
      delivered: 0,
    };

    for (const row of byStatusAgg) {
      if (row?._id && row._id in ordersByStatus) {
        ordersByStatus[row._id] = row.count;
      }
    }

    const topMealsAgg = await Order.aggregate([
      { $match: { restaurantId: restaurantObjectId } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.mealId",
          mealName: { $first: "$items.nameSnapshot" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.priceSnapshot"] },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    const topMeals = topMealsAgg.map((m) => ({
      mealId: m._id,
      name: m.mealName,
      totalQuantity: m.totalQuantity,
      totalRevenue: m.totalRevenue,
    }));

    return res.json({
      restaurant: { id: restaurant._id, name: restaurant.name },
      totalOrders,
      revenueTotal,
      avgOrderValue,
      ordersByStatus,
      topMeals,
    });
  } catch (err) {
    console.error("GET_MY_RESTAURANT_STATS_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
