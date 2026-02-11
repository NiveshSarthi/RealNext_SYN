const { ApiError } = require('./errorHandler');
const { Client } = require('../models');

/**
 * Enforce client isolation - ensures request is scoped to user's client
 */
const enforceClientScope = (req, res, next) => {
    // Super admins bypass client scope
    if (req.user?.is_super_admin) {
        return next();
    }

    if (!req.client) {
        throw ApiError.forbidden('Client context required');
    }

    // Attach scope filters for use in queries
    req.scopeFilter = {
        client_id: req.client.id
    };

    next();
};

/**
 * Validate that a specific client belongs to the requester
 */
const validateClientOwnership = async (req, res, next) => {
    const clientId = req.params.clientId || req.params.id || req.body.client_id;

    if (!clientId) {
        return next();
    }

    // Super admins can access any client
    if (req.user?.is_super_admin) {
        const client = await Client.findById(clientId);
        if (!client) {
            throw ApiError.notFound('Client not found');
        }
        req.targetClient = client.toObject({ virtuals: true });
        return next();
    }

    // Client users can only access their own client
    if (req.client && req.client.id !== clientId) {
        throw ApiError.forbidden('Access denied to this client');
    }

    next();
};

/**
 * Add client scope to query options
 */
const addClientScope = (req) => {
    if (req.user?.is_super_admin) {
        return {};
    }

    if (!req.client) {
        throw ApiError.forbidden('Client context required');
    }

    return {
        client_id: req.client.id
    };
};

/**
 * Middleware to set client context from header or query param
 */
const setClientContext = async (req, res, next) => {
    const clientId = req.headers['x-client-id'] || req.headers['x-tenant-id'] || req.query.client_id || req.query.tenant_id;

    if (!clientId) {
        return next();
    }

    // Only super admins can switch context via header
    if (!req.user?.is_super_admin) {
        return next();
    }

    const client = await Client.findById(clientId);
    if (client) {
        req.client = client.toObject({ virtuals: true });
        req.scopeFilter = { client_id: client.id };
    }

    next();
};

module.exports = {
    enforceClientScope,
    validateClientOwnership,
    addClientScope,
    setClientContext
};
