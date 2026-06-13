/**
 * Generic Zod validation middleware.
 * Usage: router.post('/route', validate(mySchema), controller)
 *
 * Validates req.body against the provided schema.
 * On failure returns 400 with field-level errors.
 * On success attaches the parsed (coerced) body back to req.body.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Validation failed',
      errors,
    });
  }

  // Replace req.body with the Zod-parsed (and coerced) value
  req.body = result.data;
  next();
};

module.exports = validate;
