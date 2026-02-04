const express = require('express');
const router = express.Router();
const { Tenant, TenantUser, User, Subscription, Plan, Lead, Campaign } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTenantAccess, requireTenantAdmin, requireTenantManager } = require('../middleware/roles');
const { enforceTenantScope } = require('../middleware/scopeEnforcer');
const { requireActiveSubscription } = require('../middleware/featureGate');
const { auditAction } = require('../middleware/auditLogger');
const { ApiError } = require('../middleware/errorHandler');
const { validate, validators } = require('../utils/validators');
const { getPagination, getPaginatedResponse, getSorting, buildSearchFilter, mergeFilters } = require('../utils/helpers');
const { Op } = require('sequelize');

// All routes require authentication and tenant access
router.use(authenticate, requireTenantAccess, enforceTenantScope);

/**
 * @route GET /api/tenant/profile
 * @desc Get current tenant profile
 * @access Tenant User
 */
router.get('/profile', async (req, res, next) => {
    try {
        const tenant = await Tenant.findByPk(req.tenant.id, {
            include: [{
                model: Subscription,
                as: 'subscriptions',
                where: { status: ['trial', 'active'] },
                required: false,
                include: [{ model: Plan, as: 'plan' }]
            }]
        });

        res.json({
            success: true,
            data: tenant
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/tenant/profile
 * @desc Update tenant profile
 * @access Tenant Admin
 */
router.put('/profile',
    requireTenantAdmin,
    [
        validators.optionalString('name'),
        validators.phone(),
        validators.optionalString('address', 500),
        validators.url('logo_url'),
        validate
    ],
    auditAction('update', 'tenant'),
    async (req, res, next) => {
        try {
            const tenant = await Tenant.findByPk(req.tenant.id);
            const { name, phone, address, logo_url, website, settings } = req.body;

            await tenant.update({
                name: name || tenant.name,
                phone: phone || tenant.phone,
                address: address || tenant.address,
                logo_url: logo_url || tenant.logo_url,
                website: website || tenant.website,
                settings: settings ? { ...tenant.settings, ...settings } : tenant.settings
            });

            res.json({
                success: true,
                data: tenant
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/tenant/users
 * @desc List tenant team members
 * @access Tenant User
 */
router.get('/users', async (req, res, next) => {
    try {
        const tenantUsers = await TenantUser.findAll({
            where: { tenant_id: req.tenant.id },
            include: [{
                model: User,
                attributes: ['id', 'name', 'email', 'avatar_url', 'phone', 'status', 'last_login_at']
            }]
        });

        res.json({
            success: true,
            data: tenantUsers
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/tenant/users
 * @desc Add team member to tenant
 * @access Tenant Admin
 */
router.post('/users',
    requireTenantAdmin,
    [
        validators.email(),
        validators.optionalString('name', 100),
        validators.enum('role', ['admin', 'manager', 'user'], false),
        validate
    ],
    auditAction('add_user', 'tenant'),
    async (req, res, next) => {
        try {
            const { email, name, role, permissions, department } = req.body;

            // Check subscription limits
            if (req.plan?.limits?.max_users) {
                const currentCount = await TenantUser.count({ where: { tenant_id: req.tenant.id } });
                if (currentCount >= req.plan.limits.max_users) {
                    throw ApiError.forbidden(`User limit reached (${req.plan.limits.max_users}). Upgrade your plan for more.`);
                }
            }

            // Find or create user
            let user = await User.findOne({ where: { email } });

            if (!user) {
                // Create new user with temporary password
                user = await User.create({
                    email,
                    name: name || email.split('@')[0],
                    status: 'pending',
                    // In production, generate temp password and send email
                    password_hash: 'temppassword123'
                });
            }

            // Check if already a member
            const existing = await TenantUser.findOne({
                where: { tenant_id: req.tenant.id, user_id: user.id }
            });

            if (existing) {
                throw ApiError.conflict('User is already a team member');
            }

            const tenantUser = await TenantUser.create({
                tenant_id: req.tenant.id,
                user_id: user.id,
                role: role || 'user',
                permissions: permissions || [],
                department
            });

            res.status(201).json({
                success: true,
                data: {
                    ...tenantUser.get({ plain: true }),
                    User: user.toSafeJSON()
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /api/tenant/users/:userId
 * @desc Update team member
 * @access Tenant Admin
 */
router.put('/users/:userId',
    requireTenantAdmin,
    auditAction('update_user', 'tenant'),
    async (req, res, next) => {
        try {
            const tenantUser = await TenantUser.findOne({
                where: { tenant_id: req.tenant.id, user_id: req.params.userId }
            });

            if (!tenantUser) {
                throw ApiError.notFound('Team member not found');
            }

            // Prevent changing own role if you're the only admin
            if (tenantUser.user_id === req.user.id && req.body.role !== tenantUser.role) {
                const adminCount = await TenantUser.count({
                    where: { tenant_id: req.tenant.id, role: 'admin' }
                });
                if (adminCount <= 1) {
                    throw ApiError.badRequest('Cannot change role: you are the only admin');
                }
            }

            const { role, permissions, department } = req.body;

            await tenantUser.update({
                role: role || tenantUser.role,
                permissions: permissions || tenantUser.permissions,
                department: department !== undefined ? department : tenantUser.department
            });

            res.json({
                success: true,
                data: tenantUser
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/tenant/users/:userId
 * @desc Remove team member
 * @access Tenant Admin
 */
router.delete('/users/:userId',
    requireTenantAdmin,
    auditAction('remove_user', 'tenant'),
    async (req, res, next) => {
        try {
            const tenantUser = await TenantUser.findOne({
                where: { tenant_id: req.tenant.id, user_id: req.params.userId }
            });

            if (!tenantUser) {
                throw ApiError.notFound('Team member not found');
            }

            if (tenantUser.is_owner) {
                throw ApiError.badRequest('Cannot remove tenant owner');
            }

            if (tenantUser.user_id === req.user.id) {
                throw ApiError.badRequest('Cannot remove yourself');
            }

            await tenantUser.destroy();

            res.json({
                success: true,
                message: 'Team member removed'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/tenant/subscription
 * @desc Get current subscription
 * @access Tenant User
 */
router.get('/subscription', async (req, res, next) => {
    try {
        const subscriptionService = require('../services/subscriptionService');
        const subscription = await subscriptionService.getSubscription(req.tenant.id);

        if (!subscription) {
            return res.json({
                success: true,
                data: null,
                message: 'No active subscription'
            });
        }

        const usage = await subscriptionService.getUsage(subscription.id);

        res.json({
            success: true,
            data: {
                ...subscription.get({ plain: true }),
                usage
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/tenant/stats
 * @desc Get tenant dashboard stats
 * @access Tenant User
 */
router.get('/stats', async (req, res, next) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [leadCount, newLeadsThisMonth, campaignCount, activeCampaigns, teamCount] = await Promise.all([
            Lead.count({ where: { tenant_id: req.tenant.id } }),
            Lead.count({ where: { tenant_id: req.tenant.id, created_at: { [Op.gte]: thirtyDaysAgo } } }),
            Campaign.count({ where: { tenant_id: req.tenant.id } }),
            Campaign.count({ where: { tenant_id: req.tenant.id, status: 'running' } }),
            TenantUser.count({ where: { tenant_id: req.tenant.id } })
        ]);

        res.json({
            success: true,
            data: {
                leads: {
                    total: leadCount,
                    new_this_month: newLeadsThisMonth
                },
                campaigns: {
                    total: campaignCount,
                    active: activeCampaigns
                },
                team: {
                    count: teamCount
                },
                subscription: req.subscription ? {
                    plan: req.plan?.name,
                    status: req.subscription.status,
                    days_remaining: Math.max(0, Math.ceil((new Date(req.subscription.current_period_end) - now) / (1000 * 60 * 60 * 24)))
                } : null
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
