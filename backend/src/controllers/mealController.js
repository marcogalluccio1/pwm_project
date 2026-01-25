import Meal from "../models/Meal.js";
import Restaurant from "../models/Restaurant.js";
import mongoose from "mongoose";

export const getMeals = async (req, res) => {
  try {
    const { name, category, ingredient } = req.query;

    const filter = {};

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    if (category) {
      filter.category = { $regex: category, $options: "i" };
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
    const { name, category, thumbnailUrl, ingredients, measures} = req.body;

    if (!name || !category || !thumbnailUrl) {
      return res.status(400).json({ message: "name, category, thumbnailUrl are required" });
    }

    const meal = await Meal.create({
      name,
      category,
      thumbnailUrl,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      measures: Array.isArray(measures) ? measures : [],
      isGlobal: false,
      createdBySellerId: req.user.id,
    });

    res.status(201).json(meal);
  } catch (err) {
    console.error("CREATE_CUSTOM_MEAL_ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCustomMeal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Meal not found" });
    }

    const meal = await Meal.findOne({
      _id: id,
      isGlobal: false,
      createdBySellerId: req.user.id,
    });

    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    const { name, category, thumbnailUrl, ingredients, measures } = req.body;

    if (!name || !category || !thumbnailUrl || !Array.isArray(ingredients)) {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    meal.name = name;
    meal.category = category;
    meal.thumbnailUrl = thumbnailUrl;
    meal.ingredients = ingredients;
    meal.measures = Array.isArray(measures) ? measures : [];

    await meal.save();
    return res.json(meal);
  } catch (err) {
    console.error("UPDATE_CUSTOM_MEAL_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteCustomMeal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Meal not found" });
    }

    const deleted = await Meal.findOneAndDelete({
      _id: id,
      isGlobal: false,
      createdBySellerId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Meal not found" });
    }

    await Restaurant.updateOne(
      { sellerId: req.user.id },
      { $pull: { menuItems: { mealId: deleted._id } } }
    );

    return res.status(204).send();
  } catch (err) {
    console.error("DELETE_CUSTOM_MEAL_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMyCustomMeals = async (req, res) => {
  try {
    const meals = await Meal.find({
      isGlobal: false,
      createdBySellerId: req.user.id,
    }).sort({ name: 1 });

    return res.json(meals);
  } catch (err) {
    console.error("GET_MY_CUSTOM_MEALS_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getSelectableMeals = async (req, res) => {
  try {
    const meals = await Meal.find(
      {
        $or: [
          { isGlobal: true },
          { isGlobal: false, createdBySellerId: req.user.id },
        ],
      },
      "name category thumbnailUrl ingredients"
    ).sort({ name: 1 });

    return res.json(meals);
  } catch (err) {
    console.error("GET_SELECTABLE_MEALS_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

