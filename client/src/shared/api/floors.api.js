import api from './client.js';

export const getFloors = () =>
  api.get('/floors');
// Returns: { floors: [{ id, name, created_at, tables: [{ id, floor_id,
//   table_number, seats, is_active, created_at, updated_at,
//   has_active_order }] }] }
// Note: has_active_order is a boolean on every table object

export const createFloor = (data) =>
  api.post('/floors', data);
// Body: { name }
// Returns: { floor: { id, name, created_at } }

export const createTable = (floorId, data) =>
  api.post(`/floors/${floorId}/tables`, data);
// Body: { table_number, seats }
// Returns: { table: {...} }
