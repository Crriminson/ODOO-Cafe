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
