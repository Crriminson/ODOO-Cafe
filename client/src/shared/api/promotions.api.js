import api from './client.js';

export const getPromotions = (params) => api.get('/promotions', { params });
export const createPromotion = (data) => api.post('/promotions', data);
export const updatePromotion = (id, data) => api.put(`/promotions/${id}`, data);
export const deletePromotion = (id) => api.delete(`/promotions/${id}`);
