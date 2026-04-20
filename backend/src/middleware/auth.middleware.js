const authService = require('../services/auth.service');
const { AuthenticationError, AuthorisationError } = require('../utils/errors');

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Populates req.user with { address, role }.
 */
function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing or malformed Authorization header'));
  }

  const token = header.slice(7);
  try {
    const decoded = authService.verifyToken(token);
    req.user = { address: decoded.address, role: decoded.role };
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Restricts access to admin users.
 * Must be used after `authenticate`.
 */
function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AuthorisationError('Only the admin can perform this action', 'NOT_ADMIN'));
  }
  next();
}

/**
 * Restricts access to authenticated voters.
 * Must be used after `authenticate`.
 */
function requireVoter(req, _res, next) {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireVoter };
