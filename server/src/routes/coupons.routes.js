import { Router } from 'express';
import { getCoupons, create, update, remove, validateCoupon } from '../controllers/coupons.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createCouponSchema, updateCouponSchema } from '../utils/validators.js';

const router = Router();

// POST /coupons/validate — any authenticated user (employee or admin)
// Must be registered BEFORE the requireRole('admin') middleware below.
router.post('/validate', authenticate, validateCoupon);

// All remaining coupon CRUD requires admin role
router.use(authenticate, requireRole('admin'));

router.get('/', getCoupons);
router.post('/', validate(createCouponSchema), create);
router.put('/:id', validate(updateCouponSchema), update);
router.delete('/:id', remove);

export default router;
