import {
  createOrder as dbCreateOrder,
  getOrders as dbGetOrders,
  getOrderById as dbGetOrderById,
  updateOrder as dbUpdateOrder,
  sendOrderToKitchen as dbSendOrderToKitchen,
  deleteOrder as dbDeleteOrder,
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
    const { sessionId, orderType, tableId, customerId, items } = req.body;

    const order = await dbCreateOrder({
      sessionId,
      employeeId,
      orderType,
      tableId,
      customerId,
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
    const { items, customerId, tableId } = req.body;

    const order = await dbUpdateOrder(orderId, {
      items,
      customerId,
      tableId,
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
