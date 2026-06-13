import {
  getAllCategories,
  getCategoryById,
  createCategory   as insertCategory,
  updateCategory   as patchCategory,
  deleteCategory   as removeCategory,
  categoryNameExists,
  categoryHasProducts,
} from '../db/queries/categories.queries.js';

// ─── GET /api/v1/categories ───────────────────────────────────────────────────

export const listCategories = async (req, res, next) => {
  try {
    const { rows } = await getAllCategories();
    return res.status(200).json({ categories: rows });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/categories ──────────────────────────────────────────────────

export const createCategory = async (req, res, next) => {
  try {
    const { name, color } = req.body; // validated by zod

    if (await categoryNameExists(name)) {
      return res.status(409).json({
        error: { message: 'Category name already exists', code: 'NAME_EXISTS' },
      });
    }

    const { rows } = await insertCategory(name, color);
    return res.status(201).json({ category: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/v1/categories/:id ───────────────────────────────────────────────

export const updateCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    // 1. Existence check
    const { rows: existing } = await getCategoryById(id);
    if (!existing[0]) {
      return res.status(404).json({
        error: { message: 'Category not found', code: 'NOT_FOUND' },
      });
    }

    // 2. Name uniqueness — exclude this category's own id from the check
    const { name, color } = req.body;
    if (name !== undefined && await categoryNameExists(name, id)) {
      return res.status(409).json({
        error: { message: 'Category name already exists', code: 'NAME_EXISTS' },
      });
    }

    // 3. Build update from only the fields present in req.body
    const fields = {};
    if (name  !== undefined) fields.name  = name;
    if (color !== undefined) fields.color = color;

    const { rows } = await patchCategory(id, fields);
    return res.status(200).json({ category: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/v1/categories/:id ───────────────────────────────────────────

export const deleteCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    // 1. Existence check
    const { rows: existing } = await getCategoryById(id);
    if (!existing[0]) {
      return res.status(404).json({
        error: { message: 'Category not found', code: 'NOT_FOUND' },
      });
    }

    // 2. Guard: cannot delete if products reference this category
    if (await categoryHasProducts(id)) {
      return res.status(409).json({
        error: {
          message: 'Cannot delete category with existing products',
          code:    'HAS_PRODUCTS',
        },
      });
    }

    // 3. Hard delete
    await removeCategory(id);
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};
