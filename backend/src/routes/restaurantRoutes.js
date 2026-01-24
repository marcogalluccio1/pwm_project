/**
* @swagger
* tags:
*   - name: Restaurants
*     description: Restaurants management and browsing
*/
import express from "express";
import {
  getRestaurants,
  getRestaurantById,
  getMyRestaurant,
  createRestaurant,
  updateMyRestaurant,
  deleteMyRestaurant,
} from "../controllers/restaurantController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { setMyMenu } from "../controllers/menuController.js";
import { getRestaurantMenu, getMyRestaurantMenu } from "../controllers/menuController.js";

const router = express.Router();

/**
* @swagger
* /api/restaurants:
*   get:
*     tags: [Restaurants]
*     summary: Get all restaurants (public)
*     description: Optional search by city and/or name (case-insensitive partial match).
*     parameters:
*       - in: query
*         name: city
*         schema: { type: string }
*         description: Filter restaurants by city (e.g. Milano)
*       - in: query
*         name: name
*         schema: { type: string }
*         description: Filter restaurants by name (partial match)
*     responses:
*       200: { description: OK (list of restaurants) }
*/
router.get("/", getRestaurants);

/**
 * @swagger
 * /api/restaurants/mine:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get my restaurant (seller only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK (restaurant or null) }
 *       401: { description: Missing or invalid token }
 *       403: { description: Forbidden (not seller) }
 */
router.get("/mine", requireAuth, requireRole("seller"), getMyRestaurant);

/**
 * @swagger
 * /api/restaurants:
 *   post:
 *     tags: [Restaurants]
 *     summary: Create my restaurant (seller only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, address, city]
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *     responses:
 *       201: { description: Created (restaurant created) }
 *       400: { description: Invalid input data }
 *       401: { description: Missing or invalid token }
 *       403: { description: Forbidden (not seller) }
 *       409: { description: Seller already has a restaurant }
 */
router.post("/", requireAuth, requireRole("seller"), createRestaurant);

/**
 * @swagger
 * /api/restaurants/mine:
 *   put:
 *     tags: [Restaurants]
 *     summary: Update my restaurant (seller only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *     responses:
 *       200: { description: OK (updated restaurant) }
 *       400: { description: Invalid input data }
 *       401: { description: Missing or invalid token }
 *       403: { description: Forbidden (not seller) }
 *       404: { description: Restaurant not found }
 */
router.put("/mine", requireAuth, requireRole("seller"), updateMyRestaurant);

/**
 * @swagger
 * /api/restaurants/mine:
 *   delete:
 *     tags: [Restaurants]
 *     summary: Delete my restaurant (seller only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204: { description: Deleted }
 *       401: { description: Missing or invalid token }
 *       403: { description: Forbidden (not seller) }
 *       404: { description: Restaurant not found }
 */
router.delete("/mine", requireAuth, requireRole("seller"), deleteMyRestaurant);

/**
 * @swagger
 * /api/restaurants/mine/menu:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get my restaurant menu (seller only, includes unavailable items)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK (full menu, includes unavailable items) }
 *       401: { description: Missing or invalid token }
 *       403: { description: Forbidden (not seller) }
 *       404: { description: Restaurant not found }
 */
router.get("/mine/menu", requireAuth, requireRole("seller"), getMyRestaurantMenu);

/**
 * @swagger
 * /api/restaurants/{id}/menu:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get restaurant public menu (available items only)
 *     description: Returns the restaurant menu with meal details (name, thumbnail, ingredients) and restaurant-specific price.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK (restaurant menu) }
 *       404: { description: Restaurant not found }
 */
router.get("/:id/menu", getRestaurantMenu);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get restaurant details by ID (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK (restaurant details) }
 *       404: { description: Restaurant not found }
 */
router.get("/:id", getRestaurantById);

/**
 * @swagger
 * /api/restaurants/mine/menu:
 *   put:
 *     tags: [Restaurants]
 *     summary: Set my restaurant menu (replace entire menu) (seller only)
 *     description: Set the menu with the provided items.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [mealId, price]
 *                   properties:
 *                     mealId: { type: string }
 *                     price: { type: number }
 *                     isAvailable: { type: boolean }
 *     responses:
 *       200: { description: OK (updated menu items) }
 *       400: { description: Invalid input data }
 *       401: { description: Missing or invalid token }
 *       403: { description: Forbidden (not seller) }
 *       404: { description: Restaurant not found or some meals not found }
 */
router.put("/mine/menu", requireAuth, requireRole("seller"), setMyMenu);

export default router;