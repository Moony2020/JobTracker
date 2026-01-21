const { ZodError } = require('zod');

/**
 * Middleware to validate request body against a Zod schema.
 * @param {import('zod').ZodSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse(req.body);
    // Replace req.body with validated and potentially transformed data
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

module.exports = validate;
