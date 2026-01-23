import express from "express";
import {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
} from "../controllers/restaurantController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getRestaurants);
router.get("/:id", getRestaurantById);

router.post("/", requireAuth, requireRole("seller"), createRestaurant);

export default router;
