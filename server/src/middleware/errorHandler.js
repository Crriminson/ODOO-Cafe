const errorHandler = (error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.code === '23505') {
    return res.status(409).json({ error: 'Email already in use' });
  }

  return res.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
};

module.exports = errorHandler;
