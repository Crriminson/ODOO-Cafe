import { Router } from 'express';
import { getPaymentMethods, updatePaymentMethods }
  from '../controllers/settings.controller.js';
import { validate }     from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole }  from '../middleware/requireRole.js';
import { updatePaymentMethodsSchema } from '../utils/validators.js';

const router = Router();

// ─── Payment Methods ──────────────────────────────────────────────────────────

// GET    /api/v1/settings/payment-methods   — any authenticated user
router.get('/payment-methods', authenticate,                                                           getPaymentMethods);

// PUT    /api/v1/settings/payment-methods   — admin only
router.put('/payment-methods', authenticate, requireRole('admin'), validate(updatePaymentMethodsSchema), updatePaymentMethods);

// ─── App Settings (round-2 — do not implement yet) ───────────────────────────
// router.get('/',  authenticate, requireRole('admin'), getAppSettings);
// router.put('/',  authenticate, requireRole('admin'), validate(updateAppSettingsSchema), updateAppSettings);

export default router;
