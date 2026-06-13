import { Router } from 'express';
import { getCategories } from '../controllers/categories.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/categories
router.get('/', getCategories);

export default router;
