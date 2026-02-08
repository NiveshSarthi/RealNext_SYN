const express = require('express');
const router = express.Router();
const { Tenant, TenantUser, User, Partner, Subscription, Plan } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireSuperAdmin } = require('../../middleware/roles');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, buildSearchFilter, mergeFilters } = require('../../utils/helpers');
const { validate, validators } = require('../../utils/validators');
const { Op } = require('sequelize');

// All routes require super admin
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/admin/tenants
 * @desc List all tenants globally
 * @access Super Admin
 */
router.get('/', async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);
        const sorting = getSorting(req.query, ['name', 'created_at', 'status'], 'created_at');

        const searchFilter = buildSearchFilter(req.query.search, ['name', 'email', 'slug']);
        const statusFilter = req.query.status ? { status: req.query.status } : null;
        const partnerFilter = req.query.partner_id ? { partner_id: req.query.partner_id } : null;
        const envFilter = req.query.environment ? { environment: req.query.environment } : null;

        const where = mergeFilters(searchFilter, statusFilter, partnerFilter, envFilter);

        const { count, rows } = await Tenant.findAndCountAll({
            where,
            include: [
                { model: Partner, as: 'partner', attributes: ['id', 'name', 'slug'] },
                {
                    model: Subscription,
                    as: 'subscriptions',
                    required: false,
                    where: { status: ['trial', 'active'] },
                    include: [{ model: Plan, as: 'plan', attributes: ['id', 'code', 'name'] }],
                    order: [['created_at', 'DESC']],
                    limit: 1
                }
            ],
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
 * @route GET /api/admin/tenants/:id
 * @desc Get tenant details
 * @access Super Admin
 */
router.get('/:id', async (req, res, next) => {
    try {
        const tenant = await Tenant.findByPk(req.params.id, {
            include: [
                { model: Partner, as: 'partner' },
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
 * @route PUT /api/admin/tenants/:id/override
 * @desc Override tenant settings (Super Admin override)
 * @access Super Admin
 */
router.put('/:id/override',
    auditAction('override', 'tenant'),
    async (req, res, next) => {
        try {
            const tenant = await Tenant.findByPk(req.params.id);

            if (!tenant) {
                throw ApiError.notFound('Tenant not found');
            }

            const { settings, metadata, status, environment, is_demo } = req.body;

            await tenant.update({
                settings: settings ? {
                    ...tenant.settings,
                    ...settings,
                    // Ensure deep merge for nested objects if needed, or rely on frontend to send complete objects
                    features: settings.features ? { ...tenant.settings.features, ...settings.features } : tenant.settings.features,
                    menu_access: settings.menu_access ? { ...tenant.settings.menu_access, ...settings.menu_access } : tenant.settings.menu_access,
                    _admin_override: true
                } : tenant.settings,
                metadata: metadata ? { ...tenant.metadata, ...metadata } : tenant.metadata,
                status: status || tenant.status,
                environment: environment || tenant.environment,
                is_demo: is_demo !== undefined ? is_demo : tenant.is_demo
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
 * @route POST /api/admin/tenants/:id/impersonate
 * @desc Get impersonation token for tenant
 * @access Super Admin
 */
router.post('/:id/impersonate', auditAction('impersonate', 'tenant'), async (req, res, next) => {
    try {
        const tenant = await Tenant.findByPk(req.params.id);

        if (!tenant) {
            throw ApiError.notFound('Tenant not found');
        }

        // Find owner user
        const ownerMembership = await TenantUser.findOne({
            where: { tenant_id: tenant.id, is_owner: true },
            include: [{ model: User }]
        });

        if (!ownerMembership) {
            throw ApiError.notFound('Tenant owner not found');
        }

        // Generate impersonation token
        const { generateAccessToken, buildTokenPayload } = require('../../utils/jwt');
        const authService = require('../../services/authService');

        const context = await authService.getUserContext(ownerMembership.User);
        const payload = buildTokenPayload(ownerMembership.User, context);
        payload.impersonated_by = req.user.id;
        payload.impersonation = true;

        const token = generateAccessToken(payload);

        res.json({
            success: true,
            data: {
                token,
                tenant: tenant.get({ plain: true }),
                user: ownerMembership.User.toSafeJSON()
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
