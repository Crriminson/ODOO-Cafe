/**
 * Standardized API response helpers.
 * Every route must use these so the shape { success, data, message, errors? }
 * is guaranteed consistent across all endpoints.
 */

const success = (data = null, message = 'OK') => ({
  success: true,
  data,
  message,
});

const error = (message = 'An error occurred', errors = null) => ({
  success: false,
  data: null,
  message,
  ...(errors && { errors }),
});

module.exports = { success, error };
