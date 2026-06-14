import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getOrders,
  createOrder,
  getOrderById,
  updateOrder,
  sendOrderToKitchen,
  deleteOrder,
  payOrderController,
} from '../controllers/orders.controller.js';

const router = Router();

// GET /orders -> requireAuth -> getOrders
router.get('/', requireAuth, getOrders);

// POST /orders -> requireAuth -> createOrder
router.post('/', requireAuth, createOrder);

// GET /orders/:id -> requireAuth -> getOrderById
router.get('/:id', requireAuth, getOrderById);

// PUT /orders/:id -> requireAuth -> updateOrder
router.put('/:id', requireAuth, updateOrder);

// POST /orders/:id/send -> requireAuth -> sendOrderToKitchen
router.post('/:id/send', requireAuth, sendOrderToKitchen);

// POST /orders/:id/pay -> requireAuth -> payOrderController
router.post('/:id/pay', requireAuth, payOrderController);

// DELETE /orders/:id -> requireAuth -> deleteOrder
router.delete('/:id', requireAuth, deleteOrder);

export default router;

