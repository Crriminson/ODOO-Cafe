import { query, getClient } from '../../config/db.js';
import { ORDER_STATUS, PAYMENT_METHODS } from '../../../../shared/constants/index.js';

/**
 * Returns the session row or null.
 * @param {number} employeeId
 * @returns {Promise<Object|null>}
 */
export const getCurrentOpenSession = async (employeeId) => {
  const { rows } = await query(
    `SELECT * FROM sessions WHERE employee_id = $1 AND closed_at IS NULL LIMIT 1`,
    [employeeId]
  );
  return rows[0] || null;
};

/**
 * Returns the new session row.
 * @param {number} employeeId
 * @returns {Promise<Object>}
 */
export const openSession = async (employeeId) => {
  const { rows } = await query(
    `INSERT INTO sessions (employee_id, opened_at) VALUES ($1, NOW()) RETURNING *`,
    [employeeId]
  );
  return rows[0];
};

/**
 * Returns the last closed session row or null.
 * @param {number} employeeId
 * @returns {Promise<Object|null>}
 */
export const getLastClosedSession = async (employeeId) => {
  const { rows } = await query(
    `SELECT * FROM sessions WHERE employee_id = $1 AND closed_at IS NOT NULL ORDER BY closed_at DESC LIMIT 1`,
    [employeeId]
  );
  return rows[0] || null;
};

/**
 * Closes the session: computes stats, builds breakdown JSON, updates session, and returns the updated row.
 * Returns null if the session wasn't open.
 * @param {number} sessionId
 * @returns {Promise<Object|null>}
 */
export const closeSession = async (sessionId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Step 1 — compute closing stats with a single SQL query
    const statsResult = await client.query(
      `SELECT
        COUNT(o.id)::int AS closing_total_orders,
        COALESCE(SUM(p.amount), 0) AS revenue_sum,
        COALESCE(SUM(CASE WHEN p.method = $2 THEN p.amount ELSE 0 END), 0) AS cash_sum,
        COALESCE(SUM(CASE WHEN p.method = $3 THEN p.amount ELSE 0 END), 0) AS card_sum,
        COALESCE(SUM(CASE WHEN p.method = $4 THEN p.amount ELSE 0 END), 0) AS upi_sum
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.session_id = $1 AND o.status = $5`,
      [
        sessionId,
        PAYMENT_METHODS.CASH,
        PAYMENT_METHODS.CARD,
        PAYMENT_METHODS.UPI,
        ORDER_STATUS.PAID,
      ]
    );

    const stats = statsResult.rows[0];
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
    const updateResult = await client.query(
      `UPDATE sessions
       SET closed_at = NOW(),
           closing_total_orders = $2,
           closing_total_revenue = $3,
           closing_breakdown = $4
       WHERE id = $1 AND closed_at IS NULL
       RETURNING *`,
      [
        sessionId,
        closingTotalOrders,
        closingTotalRevenue,
        JSON.stringify(closingBreakdown),
      ]
    );

    await client.query('COMMIT');
    return updateResult.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
