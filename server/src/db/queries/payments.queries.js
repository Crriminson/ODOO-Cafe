import { db } from '../../config/db.js';

/**
 * Record a payment made against an order.
 */
export const createPayment = async ({ orderId, method, amount, tip, transactionReference }) => {
  const rows = await db('payments')
    .insert({
      order_id: orderId,
      method,
      amount,
      tip: tip || 0,
      transaction_reference: transactionReference || null,
    })
    .returning('*');
  return { rows };
};

/**
 * Fetch all payments recorded for a specific order.
 */
export const getPaymentsByOrderId = async (orderId) => {
  const rows = await db('payments')
    .where({ order_id: orderId })
    .select('*')
    .orderBy('id', 'asc');
  return { rows };
};
