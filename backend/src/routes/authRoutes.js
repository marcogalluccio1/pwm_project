/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Registration, login and user's profile
 */
import express from "express";
import { register, login, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
* @swagger
* /api/auth/register:
*   post:
*     tags: [Auth]
*     summary: Sign up a new user (customer o seller)
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required: [email, password, role]
*             properties:
*               email: { type: string }
*               password: { type: string }
*               role: { type: string, enum: [customer, seller] }
*               firstName: { type: string }
*               lastName: { type: string }
*               companyName: { type: string }
*               vatNumber: { type: string }
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
*       200: { description: OK (returns token and user) }
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

export default router;
