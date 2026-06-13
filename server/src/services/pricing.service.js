/**
 * Computes order pricing totals.
 * Pure mathematical function with zero imports and zero side-effects.
 * 
 * @param {Array<{unit_price: string, quantity: number, tax_rate: string}>} items 
 * @param {string} [discountTotal="0.00"] 
 * @param {string} [loyaltyDiscount="0.00"] 
 * @param {string} [tip="0.00"] 
 * @returns {{
 *   subtotal: string,
 *   tax_total: string,
 *   discount_total: string,
 *   loyalty_discount: string,
 *   tip: string,
 *   total: string
 * }}
 */
export const computeOrderTotals = (
  items,
  discountTotal = "0.00",
  loyaltyDiscount = "0.00",
  tip = "0.00"
) => {
  let subtotalAccumulator = 0;
  let taxAccumulator = 0;

  for (const item of items) {
    const price = parseFloat(item.unit_price || "0.00");
    const qty = parseFloat(item.quantity || "0");
    const rate = parseFloat(item.tax_rate || "0.00");

    const lineTotal = price * qty;
    subtotalAccumulator += lineTotal;

    const itemTax = lineTotal * rate;
    taxAccumulator += itemTax;
  }

  const discountVal = parseFloat(discountTotal || "0.00");
  const loyaltyVal = parseFloat(loyaltyDiscount || "0.00");
  const tipVal = parseFloat(tip || "0.00");

  const computedTotal = subtotalAccumulator + taxAccumulator - discountVal - loyaltyVal + tipVal;
  const clampedTotal = Math.max(0, computedTotal);

  return {
    subtotal: subtotalAccumulator.toFixed(2),
    tax_total: taxAccumulator.toFixed(2),
    discount_total: discountVal.toFixed(2),
    loyalty_discount: loyaltyVal.toFixed(2),
    tip: tipVal.toFixed(2),
    total: clampedTotal.toFixed(2),
  };
};
