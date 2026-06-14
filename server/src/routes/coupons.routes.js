import { Router } from 'express';
import { getCoupons, create, update, remove, validateCoupon } from '../controllers/coupons.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { createCouponSchema, updateCouponSchema } from '../utils/validators.js';

const router = Router();

// Validate endpoint (accessible by employee/cashier)
router.post('/validate', authenticate, requireRole('admin', 'employee'), validateCoupon);

// Require admin role for all other coupon operations
router.use(authenticate, requireRole('admin'));


router.get('/', getCoupons);
router.post('/', validate(createCouponSchema), create);
router.put('/:id', validate(updateCouponSchema), update);
router.delete('/:id', remove);

export default router;
