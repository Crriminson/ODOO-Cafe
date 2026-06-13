import { Router } from 'express';
import { listFloors, createFloor } from '../controllers/floors.controller.js';
import { createTable }             from '../controllers/tables.controller.js';
import { validate }     from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole }  from '../middleware/requireRole.js';
import { createFloorSchema, createTableSchema } from '../utils/validators.js';

const router = Router();

// GET    /api/v1/floors                       — any authenticated user
router.get('/',                 authenticate,                                                    listFloors);

// POST   /api/v1/floors                       — admin only
router.post('/',                authenticate, requireRole('admin'), validate(createFloorSchema), createFloor);

// POST   /api/v1/floors/:floorId/tables       — admin only (mounted here: URL starts with /floors)
router.post('/:floorId/tables', authenticate, requireRole('admin'), validate(createTableSchema), createTable);

export default router;
