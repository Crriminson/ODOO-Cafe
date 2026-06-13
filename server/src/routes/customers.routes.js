import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  create,
  update,
  remove,
} from '../controllers/customers.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all customer routes
router.use(authenticate);

// GET /api/v1/customers
router.get('/', getCustomers);

// GET /api/v1/customers/:id
router.get('/:id', getCustomer);

// POST /api/v1/customers
router.post('/', create);

// PUT /api/v1/customers/:id
router.put('/:id', update);

// DELETE /api/v1/customers/:id
router.delete('/:id', remove);

export default router;
