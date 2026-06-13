import {
  getAllFloorsWithTables,
  createFloor  as insertFloor,
  floorNameExists,
} from '../db/queries/floors.queries.js';

// ─── GET /api/v1/floors ───────────────────────────────────────────────────────

export const listFloors = async (req, res, next) => {
  try {
    const floors = await getAllFloorsWithTables();
    return res.status(200).json({ floors });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/floors ──────────────────────────────────────────────────────

export const createFloor = async (req, res, next) => {
  try {
    const { name } = req.body; // validated by zod

    if (await floorNameExists(name)) {
      return res.status(409).json({
        error: { message: 'Floor name already exists', code: 'NAME_EXISTS' },
      });
    }

    const { rows } = await insertFloor(name);
    return res.status(201).json({ floor: rows[0] });
  } catch (err) {
    next(err);
  }
};
