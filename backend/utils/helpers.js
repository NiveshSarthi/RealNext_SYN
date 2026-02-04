const { Op } = require('sequelize');

/**
 * Helper utility functions
 */

/**
 * Build pagination object from query params
 */
const getPagination = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

/**
 * Build paginated response
 */
const getPaginatedResponse = (data, count, pagination) => {
    const { page, limit } = pagination;
    const totalPages = Math.ceil(count / limit);

    return {
        data,
        pagination: {
            page,
            limit,
            total: count,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    };
};

/**
 * Build sorting options from query
 */
const getSorting = (query, allowedFields = [], defaultSort = 'created_at', defaultOrder = 'DESC') => {
    let sort = query.sort || defaultSort;
    let order = (query.order || defaultOrder).toUpperCase();

    // Validate sort field
    if (allowedFields.length && !allowedFields.includes(sort)) {
        sort = defaultSort;
    }

    // Validate order
    if (!['ASC', 'DESC'].includes(order)) {
        order = defaultOrder;
    }

    return [[sort, order]];
};

/**
 * Build search filter for multiple fields
 */
const buildSearchFilter = (searchQuery, fields) => {
    if (!searchQuery || !fields.length) {
        return null;
    }

    return {
        [Op.or]: fields.map(field => ({
            [field]: { [Op.iLike]: `%${searchQuery}%` }
        }))
    };
};

/**
 * Build date range filter
 */
const buildDateRangeFilter = (field, startDate, endDate) => {
    const filter = {};

    if (startDate) {
        filter[Op.gte] = new Date(startDate);
    }

    if (endDate) {
        filter[Op.lte] = new Date(endDate);
    }

    return Object.keys(filter).length ? { [field]: filter } : null;
};

/**
 * Merge multiple where clauses
 */
const mergeFilters = (...filters) => {
    const validFilters = filters.filter(f => f && Object.keys(f).length);

    if (validFilters.length === 0) return {};
    if (validFilters.length === 1) return validFilters[0];

    return { [Op.and]: validFilters };
};

/**
 * Generate slug from string
 */
const generateSlug = (text) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100);
};

/**
 * Generate unique code
 */
const generateCode = (prefix = '', length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix ? `${prefix}-` : '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

/**
 * Deep merge objects
 */
const deepMerge = (target, source) => {
    const output = { ...target };

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }

    return output;
};

const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Pick specific fields from object
 */
const pick = (obj, fields) => {
    return fields.reduce((acc, field) => {
        if (obj && Object.prototype.hasOwnProperty.call(obj, field)) {
            acc[field] = obj[field];
        }
        return acc;
    }, {});
};

/**
 * Omit specific fields from object
 */
const omit = (obj, fields) => {
    const result = { ...obj };
    fields.forEach(field => delete result[field]);
    return result;
};

/**
 * Sleep/delay helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry with exponential backoff
 */
const retry = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await sleep(baseDelay * Math.pow(2, i));
            }
        }
    }

    throw lastError;
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency
    }).format(amount);
};

/**
 * Calculate percentage
 */
const calculatePercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100 * 100) / 100;
};

module.exports = {
    getPagination,
    getPaginatedResponse,
    getSorting,
    buildSearchFilter,
    buildDateRangeFilter,
    mergeFilters,
    generateSlug,
    generateCode,
    deepMerge,
    pick,
    omit,
    sleep,
    retry,
    formatCurrency,
    calculatePercentage
};
