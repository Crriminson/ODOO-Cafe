import api from './client.js';

export const getProducts = (params = {}) =>
  api.get('/products', { params });
// params: { category_id?, search?, is_active? }
// Returns: { products: [...] }
// Note: price and tax_rate come back as strings e.g. "120.00"

export const createProduct = (data) =>
  api.post('/products', data);
// Returns: { product: {...} }

export const updateProduct = (id, data) =>
  api.put(`/products/${id}`, data);
// Returns: { product: {...} }

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`);
// Returns: { message: 'Product deleted successfully' }
