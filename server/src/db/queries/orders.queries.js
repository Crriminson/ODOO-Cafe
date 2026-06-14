import db from '../knex.js';
import { computeOrderTotals } from '../../services/pricing.service.js';
import { ORDER_STATUS, ORDER_TYPE } from '../../../../shared/constants/index.js';
import { emitNewOrder } from '../../websocket/kds.emitter.js';

/**
 * Helper to validate table constraints based on order type.
 */
const validateTableConstraint = (orderType, tableId) => {
  if (orderType === ORDER_TYPE.DINE_IN && !tableId) {
    const err = new Error('Table is required for dine-in orders');
    err.code = 'TABLE_REQUIRED_FOR_DINE_IN';
    throw err;
  }
  if (orderType === ORDER_TYPE.TAKEAWAY && tableId) {
    const err = new Error('Takeaway orders cannot have a table');
    err.code = 'TAKEAWAY_NO_TABLE';
    throw err;
  }
};

/**
 * Fetches an order along with its items, payments, and discounts.
 * Can reuse an existing transaction client if passed.
 * 
 * @param {number} id 
 * @param {Object} [optionalClient] 
 * @returns {Promise<Object|null>}
 */
export const getOrderById = async (id, optionalClient) => {
  const q = optionalClient || db;

  // 1. Fetch order fields
  const orders = await q('orders as o')
    .leftJoin('customers as c', 'c.id', 'o.customer_id')
    .where('o.id', id)
    .select('o.*', 'c.name as customer_name')
    .limit(1);

  if (orders.length === 0) {
    return null;
  }
  const order = orders[0];

  // 2. Fetch items joined with products
  const items = await q('order_items as oi')
    .join('products as p', 'p.id', 'oi.product_id')
    .where('oi.order_id', id)
    .select('oi.*', 'p.name as product_name', 'p.category_id', q.raw('p.tax_rate::text as tax_rate'))
    .orderBy('oi.id', 'asc');

  // 3. Fetch payments
  const payments = await q('payments')
    .where('order_id', id)
    .orderBy('id', 'asc');

  // 4. Fetch discounts
  const discounts = await q('order_discounts')
    .where('order_id', id)
    .orderBy('id', 'asc');

  return {
    ...order,
    items,
    payments,
    discounts,
  };
};

/**
 * Creates a new order in a single database transaction.
 */
export const createOrder = async ({ sessionId, employeeId, orderType, tableId, customerId, items }) => {
  // 1. Validate table constraints
  validateTableConstraint(orderType, tableId);

  // Allow empty items on POST — the POS creates a draft order first,
  // then adds items incrementally via PUT /orders/:id.
  const hasItems = items && items.length > 0;

  return db.transaction(async (trx) => {
    let mappedItems = [];
    let totals = computeOrderTotals([], '0.00', '0.00', '0.00');

    if (hasItems) {
      // 2. Fetch product catalogue prices and tax rates (server-authoritative)
      const productIds = items.map(item => item.product_id);
      const catalogRows = await trx('products')
        .select('id', 'price', 'tax_rate')
        .whereIn('id', productIds)
        .where('is_active', true);

      const catalogMap = new Map(catalogRows.map(p => [p.id, p]));

      // Reject any product not in the active catalogue
      for (const item of items) {
        if (!catalogMap.has(item.product_id)) {
          const err = new Error(`Product ID ${item.product_id} is invalid or inactive`);
          err.code = 'INVALID_PRODUCT';
          throw err;
        }
      }

      // 3. Map items — unit_price ALWAYS comes from catalogue, never the request body
      mappedItems = items.map(item => {
        const product = catalogMap.get(item.product_id);
        return {
          product_id: item.product_id,
          unit_price: product.price.toString(),
          quantity: item.quantity,
          tax_rate: (parseFloat(product.tax_rate) / 100).toString(),
        };
      });

      // 4. Compute totals via pricing service
      totals = computeOrderTotals(mappedItems, '0.00', '0.00', '0.00');
    }

    // 5. Insert order row
    const [orderRow] = await trx('orders')
      .insert({
        session_id: sessionId,
        employee_id: employeeId,
        customer_id: customerId || null,
        table_id: tableId || null,
        order_type: orderType,
        status: ORDER_STATUS.DRAFT,
        subtotal: totals.subtotal,
        tax_total: totals.tax_total,
        discount_total: totals.discount_total,
        tip: totals.tip,
        total: totals.total,
        loyalty_points_redeemed: 0,
        loyalty_discount: '0.00',
      })
      .returning('id');

    const orderId = orderRow.id;

    // 6. Insert order items (skipped when items array is empty)
    for (const item of mappedItems) {
      const lineTotal = (parseFloat(item.unit_price) * item.quantity).toFixed(2);
      await trx('order_items').insert({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: lineTotal,
        kds_status: 'to_cook',
        is_item_completed: false,
      });
    }

    // 7. Return the full nested order object
    return getOrderById(orderId, trx);
  });
};

/**
 * Fetches filtered and searched orders.
 */
export const getOrders = async ({ sessionId, status, search, tableId }) => {
  const queryBuilder = db('orders as o')
    .leftJoin('customers as c', 'c.id', 'o.customer_id')
    .select('o.*', 'c.name as customer_name');

  if (sessionId) {
    queryBuilder.where('o.session_id', sessionId);
  }
  if (status) {
    queryBuilder.where('o.status', status);
  }
  if (tableId) {
    queryBuilder.where('o.table_id', tableId);
  }
  if (search) {
    queryBuilder.where(function() {
      this.where('c.name', 'ilike', `%${search}%`)
        .orWhereRaw('o.id::text LIKE ?', [`%${search}%`])
        .orWhereRaw('o.created_at::date::text LIKE ?', [`%${search}%`]);
    });
  }

  const rows = await queryBuilder.orderBy('o.id', 'desc');
  return { orders: rows };
};

/**
 * Replaces items and updates totals of a draft order.
 */
export const updateOrder = async (id, { items, customerId, tableId }) => {
  const currentOrder = await getOrderById(id);
  if (!currentOrder) {
    return null;
  }

  // Verify status is draft
  if (currentOrder.status !== ORDER_STATUS.DRAFT) {
    const err = new Error('Only draft orders can be modified');
    err.code = 'ORDER_NOT_DRAFT';
    throw err;
  }

  // Validate table constraints based on existing orderType
  validateTableConstraint(currentOrder.order_type, tableId ?? currentOrder.table_id);


  // Allow empty items array — clears all items and zeroes totals.
  // This happens when the cashier removes the last product before adding new ones.
  const hasItems = items && items.length > 0;

  return db.transaction(async (trx) => {
    let mappedItems = [];
    let totals = computeOrderTotals(
      [],
      currentOrder.discount_total,
      currentOrder.loyalty_discount,
      currentOrder.tip
    );

    if (hasItems) {
      // 1. Fetch products from DB (server-authoritative pricing)
      const productIds = items.map(item => item.product_id);
      const catalogRows = await trx('products')
        .select('id', 'price', 'tax_rate')
        .whereIn('id', productIds)
        .where('is_active', true);

      const catalogMap = new Map(catalogRows.map(p => [p.id, p]));

      for (const item of items) {
        if (!catalogMap.has(item.product_id)) {
          const err = new Error(`Product ID ${item.product_id} is invalid or inactive`);
          err.code = 'INVALID_PRODUCT';
          throw err;
        }
      }

      // 2. Map items — unit_price from catalogue only, never request body
      mappedItems = items.map(item => {
        const product = catalogMap.get(item.product_id);
        return {
          product_id: item.product_id,
          unit_price: product.price.toString(),
          quantity: item.quantity,
          tax_rate: (parseFloat(product.tax_rate) / 100).toString(),
        };
      });

      // 3. Recompute totals (retains existing discount, loyalty discount, and tip)
      totals = computeOrderTotals(
        mappedItems,
        currentOrder.discount_total,
        currentOrder.loyalty_discount,
        currentOrder.tip
      );
    }

    // 4. DELETE old items (always) then re-insert new ones
    await trx('order_items').where({ order_id: id }).del();

    // 5. Insert new items (loop skipped when mappedItems is empty)
    for (const item of mappedItems) {
      const lineTotal = (parseFloat(item.unit_price) * item.quantity).toFixed(2);
      await trx('order_items').insert({
        order_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: lineTotal,
        kds_status: 'to_cook',
        is_item_completed: false,
      });
    }

    // 6. Update order totals and metadata
    await trx('orders')
      .where({ id })
      .update({
        customer_id: customerId !== undefined ? (customerId || null) : currentOrder.customer_id,
        table_id: tableId !== undefined ? (tableId || null) : currentOrder.table_id,
        subtotal: totals.subtotal,
        tax_total: totals.tax_total,
        total: totals.total,
        updated_at: trx.fn.now(),
      });

    // 7. Return the full updated order within the transaction
    return getOrderById(id, trx);
  });
};

/**
 * Transitions order from draft to sent and broadcasts it to KDS.
 */
export const sendOrderToKitchen = async (id) => {
  const currentOrder = await getOrderById(id);
  if (!currentOrder) {
    return null;
  }

  if (currentOrder.status !== ORDER_STATUS.DRAFT) {
    const err = new Error('Only draft orders can be sent to the kitchen');
    err.code = 'ORDER_NOT_DRAFT';
    throw err;
  }

  // Update status to 'sent'
  await db('orders')
    .where({ id })
    .update({
      status: ORDER_STATUS.SENT,
      updated_at: db.fn.now(),
    });

  // Fetch full order with items for KDS payload
  const fullOrder = await getOrderById(id);

  // Broadcast via WebSockets
  emitNewOrder(fullOrder);

  return fullOrder;
};

/**
 * Deletes a draft order (cascades automatically to items).
 */
export const deleteOrder = async (id) => {
  const currentOrder = await getOrderById(id);
  if (!currentOrder) {
    return null;
  }

  if (currentOrder.status !== ORDER_STATUS.DRAFT) {
    const err = new Error('Only draft orders can be deleted');
    err.code = 'ORDER_NOT_DRAFT';
    throw err;
  }

  // Hard delete
  await db('orders').where({ id }).del();

  return { message: 'Order deleted' };
};

/**
 * Pays a draft order in a single transaction:
 *   1. Verify status === 'draft' and order has items
 *   2. Insert a payments row
 *   3. Update order status → 'paid', apply tip if provided
 *   4. Emit to KDS (kitchen finds out AFTER payment, not before)
 *   5. Return the full updated order with change_due for cash
 *
 * @param {number} id  - Order ID
 * @param {{ payment_method: string, amount_paid: string|number,
 *            transaction_reference?: string, tip?: string|number }} paymentData
 */
export const payOrder = async (id, { payment_method, amount_paid, transaction_reference, tip }) => {
  const currentOrder = await getOrderById(id);
  if (!currentOrder) return null;

  if (currentOrder.status !== ORDER_STATUS.DRAFT) {
    const err = new Error('Only draft orders can be paid');
    err.code = 'ORDER_NOT_DRAFT';
    throw err;
  }

  if (!currentOrder.items || currentOrder.items.length === 0) {
    const err = new Error('Cannot pay an empty order');
    err.code = 'EMPTY_ORDER';
    throw err;
  }

  const tipAmount  = parseFloat(tip || 0).toFixed(2);
  const orderTotal = parseFloat(currentOrder.total);
  const paid       = parseFloat(amount_paid);
  const changeDue  = payment_method === 'cash'
    ? Math.max(0, paid - orderTotal).toFixed(2)
    : '0.00';

  await db.transaction(async (trx) => {
    // 1. Insert payment record
    await trx('payments').insert({
      order_id:              id,
      method:                payment_method,
      amount:                orderTotal.toFixed(2),
      tip:                   tipAmount,
      transaction_reference: transaction_reference || null,
    });

    // 2. Mark order paid + apply tip
    await trx('orders').where({ id }).update({
      status:     ORDER_STATUS.PAID,
      tip:        tipAmount,
      updated_at: trx.fn.now(),
    });
  });

  // 3. Fetch the completed order
  const fullOrder = await getOrderById(id);

  // 4. Broadcast to KDS — kitchen only sees the order AFTER payment
  emitNewOrder(fullOrder);

  return { order: fullOrder, change_due: changeDue };
};
