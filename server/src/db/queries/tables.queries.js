import { db } from '../../config/db.js';

/**
 * Insert a new table on a given floor.
 */
export const createTable = async (floor_id, table_number, seats) => {
  const rows = await db('tables')
    .insert({ floor_id, table_number, seats })
    .returning(['id', 'floor_id', 'table_number', 'seats', 'is_active', 'created_at', 'updated_at']);
  return { rows };
};

/**
 * Fetch a single table by id.
 */
export const getTableById = async (id) => {
  const rows = await db('tables')
    .select('id', 'floor_id', 'table_number', 'seats', 'is_active', 'created_at', 'updated_at')
    .where({ id });
  return { rows };
};

/**
 * Dynamic UPDATE — only touches the columns actually provided.
 * Allowed fields: table_number, seats, is_active.
 * @param {number} id
 * @param {{ table_number?: number, seats?: number, is_active?: boolean }} fields
 */
export const updateTable = async (id, fields) => {
  const allowed = ['table_number', 'seats', 'is_active'];
  const updateFields = {};

  for (const col of allowed) {
    if (fields[col] !== undefined) {
      updateFields[col] = fields[col];
    }
  }

  // Always bump updated_at
  updateFields.updated_at = db.fn.now();

  const rows = await db('tables')
    .where({ id })
    .update(updateFields)
    .returning(['id', 'floor_id', 'table_number', 'seats', 'is_active', 'created_at', 'updated_at']);
  return { rows };
};

/**
 * Soft-delete: sets is_active = false. Row stays in DB.
 * @param {number} id
 */
export const softDeleteTable = async (id) => {
  const rows = await db('tables')
    .where({ id })
    .update({
      is_active: false,
      updated_at: db.fn.now(),
    })
    .returning('id');
  return { rows };
};

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
  const queryBuilder = db('tables')
    .where({ floor_id, table_number })
    .limit(1);

  if (excludeId !== null) {
    queryBuilder.whereNot({ id: excludeId });
  }

  const rows = await queryBuilder.select(1);
  return rows.length > 0;
};

/**
 * Returns true if a floor with this id exists.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export const floorExists = async (id) => {
  const rows = await db('floors')
    .where({ id })
    .limit(1)
    .select(1);
  return rows.length > 0;
};
