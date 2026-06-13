import db from '../db/knex.js';

/**
 * Returns the current open session row or null.
 * @param {number} employeeId
 * @returns {Promise<Object|null>}
 */
export const getCurrentOpenSession = async (employeeId) => {
  const row = await db('sessions')
    .where({ employee_id: employeeId })
    .whereNull('closed_at')
    .first();
  return row || null;
};

/**
 * Returns the new session row.
 * @param {number} employeeId
 * @returns {Promise<Object>}
 */
export const openSession = async (employeeId) => {
  const rows = await db('sessions')
    .insert({ employee_id: employeeId, opened_at: new Date() })
    .returning('*');
  return rows[0];
};

/**
 * Returns the last closed session row or null.
 * @param {number} employeeId
 * @returns {Promise<Object|null>}
 */
export const getLastClosedSession = async (employeeId) => {
  const row = await db('sessions')
    .where({ employee_id: employeeId })
    .whereNotNull('closed_at')
    .orderBy('closed_at', 'desc')
    .first();
  return row || null;
};

/**
 * Closes the session: computes stats, builds breakdown JSON, updates session, and returns the updated row.
 * Returns null if the session wasn't open or not found.
 * @param {number} sessionId
 * @returns {Promise<Object|null>}
 */
export const closeSession = async (sessionId) => {
  // 1. Aggregate with string cast
  const stats = await db('orders')
    .where({ session_id: sessionId, status: 'paid' })
    .select(
      db.raw('COUNT(*)::int AS closing_total_orders'),
      db.raw('COALESCE(SUM(total), 0)::numeric::text AS closing_total_revenue')
    )
    .first();

  // 2. Closing breakdown — join payments through orders
  const rows = await db('payments')
    .join('orders', 'orders.id', 'payments.order_id')
    .where('orders.session_id', sessionId)
    .where('orders.status', 'paid')
    .groupBy('payments.method')
    .select('payments.method', db.raw('SUM(payments.amount)::numeric::text AS total'));

  const breakdown = { cash: '0.00', card: '0.00', upi: '0.00' };
  rows.forEach(r => {
    if (r.method && breakdown.hasOwnProperty(r.method)) {
      breakdown[r.method] = r.total;
    }
  });

  // 3. Update and return
  const updated = await db('sessions')
    .where({ id: sessionId })
    .update({
      closed_at: new Date(),
      closing_total_orders: stats ? stats.closing_total_orders : 0,
      closing_total_revenue: stats ? stats.closing_total_revenue : '0.00',
      closing_breakdown: JSON.stringify(breakdown)
    })
    .returning('*');

  return updated[0] || null;
};
