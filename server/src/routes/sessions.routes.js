import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
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

// POST /sessions/open -> requireAuth -> openSession
router.post('/open', requireAuth, openSession);

// POST /sessions/close -> requireAuth -> closeSession
router.post('/close', requireAuth, closeSession);

export default router;
