import { Router } from 'express';
import { listCategories, createCategory, updateCategory, deleteCategory }
  from '../controllers/categories.controller.js';
import { validate }     from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole }  from '../middleware/requireRole.js';
import { createCategorySchema, updateCategorySchema }
  from '../utils/validators.js';

const router = Router();

// GET    /api/v1/categories        — any authenticated user
router.get('/',    authenticate,                                                       listCategories);

// POST   /api/v1/categories        — admin only
router.post('/',   authenticate, requireRole('admin'), validate(createCategorySchema), createCategory);

// PUT    /api/v1/categories/:id    — admin only
router.put('/:id', authenticate, requireRole('admin'), validate(updateCategorySchema), updateCategory);

// DELETE /api/v1/categories/:id   — admin only
router.delete('/:id', authenticate, requireRole('admin'),                              deleteCategory);

export default router;
