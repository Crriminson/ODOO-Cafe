const { Router } = require('express');
const rateLimit  = require('express-rate-limit');

const authController = require('../controllers/auth.controller');
const validate       = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../schemas/auth.schema');

const router = Router();

// Rate limit: strict in production (10 req / 15 min), relaxed in development (1000 req / window)
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many auth attempts, please try again later.',
  },
});

/**
 * POST /api/v1/auth/register
 * Validate body → register controller
 */
router.post('/register', authRateLimit, validate(registerSchema), authController.register);

/**
 * POST /api/v1/auth/login
 * Validate body → login controller
 */
router.post('/login', authRateLimit, validate(loginSchema), authController.login);

/**
 * POST /api/v1/auth/refresh
 * Reads httpOnly cookie — no body validation needed
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/v1/auth/logout
 * Reads httpOnly cookie — no body validation needed
 */
router.post('/logout', authController.logout);

module.exports = router;
