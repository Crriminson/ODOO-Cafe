import api from './client.js';

export const getKdsOrders = (params) => api.get('/kds/orders', { params });
export const stageOrder = (id, data) => api.put(`/kds/orders/${id}/stage`, data);
export const completeItem = (id, data) => api.put(`/kds/items/${id}/complete`, data);
