import api from './client.js';

export const getCategories = () =>
  api.get('/categories');
// Returns: { categories: [{ id, name, color, created_at, updated_at }] }

export const createCategory = (data) =>
  api.post('/categories', data);
// Body: { name, color }
// Returns: { category: {...} }

export const updateCategory = (id, data) =>
  api.put(`/categories/${id}`, data);
// Body: { name?, color? } — at least one required
// Returns: { category: {...} }

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`);
// Returns: { message: 'Category deleted successfully' }
