const express = require('express');
const router = express.Router();
const { Partner, Tenant, TenantUser, User, Subscription, Plan, PartnerAllowedPlan, Payment, Invoice } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requirePartnerAdmin, requirePartnerAccess } = require('../middleware/roles');
const { enforcePartnerScope, validateTenantOwnership } = require('../middleware/scopeEnforcer');
const { auditAction } = require('../middleware/auditLogger');
const { ApiError } = require('../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, buildSearchFilter, mergeFilters } = require('../utils/helpers');
const { createTenant, validate, validators } = require('../utils/validators');
const subscriptionService = require('../services/subscriptionService');

// All routes require authentication and partner access
router.use(authenticate, requirePartnerAccess, enforcePartnerScope);

/**
 * @route GET /api/partner/profile
 * @desc Get partner profile
 * @access Partner Team
 */
router.get('/profile', async (req, res, next) => {
    try {
        const partner = await Partner.findByPk(req.partner.id, {
            include: [{
                model: PartnerAllowedPlan,
                as: 'partnerPlans',
                include: [{ model: Plan }]
            }]
        });

        res.json({
            success: true,
            data: partner
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/partner/profile
 * @desc Update partner profile
 * @access Partner Admin
 */
router.put('/profile',
    requirePartnerAdmin,
    auditAction('update', 'partner'),
    async (req, res, next) => {
        try {
            const partner = await Partner.findByPk(req.partner.id);
            const { logo_url, primary_color, secondary_color, website, settings } = req.body;

            await partner.update({
                logo_url: logo_url || partner.logo_url,
                primary_color: primary_color || partner.primary_color,
                secondary_color: secondary_color || partner.secondary_color,
                website: website || partner.website,
                settings: settings ? { ...partner.settings, ...settings } : partner.settings
            });

            res.json({
                success: true,
                data: partner
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/partner/tenants
 * @desc List partner's tenants
 * @access Partner Team
 */
router.get('/tenants', async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);
        const sorting = getSorting(req.query, ['name', 'created_at', 'status'], 'created_at');

        const searchFilter = buildSearchFilter(req.query.search, ['name', 'email', 'slug']);
        const statusFilter = req.query.status ? { status: req.query.status } : null;

        const where = mergeFilters(
            { partner_id: req.partner.id },
            searchFilter,
            statusFilter
        );

        const { count, rows } = await Tenant.findAndCountAll({
            where,
            include: [{
                model: Subscription,
                as: 'subscriptions',
                required: false,
                where: { status: ['trial', 'active'] },
                include: [{ model: Plan, as: 'plan', attributes: ['id', 'code', 'name'] }],
                order: [['created_at', 'DESC']],
                limit: 1
            }],
            order: sorting,
            limit: pagination.limit,
            offset: pagination.offset,
            distinct: true
        });

        res.json({
            success: true,
            ...getPaginatedResponse(rows, count, pagination)
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/partner/tenants
 * @desc Create new tenant under partner
 * @access Partner Admin
 */
router.post('/tenants',
    requirePartnerAdmin,
    createTenant,
    auditAction('create', 'tenant'),
    async (req, res, next) => {
        try {
            const { name, email, phone, address, plan_id, owner_email, owner_name } = req.body;

            // Check for existing tenant
            const existing = await Tenant.findOne({ where: { email } });
            if (existing) {
                throw ApiError.conflict('Tenant with this email already exists');
            }

            // Validate plan is allowed for this partner
            if (plan_id) {
                const allowedPlan = await PartnerAllowedPlan.findOne({
                    where: { partner_id: req.partner.id, plan_id, is_active: true }
                });
                if (!allowedPlan) {
                    throw ApiError.badRequest('This plan is not available for your partner account');
                }
            }

            // Create tenant
            const tenant = await Tenant.create({
                name,
                email,
                phone,
                address,
                partner_id: req.partner.id,
                status: 'active',
                environment: 'production'
            });

            // Create or find owner user
            let owner = await User.findOne({ where: { email: owner_email || email } });

            if (!owner) {
                owner = await User.create({
                    email: owner_email || email,
                    name: owner_name || name,
                    phone,
                    status: 'pending',
                    password_hash: 'temppassword123' // Should send invite email in production
                });
            }

            // Add owner to tenant
            await TenantUser.create({
                tenant_id: tenant.id,
                user_id: owner.id,
                role: 'admin',
                is_owner: true
            });

            // Create subscription if plan specified
            if (plan_id) {
                await subscriptionService.createSubscription(
                    tenant.id,
                    plan_id,
                    req.partner.id
                );
            }

            res.status(201).json({
                success: true,
                data: {
                    tenant,
                    owner: owner.toSafeJSON()
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/partner/tenants/:tenantId
 * @desc Get tenant details
 * @access Partner Team
 */
router.get('/tenants/:tenantId', validateTenantOwnership, async (req, res, next) => {
    try {
        const tenant = await Tenant.findOne({
            where: { id: req.params.tenantId, partner_id: req.partner.id },
            include: [
                {
                    model: TenantUser,
                    as: 'tenantUsers',
                    include: [{ model: User, attributes: ['id', 'name', 'email', 'avatar_url', 'status'] }]
                },
                {
                    model: Subscription,
                    as: 'subscriptions',
                    include: [{ model: Plan, as: 'plan' }]
                }
            ]
        });

        if (!tenant) {
            throw ApiError.notFound('Tenant not found');
        }

        res.json({
            success: true,
            data: tenant
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/partner/tenants/:tenantId/subscription
 * @desc Assign/change tenant subscription
 * @access Partner Admin
 */
router.put('/tenants/:tenantId/subscription',
    requirePartnerAdmin,
    validateTenantOwnership,
    auditAction('update_subscription', 'tenant'),
    async (req, res, next) => {
        try {
            const { plan_id, billing_cycle } = req.body;

            // Validate plan is allowed for this partner
            const allowedPlan = await PartnerAllowedPlan.findOne({
                where: { partner_id: req.partner.id, plan_id, is_active: true }
            });
            if (!allowedPlan) {
                throw ApiError.badRequest('This plan is not available for your partner account');
            }

            // Get or create subscription
            let subscription = await Subscription.findOne({
                where: { tenant_id: req.params.tenantId, status: ['trial', 'active'] }
            });

            if (subscription) {
                // Upgrade existing subscription
                subscription = await subscriptionService.upgradePlan(req, subscription.id, plan_id);
            } else {
                // Create new subscription
                subscription = await subscriptionService.createSubscription(
                    req.params.tenantId,
                    plan_id,
                    req.partner.id,
                    billing_cycle || 'monthly'
                );
            }

            res.json({
                success: true,
                data: subscription
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/partner/stats
 * @desc Get partner dashboard stats
 * @access Partner Team
 */
router.get('/stats', async (req, res, next) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalTenants,
            activeTenants,
            newTenantsThisMonth,
            activeSubscriptions,
            trialSubscriptions
        ] = await Promise.all([
            Tenant.count({ where: { partner_id: req.partner.id } }),
            Tenant.count({ where: { partner_id: req.partner.id, status: 'active' } }),
            Tenant.count({ where: { partner_id: req.partner.id, created_at: { [Op.gte]: thirtyDaysAgo } } }),
            Subscription.count({ where: { partner_id: req.partner.id, status: 'active' } }),
            Subscription.count({ where: { partner_id: req.partner.id, status: 'trial' } })
        ]);

        // Commission calculation
        const totalRevenue = await Payment.sum('amount', {
            include: [{
                model: Invoice,
                as: 'invoice',
                where: { partner_id: req.partner.id },
                required: true
            }],
            where: { status: 'completed' }
        });

        const commissionRate = req.partner.commission_rate || 0;
        const estimatedCommission = (totalRevenue || 0) * (commissionRate / 100);

        res.json({
            success: true,
            data: {
                tenants: {
                    total: totalTenants,
                    active: activeTenants,
                    new_this_month: newTenantsThisMonth
                },
                subscriptions: {
                    active: activeSubscriptions,
                    trial: trialSubscriptions
                },
                revenue: {
                    total: totalRevenue || 0,
                    commission_rate: commissionRate,
                    estimated_commission: estimatedCommission
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/partner/plans
 * @desc Get plans available for this partner
 * @access Partner Team
 */
router.get('/plans', async (req, res, next) => {
    try {
        const allowedPlans = await PartnerAllowedPlan.findAll({
            where: { partner_id: req.partner.id, is_active: true },
            include: [{ model: Plan }]
        });

        res.json({
            success: true,
            data: allowedPlans
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
