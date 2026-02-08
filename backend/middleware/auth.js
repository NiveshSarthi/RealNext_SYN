const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/jwt');
const { User, TenantUser, PartnerUser, Tenant, Partner, Subscription, Plan, PlanFeature, Feature } = require('../models');
const { ApiError } = require('./errorHandler');
const logger = require('../config/logger');

/**
 * JWT Authentication middleware
 * Validates JWT token and attaches user context to request
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('No token provided');
        }

        const token = authHeader.substring(7);

        // Verify JWT
        const decoded = jwt.verify(token, jwtConfig.accessSecret);

        // Get user from database
        const user = await User.findByPk(decoded.sub, {
            attributes: { exclude: ['password_hash'] }
        });

        if (!user) {
            throw ApiError.unauthorized('User not found');
        }

        if (user.status !== 'active') {
            throw ApiError.unauthorized('Account is suspended or inactive');
        }

        // Attach user to request
        req.user = user.get({ plain: true });
        req.user.is_super_admin = user.is_super_admin;

        // If token has tenant context, attach it
        if (decoded.tenant_id) {
            console.log(`[AUTH] Token has tenant_id: ${decoded.tenant_id}`);
            const tenantUser = await TenantUser.findOne({
                where: { user_id: user.id, tenant_id: decoded.tenant_id },
                include: [{
                    model: Tenant,
                    as: 'Tenant',
                    where: { status: 'active' }
                }]
            });

            if (tenantUser) {
                // Attach tenant context to request
                req.tenantUser = tenantUser.get({ plain: true });
                req.tenant = tenantUser.Tenant.get({ plain: true });
                req.user.tenant_role = tenantUser.role;

                console.log(`[AUTH] ✅ Tenant context loaded: ${req.tenant.name} (Role: ${req.tenantUser.role})`);

                // Get subscription and features
                const subscription = await Subscription.findOne({
                    where: {
                        tenant_id: decoded.tenant_id,
                        status: ['trial', 'active']
                    },
                    include: [{
                        model: Plan,
                        as: 'plan',
                        include: [{
                            model: PlanFeature,
                            as: 'planFeatures',
                            include: [{ model: Feature }]
                        }]
                    }],
                    order: [['created_at', 'DESC']]
                });

                // Initialize contexts
                req.features = {};
                req.menu_access = req.tenant.settings?.menu_access || {}; // Load menu overrides
                req.featureLimits = {};

                if (subscription) {
                    req.subscription = subscription.get({ plain: true });
                    req.plan = subscription.plan?.get({ plain: true });

                    console.log(`[AUTH] Found Subscription: ${subscription.id} (Plan: ${subscription.plan?.name})`);

                    // Extract enabled features
                    if (subscription.plan?.planFeatures) {
                        subscription.plan.planFeatures.forEach(pf => {
                            if (pf.is_enabled && pf.Feature?.is_enabled) {
                                req.features[pf.Feature.code] = true;
                                req.featureLimits[pf.Feature.code] = pf.limits || {};
                            }
                        });
                    }
                }

                // Apply Tenant Feature Overrides (Tenant settings take precedence)
                if (req.tenant.settings?.features) {
                    Object.keys(req.tenant.settings.features).forEach(code => {
                        req.features[code] = req.tenant.settings.features[code];
                    });
                }
            } else {
                console.log(`[AUTH] ❌ TenantUser link not found for user ${user.id} and tenant ${decoded.tenant_id}`);
            }
        } else {
            console.log(`[AUTH] ⚠️ Token MISSING tenant_id`);
        }

        // If token has partner context, attach it
        if (decoded.partner_id) {
            const partnerUser = await PartnerUser.findOne({
                where: { user_id: user.id, partner_id: decoded.partner_id },
                include: [{
                    model: Partner,
                    where: { status: 'active' }
                }]
            });

            if (partnerUser) {
                req.partnerUser = partnerUser.get({ plain: true });
                req.partner = partnerUser.Partner.get({ plain: true });
                req.user.partner_role = partnerUser.role;
                req.user.is_partner_owner = partnerUser.is_owner;
            }
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(ApiError.unauthorized(error.message));
        }
        next(error);
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    return authenticate(req, res, next);
};

module.exports = { authenticate, optionalAuth };
