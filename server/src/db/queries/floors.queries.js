import { db } from '../../config/db.js';

/**
 * Fetch all floors with their tables nested, each table including
 * has_active_order (boolean from SQL EXISTS subquery).
 * Floors with zero tables are included (LEFT JOIN, t.id may be null).
 * ALL tables returned — active and inactive — frontend filters.
 *
 * @returns {Promise<Array>} grouped floor objects
 */
export const getAllFloorsWithTables = async () => {
  const rows = await db('floors as f')
    .select(
      'f.id as floor_id',
      'f.name as floor_name',
      'f.created_at as floor_created_at',
      't.id',
      't.floor_id',
      't.table_number',
      't.seats',
      't.is_active',
      't.created_at',
      't.updated_at',
      db.raw(`EXISTS (
        SELECT 1 FROM orders o
        WHERE o.table_id = t.id
          AND o.status NOT IN ('paid', 'cancelled')
      ) AS has_active_order`)
    )
    .leftJoin('tables as t', 't.floor_id', 'f.id')
    .orderBy([
      { column: 'f.id', order: 'asc' },
      { column: 't.table_number', order: 'asc' }
    ]);

  // Group flat rows into { id, name, created_at, tables: [...] }
  const floorMap = new Map();

  for (const row of rows) {
    if (!floorMap.has(row.floor_id)) {
      floorMap.set(row.floor_id, {
        id:         row.floor_id,
        name:       row.floor_name,
        created_at: row.floor_created_at,
        tables:     [],
      });
    }

    // LEFT JOIN: if floor has no tables, t.id is null — skip adding a null table
    if (row.id !== null) {
      floorMap.get(row.floor_id).tables.push({
        id:               row.id,
        floor_id:         row.floor_id,
        table_number:     row.table_number,
        seats:            row.seats,
        is_active:        row.is_active,
        created_at:       row.created_at,
        updated_at:       row.updated_at,
        has_active_order: row.has_active_order, // boolean from pg — no conversion needed
      });
    }
  }

  return Array.from(floorMap.values());
};

/**
 * Insert a new floor.
 * @param {string} name
 */
export const createFloor = async (name) => {
  const rows = await db('floors')
    .insert({ name })
    .returning(['id', 'name', 'created_at']);
  return { rows };
};

/**
 * Fetch a single floor by id.
 * @param {number} id
 */
export const getFloorById = async (id) => {
  const rows = await db('floors')
    .select('id', 'name', 'created_at')
    .where({ id });
  return { rows };
};

/**
 * Returns true if a floor with this name already exists.
 * @param {string} name
 * @returns {Promise<boolean>}
 */
export const floorNameExists = async (name) => {
  const rows = await db('floors')
    .where({ name })
    .limit(1)
    .select(1);
  return rows.length > 0;
};
