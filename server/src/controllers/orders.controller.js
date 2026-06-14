import {
  createOrder as dbCreateOrder,
  getOrders as dbGetOrders,
  getOrderById as dbGetOrderById,
  updateOrder as dbUpdateOrder,
  sendOrderToKitchen as dbSendOrderToKitchen,
  deleteOrder as dbDeleteOrder,
  payOrder as dbPayOrder,
} from '../db/queries/orders.queries.js';
import { emitOrderPaid } from '../websocket/kds.emitter.js';


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
 * Processes checkout payment.
 */
export const payOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id, 10);
    const {
      method,
      amount,
      tip,
      transaction_reference, transactionReference,
      coupon_code, couponCode,
      loyalty_points_to_redeem, loyaltyPointsToRedeem,
    } = req.body;

    const result = await dbPayOrder(orderId, {
      method,
      amount,
      tip,
      transactionReference: transaction_reference ?? transactionReference,
      couponCode:           coupon_code ?? couponCode,
      loyaltyPointsToRedeem: loyalty_points_to_redeem ?? loyaltyPointsToRedeem,
    });

    if (!result) {
      return res.status(404).json({
        error: { message: 'Order not found', code: 'NOT_FOUND' },
      });
    }

    // Broadcast order payment to KDS screens
    emitOrderPaid(orderId);

    return res.status(200).json(result);
  } catch (err) {
    if (
      err.code === 'ORDER_NOT_SENT' ||
      err.code === 'INVALID_COUPON' ||
      err.code === 'INSUFFICIENT_LOYALTY_POINTS' ||
      err.code === 'CUSTOMER_REQUIRED'
    ) {
      return res.status(err.code === 'ORDER_NOT_SENT' ? 409 : 400).json({
        error: { message: err.message, code: err.code },
      });
    }
    next(err);
  }
};

