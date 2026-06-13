import { db } from '../../config/db.js';

/**
 * Fetch all items belonging to a specific order.
 */
export const getOrderItems = async (orderId) => {
  const rows = await db('order_items')
    .where({ order_id: orderId })
    .select('*')
    .orderBy('id', 'asc');
  return { rows };
};

/**
 * Insert a new order item.
 */
export const createOrderItem = async ({ orderId, productId, quantity, unitPrice, lineTotal }) => {
  const rows = await db('order_items')
    .insert({
      order_id: orderId,
      product_id: productId,
      quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
      kds_status: 'to_cook',
      is_item_completed: false,
    })
    .returning('*');
  return { rows };
};

/**
 * Dynamic UPDATE order item fields.
 */
export const updateOrderItem = async (id, fields) => {
  const allowed = ['quantity', 'unit_price', 'line_total', 'kds_status', 'is_item_completed', 'assigned_cook_id'];
  const updateFields = {};
  for (const col of allowed) {
    if (fields[col] !== undefined) {
      updateFields[col] = fields[col];
    }
  }
  updateFields.updated_at = db.fn.now();

  const rows = await db('order_items')
    .where({ id })
    .update(updateFields)
    .returning('*');
  return { rows };
};

/**
 * Hard-delete an order item.
 */
export const deleteOrderItem = async (id) => {
  const rows = await db('order_items').where({ id }).del().returning('id');
  return { rows };
};
