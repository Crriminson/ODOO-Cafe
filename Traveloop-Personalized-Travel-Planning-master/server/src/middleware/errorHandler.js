const env = require('../config/env');
const apiResponse = require('../utils/apiResponse');

/**
 * Global Error Handling Middleware
 * 
 * Catches all errors passed to next(err) and returns a standardized 
 * JSON response with correct status codes.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Sanitize Prisma database errors
  if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    if (err.code === 'P2003') {
      message = 'Invalid reference: The associated record (e.g. user or resource) does not exist.';
    } else if (err.code === 'P2002') {
      message = 'Duplicate entry: A record with this unique value already exists.';
    } else {
      message = 'A database request error occurred.';
    }
  } else if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data format submitted to the database.';
  }

  // Log error for developers
  if (env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${req.method} ${req.url} — ${statusCode} ${message}`);
    if (err.stack) console.error(err.stack);
  }

  // Final API response
  res.status(statusCode).json(
    apiResponse.error(
      message, 
      env.NODE_ENV === 'development' ? err.stack : undefined
    )
  );
};

module.exports = errorHandler;
