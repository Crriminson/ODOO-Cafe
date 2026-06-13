import { query } from '../../config/db.js';

/**
 * Fetch all 3 payment method rows (cash, card, upi).
 * Rows are seeded and always exist — never insert here.
 * @returns {Promise<import('pg').QueryResult>}
 */
export const getPaymentMethods = () =>
  query(
    `SELECT id, method, is_enabled, upi_id, updated_at
     FROM payment_method_settings
     ORDER BY id ASC`
  );

/**
 * Update each payment method row using method as the lookup key.
 * Updates run sequentially (for...of) to avoid partial-update races.
 * Returns the fresh DB state after all updates.
 *
 * @param {{ method: string, is_enabled: boolean, upi_id: string|null }[]} methods
 * @returns {Promise<import('pg').QueryResult>}
 */
export const updatePaymentMethods = async (methods) => {
  for (const item of methods) {
    await query(
      `UPDATE payment_method_settings
       SET is_enabled = $1,
           upi_id     = $2,
           updated_at = NOW()
       WHERE method = $3`,
      [item.is_enabled, item.upi_id ?? null, item.method]
    );
  }

  // Return fresh state in one round-trip
  return getPaymentMethods();
};
