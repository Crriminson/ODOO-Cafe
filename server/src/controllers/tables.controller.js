import {
  createTable    as insertTable,
  getTableById,
  updateTable    as patchTable,
  softDeleteTable as archiveTable,
  tableNumberExistsOnFloor,
  floorExists,
} from '../db/queries/tables.queries.js';

// ─── POST /api/v1/floors/:floorId/tables ─────────────────────────────────────

export const createTable = async (req, res, next) => {
  try {
    const floorId      = parseInt(req.params.floorId, 10);
    const { table_number, seats } = req.body; // validated by zod

    // 1. Floor must exist
    if (!(await floorExists(floorId))) {
      return res.status(404).json({
        error: { message: 'Floor not found', code: 'NOT_FOUND' },
      });
    }

    // 2. Table number must be unique on this floor
    if (await tableNumberExistsOnFloor(floorId, table_number)) {
      return res.status(409).json({
        error: {
          message: 'Table number already exists on this floor',
          code:    'TABLE_NUMBER_EXISTS',
        },
      });
    }

    const { rows } = await insertTable(floorId, table_number, seats);
    return res.status(201).json({ table: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/v1/tables/:id ───────────────────────────────────────────────────

export const updateTable = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    // 1. Existence check
    const { rows: existing } = await getTableById(id);
    if (!existing[0]) {
      return res.status(404).json({
        error: { message: 'Table not found', code: 'NOT_FOUND' },
      });
    }

    const { table_number, seats, is_active } = req.body;

    // 2. If table_number is being changed, check uniqueness on same floor
    if (table_number !== undefined) {
      const conflict = await tableNumberExistsOnFloor(
        existing[0].floor_id,
        table_number,
        id  // excludeId — allow keeping the same number
      );
      if (conflict) {
        return res.status(409).json({
          error: {
            message: 'Table number already exists on this floor',
            code:    'TABLE_NUMBER_EXISTS',
          },
        });
      }
    }

    // 3. Build update from only the fields present in req.body
    const fields = {};
    if (table_number !== undefined) fields.table_number = table_number;
    if (seats        !== undefined) fields.seats        = seats;
    if (is_active    !== undefined) fields.is_active    = is_active;

    const { rows } = await patchTable(id, fields);
    return res.status(200).json({ table: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/v1/tables/:id ───────────────────────────────────────────────

export const softDeleteTable = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Existence check
    const { rows: existing } = await getTableById(id);
    if (!existing[0]) {
      return res.status(404).json({
        error: { message: 'Table not found', code: 'NOT_FOUND' },
      });
    }

    await archiveTable(id);
    return res.status(200).json({ message: 'Table deleted successfully' });
  } catch (err) {
    next(err);
  }
};
