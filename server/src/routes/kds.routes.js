import { Router } from 'express';
import { getOrders, stageOrder, completeItem } from '../controllers/kds.controller.js';

const router = Router();

// GET /api/v1/kds/orders
router.get('/orders', getOrders);

// PUT /api/v1/kds/orders/:id/stage
router.put('/orders/:id/stage', stageOrder);

// PUT /api/v1/kds/items/:id/complete
router.put('/items/:id/complete', completeItem);

export default router;
