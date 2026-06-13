const { verifyAccessToken } = require('../utils/jwt');
const apiResponse = require('../utils/apiResponse');

/**
 * Verifies the Bearer access token from the Authorization header.
 * On success: attaches { id, role } to req.user and calls next().
 * On failure: 401 — the Axios interceptor on the frontend will then
 *   call /auth/refresh and retry the original request automatically.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(apiResponse.error('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    // Only expose what downstream handlers need — never the full payload
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json(apiResponse.error('Invalid or expired token'));
  }
};

module.exports = authMiddleware;
