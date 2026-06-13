import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { ROLES } from '../../../shared/constants/index.js';
import {
  getCurrentSession,
  openSession,
  closeSession,
  getLastClosed,
} from '../controllers/sessions.controller.js';

const router = Router();

// GET /sessions/current -> requireAuth -> getCurrentSession
router.get('/current', requireAuth, getCurrentSession);

// GET /sessions/last-closed -> requireAuth -> getLastClosed
router.get('/last-closed', requireAuth, getLastClosed);

// POST /sessions/open -> requireAuth, requireRole('employee') -> openSession
router.post('/open', requireAuth, requireRole(ROLES.EMPLOYEE), openSession);

// POST /sessions/close -> requireAuth, requireRole('employee') -> closeSession
router.post('/close', requireAuth, requireRole(ROLES.EMPLOYEE), closeSession);

export default router;
