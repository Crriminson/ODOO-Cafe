import {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '../db/queries/promotions.queries.js';
import { createPromotionSchema } from '../utils/validators.js';

// GET /api/v1/promotions
export const getPromotions = async (req, res, next) => {
  try {
    const { is_active } = req.query;
    const { rows } = await getAllPromotions({ is_active });
    const promotions = rows.map(formatPromotion);
    res.json({ promotions });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/promotions
export const create = async (req, res, next) => {
  try {
    const {
      name,
      applies_to,
      product_id,
      min_quantity,
      min_order_amount,
      discount_type,
      discount_value,
    } = req.body;

    const rules = {
      applies_to,
      product_id: product_id ? parseInt(product_id, 10) : null,
      min_quantity: min_quantity ? parseInt(min_quantity, 10) : null,
      min_order_amount: min_order_amount ? parseFloat(min_order_amount) : null,
      discount_type,
      discount_value: parseFloat(discount_value),
    };

    const { rows } = await createPromotion({
      name,
      applies_to,
      product_id: rules.product_id,
      min_quantity: rules.min_quantity,
      min_order_amount: rules.min_order_amount,
      discount_type,
      discount_value: rules.discount_value,
      rules,
    });

    const promotion = formatPromotion(rows[0]);
    res.status(201).json({ promotion });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/promotions/:id
export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await getPromotionById(id);
    if (!existing) {
      return res.status(404).json({
        error: { message: 'Promotion not found', code: 'NOT_FOUND' },
      });
    }

    const merged = {
      name: req.body.name !== undefined ? req.body.name : existing.name,
      applies_to: req.body.applies_to !== undefined ? req.body.applies_to : existing.applies_to,
      product_id:
        req.body.product_id !== undefined ? req.body.product_id : existing.product_id,
      min_quantity:
        req.body.min_quantity !== undefined ? req.body.min_quantity : existing.min_quantity,
      min_order_amount:
        req.body.min_order_amount !== undefined
          ? req.body.min_order_amount
          : existing.min_order_amount,
      discount_type:
        req.body.discount_type !== undefined ? req.body.discount_type : existing.discount_type,
      discount_value:
        req.body.discount_value !== undefined ? req.body.discount_value : existing.discount_value,
    };

    const parsedMerged = {
      name: merged.name,
      applies_to: merged.applies_to,
      product_id: merged.product_id ? parseInt(merged.product_id, 10) : null,
      min_quantity: merged.min_quantity ? parseInt(merged.min_quantity, 10) : null,
      min_order_amount: merged.min_order_amount ? parseFloat(merged.min_order_amount) : null,
      discount_type: merged.discount_type,
      discount_value: parseFloat(merged.discount_value),
    };

    const validationResult = createPromotionSchema.safeParse(parsedMerged);
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

    const updateFields = { ...req.body };
    const finalAppliesTo = updateFields.applies_to || existing.applies_to;

    // Recompute rules
    const rules = {
      applies_to: finalAppliesTo,
      product_id:
        finalAppliesTo === 'product'
          ? updateFields.product_id !== undefined
            ? updateFields.product_id
            : existing.product_id
          : null,
      min_quantity:
        finalAppliesTo === 'product'
          ? updateFields.min_quantity !== undefined
            ? updateFields.min_quantity
            : existing.min_quantity
          : null,
      min_order_amount:
        finalAppliesTo === 'order'
          ? updateFields.min_order_amount !== undefined
            ? updateFields.min_order_amount
            : existing.min_order_amount
          : null,
      discount_type: updateFields.discount_type || existing.discount_type,
      discount_value:
        updateFields.discount_value !== undefined
          ? parseFloat(updateFields.discount_value)
          : parseFloat(existing.discount_value),
    };

    if (rules.product_id) rules.product_id = parseInt(rules.product_id, 10);
    if (rules.min_quantity) rules.min_quantity = parseInt(rules.min_quantity, 10);
    if (rules.min_order_amount) rules.min_order_amount = parseFloat(rules.min_order_amount);

    updateFields.rules = rules;

    if (req.body.applies_to) {
      if (req.body.applies_to === 'product') {
        updateFields.min_order_amount = null;
      } else {
        updateFields.product_id = null;
        updateFields.min_quantity = null;
      }
    }

    const updated = await updatePromotion(id, updateFields);
    res.json({ promotion: formatPromotion(updated) });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/promotions/:id
export const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await deletePromotion(id);
    if (rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Promotion not found', code: 'NOT_FOUND' },
      });
    }
    res.json({ message: 'Promotion deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const formatPromotion = (p) => {
  if (!p) return null;
  return {
    ...p,
    product_id: p.product_id ? parseInt(p.product_id, 10) : null,
    min_quantity: p.min_quantity ? parseInt(p.min_quantity, 10) : null,
    min_order_amount:
      p.min_order_amount !== null ? Number(p.min_order_amount).toFixed(2) : null,
    discount_value: Number(p.discount_value).toFixed(2),
  };
};
