import { db } from '../../config/db.js';

/**
 * Helper to retrieve product columns with appropriate casting.
 * price and tax_rate are cast to text to avoid floating point precision differences.
 */
const getProductColumns = () => [
  'id',
  'name',
  'category_id',
  db.raw('price::text as price'),
  'unit_of_measure',
  db.raw('tax_rate::text as tax_rate'),
  'description',
  'estimated_prep_time',
  'show_on_kds',
  'is_active',
  'created_at',
  'updated_at'
];

/**
 * List products with optional filters.
 * @param {{ category_id?: string|number, search?: string, is_active?: string|boolean }} filters
 */
export const getProducts = async ({ category_id, search, is_active } = {}) => {
  const queryBuilder = db('products');

  if (category_id !== undefined) {
    queryBuilder.where({ category_id: Number(category_id) });
  }

  if (search !== undefined && search !== '') {
    queryBuilder.where('name', 'ilike', `%${search}%`);
  }

  // is_active arrives as string 'true'/'false' from query params — convert explicitly
  if (is_active !== undefined) {
    queryBuilder.where({ is_active: is_active === 'true' || is_active === true });
  }

  const rows = await queryBuilder
    .select(getProductColumns())
    .orderBy('name', 'asc');

  return { rows };
};

/**
 * Fetch a single product by id.
 * @param {number} id
 */
export const getProductById = async (id) => {
  const rows = await db('products')
    .select(getProductColumns())
    .where({ id });
  return { rows };
};

/**
 * Insert a new product.
 */
export const createProduct = async ({
  name, category_id, price, unit_of_measure, tax_rate,
  description, estimated_prep_time, show_on_kds,
}) => {
  const rows = await db('products')
    .insert({
      name,
      category_id,
      price,
      unit_of_measure,
      tax_rate: tax_rate ?? 0,
      description: description ?? null,
      estimated_prep_time: estimated_prep_time ?? null,
      show_on_kds: show_on_kds ?? true,
    })
    .returning(getProductColumns());
  return { rows };
};

/**
 * Dynamic UPDATE — only touches the columns actually provided.
 * @param {number} id
 * @param {Object} fields
 */
export const updateProduct = async (id, fields) => {
  const allowed = [
    'name', 'category_id', 'price', 'unit_of_measure',
    'tax_rate', 'description', 'estimated_prep_time', 'show_on_kds',
  ];

  const updateFields = {};
  for (const col of allowed) {
    if (fields[col] !== undefined) {
      updateFields[col] = fields[col];
    }
  }

  // Always bump updated_at
  updateFields.updated_at = db.fn.now();

  const rows = await db('products')
    .where({ id })
    .update(updateFields)
    .returning(getProductColumns());
  return { rows };
};

/**
 * Soft-delete: sets is_active = false. Row stays in DB.
 * @param {number} id
 */
export const softDeleteProduct = async (id) => {
  const rows = await db('products')
    .where({ id })
    .update({
      is_active: false,
      updated_at: db.fn.now(),
    })
    .returning('id');
  return { rows };
};

/**
 * Returns true if a category with this id exists.
 * @param {number|string} id
 * @returns {Promise<boolean>}
 */
export const categoryExists = async (id) => {
  const rows = await db('categories')
    .where({ id })
    .limit(1)
    .select(1);
  return rows.length > 0;
};
