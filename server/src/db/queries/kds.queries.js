import { db } from '../../config/db.js';
import { ORDER_STATUS } from '../../../../shared/constants/index.js';

/**
 * Fetch all active KDS orders (status 'sent') with their items (only those with show_on_kds = true).
 */
export const getActiveKDSOrders = async () => {
  const orders = await db('orders as o')
    .leftJoin('tables as t', 't.id', 'o.table_id')
    .where('o.status', ORDER_STATUS.SENT)
    .select('o.*', 't.table_number')
    .orderBy('o.id', 'asc');

  if (orders.length === 0) return { rows: [] };

  const orderIds = orders.map((o) => o.id);

  // Fetch KDS items for these orders
  const items = await db('order_items as oi')
    .join('products as p', 'p.id', 'oi.product_id')
    .leftJoin('cooks as c', 'c.id', 'oi.assigned_cook_id')
    .whereIn('oi.order_id', orderIds)
    .where('p.show_on_kds', true)
    .select(
      'oi.*',
      'p.name as product_name',
      'p.category_id',
      'c.name as assigned_cook_name'
    )
    .orderBy('oi.id', 'asc');

  // Nest items inside orders
  const ordersWithItems = orders
    .map((o) => {
      const orderItems = items.filter((item) => item.order_id === o.id);
      return { ...o, items: orderItems };
    })
    .filter((o) => o.items.length > 0); // Only return orders that have KDS items

  return { rows: ordersWithItems };
};

/**
 * Advance or update the KDS status of an item.
 */
export const updateOrderItemStage = async (itemId, newStage) => {
  const rows = await db('order_items')
    .where({ id: itemId })
    .update({
      kds_status: newStage,
      is_item_completed: newStage === 'completed',
      updated_at: db.fn.now(),
    })
    .returning('*');
  return { rows };
};

/**
 * Mark a line item completed or not (setting strikethrough status).
 */
export const updateOrderItemCompleted = async (itemId, isCompleted) => {
  const rows = await db('order_items')
    .where({ id: itemId })
    .update({
      is_item_completed: isCompleted,
      kds_status: isCompleted ? 'completed' : 'to_cook',
      updated_at: db.fn.now(),
    })
    .returning('*');
  return { rows };
};

/**
 * Assign a cook to a specific item.
 */
export const assignCookToItem = async (itemId, cookId) => {
  const rows = await db('order_items')
    .where({ id: itemId })
    .update({
      assigned_cook_id: cookId || null,
      updated_at: db.fn.now(),
    })
    .returning('*');
  return { rows };
};
