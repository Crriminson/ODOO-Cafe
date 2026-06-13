import { ZodError } from 'zod';

/**
 * Middleware factory — validates `req.body` against a Zod schema.
 *
 * On success:   req.body is replaced with the schema-parsed (coerced) value, next() is called.
 * On failure:   responds 422 with per-field error details.
 *
 * Usage:
 *   import { validate } from '../middleware/validate.js';
 *   import { loginSchema } from '../utils/validators.js';
 *
 *   router.post('/login', validate(loginSchema), loginController);
 *
 * Error response shape:
 *   {
 *     error: {
 *       message: 'Validation failed',
 *       code:    'VALIDATION_ERROR',
 *       fields:  [{ field: 'email', message: 'Invalid email address' }]
 *     }
 *   }
 *
 * @param {import('zod').ZodTypeAny} schema
 */
export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const fields = err.errors.map((e) => ({
        field:   e.path.join('.') || 'body',
        message: e.message,
      }));

      return res.status(422).json({
        error: {
          message: 'Validation failed',
          code:    'VALIDATION_ERROR',
          fields,
        },
      });
    }
    next(err); // unexpected — let global error handler deal with it
  }
};
