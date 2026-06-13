import { request } from './client.js';

// Returns: { categories: [{ id, name, color, created_at, updated_at }] }
export const getCategories = () =>
  request('/categories');

// Body: { name, color }
// Returns: { category: {...} }
export const createCategory = (data) =>
  request('/categories', { method: 'POST', body: data });

// Body: { name?, color? } — at least one required
// Returns: { category: {...} }
export const updateCategory = (id, data) =>
  request(`/categories/${id}`, { method: 'PUT', body: data });

// Returns: { message: 'Category deleted successfully' }
export const deleteCategory = (id) =>
  request(`/categories/${id}`, { method: 'DELETE' });
