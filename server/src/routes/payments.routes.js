import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';
import { payOrder } from '../db/queries/orders.queries.js';

const router = Router();

const razorpay = new Razorpay({
  key_id:     env.RAZORPAY.keyId,
  key_secret: env.RAZORPAY.keySecret,
});

/**
 * POST /api/v1/payments/razorpay/create-order
 * Creates a Razorpay order.
 */
router.post('/create-order', requireAuth, async (req, res, next) => {
  try {
    const { amount, orderId, notes } = req.body;
    if (!amount || !orderId) {
      return res.status(400).json({
        error: { message: 'amount and orderId are required', code: 'BAD_REQUEST' },
      });
    }

    const rzpOrder = await razorpay.orders.create({
      amount:   Math.round(parseFloat(amount) * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt:  `pos_order_${orderId}`,
      notes:    notes ?? {},
    });

    return res.status(200).json({
      razorpayOrderId: rzpOrder.id,
      keyId:           env.RAZORPAY.keyId,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/payments/razorpay/verify
 * Verifies Razorpay payment signature and marks the POS order as paid.
 */
router.post('/verify', requireAuth, async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      posOrderId,
      couponCode,
      loyaltyPointsToRedeem,
      tip,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !posOrderId) {
      return res.status(400).json({
        error: { message: 'Missing verification parameters', code: 'BAD_REQUEST' },
      });
    }

    // Verify signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const digest = crypto
      .createHmac('sha256', env.RAZORPAY.keySecret)
      .update(body)
      .digest('hex');

    if (digest !== razorpaySignature) {
      return res.status(400).json({
        error: { message: 'Invalid payment signature', code: 'RZP_SIG_INVALID' },
      });
    }

    // Call checkout query to update order status, apply discounts/loyalty points, and create payment record
    const result = await payOrder(posOrderId, {
      method: 'card', // Razorpay online payment counts as card/digital
      amount: null,   // let payOrder query calculate correct totals dynamically
      tip: tip || '0.00',
      transactionReference: razorpayPaymentId,
      couponCode: couponCode || null,
      loyaltyPointsToRedeem: loyaltyPointsToRedeem || 0,
    });

    if (!result) {
      return res.status(404).json({
        error: { message: 'Order not found', code: 'NOT_FOUND' },
      });
    }

    // Broadcast order:paid event to remove ticket from KDS
    const { emitOrderPaid } = await import('../websocket/kds.emitter.js');
    emitOrderPaid(posOrderId);

    return res.status(200).json({
      success: true,
      paymentId: razorpayPaymentId,
      order: result.order,
      change_due: result.change_due,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
