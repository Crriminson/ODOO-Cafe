import { db } from '../../config/db.js';

/**
 * Fetch all promotions.
 */
export const getAllPromotions = async () => {
  const rows = await db('promotions').select('*').orderBy('id', 'asc');
  return { rows };
};

/**
 * Fetch a single promotion by id.
 */
export const getPromotionById = async (id) => {
  const rows = await db('promotions').where({ id }).select('*').limit(1);
  return { rows };
};

/**
 * Fetch all active promotions.
 */
export const getActivePromotions = async () => {
  const rows = await db('promotions').where({ is_active: true }).select('*');
  return { rows };
};

/**
 * Create a new automated promotion.
 */
export const createPromotion = async ({
  name, applies_to, product_id, min_quantity, min_order_amount,
  discount_type, discount_value, rules, is_active
}) => {
  const rows = await db('promotions')
    .insert({
      name,
      applies_to,
      product_id: product_id || null,
      min_quantity: min_quantity !== undefined ? min_quantity : null,
      min_order_amount: min_order_amount || null,
      discount_type,
      discount_value,
      rules: rules ? JSON.stringify(rules) : null,
      is_active: is_active ?? true,
    })
    .returning('*');
  return { rows };
};

/**
 * Update promotion fields.
 */
export const updatePromotion = async (id, fields) => {
  const allowed = [
    'name', 'applies_to', 'product_id', 'min_quantity', 'min_order_amount',
    'discount_type', 'discount_value', 'rules', 'is_active'
  ];

  const updateFields = {};
  for (const col of allowed) {
    if (fields[col] !== undefined) {
      if (col === 'rules') {
        updateFields[col] = fields[col] ? JSON.stringify(fields[col]) : null;
      } else {
        updateFields[col] = fields[col];
      }
    }
  }
  updateFields.updated_at = db.fn.now();

  const rows = await db('promotions')
    .where({ id })
    .update(updateFields)
    .returning('*');
  return { rows };
};

/**
 * Hard-delete a promotion.
 */
export const deletePromotion = async (id) => {
  const rows = await db('promotions').where({ id }).del().returning('id');
  return { rows };
};
