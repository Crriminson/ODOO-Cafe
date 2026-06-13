import { query } from '../../config/db.js';

/**
 * Insert a new table on a given floor.
 */
export const createTable = (floor_id, table_number, seats) =>
  query(
    `INSERT INTO tables (floor_id, table_number, seats)
     VALUES ($1, $2, $3)
     RETURNING id, floor_id, table_number, seats, is_active, created_at, updated_at`,
    [floor_id, table_number, seats]
  );

/**
 * Fetch a single table by id.
 */
export const getTableById = (id) =>
  query(
    `SELECT id, floor_id, table_number, seats, is_active, created_at, updated_at
     FROM tables
     WHERE id = $1`,
    [id]
  );

/**
 * Dynamic UPDATE — only touches the columns actually provided.
 * Allowed fields: table_number, seats, is_active.
 * @param {number} id
 * @param {{ table_number?: number, seats?: number, is_active?: boolean }} fields
 */
export const updateTable = (id, fields) => {
  const allowed    = ['table_number', 'seats', 'is_active'];
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
    `UPDATE tables
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, floor_id, table_number, seats, is_active, created_at, updated_at`,
    values
  );
};

/**
 * Soft-delete: sets is_active = false. Row stays in DB.
 * @param {number} id
 */
export const softDeleteTable = (id) =>
  query(
    `UPDATE tables
     SET is_active = false, updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  );

/**
 * Returns true if a table with this number already exists on the given floor.
 * Per-floor uniqueness only — two different floors CAN share table_number=1.
 * Pass excludeId when updating so the table can keep its own number.
 *
 * @param {number}      floor_id
 * @param {number}      table_number
 * @param {number|null} excludeId
 * @returns {Promise<boolean>}
 */
export const tableNumberExistsOnFloor = async (floor_id, table_number, excludeId = null) => {
  const { rows } = await query(
    `SELECT 1 FROM tables
     WHERE floor_id    = $1
       AND table_number = $2
       AND ($3::int IS NULL OR id != $3)
     LIMIT 1`,
    [floor_id, table_number, excludeId]
  );
  return rows.length > 0;
};

/**
 * Returns true if a floor with this id exists.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export const floorExists = async (id) => {
  const { rows } = await query(
    `SELECT 1 FROM floors WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows.length > 0;
};
