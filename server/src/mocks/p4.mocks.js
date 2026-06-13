// MOCK IMPLEMENTATIONS — swap these imports for real P4 service imports
// once feature/kds-engagement is merged. One-line change per function.

// Returns empty array (no promotions applied) — valid shape for the pipeline
export const evaluatePromotions = async (order) => {
  return [];
};

// Simulates a successful redemption with a flat ₹10 discount per 10 points
// Throws with err.code = 'INSUFFICIENT_LOYALTY_POINTS' if pointsToRedeem > 100
// (just a stub threshold — real logic lives in P4's implementation)
export const redeemPoints = async (customerId, pointsToRedeem) => {
  if (pointsToRedeem > 100) {
    const err = new Error('Insufficient loyalty points');
    err.code = 'INSUFFICIENT_LOYALTY_POINTS';
    throw err;
  }
  const discountAmount = (pointsToRedeem * 1).toFixed(2); // 1 point = ₹1 for mock
  return { discountAmount, newBalance: 100 - pointsToRedeem };
};

// No-op stub — just returns null (no points credited in mock mode)
export const creditPoints = async (customerId, orderTotal) => {
  return null;
};

// Returns a valid coupon object for code "WELCOME10", null for everything else
export const findValidCouponByCode = async (code) => {
  if (code.toUpperCase() === 'WELCOME10') {
    return { id: 1, code: 'WELCOME10', discount_type: 'percentage', discount_value: '10.00' };
  }
  return null;
};
