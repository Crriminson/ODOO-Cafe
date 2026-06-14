import api from './client.js';

export const getCoupons    = ()          => api.get('/coupons');
export const createCoupon  = (data)      => api.post('/coupons', data);
export const updateCoupon  = (id, data)  => api.put(`/coupons/${id}`, data);
export const deleteCoupon  = (id)        => api.delete(`/coupons/${id}`);

/**
 * POST /coupons/validate
 * No side-effects — purely validates the code and previews discount.
 * @param {string}        code        - The coupon code entered by cashier
 * @param {string|number} order_total - Current order total for discount preview
 * @returns {Promise<{ coupon: { code, discount_type, discount_value, discount_amount } }>}
 */
export const validateCoupon = (code, order_total) =>
  api.post('/coupons/validate', { code, order_total });

