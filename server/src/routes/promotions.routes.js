import { Router } from 'express';
import { getPromotions, create, update, remove } from '../controllers/promotions.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createPromotionSchema, updatePromotionSchema } from '../utils/validators.js';

const router = Router();

// Require admin role for all promotion operations
router.use(authenticate, requireRole('admin'));

router.get('/', getPromotions);
router.post('/', validate(createPromotionSchema), create);
router.put('/:id', validate(updatePromotionSchema), update);
router.delete('/:id', remove);

export default router;
