import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import Meal from "../models/Meal.js";

export const setMyMenu = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "items must be an array" });
    }

    //allow empty menu, items can be []

    const normalizedMap = new Map();

    for (const it of items) {
      if (!it?.mealId || typeof it.price === "undefined") {
        return res.status(400).json({ message: "Each item must include mealId and price" });
      }
      if (!mongoose.Types.ObjectId.isValid(it.mealId)) {
        return res.status(400).json({ message: `Invalid mealId: ${it.mealId}` });
      }
      const p = Number(it.price);
      if (!Number.isFinite(p) || p < 0) {
        return res.status(400).json({ message: `Invalid price for mealId ${it.mealId}` });
      }
      if ("isAvailable" in it && typeof it.isAvailable !== "boolean") {
        return res.status(400).json({ message: `isAvailable must be boolean for mealId ${it.mealId}` });
      }

      normalizedMap.set(it.mealId.toString(), {
        mealId: it.mealId,
        price: p,
        isAvailable: "isAvailable" in it ? it.isAvailable : true,
      });
    }

    const normalized = Array.from(normalizedMap.values());

    const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    //verify all meals exist
    if (normalized.length > 0) {
      const ids = normalized.map((i) => i.mealId);
      const found = await Meal.find({ _id: { $in: ids } }).select("_id");
      if (found.length !== ids.length) {
        const foundSet = new Set(found.map((m) => m._id.toString()));
        const missing = ids.filter((id) => !foundSet.has(id.toString()));
        return res.status(404).json({ message: "Some meals were not found", missing });
      }
    }

    //replace menu
    restaurant.menuItems = normalized;
    await restaurant.save();

    return res.status(200).json(restaurant.menuItems);
  } catch (err) {
    console.error("SET_MY_MENU_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getRestaurantMenu = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const restaurant = await Restaurant.findById(id)
      .select("name city menuItems")
      .populate({
        path: "menuItems.mealId",
        select: "name category thumbnailUrl ingredients basePrice isGlobal",
      });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const menu = (restaurant.menuItems || [])
    .filter((it) => it.isAvailable === true)
    .map((it) => ({
      meal: it.mealId,
      price: it.price,
      isAvailable: it.isAvailable,
    }));

    return res.json({
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        city: restaurant.city,
      },
      menu,
    });
  } catch (err) {
    console.error("GET_RESTAURANT_MENU_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMyRestaurantMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ sellerId: req.user.id })
      .select("menuItems")
      .populate({
        path: "menuItems.mealId",
        select: "name category thumbnailUrl ingredients basePrice isGlobal",
      });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    //return every meal, including not available
    const menu = (restaurant.menuItems || []).map((it) => ({
      meal: it.mealId,
      price: it.price,
      isAvailable: it.isAvailable,
    }));

    return res.json({ menu });
  } catch (err) {
    console.error("GET_MY_MENU_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
