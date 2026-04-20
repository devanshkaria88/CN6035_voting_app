const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  logger.error(err.message, {
    code: err.code,
    statusCode: err.statusCode,
    stack: err.stack,
  });

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'Malformed JSON in request body');
  }

  return sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}

function notFoundHandler(_req, res) {
  return sendError(res, 404, 'NOT_FOUND', 'The requested endpoint does not exist');
}

module.exports = { errorHandler, notFoundHandler };
