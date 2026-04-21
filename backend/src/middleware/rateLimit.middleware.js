const rateLimit = require('express-rate-limit');

const noopLimiter = (_req, _res, next) => next();

/**
 * Tighter limiter for sensitive endpoints (auth, vote, register).
 * 10 requests per minute per IP. Disabled in NODE_ENV=test so the
 * integration suite isn't throttled by the limiter itself.
 */
const strictLimiter =
  process.env.NODE_ENV === 'test'
    ? noopLimiter
    : rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message: 'Too many sensitive requests, please try again in a minute',
          },
        },
      });

module.exports = { strictLimiter };
