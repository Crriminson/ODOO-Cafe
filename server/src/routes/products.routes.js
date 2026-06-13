import { Router } from 'express';
import { getProducts } from '../controllers/products.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/products
router.get('/', getProducts);

export default router;
