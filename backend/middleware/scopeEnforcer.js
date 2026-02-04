const { ApiError } = require('./errorHandler');
const { Tenant, Partner } = require('../models');

/**
 * Tenant/Partner Scope Enforcement Middleware
 * Ensures users can only access data within their authorized scope
 */

/**
 * Enforce tenant isolation - ensures request is scoped to user's tenant
 */
const enforceTenantScope = (req, res, next) => {
    // Super admins bypass tenant scope (but should explicitly set it when needed)
    if (req.user?.is_super_admin) {
        return next();
    }

    if (!req.tenant) {
        throw ApiError.forbidden('Tenant context required');
    }

    // Attach scope filters for use in queries
    req.scopeFilter = {
        tenant_id: req.tenant.id
    };

    next();
};

/**
 * Enforce partner isolation - ensures partner can only access their tenants
 */
const enforcePartnerScope = (req, res, next) => {
    // Super admins bypass partner scope
    if (req.user?.is_super_admin) {
        return next();
    }

    if (!req.partner) {
        throw ApiError.forbidden('Partner context required');
    }

    // Partner can access tenants under them
    req.partnerScopeFilter = {
        partner_id: req.partner.id
    };

    next();
};

/**
 * Validate that a specific tenant belongs to the current partner
 */
const validateTenantOwnership = async (req, res, next) => {
    const tenantId = req.params.tenantId || req.params.id || req.body.tenant_id;

    if (!tenantId) {
        return next();
    }

    // Super admins can access any tenant
    if (req.user?.is_super_admin) {
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            throw ApiError.notFound('Tenant not found');
        }
        req.targetTenant = tenant.get({ plain: true });
        return next();
    }

    // Partners can only access their own tenants
    if (req.partner) {
        const tenant = await Tenant.findOne({
            where: {
                id: tenantId,
                partner_id: req.partner.id
            }
        });

        if (!tenant) {
            throw ApiError.notFound('Tenant not found or access denied');
        }

        req.targetTenant = tenant.get({ plain: true });
        return next();
    }

    // Tenant users can only access their own tenant
    if (req.tenant && req.tenant.id !== tenantId) {
        throw ApiError.forbidden('Access denied to this tenant');
    }

    next();
};

/**
 * Validate that a specific partner can be accessed
 */
const validatePartnerAccess = async (req, res, next) => {
    const partnerId = req.params.partnerId || req.params.id;

    if (!partnerId) {
        return next();
    }

    // Super admins can access any partner
    if (req.user?.is_super_admin) {
        const partner = await Partner.findByPk(partnerId);
        if (!partner) {
            throw ApiError.notFound('Partner not found');
        }
        req.targetPartner = partner.get({ plain: true });
        return next();
    }

    // Partners can only access themselves
    if (req.partner && req.partner.id !== partnerId) {
        throw ApiError.forbidden('Access denied to this partner');
    }

    if (req.partner) {
        req.targetPartner = req.partner;
    }

    next();
};

/**
 * Add tenant scope to query options
 * Usage: Model.findAll({ ...addTenantScope(req) })
 */
const addTenantScope = (req) => {
    if (req.user?.is_super_admin) {
        return {};
    }

    if (!req.tenant) {
        throw ApiError.forbidden('Tenant context required');
    }

    return {
        where: {
            tenant_id: req.tenant.id
        }
    };
};

/**
 * Middleware to set tenant context from header or query param
 * Used by super admins to switch tenant context
 */
const setTenantContext = async (req, res, next) => {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id;

    if (!tenantId) {
        return next();
    }

    // Only super admins can switch tenant context via header
    if (!req.user?.is_super_admin) {
        return next();
    }

    const tenant = await Tenant.findByPk(tenantId);
    if (tenant) {
        req.tenant = tenant.get({ plain: true });
        req.scopeFilter = { tenant_id: tenant.id };
    }

    next();
};

module.exports = {
    enforceTenantScope,
    enforcePartnerScope,
    validateTenantOwnership,
    validatePartnerAccess,
    addTenantScope,
    setTenantContext
};
