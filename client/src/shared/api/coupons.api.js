import api from './client.js';

export const getCoupons = () => api.get('/coupons');
export const createCoupon = (data) => api.post('/coupons', data);
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`);
export const validateCoupon = (code, orderTotal) => api.post('/coupons/validate', { code, orderTotal });
