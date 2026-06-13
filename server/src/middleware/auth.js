const { verifyAuthToken } = require('../utils/jwt');

const readBearerToken = (authorization) => {
  if (!authorization) return null;

  const [scheme, token] = authorization.split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : null;
};

const authenticate = (req, res, next) => {
  const token = req.cookies?.accessToken || readBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    req.user = verifyAuthToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
};

module.exports = {
  authenticate,
  requireRole
};
