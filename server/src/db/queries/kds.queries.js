import { query } from '../../config/db.js';

/**
 * Fetch all active KDS orders with optional filters.
 * Filters: search, product_id, category_id.
 * Grouping is done in the controller.
 * Note: To show completed items alongside active ones within the same order,
 * we write a fresh query instead of using v_kds_active_orders (which filters out completed items).
 */
export const getKdsOrders = async ({ search, product_id, category_id } = {}) => {
  let sql = `
    SELECT
      o.id AS order_id,
      o.order_type,
      o.status AS order_status,
      o.table_id,
      t.table_number,
      o.session_id,
      o.customer_id,
      cust.name AS customer_name,
      o.created_at AS order_created_at,
      o.subtotal::text AS subtotal,
      o.tax_total::text AS tax_total,
      o.discount_total::text AS discount_total,
      o.tip::text AS tip,
      o.total::text AS total,
      oi.id AS item_id,
      oi.product_id,
      oi.quantity,
      oi.unit_price::text AS unit_price,
      (oi.quantity * oi.unit_price)::numeric::text AS line_total,
      oi.kds_status,
      oi.is_item_completed,
      oi.assigned_cook_id,
      pr.name AS product_name,
      pr.category_id,
      cat.name AS category_name,
      cat.color AS category_color,
      pr.estimated_prep_time,
      ck.name AS assigned_cook_name
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products pr ON pr.id = oi.product_id AND pr.show_on_kds = TRUE
    JOIN categories cat ON cat.id = pr.category_id
    LEFT JOIN cooks ck ON ck.id = oi.assigned_cook_id
    LEFT JOIN tables t ON t.id = o.table_id
    LEFT JOIN customers cust ON cust.id = o.customer_id
    WHERE o.status = 'sent'
      AND EXISTS (
        SELECT 1 FROM order_items oi_act
        JOIN products pr_act ON pr_act.id = oi_act.product_id
        WHERE oi_act.order_id = o.id
          AND pr_act.show_on_kds = TRUE
          AND oi_act.kds_status != 'completed'
      )
  `;

  const params = [];

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND EXISTS (
      SELECT 1 FROM order_items oi_s
      JOIN products pr_s ON pr_s.id = oi_s.product_id
      WHERE oi_s.order_id = o.id
        AND pr_s.show_on_kds = TRUE
        AND pr_s.name ILIKE $${params.length}
    )`;
  }

  if (product_id) {
    params.push(parseInt(product_id, 10));
    sql += ` AND EXISTS (
      SELECT 1 FROM order_items oi_p
      JOIN products pr_p ON pr_p.id = oi_p.product_id
      WHERE oi_p.order_id = o.id
        AND pr_p.show_on_kds = TRUE
        AND oi_p.product_id = $${params.length}
    )`;
  }

  if (category_id) {
    params.push(parseInt(category_id, 10));
    sql += ` AND EXISTS (
      SELECT 1 FROM order_items oi_c
      JOIN products pr_c ON pr_c.id = oi_c.product_id
      WHERE oi_c.order_id = o.id
        AND pr_c.show_on_kds = TRUE
        AND pr_c.category_id = $${params.length}
    )`;
  }

  sql += ` ORDER BY o.created_at ASC, oi.id ASC`;

  return query(sql, params);
};

/**
 * Get the order status and its items' KDS status to compute stage.
 */
export const getOrderForStageUpdate = (orderId) =>
  query(
    `SELECT
       o.id AS order_id,
       o.status AS order_status,
       oi.kds_status
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products pr ON pr.id = oi.product_id AND pr.show_on_kds = TRUE
     WHERE o.id = $1`,
    [orderId]
  );

/**
 * Update the KDS status of all items in an order.
 */
export const updateOrderKdsStatus = (orderId, newStage) =>
  query(
    `UPDATE order_items
     SET kds_status = $1
     WHERE order_id = $2`,
    [newStage, orderId]
  );

/**
 * Complete a single KDS item.
 */
export const completeKdsItem = (itemId) =>
  query(
    `UPDATE order_items
     SET is_item_completed = TRUE
     WHERE id = $1
     RETURNING order_id`,
    [itemId]
  );
