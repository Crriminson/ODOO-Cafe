import api from './client.js';

export const getProducts = () => api.get('/products');
