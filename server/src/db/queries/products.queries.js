import * as db from '../../config/db.js';

export const getAllProducts = async () => {
  const { rows } = await db.query('SELECT id, name, category_id, price, unit_of_measure, tax_rate, description, estimated_prep_time, show_on_kds, is_active, created_at, updated_at FROM products ORDER BY name ASC');
  return rows;
};
