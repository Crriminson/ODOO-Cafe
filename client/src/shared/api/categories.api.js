import api from './client.js';

export const getCategories = () => api.get('/categories');
