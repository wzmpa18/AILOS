const rateLimit = require('express-rate-limit');
const config = require('../../config');

const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || config.rateLimit.windowMs,
    max: options.max || config.rateLimit.maxRequests,
    message: {
      success: false,
      error: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false }, // P0 fix: suppress trust proxy validation error
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
  });
};

// Specific limiters for different endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
});

const smsLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 SMS per window
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

module.exports = {
  createRateLimiter,
  authLimiter,
  smsLimiter,
  apiLimiter,
};
