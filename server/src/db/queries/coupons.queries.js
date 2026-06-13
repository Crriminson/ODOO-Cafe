import { db } from '../../config/db.js';

/**
 * Fetch all coupons.
 */
export const getAllCoupons = async () => {
  const rows = await db('coupons').select('*').orderBy('id', 'asc');
  return { rows };
};

/**
 * Fetch a single coupon by id.
 */
export const getCouponById = async (id) => {
  const rows = await db('coupons').where({ id }).select('*').limit(1);
  return { rows };
};

/**
 * Fetch a single active coupon by code (case-insensitive).
 */
export const getCouponByCode = async (code) => {
  const rows = await db('coupons')
    .whereRaw('LOWER(code) = LOWER(?)', [code])
    .where('is_active', true)
    .select('*')
    .limit(1);
  return { rows };
};

/**
 * Insert a new coupon.
 */
export const createCoupon = async ({ code, discount_type, discount_value, is_active }) => {
  const rows = await db('coupons')
    .insert({
      code,
      discount_type,
      discount_value,
      is_active: is_active ?? true,
    })
    .returning('*');
  return { rows };
};

/**
 * Dynamic UPDATE coupon fields.
 */
export const updateCoupon = async (id, fields) => {
  const allowed = ['code', 'discount_type', 'discount_value', 'is_active'];
  const updateFields = {};
  for (const col of allowed) {
    if (fields[col] !== undefined) {
      updateFields[col] = fields[col];
    }
  }
  updateFields.updated_at = db.fn.now();

  const rows = await db('coupons')
    .where({ id })
    .update(updateFields)
    .returning('*');
  return { rows };
};

/**
 * Hard-delete a coupon.
 */
export const deleteCoupon = async (id) => {
  const rows = await db('coupons').where({ id }).del().returning('id');
  return { rows };
};
