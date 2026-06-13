import api from './client.js';

export const updateTable = (id, data) =>
  api.put(`/tables/${id}`, data);
// Body: { table_number?, seats?, is_active? } — at least one required
// Returns: { table: {...} }

export const deleteTable = (id) =>
  api.delete(`/tables/${id}`);
// Returns: { message: 'Table deleted successfully' }
