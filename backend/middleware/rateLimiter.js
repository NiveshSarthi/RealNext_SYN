const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Default rate limiter for API endpoints
 */
const defaultLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.id || req.ip;
    },
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for ${req.user?.id || req.ip}`);
        res.status(options.statusCode).json(options.message);
    }
});

/**
 * Strict rate limiter for auth endpoints
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 attempts per window (dev mode)
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * Very strict limiter for password reset
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        error: 'Too many password reset attempts, please try again later'
    }
});

/**
 * Limiter for resource-intensive operations
 */
const heavyOperationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: {
        success: false,
        error: 'Operation limit exceeded, please try again later'
    }
});

module.exports = defaultLimiter;
module.exports.authLimiter = authLimiter;
module.exports.passwordResetLimiter = passwordResetLimiter;
module.exports.heavyOperationLimiter = heavyOperationLimiter;
