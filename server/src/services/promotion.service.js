import * as db from '../config/db.js';
import { DISCOUNT_TYPES } from '../../../shared/constants/discountTypes.js';

const formatMoney = (value) => Number(value).toFixed(2);

const matchesPromotion = (promotion, order) => {
  if (promotion.applies_to === 'product') {
    return order.items.some(
      (item) =>
        item.product_id === promotion.product_id &&
        item.quantity >= promotion.min_quantity
    );
  }

  if (promotion.applies_to === 'order') {
    return parseFloat(order.subtotal) >= parseFloat(promotion.min_order_amount);
  }

  return false;
};

const calculateAppliedAmount = (promotion, subtotal) => {
  if (promotion.discount_type === DISCOUNT_TYPES.PERCENTAGE) {
    return formatMoney(
      (parseFloat(subtotal) * parseFloat(promotion.discount_value)) / 100
    );
  }

  return formatMoney(
    Math.min(parseFloat(promotion.discount_value), parseFloat(subtotal))
  );
};

export const evaluatePromotions = async (order) => {
  const { rows: promotions } = await db.query(
    `SELECT *
     FROM promotions
     WHERE is_active = TRUE`
  );

  const matches = promotions
    .filter((promotion) => matchesPromotion(promotion, order))
    .map((promotion) => ({
      promotion_id:   promotion.id,
      discount_type:  promotion.discount_type,
      discount_value: String(promotion.discount_value),
      applied_amount: calculateAppliedAmount(promotion, order.subtotal),
    }));

  return matches;
};
