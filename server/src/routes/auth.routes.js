import { Router } from 'express';
import { signup, login, logout, me } from '../controllers/auth.controller.js';
import { validate }    from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { signupSchema, loginSchema } from '../utils/validators.js';

const router = Router();

// POST /api/v1/auth/signup
router.post('/signup', validate(signupSchema), signup);

// POST /api/v1/auth/login
router.post('/login',  validate(loginSchema),  login);

// POST /api/v1/auth/logout  (auth required — proves token is valid before discarding)
router.post('/logout', authenticate,           logout);

// GET  /api/v1/auth/me
router.get('/me',      authenticate,           me);

export default router;
