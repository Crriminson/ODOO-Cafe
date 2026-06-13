import { query } from '../../config/db.js';

/**
 * Fetch all categories ordered alphabetically.
 * @returns {Promise<import('pg').QueryResult>}
 */
export const getAllCategories = () =>
  query(
    `SELECT id, name, color, created_at, updated_at
     FROM categories
     ORDER BY name ASC`
  );

/**
 * Fetch a single category by id.
 */
export const getCategoryById = (id) =>
  query(
    `SELECT id, name, color, created_at, updated_at
     FROM categories
     WHERE id = $1`,
    [id]
  );

/**
 * Insert a new category.
 */
export const createCategory = (name, color) =>
  query(
    `INSERT INTO categories (name, color)
     VALUES ($1, $2)
     RETURNING id, name, color, created_at, updated_at`,
    [name, color]
  );

/**
 * Dynamic UPDATE — only touches the columns actually provided.
 * @param {number} id
 * @param {{ name?: string, color?: string }} fields
 */
export const updateCategory = (id, fields) => {
  const setClauses = [];
  const values     = [];
  let   paramIndex = 1;

  if (fields.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(fields.name);
  }
  if (fields.color !== undefined) {
    setClauses.push(`color = $${paramIndex++}`);
    values.push(fields.color);
  }

  // Always bump updated_at
  setClauses.push(`updated_at = NOW()`);
  values.push(id);  // id is the last param

  return query(
    `UPDATE categories
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, color, created_at, updated_at`,
    values
  );
};

/**
 * Hard-delete a category row.
 */
export const deleteCategory = (id) =>
  query(
    `DELETE FROM categories WHERE id = $1 RETURNING id`,
    [id]
  );

/**
 * Returns true if a category with this name already exists.
 * Pass excludeId when updating so a category can keep its own name.
 * Check is case-sensitive (mirrors the DB UNIQUE constraint).
 *
 * @param {string}      name
 * @param {number|null} excludeId
 * @returns {Promise<boolean>}
 */
export const categoryNameExists = async (name, excludeId = null) => {
  const { rows } = await query(
    `SELECT 1 FROM categories
     WHERE name = $1
       AND ($2::int IS NULL OR id != $2)
     LIMIT 1`,
    [name, excludeId]
  );
  return rows.length > 0;
};

/**
 * Returns true if any product references this category.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export const categoryHasProducts = async (id) => {
  const { rows } = await query(
    `SELECT 1 FROM products WHERE category_id = $1 LIMIT 1`,
    [id]
  );
  return rows.length > 0;
};
