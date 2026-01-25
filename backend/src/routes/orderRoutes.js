/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order creation and management
 */
import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getMyRestaurantOrders,
  updateOrderStatus,
  confirmDelivered,
} from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order (customer)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [restaurantId, items, fulfillment]
 *             properties:
 *               restaurantId: { type: string }
 *               fulfillment: { type: string, enum: [pickup] }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [mealId, quantity]
 *                   properties:
 *                     mealId: { type: string }
 *                     quantity: { type: number }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Invalid input }
 *       401: { description: Missing/invalid token }
 *       403: { description: Forbidden }
 */
router.post("/", requireAuth, requireRole("customer"), createOrder);

/**
 * @swagger
 * /api/orders/mine:
 *   get:
 *     tags: [Orders]
 *     summary: Get my orders (customer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: false
 *         schema: 
 *             type: string
 *             enum: [active, past]
 *     responses:
 *       200: { description: OK }
 *       401: { description: Missing/invalid token }
 */
router.get("/mine", requireAuth, requireRole("customer"), getMyOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by id (customer owner or restaurant seller)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Missing/invalid token }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
router.get("/:id", requireAuth, getOrderById);

/**
 * @swagger
 * /api/orders/restaurant/mine:
 *   get:
 *     tags: [Orders]
 *     summary: Get orders for my restaurant (seller)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema: { type: string, enum: [ordered, preparing, delivering, delivered] }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Missing/invalid token }
 *       403: { description: Forbidden }
 */
router.get("/restaurant/mine", requireAuth, requireRole("seller"), getMyRestaurantOrders);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     tags: [Orders]
 *     summary: Update order status (seller)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [preparing, delivering, delivered] }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Invalid transition }
 *       401: { description: Missing/invalid token }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
router.put("/:id/status", requireAuth, requireRole("seller"), updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/confirm-delivered:
 *   post:
 *     tags: [Orders]
 *     summary: Confirm delivered (customer) (Deliveries are not supported at the moment)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Order is not delivering }
 *       401: { description: Missing/invalid token }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
router.post("/:id/confirm-delivered", requireAuth, requireRole("customer"), confirmDelivered);

export default router;
