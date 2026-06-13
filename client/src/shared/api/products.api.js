import { request } from './client.js';

// params: { category_id?, search?, is_active? }
// Returns: { products: [...] }
// Note: price and tax_rate come back as strings e.g. "120.00"
export const getProducts = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.category_id !== undefined) qs.set('category_id', params.category_id);
  if (params.search      !== undefined) qs.set('search',      params.search);
  if (params.is_active   !== undefined) qs.set('is_active',   params.is_active);
  const query = qs.toString();
  return request(`/products${query ? `?${query}` : ''}`);
};

// Returns: { product: {...} }
export const createProduct = (data) =>
  request('/products', { method: 'POST', body: data });

// Returns: { product: {...} }
export const updateProduct = (id, data) =>
  request(`/products/${id}`, { method: 'PUT', body: data });

// Returns: { message: 'Product deleted successfully' }
export const deleteProduct = (id) =>
  request(`/products/${id}`, { method: 'DELETE' });
