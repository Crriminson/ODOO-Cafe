import {
  getProducts,
  getProductById,
  createProduct    as insertProduct,
  updateProduct    as patchProduct,
  softDeleteProduct as archiveProduct,
  categoryExists,
} from '../db/queries/products.queries.js';

// ─── GET /api/v1/products ─────────────────────────────────────────────────────

export const listProducts = async (req, res, next) => {
  try {
    const { category_id, search, is_active } = req.query;
    const { rows } = await getProducts({ category_id, search, is_active });
    return res.status(200).json({ products: rows });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/products ────────────────────────────────────────────────────

export const createProduct = async (req, res, next) => {
  try {
    const {
      name, category_id, price, unit_of_measure, tax_rate,
      description, estimated_prep_time, show_on_kds, is_active,
    } = req.body; // validated by zod

    // Category existence check — only when a category is provided
    if (category_id != null && !(await categoryExists(category_id))) {
      return res.status(422).json({
        error: {
          message: 'Category not found',
          code:    'VALIDATION_ERROR',
          fields:  [{ field: 'category_id', message: 'Category not found' }],
        },
      });
    }

    const { rows } = await insertProduct({
      name, category_id: category_id ?? null, price, unit_of_measure, tax_rate,
      description, estimated_prep_time, show_on_kds, is_active,
    });
    return res.status(201).json({ product: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/v1/products/:id ─────────────────────────────────────────────────

export const updateProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    // 1. Existence check
    const { rows: existing } = await getProductById(id);
    if (!existing[0]) {
      return res.status(404).json({
        error: { message: 'Product not found', code: 'NOT_FOUND' },
      });
    }

    // 2. If category_id is being changed to a non-null value, verify it exists
    const { category_id } = req.body;
    if (category_id != null && !(await categoryExists(category_id))) {
      return res.status(422).json({
        error: {
          message: 'Category not found',
          code:    'VALIDATION_ERROR',
          fields:  [{ field: 'category_id', message: 'Category not found' }],
        },
      });
    }

    // 3. Build update from only the fields present in req.body
    const fields = {};
    const allowed = [
      'name', 'category_id', 'price', 'unit_of_measure',
      'tax_rate', 'description', 'estimated_prep_time', 'show_on_kds', 'is_active',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }

    const { rows } = await patchProduct(id, fields);
    return res.status(200).json({ product: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/v1/products/:id ─────────────────────────────────────────────

export const softDeleteProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Existence check
    const { rows: existing } = await getProductById(id);
    if (!existing[0]) {
      return res.status(404).json({
        error: { message: 'Product not found', code: 'NOT_FOUND' },
      });
    }

    await archiveProduct(id);
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};
