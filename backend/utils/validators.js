const { body, param, query, validationResult } = require('express-validator');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Common validators for API endpoints
 */

/**
 * Handle validation errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));
        const err = ApiError.badRequest('Validation failed', 'VALIDATION_ERROR');
        err.details = errorMessages;
        throw err;
    }
    next();
};

// Common validators
const validators = {
    // UUID validator
    uuid: (field, location = 'param') => {
        const validator = location === 'param' ? param(field) :
            location === 'query' ? query(field) : body(field);
        return validator.isUUID().withMessage(`${field} must be a valid UUID`);
    },

    // Email validator
    email: (field = 'email') =>
        body(field).isEmail().normalizeEmail().withMessage('Invalid email address'),

    // Optional email
    optionalEmail: (field = 'email') =>
        body(field).optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Invalid email address'),

    // Password validator
    password: (field = 'password') =>
        body(field)
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
            .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
            .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
            .matches(/[0-9]/).withMessage('Password must contain a number'),

    // Required string
    requiredString: (field, minLength = 1, maxLength = 255) =>
        body(field)
            .trim()
            .notEmpty().withMessage(`${field} is required`)
            .isLength({ min: minLength, max: maxLength })
            .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`),

    // Optional string
    optionalString: (field, maxLength = 255) =>
        body(field).optional().trim().isLength({ max: maxLength }),

    // Required number
    requiredNumber: (field, min = null, max = null) => {
        let validator = body(field).notEmpty().isNumeric().withMessage(`${field} must be a number`);
        if (min !== null) validator = validator.custom(v => v >= min);
        if (max !== null) validator = validator.custom(v => v <= max);
        return validator;
    },

    // Enum validator
    enum: (field, values, required = true) => {
        let validator = body(field);
        if (!required) validator = validator.optional();
        return validator.isIn(values).withMessage(`${field} must be one of: ${values.join(', ')}`);
    },

    // Phone number
    phone: (field = 'phone') =>
        body(field).optional({ checkFalsy: true }).matches(/^[\d\s+()-]+$/).withMessage('Invalid phone number'),

    // URL validator
    url: (field) =>
        body(field).optional().isURL().withMessage(`${field} must be a valid URL`),

    // Pagination
    pagination: [
        query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
        query('sort').optional().isString(),
        query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC'])
    ],

    // Date range
    dateRange: [
        query('start_date').optional().isISO8601().withMessage('Invalid start date'),
        query('end_date').optional().isISO8601().withMessage('Invalid end date')
    ],

    // JSON field
    json: (field, required = false) => {
        let validator = body(field);
        if (!required) validator = validator.optional();
        return validator.isObject().withMessage(`${field} must be a valid JSON object`);
    },

    // Array field
    array: (field, required = false) => {
        let validator = body(field);
        if (!required) validator = validator.optional();
        return validator.isArray().withMessage(`${field} must be an array`);
    },

    // Optional date
    optionalDate: (field) =>
        body(field).optional().isISO8601().withMessage(`${field} must be a valid date`)
};

// Pre-built validation chains
const validationChains = {
    // Login validation
    login: [
        validators.email(),
        body('password').notEmpty().withMessage('Password is required'),
        validate
    ],

    // Registration validation
    register: [
        validators.requiredString('name', 2, 100),
        validators.email(),
        validators.password(),
        validators.phone(),
        validate
    ],

    // Partner creation
    createPartner: [
        validators.requiredString('name', 2, 255),
        validators.email(),
        validators.optionalString('domain'),
        validators.optionalString('subdomain'),
        validators.url('logo_url'),
        validate
    ],

    // Tenant creation
    createTenant: [
        validators.requiredString('name', 2, 255),
        validators.email(),
        validators.phone(),
        validators.optionalString('address', 500),
        validate
    ],

    // Lead creation
    createLead: [
        validators.requiredString('name', 1, 255),
        validators.email().optional(),
        validators.phone(),
        validators.enum('stage', ['Screening', 'Sourcing', 'Walk-in', 'Closure'], false),
        validators.enum('status', ['Uncontacted', 'Not Interested', 'Not Responding', 'Dead', 'Hot', 'Warm', 'Cold', 'Lost'], false),
        validators.optionalString('source', 100),
        validators.optionalString('location', 255),
        validate
    ],

    // Campaign creation
    createCampaign: [
        validators.requiredString('name', 1, 255),
        validators.enum('type', ['broadcast', 'drip', 'triggered', 'scheduled'], false),
        validators.optionalString('template_name'),
        validate
    ],

    // Plan creation
    createPlan: [
        validators.requiredString('code', 2, 100),
        validators.requiredString('name', 2, 255),
        validators.requiredNumber('price_monthly', 0),
        body('price_yearly').optional().isNumeric(),
        validators.enum('billing_period', ['monthly', 'yearly', 'custom'], false),
        body('trial_days').optional().isInt({ min: 0 }),
        validate
    ]
};

module.exports = {
    validate,
    validators,
    ...validationChains
};
