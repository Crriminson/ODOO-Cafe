import { request } from './client.js';

// Returns: { floors: [{ id, name, created_at, tables: [{ id, floor_id,
//   table_number, seats, is_active, created_at, updated_at,
//   has_active_order }] }] }
// Note: has_active_order is a boolean on every table object
export const getFloors = () =>
  request('/floors');

// Body: { name }
// Returns: { floor: { id, name, created_at } }
export const createFloor = (data) =>
  request('/floors', { method: 'POST', body: data });

// Body: { table_number, seats }
// Returns: { table: {...} }
export const createTable = (floorId, data) =>
  request(`/floors/${floorId}/tables`, { method: 'POST', body: data });
