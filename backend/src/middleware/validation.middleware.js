const { ValidationError } = require('../utils/errors');

/**
 * Creates an Express middleware that validates req[source] against a Joi schema.
 * @param {import('joi').ObjectSchema} schema
 * @param {'body'|'params'|'query'} source
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(new ValidationError('Validation failed', details));
    }

    req[source] = value;
    next();
  };
}

module.exports = { validate };
