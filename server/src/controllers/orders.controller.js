import {
  createOrder as dbCreateOrder,
  getOrders as dbGetOrders,
  getOrderById as dbGetOrderById,
  updateOrder as dbUpdateOrder,
  sendOrderToKitchen as dbSendOrderToKitchen,
  deleteOrder as dbDeleteOrder,
  payOrder as dbPayOrder,
} from '../db/queries/orders.queries.js';

/**
 * Handle errors common to orders module.
 */
const handleOrderError = (err, res) => {
  if (
    err.code === 'TABLE_REQUIRED_FOR_DINE_IN' ||
    err.code === 'TAKEAWAY_NO_TABLE' ||
    err.code === 'EMPTY_ORDER' ||
    err.code === 'INVALID_PRODUCT'
  ) {
    return res.status(400).json({
      error: { message: err.message, code: err.code },
    });
  }
  if (err.code === 'ORDER_NOT_DRAFT') {
    return res.status(409).json({
      error: { message: err.message, code: err.code },
    });
  }
  return null;
};

/**
 * POST /orders
 * Creates a new order.
 */
export const createOrder = async (req, res, next) => {
  try {
    const employeeId = req.user.userId || req.user.id;
    // Accept both snake_case (from client/API contract) and camelCase
    const {
      session_id, sessionId,
      order_type, orderType,
      table_id,   tableId,
      customer_id, customerId,
      items,
    } = req.body;

    const order = await dbCreateOrder({
      sessionId:   session_id  ?? sessionId,
      employeeId,
      orderType:   order_type  ?? orderType,
      tableId:     table_id    ?? tableId,
      customerId:  customer_id ?? customerId,
      items,
    });

    return res.status(201).json({ order });
  } catch (err) {
    if (handleOrderError(err, res)) return;
    next(err);
  }
};

/**
 * GET /orders
 * Fetches filtered/searched orders.
 */
export const getOrders = async (req, res, next) => {
  try {
    const { sessionId, status, search, tableId } = req.query;
    
    // Parse tableId/sessionId to integer if present, to align with query expectations
    const parsedSessionId = sessionId ? parseInt(sessionId, 10) : undefined;
    const parsedTableId = tableId ? parseInt(tableId, 10) : undefined;

    const result = await dbGetOrders({
      sessionId: parsedSessionId,
      status,
      search,
      tableId: parsedTableId,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /orders/:id
 * Fetches details of a single order.
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id, 10);

    const order = await dbGetOrderById(orderId);
    if (!order) {
      return res.status(404).json({
        error: { message: 'Order not found', code: 'NOT_FOUND' },
      });
    }

    return res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /orders/:id
 * Replaces items and updates metadata of a draft order.
 */
export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id, 10);
    // Accept both snake_case (from client/API contract) and camelCase
    const {
      items,
      customer_id, customerId,
      table_id,    tableId,
    } = req.body;

    const order = await dbUpdateOrder(orderId, {
      items,
      customerId: customer_id ?? customerId,
      tableId:    table_id    ?? tableId,
    });

    if (!order) {
      return res.status(404).json({
        error: { message: 'Order not found', code: 'NOT_FOUND' },
      });
    }

    return res.status(200).json({ order });
  } catch (err) {
    if (handleOrderError(err, res)) return;
    next(err);
  }
};

/**
 * POST /orders/:id/send
 * Transitions order status to sent and sends it to kitchen (KDS).
 */
export const sendOrderToKitchen = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id, 10);

    const order = await dbSendOrderToKitchen(orderId);
    if (!order) {
      return res.status(404).json({
        error: { message: 'Order not found', code: 'NOT_FOUND' },
      });
    }

    return res.status(200).json({ order });
  } catch (err) {
    if (handleOrderError(err, res)) return;
    next(err);
  }
};

/**
 * DELETE /orders/:id
 * Hard deletes a draft order.
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id, 10);

    const result = await dbDeleteOrder(orderId);
    if (!result) {
      return res.status(404).json({
        error: { message: 'Order not found', code: 'NOT_FOUND' },
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    if (handleOrderError(err, res)) return;
    next(err);
  }
};

/**
 * POST /orders/:id/pay
 * Accepts payment for a draft order, transitions it to paid,
 * and broadcasts to KDS. Kitchen sees the order only after payment.
 */
export const payOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id, 10);
    const {
      payment_method,
      amount_paid,
      transaction_reference,
      tip,
    } = req.body;

    if (!payment_method || !amount_paid) {
      return res.status(400).json({
        error: { message: 'payment_method and amount_paid are required', code: 'MISSING_FIELDS' },
      });
    }

    const result = await dbPayOrder(orderId, {
      payment_method,
      amount_paid,
      transaction_reference,
      tip,
    });

    if (!result) {
      return res.status(404).json({
        error: { message: 'Order not found', code: 'NOT_FOUND' },
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    if (handleOrderError(err, res)) return;
    next(err);
  }
};
