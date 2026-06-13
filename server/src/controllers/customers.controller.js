import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  findValidCustomerByEmail,
} from '../db/queries/customers.queries.js';
import { createCustomerSchema, updateCustomerSchema } from '../utils/validators.js';

// GET /api/v1/customers
export const getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const rows = await getAllCustomers({ search });

    const customers = rows.map((r) => ({
      ...r,
      loyalty_points: parseInt(r.loyalty_points, 10),
    }));

    res.json({ customers });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/customers/:id
export const getCustomer = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const customer = await getCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        error: { message: 'Customer not found', code: 'NOT_FOUND' },
      });
    }

    customer.loyalty_points = parseInt(customer.loyalty_points, 10);
    res.json({ customer });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/customers
export const create = async (req, res, next) => {
  try {
    const validationResult = createCustomerSchema.safeParse(req.body);
    if (!validationResult.success) {
      const fields = validationResult.error.errors.map((e) => ({
        field: e.path.join('.') || 'body',
        message: e.message,
      }));
      return res.status(422).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fields,
        },
      });
    }

    const { name, email, phone, address } = validationResult.data;

    if (email && email.trim() !== '') {
      const existing = await findValidCustomerByEmail(email);
      if (existing) {
        return res.status(409).json({
          error: { message: 'Customer email already exists', code: 'EMAIL_EXISTS' },
        });
      }
    }

    const newCustomer = await createCustomer(name, email, phone, address);
    newCustomer.loyalty_points = parseInt(newCustomer.loyalty_points, 10);

    res.status(201).json({ customer: newCustomer });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/customers/:id
export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingCustomer = await getCustomerById(id);

    if (!existingCustomer) {
      return res.status(404).json({
        error: { message: 'Customer not found', code: 'NOT_FOUND' },
      });
    }

    const validationResult = updateCustomerSchema.safeParse(req.body);
    if (!validationResult.success) {
      const fields = validationResult.error.errors.map((e) => ({
        field: e.path.join('.') || 'body',
        message: e.message,
      }));
      return res.status(422).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fields,
        },
      });
    }

    const fields = validationResult.data;

    if (fields.email && fields.email.trim() !== '') {
      const existingByEmail = await findValidCustomerByEmail(fields.email);
      if (existingByEmail && existingByEmail.id !== id) {
        return res.status(409).json({
          error: { message: 'Customer email already exists', code: 'EMAIL_EXISTS' },
        });
      }
    }

    const updated = await updateCustomer(id, fields);
    updated.loyalty_points = parseInt(updated.loyalty_points, 10);

    res.json({ customer: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/customers/:id
export const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingCustomer = await getCustomerById(id);

    if (!existingCustomer) {
      return res.status(404).json({
        error: { message: 'Customer not found', code: 'NOT_FOUND' },
      });
    }

    await deleteCustomer(id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    next(err);
  }
};
