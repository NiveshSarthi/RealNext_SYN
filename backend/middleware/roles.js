const { ApiError } = require('./errorHandler');
const { ROLES } = require('../config/constants');

/**
 * Role-based access control middleware
 * Checks if the user has the required role(s) to access the resource
 */

/**
 * Require Super Admin role
 */
const requireSuperAdmin = (req, res, next) => {
    if (!req.user?.is_super_admin) {
        throw ApiError.forbidden('Super Admin access required');
    }
    next();
};

/**
 * Require Client Admin role or higher
 */
const requireClientAdmin = (req, res, next) => {
    if (req.user?.is_super_admin) {
        return next();
    }

    if (!req.client || !req.clientUser) {
        throw ApiError.forbidden('Client Admin access required');
    }

    if (req.clientUser.role !== 'admin') {
        throw ApiError.forbidden('Client Admin access required');
    }

    next();
};

/**
 * Require Client Manager role or higher
 */
const requireClientManager = (req, res, next) => {
    if (req.user?.is_super_admin) {
        return next();
    }

    if (!req.client || !req.clientUser) {
        throw ApiError.forbidden('Client access required');
    }

    if (!['admin', 'manager'].includes(req.clientUser.role)) {
        throw ApiError.forbidden('Client Manager access required');
    }

    next();
};

/**
 * Require Client access (any role)
 */
const requireClientAccess = (req, res, next) => {
    if (req.user?.is_super_admin) {
        return next();
    }

    if (!req.client || !req.clientUser) {
        throw ApiError.forbidden('Client access required');
    }

    next();
};

/**
 * Check for specific permission within client
 */
const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        if (req.user?.is_super_admin) {
            return next();
        }

        // Client admins have all permissions
        if (req.clientUser?.role === 'admin') {
            return next();
        }

        const userPermissions = req.clientUser?.permissions || [];

        const hasPermission = requiredPermissions.some(perm => {
            // Check exact match or wildcard
            return userPermissions.includes(perm) ||
                userPermissions.includes(perm.split(':')[0] + ':admin') ||
                userPermissions.includes('*');
        });

        if (!hasPermission) {
            throw ApiError.forbidden(`Missing required permission: ${requiredPermissions.join(' or ')}`);
        }

        next();
    };
};

/**
 * Generic role check - accepts array of allowed roles
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (req.user?.is_super_admin && allowedRoles.includes(ROLES.SUPER_ADMIN)) {
            return next();
        }

        const userRoles = [];

        if (req.user?.is_super_admin) userRoles.push(ROLES.SUPER_ADMIN);
        if (req.clientUser) userRoles.push(`client_${req.clientUser.role}`);

        const hasRole = allowedRoles.some(role => userRoles.includes(role));

        if (!hasRole) {
            throw ApiError.forbidden('Insufficient role privileges');
        }

        next();
    };
};

module.exports = {
    requireSuperAdmin,
    requireClientAdmin,
    requireClientManager,
    requireClientAccess,
    requirePermission,
    requireRoles
};
