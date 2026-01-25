/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Registration, login and user profile
 */
import express from "express";
import { register, login, me, updateMe, deleteMe } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
* @swagger
* /api/auth/register:
*   post:
*     tags: [Auth]
*     summary: Register a new user (customer or seller)
*     description: firstName and lastName are required for all users. For sellers, vatNumber is also required.
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required: [email, password, role, firstName, lastName]
*             properties:
*               email: { type: string }
*               password: { type: string }
*               role: { type: string, enum: [customer, seller] }
*               firstName: { type: string }
*               lastName: { type: string }
*               vatNumber: { type: string, description: "Required if role is seller" }
*     responses:
*       201: { description: Created (returns token + user) }
*       400: { description: Invalid input data }
*       409: { description: Email already registered }
*/
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: User login and JWT generation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: OK (returns token + user) }
 *       400: { description: Missing or invalid data }
 *       401: { description: Invalid credentials }
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK (returns user profile) }
 *       401: { description: Missing or invalid token }
 */
router.get("/me", requireAuth, me);

/**
* @swagger
* /api/auth/me:
*   put:
*     tags: [Auth]
*     summary: Update authenticated user profile
*     description: If payment method is card or prepaid, cardBrand/cardLast4/holderName are required.
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               email: { type: string }
*               firstName: { type: string }
*               lastName: { type: string }
*               vatNumber: { type: string }
*               password: { type: string }
*               payment:
*                 type: object
*                 properties:
*                   method: { type: string, enum: [card, prepaid, cash] }
*                   cardBrand: { type: string }
*                   cardLast4: { type: string }
*                   holderName: { type: string }
*               preferences:
*                 type: object
*                 properties:
*                   favoriteMealTypes:
*                     type: array
*                     items: { type: string }
*                   marketingOptIn: { type: boolean }
*     responses:
*       200: { description: OK (returns updated user) }
*       400: { description: Invalid input data }
*       401: { description: Missing or invalid token }
*       409: { description: Email already registered }
*/

router.put("/me", requireAuth, updateMe);

/**
 * @swagger
 * /api/auth/me:
 *   delete:
 *     tags: [Auth]
 *     summary: Delete authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204: { description: Deleted }
 *       401: { description: Missing or invalid token }
 *       404: { description: User not found }
 *       409: { description: Conflict - active orders prevent deletion }
 */
router.delete("/me", requireAuth, deleteMe);

export default router;
