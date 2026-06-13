import { db } from '../../config/db.js';

/**
 * Fetch all categories ordered alphabetically.
 */
export const getAllCategories = async () => {
  const rows = await db('categories')
    .select('id', 'name', 'color', 'created_at', 'updated_at')
    .orderBy('name', 'asc');
  return { rows };
};

/**
 * Fetch a single category by id.
 */
export const getCategoryById = async (id) => {
  const rows = await db('categories')
    .select('id', 'name', 'color', 'created_at', 'updated_at')
    .where({ id });
  return { rows };
};

/**
 * Insert a new category.
 */
export const createCategory = async (name, color) => {
  const rows = await db('categories')
    .insert({ name, color })
    .returning(['id', 'name', 'color', 'created_at', 'updated_at']);
  return { rows };
};

/**
 * Dynamic UPDATE — only touches the columns actually provided.
 * @param {number} id
 * @param {{ name?: string, color?: string }} fields
 */
export const updateCategory = async (id, fields) => {
  const updateFields = {};

  if (fields.name !== undefined) {
    updateFields.name = fields.name;
  }
  if (fields.color !== undefined) {
    updateFields.color = fields.color;
  }

  // Always bump updated_at
  updateFields.updated_at = db.fn.now();

  const rows = await db('categories')
    .where({ id })
    .update(updateFields)
    .returning(['id', 'name', 'color', 'created_at', 'updated_at']);
  return { rows };
};

/**
 * Hard-delete a category row.
 */
export const deleteCategory = async (id) => {
  const rows = await db('categories')
    .where({ id })
    .del()
    .returning('id');
  return { rows };
};

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
  const queryBuilder = db('categories').where({ name }).limit(1);
  
  if (excludeId !== null) {
    queryBuilder.whereNot({ id: excludeId });
  }

  const rows = await queryBuilder.select(1);
  return rows.length > 0;
};

/**
 * Returns true if any product references this category.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export const categoryHasProducts = async (id) => {
  const rows = await db('products')
    .where({ category_id: id })
    .limit(1)
    .select(1);
  return rows.length > 0;
};
