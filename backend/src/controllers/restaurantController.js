import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";

export const getRestaurants = async (req, res) => {
  try {
    const { city, name } = req.query;
    const filter = {};
    if (city) filter.city = { $regex: city, $options: "i" };
    if (name) filter.name = { $regex: name, $options: "i" };

    const restaurants = await Restaurant.find(filter);
    res.json(restaurants);
  } catch (err) {
    console.error("GET_RESTAURANTS_ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (err) {
    console.error("GET_RESTAURANT_BY_ID_ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
    res.json(restaurant);
  } catch (err) {
    console.error("GET_MY_RESTAURANT_ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createRestaurant = async (req, res) => {
  try {
    const { name, phone, address, city } = req.body;

    if (!name || !phone || !address || !city) {
      return res.status(400).json({
        message: "name, phone, address and city are required",
      });
    }

    const existing = await Restaurant.findOne({ sellerId: req.user.id });
    if (existing) {
      return res.status(409).json({ message: "Seller already owns a restaurant" });
    }

    const restaurant = await Restaurant.create({
      sellerId: req.user.id,
      name,
      phone,
      address,
      city,
    });

    return res.status(201).json(restaurant);
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.sellerId) {
      return res.status(409).json({ message: "Seller already owns a restaurant" });
    }
    console.error("CREATE_RESTAURANT_ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const allowed = ["name", "phone", "address", "city"];
    for (const k of allowed) {
      if (k in req.body) {
        restaurant[k] = req.body[k];
      }
    }

    await restaurant.save();
    res.json(restaurant);
  } catch (err) {
    console.error("UPDATE_MY_RESTAURANT_ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ sellerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    await Restaurant.findByIdAndDelete(restaurant._id);
    res.status(204).end();
  } catch (err) {
    console.error("DELETE_MY_RESTAURANT_ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


