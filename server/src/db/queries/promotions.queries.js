import * as db from '../../config/db.js';

export const getAllPromotions = async ({ is_active } = {}) => {
  let sql = `
    SELECT id, name, applies_to, product_id, min_quantity, min_order_amount::text,
           discount_type, discount_value::text, rules, is_active, created_at, updated_at
    FROM promotions
  `;
  const params = [];
  if (is_active !== undefined) {
    params.push(is_active === 'true' || is_active === true);
    sql += ` WHERE is_active = $1`;
  }
  sql += ` ORDER BY created_at DESC`;
  return db.query(sql, params);
};

export const getPromotionById = async (id) => {
  const { rows } = await db.query(
    `SELECT id, name, applies_to, product_id, min_quantity, min_order_amount::text,
            discount_type, discount_value::text, rules, is_active, created_at, updated_at
     FROM promotions
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
};

export const createPromotion = ({
  name,
  applies_to,
  product_id,
  min_quantity,
  min_order_amount,
  discount_type,
  discount_value,
  rules,
}) =>
  db.query(
    `INSERT INTO promotions (
       name, applies_to, product_id, min_quantity, min_order_amount,
       discount_type, discount_value, rules
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, name, applies_to, product_id, min_quantity, min_order_amount::text,
               discount_type, discount_value::text, rules, is_active, created_at, updated_at`,
    [
      name,
      applies_to,
      product_id,
      min_quantity,
      min_order_amount,
      discount_type,
      discount_value,
      rules,
    ]
  );

export const updatePromotion = async (id, fields) => {
  const setKeys = [];
  const params = [];

  const allowedFields = [
    'name',
    'applies_to',
    'product_id',
    'min_quantity',
    'min_order_amount',
    'discount_type',
    'discount_value',
    'rules',
    'is_active',
  ];
  for (const key of allowedFields) {
    if (fields[key] !== undefined) {
      params.push(fields[key]);
      setKeys.push(`${key} = $${params.length}`);
    }
  }

  if (setKeys.length === 0) {
    return getPromotionById(id);
  }

  params.push(id);
  const sql = `
    UPDATE promotions
    SET ${setKeys.join(', ')}, updated_at = NOW()
    WHERE id = $${params.length}
    RETURNING id, name, applies_to, product_id, min_quantity, min_order_amount::text,
              discount_type, discount_value::text, rules, is_active, created_at, updated_at
  `;
  const { rows } = await db.query(sql, params);
  return rows[0] ?? null;
};

export const deletePromotion = (id) =>
  db.query(
    `DELETE FROM promotions
     WHERE id = $1
     RETURNING id`,
    [id]
  );
