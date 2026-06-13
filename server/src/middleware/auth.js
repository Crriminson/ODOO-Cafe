import { verifyToken } from '../utils/jwt.js';

/**
 * Verifies the Bearer JWT in the Authorization header.
 * On success, attaches decoded payload to req.user:
 *   { userId, role, name, iat, exp }
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'No token provided', code: 'UNAUTHORIZED' },
    });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({
      error: { message: 'Invalid or expired token', code: 'TOKEN_INVALID' },
    });
  }
};
