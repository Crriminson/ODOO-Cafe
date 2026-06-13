/**
 * Role guard — must run after `authenticate`.
 * Call with one or more allowed roles:
 *   requireRole('admin')
 *   requireRole('admin', 'employee')
 *
 * @param {...string} roles
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: { message: 'Not authenticated', code: 'UNAUTHORIZED' },
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: {
        message: `Access restricted to: ${roles.join(', ')}`,
        code: 'FORBIDDEN',
      },
    });
  }

  next();
};
