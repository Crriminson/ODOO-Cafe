import { getIO } from './index.js';

/**
 * KDS real-time emitters.
 * Import and call these from order/KDS controllers — never emit directly from routes.
 *
 * All KDS clients listen on the default namespace ('/').
 */

/** Broadcast a new order to all KDS screens. */
export const emitNewOrder = (orderPayload) =>
  getIO().emit('order:new', orderPayload);

/** Broadcast a KDS stage change (to_cook → preparing → completed). */
export const emitStageUpdated = (orderId, newStage) =>
  getIO().emit('order:stage_updated', { order_id: orderId, kds_status: newStage });

/** Broadcast a single item completion (per-item strikethrough on KDS). */
export const emitItemCompleted = (orderId, itemId) =>
  getIO().emit('item:completed', { order_id: orderId, item_id: itemId });

/** Broadcast order payment — removes ticket from KDS. */
export const emitOrderPaid = (orderId) =>
  getIO().emit('order:paid', { order_id: orderId });
