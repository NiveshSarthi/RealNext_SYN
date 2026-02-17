const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Default rate limiter for API endpoints
 */
const defaultLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development'
        ? 10000  // 10,000 requests in dev mode
        : Math.max(parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, 1000), // Minimum 1000 in production
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
    max: process.env.NODE_ENV === 'development' ? 5000 : 1000, // More lenient in dev
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

/**
 * General API rate limiter (less restrictive than default)
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 50000 : 5000, // More generous for general API calls
    message: {
        success: false,
        error: 'API rate limit exceeded, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.id || req.ip;
    }
});

/**
 * Stricter limiter for data-heavy operations
 */
const dataLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 1000 : 200, // Stricter for data operations
    message: {
        success: false,
        error: 'Data operation rate limit exceeded, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.id || req.ip;
    }
});

module.exports = defaultLimiter;
module.exports.authLimiter = authLimiter;
module.exports.passwordResetLimiter = passwordResetLimiter;
module.exports.heavyOperationLimiter = heavyOperationLimiter;
module.exports.apiLimiter = apiLimiter;
module.exports.dataLimiter = dataLimiter;
