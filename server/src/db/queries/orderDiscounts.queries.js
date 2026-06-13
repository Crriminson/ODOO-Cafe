import { db } from '../../config/db.js';

/**
 * Record a discount (coupon or automated promotion) applied to an order.
 */
export const createOrderDiscount = async ({ orderId, couponId, promotionId, discountType, discountValue, appliedAmount }) => {
  const rows = await db('order_discounts')
    .insert({
      order_id: orderId,
      coupon_id: couponId || null,
      promotion_id: promotionId || null,
      discount_type: discountType,
      discount_value: discountValue,
      applied_amount: appliedAmount,
    })
    .returning('*');
  return { rows };
};

/**
 * Fetch all discounts applied to a specific order.
 */
export const getOrderDiscounts = async (orderId) => {
  const rows = await db('order_discounts')
    .where({ order_id: orderId })
    .select('*')
    .orderBy('id', 'asc');
  return { rows };
};

/**
 * Remove all discount entries for a specific order.
 */
export const deleteOrderDiscounts = async (orderId) => {
  const rows = await db('order_discounts')
    .where({ order_id: orderId })
    .del()
    .returning('id');
  return { rows };
};
