import api from './client.js';

export const getCooks = (params) => api.get('/cooks', { params });
export const createCook = (data) => api.post('/cooks', data);
export const updateCook = (id, data) => api.put(`/cooks/${id}`, data);
export const deleteCook = (id) => api.delete(`/cooks/${id}`);
