import { db } from '../../config/db.js';
import { ORDER_STATUS, PAYMENT_METHODS } from '../../../../shared/constants/index.js';

/**
 * Returns the session row or null.
 * @param {number} employeeId
 * @returns {Promise<Object|null>}
 */
export const getCurrentOpenSession = async (employeeId) => {
  const rows = await db('sessions')
    .where({ employee_id: employeeId })
    .whereNull('closed_at')
    .limit(1);
  return rows[0] || null;
};

/**
 * Returns the new session row.
 * @param {number} employeeId
 * @returns {Promise<Object>}
 */
export const openSession = async (employeeId) => {
  const rows = await db('sessions')
    .insert({ employee_id: employeeId, opened_at: db.fn.now() })
    .returning('*');
  return rows[0];
};

/**
 * Returns the last closed session row or null.
 * @param {number} employeeId
 * @returns {Promise<Object|null>}
 */
export const getLastClosedSession = async (employeeId) => {
  const rows = await db('sessions')
    .where({ employee_id: employeeId })
    .whereNotNull('closed_at')
    .orderBy('closed_at', 'desc')
    .limit(1);
  return rows[0] || null;
};

/**
 * Closes the session: computes stats, builds breakdown JSON, updates session, and returns the updated row.
 * Returns null if the session wasn't open.
 * @param {number} sessionId
 * @returns {Promise<Object|null>}
 */
export const closeSession = async (sessionId) => {
  return db.transaction(async (trx) => {
    // Step 1 — compute closing stats with a single SQL query
    const statsResult = await trx('orders as o')
      .leftJoin('payments as p', 'p.order_id', 'o.id')
      .where('o.session_id', sessionId)
      .where('o.status', ORDER_STATUS.PAID)
      .select(
        trx.raw('COUNT(o.id)::int AS closing_total_orders'),
        trx.raw('COALESCE(SUM(p.amount), 0) AS revenue_sum'),
        trx.raw(`COALESCE(SUM(CASE WHEN p.method = ? THEN p.amount ELSE 0 END), 0) AS cash_sum`, [PAYMENT_METHODS.CASH]),
        trx.raw(`COALESCE(SUM(CASE WHEN p.method = ? THEN p.amount ELSE 0 END), 0) AS card_sum`, [PAYMENT_METHODS.CARD]),
        trx.raw(`COALESCE(SUM(CASE WHEN p.method = ? THEN p.amount ELSE 0 END), 0) AS upi_sum`, [PAYMENT_METHODS.UPI])
      );

    const stats = statsResult[0] || {
      closing_total_orders: 0,
      revenue_sum: 0,
      cash_sum: 0,
      card_sum: 0,
      upi_sum: 0
    };

    const closingTotalOrders = stats.closing_total_orders;
    const revenueSum = Number(stats.revenue_sum);
    const cashSum = Number(stats.cash_sum);
    const cardSum = Number(stats.card_sum);
    const upiSum = Number(stats.upi_sum);

    // Step 2 — build the closing_breakdown JSON object. All three keys MUST always be present:
    const closingBreakdown = {
      cash: cashSum.toFixed(2),
      card: cardSum.toFixed(2),
      upi: upiSum.toFixed(2),
    };

    const closingTotalRevenue = revenueSum.toFixed(2); // Numeric string format e.g. "3560.00"

    // Step 3 — update sessions SET closed_at = NOW(), etc.
    const updateResult = await trx('sessions')
      .where({ id: sessionId })
      .whereNull('closed_at')
      .update({
        closed_at: trx.fn.now(),
        closing_total_orders: closingTotalOrders,
        closing_total_revenue: closingTotalRevenue,
        closing_breakdown: JSON.stringify(closingBreakdown),
      })
      .returning('*');

    return updateResult[0] || null;
  });
};
