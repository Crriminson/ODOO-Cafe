import { db } from '../../config/db.js';
import { ORDER_STATUS } from '../../../../shared/constants/index.js';

/**
 * Apply date and employee filters to standard reports.
 */
const applyFilters = (queryBuilder, { startDate, endDate, employeeId }) => {
  if (startDate) {
    queryBuilder.where('o.created_at', '>=', startDate);
  }
  if (endDate) {
    queryBuilder.where('o.created_at', '<=', endDate);
  }
  if (employeeId) {
    queryBuilder.where('o.employee_id', employeeId);
  }
};

/**
 * Fetch summary metrics: Total Orders, Total Revenue, Average Order Value.
 */
export const getSummaryMetrics = async ({ startDate, endDate, employeeId }) => {
  const queryBuilder = db('orders as o')
    .where('o.status', ORDER_STATUS.PAID);

  applyFilters(queryBuilder, { startDate, endDate, employeeId });

  const rows = await queryBuilder.select(
    db.raw('COUNT(o.id)::int as total_orders'),
    db.raw('COALESCE(SUM(o.total), 0)::text as total_revenue'),
    db.raw('COALESCE(AVG(o.total), 0)::text as average_order_value')
  );

  return { rows };
};

/**
 * Group paid sales by calendar date.
 */
export const getSalesTrend = async ({ startDate, endDate, employeeId }) => {
  const queryBuilder = db('orders as o')
    .where('o.status', ORDER_STATUS.PAID);

  applyFilters(queryBuilder, { startDate, endDate, employeeId });

  const rows = await queryBuilder
    .select(
      db.raw("o.created_at::date::text as date"),
      db.raw("COUNT(o.id)::int as order_count"),
      db.raw("SUM(o.total)::text as revenue")
    )
    .groupBy(db.raw("o.created_at::date"))
    .orderBy("date", "asc");

  return { rows };
};

/**
 * Fetch products generating the most sales.
 */
export const getTopProducts = async ({ startDate, endDate, limit = 5 }) => {
  const queryBuilder = db('orders as o')
    .join('order_items as oi', 'oi.order_id', 'o.id')
    .join('products as p', 'p.id', 'oi.product_id')
    .where('o.status', ORDER_STATUS.PAID);

  if (startDate) {
    queryBuilder.where('o.created_at', '>=', startDate);
  }
  if (endDate) {
    queryBuilder.where('o.created_at', '<=', endDate);
  }

  const rows = await queryBuilder
    .select(
      'p.name as product_name',
      db.raw('SUM(oi.quantity)::int as quantity_sold'),
      db.raw('SUM(oi.line_total)::text as revenue')
    )
    .groupBy('p.id', 'p.name')
    .orderBy('quantity_sold', 'desc')
    .limit(limit);

  return { rows };
};

/**
 * Fetch product categories generating the most revenue.
 */
export const getTopCategories = async ({ startDate, endDate, limit = 5 }) => {
  const queryBuilder = db('orders as o')
    .join('order_items as oi', 'oi.order_id', 'o.id')
    .join('products as p', 'p.id', 'oi.product_id')
    .join('categories as c', 'c.id', 'p.category_id')
    .where('o.status', ORDER_STATUS.PAID);

  if (startDate) {
    queryBuilder.where('o.created_at', '>=', startDate);
  }
  if (endDate) {
    queryBuilder.where('o.created_at', '<=', endDate);
  }

  const rows = await queryBuilder
    .select(
      'c.name as category_name',
      'c.color as category_color',
      db.raw('SUM(oi.line_total)::text as revenue')
    )
    .groupBy('c.id', 'c.name', 'c.color')
    .orderBy('revenue', 'desc')
    .limit(limit);

  return { rows };
};

/**
 * Fetch top highest-value orders.
 */
export const getTopOrders = async ({ startDate, endDate, limit = 5 }) => {
  const queryBuilder = db('orders as o')
    .leftJoin('customers as cust', 'cust.id', 'o.customer_id')
    .where('o.status', ORDER_STATUS.PAID);

  if (startDate) {
    queryBuilder.where('o.created_at', '>=', startDate);
  }
  if (endDate) {
    queryBuilder.where('o.created_at', '<=', endDate);
  }

  const rows = await queryBuilder
    .select(
      'o.id as order_id',
      'cust.name as customer_name',
      'o.order_type',
      db.raw('o.total::text as total'),
      'o.created_at'
    )
    .orderBy('o.total', 'desc')
    .limit(limit);

  return { rows };
};
