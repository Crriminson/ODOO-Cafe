import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole }  from '../middleware/requireRole.js';
import {
  summary,
  salesTrend,
  topProducts,
  topCategories,
  topOrders,
} from '../controllers/reports.controller.js';

const router = Router();

// All reports require a logged-in admin
router.use(authenticate, requireRole('admin'));

router.get('/summary',        summary);
router.get('/sales-trend',    salesTrend);
router.get('/top-products',   topProducts);
router.get('/top-categories', topCategories);
router.get('/top-orders',     topOrders);

export default router;
