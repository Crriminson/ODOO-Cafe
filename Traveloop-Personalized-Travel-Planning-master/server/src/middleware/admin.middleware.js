const apiResponse = require('../utils/apiResponse');

/**
 * Requires req.user.role === 'ADMIN'.
 * Must be placed AFTER authMiddleware in the middleware chain.
 *
 * Returning 403 (not 404) is intentional — we confirm the resource exists
 * but deny access, rather than pretending it doesn't exist.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json(apiResponse.error('Access denied: Admins only'));
  }
  next();
};

module.exports = adminMiddleware;
