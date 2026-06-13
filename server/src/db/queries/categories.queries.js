import * as db from '../../config/db.js';

export const getAllCategories = async () => {
  const { rows } = await db.query('SELECT id, name, color, created_at, updated_at FROM categories ORDER BY name ASC');
  return rows;
};
