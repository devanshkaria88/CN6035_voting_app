/**
 * Send a standardised success response.
 * @param {import('express').Response} res
 * @param {object}  data
 * @param {string}  message
 * @param {number}  statusCode
 */
function sendSuccess(res, data, message = 'Operation completed successfully', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

/**
 * Send a standardised error response.
 * @param {import('express').Response} res
 * @param {number}       statusCode
 * @param {string}       code
 * @param {string}       message
 * @param {object|null}  details
 */
function sendError(res, statusCode, code, message, details = null) {
  const body = {
    success: false,
    error: { code, message },
  };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError };
