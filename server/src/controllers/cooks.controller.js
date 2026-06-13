import {
  getAllCooks,
  getCookById,
  getCookCategoryPreferences,
  createCook,
  updateCook,
  softDeleteCook,
} from '../db/queries/cooks.queries.js';
import { createCookSchema, updateCookSchema } from '../utils/validators.js';

// GET /api/v1/cooks
export const getCooks = async (req, res, next) => {
  try {
    let is_active;
    if (req.query.is_active !== undefined) {
      is_active = req.query.is_active === 'true';
    }

    const rows = await getAllCooks({ is_active });

    const cooks = await Promise.all(
      rows.map(async (cook) => {
        const preferences = await getCookCategoryPreferences(cook.id);
        return {
          ...cook,
          category_preferences: preferences,
        };
      })
    );

    res.json({ cooks });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/cooks
export const create = async (req, res, next) => {
  try {
    const validationResult = createCookSchema.safeParse(req.body);
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

    const { name, category_preferences } = validationResult.data;

    const newCook = await createCook(name, category_preferences);
    const preferences = await getCookCategoryPreferences(newCook.id);

    res.status(201).json({
      cook: {
        ...newCook,
        category_preferences: preferences,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/cooks/:id
export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingCook = await getCookById(id);

    if (!existingCook) {
      return res.status(404).json({
        error: { message: 'Cook not found', code: 'NOT_FOUND' },
      });
    }

    const validationResult = updateCookSchema.safeParse(req.body);
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

    const { name, is_active, category_preferences } = validationResult.data;
    const fields = {};
    if (name !== undefined) fields.name = name;
    if (is_active !== undefined) fields.is_active = is_active;

    const updatedCook = await updateCook(id, fields, category_preferences);
    const preferences = await getCookCategoryPreferences(updatedCook.id);

    res.json({
      cook: {
        ...updatedCook,
        category_preferences: preferences,
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/cooks/:id
export const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existingCook = await getCookById(id);

    if (!existingCook) {
      return res.status(404).json({
        error: { message: 'Cook not found', code: 'NOT_FOUND' },
      });
    }

    await softDeleteCook(id);
    res.json({ message: 'Cook deleted successfully' });
  } catch (err) {
    next(err);
  }
};
