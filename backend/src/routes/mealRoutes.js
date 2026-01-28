/**
* @swagger
* tags:
*   - name: Meals
*     description: Global meals catalog and custom meals
*/

import express from "express";
import { getMeals, getMealById, createCustomMeal, getSelectableMeals, getMyCustomMeals, updateCustomMeal, deleteCustomMeal } from "../controllers/mealController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/meals/mine/custom:
 *   get:
 *     tags: [Meals]
 *     summary: Get my custom meals (seller only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 *       401: { description: Missing or invalid token }
 *       403: { description: Forbidden (not seller) }
 */
router.get("/mine/custom", requireAuth, requireRole("seller"), getMyCustomMeals);

/**
* @swagger
* /api/meals:
*   get:
*     tags: [Meals]
*     summary: Search meals (public)
*     description: Filter meals by category, name and ingredients.
*     parameters:
*       - in: query
*         name: name
*         schema: { type: string }
*         description: Partial match on meal name (case-insensitive)
*       - in: query
*         name: category
*         schema: { type: string }
*         description: Partial match on meal category/type (case-insensitive)
*       - in: query
*         name: ingredient
*         schema: { type: string }
*         description: Comma-separated ingredients (e.g. "onion,garlic") - must all be present
*     responses:
*       200: { description: OK (list of meals) }
*       400: { description: Invalid query parameters }
*/
router.get("/", getMeals);

/**
 * @swagger
 * /api/meals/selectable:
 *   get:
 *     tags: [Meals]
 *     summary: Get selectable meals for menu (seller only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 *       401: { description: Missing or invalid token }
 *       403: { description: Forbidden (not seller) }
 */
router.get("/selectable", requireAuth, requireRole("seller"), getSelectableMeals);

/**
* @swagger
* /api/meals/{id}:
*   get:
*     tags: [Meals]
*     summary: Get meal details by ID (public)
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema: { type: string }
*     responses:
*       200: { description: OK (meal details) }
*       404: { description: Meal not found }
*/
router.get("/:id", getMealById);

/**
* @swagger
* /api/meals:
*   post:
*     tags: [Meals]
*     summary: Create a custom meal (seller only)
*     security:
*       - bearerAuth: []
*     description: Creates a seller-owned custom meal (not part of the global JSON catalog).
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required: [name, category, thumbnailUrl, ingredients]
*             properties:
*               name: { type: string }
*               category: { type: string }
*               thumbnailUrl: { type: string, description: "Public URL of the meal image" }
*               ingredients:
*                 type: array
*                 items: { type: string }
*     responses:
*       201: { description: Created (custom meal created) }
*       400: { description: Invalid input data }
*       401: { description: Missing or invalid token }
*       403: { description: Forbidden (not seller) }
*/
router.post("/", requireAuth, requireRole("seller"), createCustomMeal);

/**
* @swagger
* /api/meals/{id}:
*   put:
*     tags: [Meals]
*     summary: Update my custom meal (seller only)
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema: { type: string }
*     responses:
*       200: { description: OK }
*       400: { description: Invalid input data }
*       401: { description: Missing or invalid token }
*       403: { description: Forbidden (not seller) }
*       404: { description: Meal not found }
*/
router.put("/:id", requireAuth, requireRole("seller"), updateCustomMeal);

/**
 * @swagger
 * /api/meals/{id}:
 *   delete:
 *     tags: [Meals]
 *     summary: Delete my custom meal (seller only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       401: { description: Missing or invalid token }
 *       403: { description: Forbidden (not seller) }
 *       404: { description: Meal not found }
 */
router.delete("/:id", requireAuth, requireRole("seller"), deleteCustomMeal);

export default router;
