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
 * Require Partner Admin role or higher
 */
const requirePartnerAdmin = (req, res, next) => {
    if (req.user?.is_super_admin) {
        return next();
    }

    if (!req.partner || !req.partnerUser) {
        throw ApiError.forbidden('Partner Admin access required');
    }

    if (!['admin', 'manager'].includes(req.partnerUser.role)) {
        throw ApiError.forbidden('Partner Admin access required');
    }

    next();
};

/**
 * Require Partner access (any role)
 */
const requirePartnerAccess = (req, res, next) => {
    if (req.user?.is_super_admin) {
        return next();
    }

    if (!req.partner || !req.partnerUser) {
        throw ApiError.forbidden('Partner access required');
    }

    next();
};

/**
 * Require Tenant Admin role or higher
 */
const requireTenantAdmin = (req, res, next) => {
    if (req.user?.is_super_admin) {
        return next();
    }

    // Partner admins can manage their tenants
    if (req.partner && req.partnerUser &&
        ['admin', 'manager'].includes(req.partnerUser.role)) {
        return next();
    }

    if (!req.tenant || !req.tenantUser) {
        throw ApiError.forbidden('Tenant Admin access required');
    }

    if (req.tenantUser.role !== 'admin') {
        throw ApiError.forbidden('Tenant Admin access required');
    }

    next();
};

/**
 * Require Tenant Manager role or higher
 */
const requireTenantManager = (req, res, next) => {
    if (req.user?.is_super_admin) {
        return next();
    }

    if (req.partner && req.partnerUser &&
        ['admin', 'manager'].includes(req.partnerUser.role)) {
        return next();
    }

    if (!req.tenant || !req.tenantUser) {
        throw ApiError.forbidden('Tenant access required');
    }

    if (!['admin', 'manager'].includes(req.tenantUser.role)) {
        throw ApiError.forbidden('Tenant Manager access required');
    }

    next();
};

/**
 * Require Tenant access (any role)
 */
const requireTenantAccess = (req, res, next) => {
    if (req.user?.is_super_admin) {
        return next();
    }

    if (!req.tenant || !req.tenantUser) {
        throw ApiError.forbidden('Tenant access required');
    }

    next();
};

/**
 * Check for specific permission within tenant
 */
const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        if (req.user?.is_super_admin) {
            return next();
        }

        // Partner and Tenant admins have all permissions
        if (req.partnerUser?.role === 'admin' || req.tenantUser?.role === 'admin') {
            return next();
        }

        const userPermissions = req.tenantUser?.permissions || [];

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
        if (req.partnerUser) userRoles.push(`partner_${req.partnerUser.role}`);
        if (req.tenantUser) userRoles.push(`tenant_${req.tenantUser.role}`);

        const hasRole = allowedRoles.some(role => userRoles.includes(role));

        if (!hasRole) {
            throw ApiError.forbidden('Insufficient role privileges');
        }

        next();
    };
};

module.exports = {
    requireSuperAdmin,
    requirePartnerAdmin,
    requirePartnerAccess,
    requireTenantAdmin,
    requireTenantManager,
    requireTenantAccess,
    requirePermission,
    requireRoles
};
