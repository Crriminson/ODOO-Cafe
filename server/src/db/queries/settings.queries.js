import { db } from '../../config/db.js';

/**
 * Fetch all 3 payment method rows (cash, card, upi).
 * Rows are seeded and always exist — never insert here.
 */
export const getPaymentMethods = async () => {
  const rows = await db('payment_method_settings')
    .select('id', 'method', 'is_enabled', 'upi_id', 'updated_at')
    .orderBy('id', 'asc');
  return { rows };
};

/**
 * Update each payment method row using method as the lookup key.
 * Updates run sequentially (for...of) to avoid partial-update races.
 * Returns the fresh DB state after all updates.
 *
 * @param {{ method: string, is_enabled: boolean, upi_id: string|null }[]} methods
 */
export const updatePaymentMethods = async (methods) => {
  for (const item of methods) {
    await db('payment_method_settings')
      .where({ method: item.method })
      .update({
        is_enabled: item.is_enabled,
        upi_id: item.upi_id ?? null,
        updated_at: db.fn.now(),
      });
  }

  // Return fresh state in one round-trip
  return getPaymentMethods();
};
