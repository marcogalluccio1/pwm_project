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

      normalizedMap.set(it.mealId.toString(), {
        mealId: new mongoose.Types.ObjectId(it.mealId),
        price: p,
      });
    }

    const normalized = Array.from(normalizedMap.values());

    const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    //verify all meals exist
    if (normalized.length > 0) {
      const ids = normalized.map((i) => i.mealId);

      const foundMeals = await Meal.find({ _id: { $in: ids } })
        .select("_id isGlobal createdBySellerId")
        .lean();

      if (foundMeals.length !== ids.length) {
        const foundSet = new Set(foundMeals.map((m) => m._id.toString()));
        const missing = ids.filter((id) => !foundSet.has(id.toString()));
        return res.status(404).json({ message: "Some meals were not found", missing });
      }

      //allow to add global meals, and allow custom meals only if created by the same seller
      const sellerId = String(req.user.id);
      const notAllowed = foundMeals
        .filter((m) => m.isGlobal === false && String(m.createdBySellerId) !== sellerId)
        .map((m) => m._id.toString());

      if (notAllowed.length > 0) {
        return res.status(403).json({
          message: "Some meals are not allowed to be added",
          notAllowed,
        });
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
    const { name, category, ingredient, minPrice, maxPrice } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const restaurant = await Restaurant.findById(id)
      .select("menuItems")
      .populate({
        path: "menuItems.mealId",
        select: "name category thumbnailUrl ingredients",
      });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const ingList = ingredient
      ? String(ingredient)
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const menu = (restaurant.menuItems || [])
      .filter((it) => {
        if (minPrice !== undefined && it.price < Number(minPrice)) return false;
        if (maxPrice !== undefined && it.price > Number(maxPrice)) return false;
        return true;
      })
      .filter((it) => {
        const meal = it.mealId;
        if (!meal) return false;

        if (name && !String(meal.name || "").toLowerCase().includes(String(name).toLowerCase())) {
          return false;
        }

        if (
          category &&
          !String(meal.category || "")
            .toLowerCase()
            .includes(String(category).toLowerCase())
        ) {
          return false;
        }

        if (ingList.length > 0) {
          const mealIngredients = Array.isArray(meal.ingredients)
            ? meal.ingredients.map((x) => String(x).toLowerCase())
            : [];
          const hasAll = ingList.every((ing) => mealIngredients.includes(ing));
          if (!hasAll) return false;
        }

        return true;
      })
      .map((it) => ({
        meal: it.mealId,
        price: it.price,
      }));

    return res.json({ menu });
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

    //return every meal
    const menu = (restaurant.menuItems || []).map((it) => ({
      meal: it.mealId,
      price: it.price,
    }));

    return res.json({ menu });
  } catch (err) {
    console.error("GET_MY_MENU_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
