import * as db from '../../config/db.js';

export const findValidCouponByCode = async (code) => {
  const { rows } = await db.query(
    `SELECT
       id,
       code,
       discount_type,
       discount_value::text
     FROM coupons
     WHERE LOWER(code) = LOWER($1)
       AND is_active = TRUE
     LIMIT 1`,
    [code]
  );

  return rows[0] ?? null;
};

export const getAllCoupons = () =>
  db.query(
    `SELECT id, code, discount_type, discount_value::text, is_active, created_at, updated_at
     FROM coupons
     ORDER BY created_at DESC`
  );

export const getCouponById = async (id) => {
  const { rows } = await db.query(
    `SELECT id, code, discount_type, discount_value::text, is_active, created_at, updated_at
     FROM coupons
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
};

export const createCoupon = (code, discountType, discountValue) =>
  db.query(
    `INSERT INTO coupons (code, discount_type, discount_value)
     VALUES ($1, $2, $3)
     RETURNING id, code, discount_type, discount_value::text, is_active, created_at, updated_at`,
    [code, discountType, discountValue]
  );

export const updateCoupon = async (id, fields) => {
  const setKeys = [];
  const params = [];

  const allowedFields = ['code', 'discount_type', 'discount_value', 'is_active'];
  for (const key of allowedFields) {
    if (fields[key] !== undefined) {
      params.push(fields[key]);
      setKeys.push(`${key} = $${params.length}`);
    }
  }

  if (setKeys.length === 0) {
    return getCouponById(id);
  }

  params.push(id);
  const sql = `
    UPDATE coupons
    SET ${setKeys.join(', ')}, updated_at = NOW()
    WHERE id = $${params.length}
    RETURNING id, code, discount_type, discount_value::text, is_active, created_at, updated_at
  `;
  const { rows } = await db.query(sql, params);
  return rows[0] ?? null;
};

export const deleteCoupon = (id) =>
  db.query(
    `DELETE FROM coupons
     WHERE id = $1
     RETURNING id`,
    [id]
  );
