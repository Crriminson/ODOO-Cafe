import { query, getClient } from '../../config/db.js';
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
  const db = optionalClient || { query: (text, params) => query(text, params) };

  // 1. Fetch order fields
  const orderRes = await db.query(
    `SELECT o.*, c.name AS customer_name
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.id = $1`,
    [id]
  );
  if (orderRes.rows.length === 0) {
    return null;
  }
  const order = orderRes.rows[0];

  // 2. Fetch items joined with products
  const itemsRes = await db.query(
    `SELECT oi.*, p.name AS product_name, p.category_id
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1
     ORDER BY oi.id ASC`,
    [id]
  );

  // 3. Fetch payments
  const paymentsRes = await db.query(
    `SELECT * FROM payments WHERE order_id = $1 ORDER BY id ASC`,
    [id]
  );

  // 4. Fetch discounts
  const discountsRes = await db.query(
    `SELECT * FROM order_discounts WHERE order_id = $1 ORDER BY id ASC`,
    [id]
  );

  return {
    ...order,
    items: itemsRes.rows,
    payments: paymentsRes.rows,
    discounts: discountsRes.rows,
  };
};

/**
 * Creates a new order in a single database transaction.
 */
export const createOrder = async ({ sessionId, employeeId, orderType, tableId, customerId, items }) => {
  // 1. Validate constraints
  validateTableConstraint(orderType, tableId);

  if (!items || items.length === 0) {
    const err = new Error('Order must contain at least one item');
    err.code = 'EMPTY_ORDER';
    throw err;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 2. Fetch product catalogue prices and tax rates
    const productIds = items.map(item => item.product_id);
    const catalogRes = await client.query(
      `SELECT id, price, tax_rate FROM products WHERE id = ANY($1) AND is_active = true`,
      [productIds]
    );

    const catalogMap = new Map(catalogRes.rows.map(p => [p.id, p]));

    // Check that all products exist in active catalogue
    for (const item of items) {
      if (!catalogMap.has(item.product_id)) {
        const err = new Error(`Product ID ${item.product_id} is invalid or inactive`);
        err.code = 'INVALID_PRODUCT';
        throw err;
      }
    }

    // 3. Map items to calculate pricing
    const mappedItems = items.map(item => {
      const product = catalogMap.get(item.product_id);
      return {
        product_id: item.product_id,
        unit_price: product.price.toString(),
        quantity: item.quantity,
        tax_rate: (parseFloat(product.tax_rate) / 100).toString(),
      };
    });

    // 4. Compute totals
    const totals = computeOrderTotals(mappedItems, '0.00', '0.00', '0.00');

    // 5. Insert order row
    const orderInsertRes = await client.query(
      `INSERT INTO orders (
        session_id, employee_id, customer_id, table_id, order_type, status,
        subtotal, tax_total, discount_total, tip, total, loyalty_points_redeemed, loyalty_discount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, '0.00')
      RETURNING id`,
      [
        sessionId,
        employeeId,
        customerId || null,
        tableId || null,
        orderType,
        ORDER_STATUS.DRAFT,
        totals.subtotal,
        totals.tax_total,
        totals.discount_total,
        totals.tip,
        totals.total,
      ]
    );

    const orderId = orderInsertRes.rows[0].id;

    // 6. Insert order items
    for (const item of mappedItems) {
      const lineTotal = (parseFloat(item.unit_price) * item.quantity).toFixed(2);
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, quantity, unit_price, line_total, kds_status, is_item_completed
        ) VALUES ($1, $2, $3, $4, $5, 'to_cook', false)`,
        [
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          lineTotal,
        ]
      );
    }

    // 7. Get the full nested order object
    const fullOrder = await getOrderById(orderId, client);

    await client.query('COMMIT');
    return fullOrder;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Fetches filtered and searched orders.
 */
export const getOrders = async ({ sessionId, status, search, tableId }) => {
  const conditions = [];
  const params = [];

  if (sessionId) {
    params.push(sessionId);
    conditions.push(`o.session_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }
  if (tableId) {
    params.push(tableId);
    conditions.push(`o.table_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(LOWER(c.name) LIKE LOWER($${params.length}) 
        OR o.id::text LIKE $${params.length} 
        OR o.created_at::date::text LIKE $${params.length})`
    );
  }

  let queryText = `
    SELECT o.*, c.name AS customer_name
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
  `;
  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }
  queryText += ' ORDER BY o.id DESC';

  const { rows } = await query(queryText, params);
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
  validateTableConstraint(currentOrder.order_type, tableId);

  if (!items || items.length === 0) {
    const err = new Error('Order must contain at least one item');
    err.code = 'EMPTY_ORDER';
    throw err;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch products from DB
    const productIds = items.map(item => item.product_id);
    const catalogRes = await client.query(
      `SELECT id, price, tax_rate FROM products WHERE id = ANY($1) AND is_active = true`,
      [productIds]
    );

    const catalogMap = new Map(catalogRes.rows.map(p => [p.id, p]));

    for (const item of items) {
      if (!catalogMap.has(item.product_id)) {
        const err = new Error(`Product ID ${item.product_id} is invalid or inactive`);
        err.code = 'INVALID_PRODUCT';
        throw err;
      }
    }

    // 2. Map items
    const mappedItems = items.map(item => {
      const product = catalogMap.get(item.product_id);
      return {
        product_id: item.product_id,
        unit_price: product.price.toString(),
        quantity: item.quantity,
        tax_rate: (parseFloat(product.tax_rate) / 100).toString(),
      };
    });

    // 3. Recompute totals (retains discount, loyalty discount, and tip)
    const totals = computeOrderTotals(
      mappedItems,
      currentOrder.discount_total,
      currentOrder.loyalty_discount,
      currentOrder.tip
    );

    // 4. Delete old items
    await client.query(`DELETE FROM order_items WHERE order_id = $1`, [id]);

    // 5. Insert new items
    for (const item of mappedItems) {
      const lineTotal = (parseFloat(item.unit_price) * item.quantity).toFixed(2);
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, quantity, unit_price, line_total, kds_status, is_item_completed
        ) VALUES ($1, $2, $3, $4, $5, 'to_cook', false)`,
        [
          id,
          item.product_id,
          item.quantity,
          item.unit_price,
          lineTotal,
        ]
      );
    }

    // 6. Update order fields
    await client.query(
      `UPDATE orders
       SET customer_id = $2,
           table_id = $3,
           subtotal = $4,
           tax_total = $5,
           total = $6,
           updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        customerId || null,
        tableId || null,
        totals.subtotal,
        totals.tax_total,
        totals.total,
      ]
    );

    // 7. Get full updated order within transaction
    const updatedOrder = await getOrderById(id, client);

    await client.query('COMMIT');
    return updatedOrder;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
  await query(
    `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1`,
    [id, ORDER_STATUS.SENT]
  );

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
  await query(`DELETE FROM orders WHERE id = $1`, [id]);

  return { message: 'Order deleted' };
};
