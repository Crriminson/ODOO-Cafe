import {
  getKdsOrders,
  getOrderForStageUpdate,
  updateOrderKdsStatus,
  completeKdsItem,
} from '../db/queries/kds.queries.js';
import {
  emitStageUpdated,
  emitItemCompleted,
} from '../websocket/kds.emitter.js';
import { KDS_STAGES } from '../../../shared/constants/kdsStages.js';
import { ORDER_STATUS } from '../../../shared/constants/orderStatus.js';

const computeKdsStage = (items) => {
  if (!items || items.length === 0) return KDS_STAGES.COMPLETED;
  const allCompleted = items.every((i) => i.is_item_completed || i.kds_status === KDS_STAGES.COMPLETED);
  if (allCompleted) return KDS_STAGES.COMPLETED;
  const hasPreparing = items.some((i) => i.kds_status === KDS_STAGES.PREPARING);
  if (hasPreparing) return KDS_STAGES.PREPARING;
  return KDS_STAGES.TO_COOK;
};

// ─── GET /api/v1/kds/orders ──────────────────────────────────────────────────

export const getOrders = async (req, res, next) => {
  try {
    const { search, product_id, category_id } = req.query;
    const { rows } = await getKdsOrders({ search, product_id, category_id });

    const ordersMap = new Map();
    for (const row of rows) {
      const orderId = row.order_id;
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          id: parseInt(orderId, 10),
          order_type: row.order_type,
          table_id: row.table_id ? parseInt(row.table_id, 10) : null,
          table_number: row.table_number ? parseInt(row.table_number, 10) : null,
          session_id: parseInt(row.session_id, 10),
          customer_id: row.customer_id ? parseInt(row.customer_id, 10) : null,
          customer_name: row.customer_name || null,
          status: row.order_status,
          subtotal: Number(row.subtotal || 0).toFixed(2),
          tax_total: Number(row.tax_total || 0).toFixed(2),
          discount_total: Number(row.discount_total || 0).toFixed(2),
          tip: Number(row.tip || 0).toFixed(2),
          total: Number(row.total || 0).toFixed(2),
          created_at: new Date(row.order_created_at).toISOString(),
          items: [],
        });
      }

      if (row.item_id) {
        ordersMap.get(orderId).items.push({
          id: parseInt(row.item_id, 10),
          order_id: parseInt(orderId, 10),
          product_id: parseInt(row.product_id, 10),
          product_name: row.product_name,
          category_id: parseInt(row.category_id, 10),
          category_name: row.category_name,
          category_color: row.category_color,
          show_on_kds: true,
          quantity: parseInt(row.quantity, 10),
          unit_price: Number(row.unit_price).toFixed(2),
          line_total: Number(row.line_total).toFixed(2),
          kds_status: row.kds_status,
          is_item_completed: row.is_item_completed,
          assigned_cook_id: row.assigned_cook_id ? parseInt(row.assigned_cook_id, 10) : null,
          assigned_cook_name: row.assigned_cook_name || null,
          estimated_prep_time: row.estimated_prep_time ? parseInt(row.estimated_prep_time, 10) : null,
        });
      }
    }

    const orders = Array.from(ordersMap.values()).map((order) => ({
      ...order,
      kds_stage: computeKdsStage(order.items),
    }));
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/v1/kds/orders/:id/stage ──────────────────────────────────────────

export const stageOrder = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { rows } = await getOrderForStageUpdate(orderId);

    if (rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Order not found', code: 'NOT_FOUND' },
      });
    }

    const orderStatus = rows[0].order_status;
    if (orderStatus !== ORDER_STATUS.SENT) {
      return res.status(409).json({
        error: { message: 'Order is not sent', code: 'ORDER_NOT_SENT' },
      });
    }

    const items = rows.filter((r) => r.kds_status !== null);
    if (items.length === 0) {
      return res.status(409).json({
        error: { message: 'Order has no KDS items', code: 'ALREADY_COMPLETED' },
      });
    }

    const allCompleted = items.every((item) => item.kds_status === KDS_STAGES.COMPLETED);
    if (allCompleted) {
      return res.status(409).json({
        error: { message: 'Order is already completed', code: 'ALREADY_COMPLETED' },
      });
    }

    const hasToCook = items.some((item) => item.kds_status === KDS_STAGES.TO_COOK);
    const hasPreparing = items.some((item) => item.kds_status === KDS_STAGES.PREPARING);

    let newStage;
    if (hasToCook) {
      newStage = KDS_STAGES.PREPARING;
    } else if (hasPreparing) {
      newStage = KDS_STAGES.COMPLETED;
    } else {
      newStage = KDS_STAGES.COMPLETED;
    }

    await updateOrderKdsStatus(orderId, newStage);
    emitStageUpdated(orderId, newStage);

    res.json({
      order_id: orderId,
      kds_status: newStage,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/v1/kds/items/:id/complete ────────────────────────────────────────

export const completeItem = async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const { rows } = await completeKdsItem(itemId);

    if (rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Item not found', code: 'NOT_FOUND' },
      });
    }

    const orderId = parseInt(rows[0].order_id, 10);
    emitItemCompleted(orderId, itemId);

    res.json({
      item_id: itemId,
      is_item_completed: true,
    });
  } catch (err) {
    next(err);
  }
};
