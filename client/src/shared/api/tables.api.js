import { request } from './client.js';

// Body: { table_number?, seats?, is_active? } — at least one required
// Returns: { table: {...} }
export const updateTable = (id, data) =>
  request(`/tables/${id}`, { method: 'PUT', body: data });

// Returns: { message: 'Table deleted successfully' }
export const deleteTable = (id) =>
  request(`/tables/${id}`, { method: 'DELETE' });
