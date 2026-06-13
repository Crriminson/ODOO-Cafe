import { Router } from 'express';
import { updateTable, softDeleteTable } from '../controllers/tables.controller.js';
import { validate }     from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole }  from '../middleware/requireRole.js';
import { updateTableSchema } from '../utils/validators.js';

const router = Router();

// PUT    /api/v1/tables/:id    — admin only
router.put('/:id',    authenticate, requireRole('admin'), validate(updateTableSchema), updateTable);

// DELETE /api/v1/tables/:id   — admin only (soft delete)
router.delete('/:id', authenticate, requireRole('admin'),                              softDeleteTable);

export default router;
