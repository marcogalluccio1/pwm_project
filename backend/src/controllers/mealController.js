import Meal from "../models/Meal.js";
import mongoose from "mongoose";

export const getMeals = async (req, res) => {
  try {
    const { name, category, maxPrice, ingredient } = req.query;

    const filter = {};

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    if (maxPrice) {
      const p = Number(maxPrice);
      if (p < 0) {
        return res.status(400).json({ message: "maxPrice must be a positive number" });
      }
      filter.basePrice = { $lte: p };
    }

    if (ingredient) {
      const ingredients = String(ingredient)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (ingredients.length > 0) {
        filter.ingredients = { $all: ingredients };
      }
    }

    const meals = await Meal.find(filter).sort({ name: 1 });
    res.json(meals);
  } catch (err) {
    console.error("GET_MEALS_ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMealById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Meal not found" });
    }

    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: "Meal not found" });

    res.json(meal);
  } catch (err) {
    console.error("GET_MEAL_BY_ID_ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createCustomMeal = async (req, res) => {
  try {
    const { name, category, thumbnailUrl, ingredients, measures, basePrice } = req.body;

    if (!name || !category || !thumbnailUrl) {
      return res.status(400).json({ message: "name, category, thumbnailUrl are required" });
    }

    const price = Number(basePrice);
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ message: "basePrice must be a positive number" });
    }

    const meal = await Meal.create({
      name,
      category,
      thumbnailUrl,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      measures: Array.isArray(measures) ? measures : [],
      basePrice: price,
      isGlobal: false,
      createdBySellerId: req.user.id,
    });

    res.status(201).json(meal);
  } catch (err) {
    console.error("CREATE_CUSTOM_MEAL_ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
