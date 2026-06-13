/**
 * Global error handler — must be registered LAST in app.js.
 *
 * Consistent response shape:
 *   { error: { message: string, code: string } }
 *
 * Attach `err.status` / `err.code` to control the response code and label.
 */
export const errorHandler = (err, req, res, _next) => {
  // Avoid leaking stack traces in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('[error]', err);
  }

  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code    = err.code    || 'INTERNAL_ERROR';

  res.status(status).json({ error: { message, code } });
};
