import {
  getSummaryMetrics,
  getSalesTrend,
  getTopProducts,
  getTopCategories,
  getTopOrders,
} from '../db/queries/reports.queries.js';

const parseFilters = (q) => ({
  startDate:  q.startDate  || null,
  endDate:    q.endDate    || null,
  employeeId: q.employeeId ? parseInt(q.employeeId, 10) : null,
});

// GET /api/v1/reports/summary
export const summary = async (req, res, next) => {
  try {
    const { rows } = await getSummaryMetrics(parseFilters(req.query));
    return res.json({ metrics: rows[0] ?? { total_orders: 0, total_revenue: '0', average_order_value: '0' } });
  } catch (err) { next(err); }
};

// GET /api/v1/reports/sales-trend
export const salesTrend = async (req, res, next) => {
  try {
    const { rows } = await getSalesTrend(parseFilters(req.query));
    return res.json({ trend: rows });
  } catch (err) { next(err); }
};

// GET /api/v1/reports/top-products
export const topProducts = async (req, res, next) => {
  try {
    const { startDate, endDate } = parseFilters(req.query);
    const limit = parseInt(req.query.limit, 10) || 5;
    const { rows } = await getTopProducts({ startDate, endDate, limit });
    return res.json({ products: rows });
  } catch (err) { next(err); }
};

// GET /api/v1/reports/top-categories
export const topCategories = async (req, res, next) => {
  try {
    const { startDate, endDate } = parseFilters(req.query);
    const limit = parseInt(req.query.limit, 10) || 8;
    const { rows } = await getTopCategories({ startDate, endDate, limit });
    return res.json({ categories: rows });
  } catch (err) { next(err); }
};

// GET /api/v1/reports/top-orders
export const topOrders = async (req, res, next) => {
  try {
    const { startDate, endDate } = parseFilters(req.query);
    const limit = parseInt(req.query.limit, 10) || 5;
    const { rows } = await getTopOrders({ startDate, endDate, limit });
    return res.json({ orders: rows });
  } catch (err) { next(err); }
};
