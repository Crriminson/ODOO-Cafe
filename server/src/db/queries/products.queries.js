import { query } from '../../config/db.js';

// Columns selected on every product query — price and tax_rate cast to text
const PRODUCT_COLUMNS = `
  id, name, category_id,
  price::text, unit_of_measure, tax_rate::text,
  description, estimated_prep_time, show_on_kds,
  is_active, created_at, updated_at
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List products with optional filters.
 * @param {{ category_id?: string|number, search?: string, is_active?: string|boolean }} filters
 */
export const getProducts = ({ category_id, search, is_active } = {}) => {
  const conditions = [];
  const values     = [];
  let   idx        = 1;

  if (category_id !== undefined) {
    conditions.push(`category_id = $${idx++}`);
    values.push(Number(category_id));
  }

  if (search !== undefined && search !== '') {
    conditions.push(`name ILIKE $${idx++}`);
    values.push(`%${search}%`);
  }

  // is_active arrives as string 'true'/'false' from query params — convert explicitly
  if (is_active !== undefined) {
    conditions.push(`is_active = $${idx++}`);
    values.push(is_active === 'true' || is_active === true);
  }

  const WHERE = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return query(
    `SELECT ${PRODUCT_COLUMNS}
     FROM products
     ${WHERE}
     ORDER BY name ASC`,
    values
  );
};

/**
 * Fetch a single product by id.
 * @param {number} id
 */
export const getProductById = (id) =>
  query(
    `SELECT ${PRODUCT_COLUMNS}
     FROM products
     WHERE id = $1`,
    [id]
  );

/**
 * Insert a new product.
 */
export const createProduct = ({
  name, category_id, price, unit_of_measure, tax_rate,
  description, estimated_prep_time, show_on_kds,
}) =>
  query(
    `INSERT INTO products
       (name, category_id, price, unit_of_measure, tax_rate,
        description, estimated_prep_time, show_on_kds)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${PRODUCT_COLUMNS}`,
    [
      name, category_id, price, unit_of_measure,
      tax_rate ?? 0,
      description    ?? null,
      estimated_prep_time ?? null,
      show_on_kds   ?? true,
    ]
  );

/**
 * Dynamic UPDATE — only touches the columns actually provided.
 * price::text and tax_rate::text always appear in RETURNING regardless.
 * @param {number} id
 * @param {Object} fields
 */
export const updateProduct = (id, fields) => {
  const allowed = [
    'name', 'category_id', 'price', 'unit_of_measure',
    'tax_rate', 'description', 'estimated_prep_time', 'show_on_kds',
  ];

  const setClauses = [];
  const values     = [];
  let   paramIndex = 1;

  for (const col of allowed) {
    if (fields[col] !== undefined) {
      setClauses.push(`${col} = $${paramIndex++}`);
      values.push(fields[col]);
    }
  }

  // Always bump updated_at
  setClauses.push(`updated_at = NOW()`);
  values.push(id); // id is always the last param

  return query(
    `UPDATE products
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING ${PRODUCT_COLUMNS}`,
    values
  );
};

/**
 * Soft-delete: sets is_active = false. Row stays in DB.
 * @param {number} id
 */
export const softDeleteProduct = (id) =>
  query(
    `UPDATE products
     SET is_active = false, updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  );

/**
 * Returns true if a category with this id exists.
 * @param {number|string} id
 * @returns {Promise<boolean>}
 */
export const categoryExists = async (id) => {
  const { rows } = await query(
    `SELECT 1 FROM categories WHERE id = $1`,
    [id]
  );
  return rows.length > 0;
};
