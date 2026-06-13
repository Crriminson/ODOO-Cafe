import { Router } from 'express';
import { listProducts, createProduct, updateProduct, softDeleteProduct }
  from '../controllers/products.controller.js';
import { validate }     from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole }  from '../middleware/requireRole.js';
import { createProductSchema, updateProductSchema }
  from '../utils/validators.js';

const router = Router();

// GET    /api/v1/products        — any authenticated user
router.get('/',    authenticate,                                                     listProducts);

// POST   /api/v1/products        — admin only
router.post('/',   authenticate, requireRole('admin'), validate(createProductSchema), createProduct);

// PUT    /api/v1/products/:id    — admin only
router.put('/:id', authenticate, requireRole('admin'), validate(updateProductSchema), updateProduct);

// DELETE /api/v1/products/:id   — admin only (soft delete)
router.delete('/:id', authenticate, requireRole('admin'),                             softDeleteProduct);

export default router;
