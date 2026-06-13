import { Router } from 'express';
import {
  getCooks,
  create,
  update,
  remove,
} from '../controllers/cooks.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

// Apply authentication to all cook routes
router.use(authenticate);

// GET /api/v1/cooks
router.get('/', getCooks);

// Write actions require admin role
router.post('/', requireRole('admin'), create);
router.put('/:id', requireRole('admin'), update);
router.delete('/:id', requireRole('admin'), remove);

export default router;
