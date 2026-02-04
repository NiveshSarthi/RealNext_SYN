const express = require('express');
const router = express.Router();
const { Partner, PartnerUser, User, Tenant, PartnerAllowedPlan, Plan } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireSuperAdmin } = require('../../middleware/roles');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, buildSearchFilter, mergeFilters } = require('../../utils/helpers');
const { createPartner, validate, validators } = require('../../utils/validators');
const { body } = require('express-validator');
const { Op } = require('sequelize');

// All routes require super admin
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/admin/partners
 * @desc List all partners
 * @access Super Admin
 */
router.get('/', async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);
        const sorting = getSorting(req.query, ['name', 'created_at', 'status'], 'created_at');

        const searchFilter = buildSearchFilter(req.query.search, ['name', 'email', 'slug']);
        const statusFilter = req.query.status ? { status: req.query.status } : null;

        const where = mergeFilters(searchFilter, statusFilter);

        const { count, rows } = await Partner.findAndCountAll({
            where,
            include: [{
                model: PartnerUser,
                as: 'partnerUsers',
                attributes: ['id'],
                required: false
            }],
            order: sorting,
            limit: pagination.limit,
            offset: pagination.offset,
            distinct: true
        });

        // Add tenant count
        const partnersWithCounts = await Promise.all(rows.map(async (partner) => {
            const tenantCount = await Tenant.count({ where: { partner_id: partner.id } });
            return {
                ...partner.get({ plain: true }),
                tenant_count: tenantCount,
                user_count: partner.partnerUsers?.length || 0
            };
        }));

        res.json({
            success: true,
            ...getPaginatedResponse(partnersWithCounts, count, pagination)
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/partners
 * @desc Create new partner
 * @access Super Admin
 */
router.post('/', createPartner, auditAction('create', 'partner'), async (req, res, next) => {
    try {
        const { name, email, domain, subdomain, logo_url, primary_color, secondary_color, commission_rate } = req.body;

        // Check for existing partner
        const existing = await Partner.findOne({
            where: {
                [Op.or]: [
                    { email },
                    subdomain ? { subdomain } : null,
                    domain ? { domain } : null
                ].filter(Boolean)
            }
        });

        if (existing) {
            throw ApiError.conflict('Partner with this email, subdomain, or domain already exists');
        }

        const partner = await Partner.create({
            name,
            email,
            domain,
            subdomain,
            logo_url,
            primary_color,
            secondary_color,
            commission_rate: commission_rate || 0,
            status: 'active'
        });

        res.status(201).json({
            success: true,
            data: partner
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/partners/:id
 * @desc Get partner details
 * @access Super Admin
 */
router.get('/:id', async (req, res, next) => {
    try {
        const partner = await Partner.findByPk(req.params.id, {
            include: [
                {
                    model: PartnerUser,
                    as: 'partnerUsers',
                    include: [{ model: User, attributes: ['id', 'name', 'email', 'avatar_url'] }]
                },
                {
                    model: PartnerAllowedPlan,
                    as: 'partnerPlans',
                    include: [{ model: Plan }]
                }
            ]
        });

        if (!partner) {
            throw ApiError.notFound('Partner not found');
        }

        // Get tenant count and stats
        const tenants = await Tenant.findAll({
            where: { partner_id: partner.id },
            attributes: ['id', 'name', 'status', 'created_at']
        });

        res.json({
            success: true,
            data: {
                ...partner.get({ plain: true }),
                tenants,
                stats: {
                    total_tenants: tenants.length,
                    active_tenants: tenants.filter(t => t.status === 'active').length
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/admin/partners/:id
 * @desc Update partner
 * @access Super Admin
 */
router.put('/:id',
    [
        validators.optionalString('name'),
        validators.email().optional(),
        validators.optionalString('domain'),
        validators.url('logo_url'),
        validate
    ],
    auditAction('update', 'partner'),
    async (req, res, next) => {
        try {
            const partner = await Partner.findByPk(req.params.id);

            if (!partner) {
                throw ApiError.notFound('Partner not found');
            }

            const { name, email, domain, subdomain, logo_url, primary_color, secondary_color, commission_rate, settings } = req.body;

            await partner.update({
                name: name || partner.name,
                email: email || partner.email,
                domain: domain !== undefined ? domain : partner.domain,
                subdomain: subdomain !== undefined ? subdomain : partner.subdomain,
                logo_url: logo_url || partner.logo_url,
                primary_color: primary_color || partner.primary_color,
                secondary_color: secondary_color || partner.secondary_color,
                commission_rate: commission_rate !== undefined ? commission_rate : partner.commission_rate,
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
 * @route PUT /api/admin/partners/:id/status
 * @desc Update partner status (activate/suspend)
 * @access Super Admin
 */
router.put('/:id/status',
    [validators.enum('status', ['active', 'suspended', 'inactive']), validate],
    auditAction('update_status', 'partner'),
    async (req, res, next) => {
        try {
            const partner = await Partner.findByPk(req.params.id);

            if (!partner) {
                throw ApiError.notFound('Partner not found');
            }

            await partner.update({ status: req.body.status });

            // If suspending, also suspend all tenants under this partner
            if (req.body.status === 'suspended') {
                await Tenant.update(
                    { status: 'suspended' },
                    { where: { partner_id: partner.id } }
                );
            }

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
 * @route DELETE /api/admin/partners/:id
 * @desc Soft delete partner
 * @access Super Admin
 */
router.delete('/:id', auditAction('delete', 'partner'), async (req, res, next) => {
    try {
        const partner = await Partner.findByPk(req.params.id);

        if (!partner) {
            throw ApiError.notFound('Partner not found');
        }

        // Check if partner has tenants
        const tenantCount = await Tenant.count({ where: { partner_id: partner.id } });
        if (tenantCount > 0 && !req.query.force) {
            throw ApiError.badRequest(`Partner has ${tenantCount} tenant(s). Use ?force=true to delete anyway.`);
        }

        await partner.destroy(); // Soft delete due to paranoid: true

        res.json({
            success: true,
            message: 'Partner deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/partners/:id/users
 * @desc List partner users
 * @access Super Admin
 */
router.get('/:id/users', async (req, res, next) => {
    try {
        const partnerUsers = await PartnerUser.findAll({
            where: { partner_id: req.params.id },
            include: [{
                model: User,
                attributes: ['id', 'name', 'email', 'avatar_url', 'status', 'last_login_at']
            }]
        });

        res.json({
            success: true,
            data: partnerUsers
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/partners/:id/users
 * @desc Add user to partner
 * @access Super Admin
 */
router.post('/:id/users',
    [
        validators.uuid('user_id', 'body'),
        validators.enum('role', ['admin', 'manager', 'viewer']),
        validate
    ],
    auditAction('add_user', 'partner'),
    async (req, res, next) => {
        try {
            const { user_id, role, is_owner } = req.body;

            const partner = await Partner.findByPk(req.params.id);
            if (!partner) {
                throw ApiError.notFound('Partner not found');
            }

            const user = await User.findByPk(user_id);
            if (!user) {
                throw ApiError.notFound('User not found');
            }

            const [partnerUser, created] = await PartnerUser.findOrCreate({
                where: { partner_id: req.params.id, user_id },
                defaults: { role, is_owner: is_owner || false }
            });

            if (!created) {
                throw ApiError.conflict('User is already a member of this partner');
            }

            res.status(201).json({
                success: true,
                data: partnerUser
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/admin/partners/:id/plans
 * @desc Get plans allowed for this partner
 * @access Super Admin
 */
router.get('/:id/plans', async (req, res, next) => {
    try {
        const allowedPlans = await PartnerAllowedPlan.findAll({
            where: { partner_id: req.params.id },
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

/**
 * @route PUT /api/admin/partners/:id/plans
 * @desc Set plans allowed for this partner
 * @access Super Admin
 */
router.put('/:id/plans',
    [validators.array('plans', true), validate],
    auditAction('update_plans', 'partner'),
    async (req, res, next) => {
        try {
            const { plans } = req.body;
            // plans: [{ plan_id, custom_price_monthly, custom_price_yearly, is_active }]

            // Remove existing and add new
            await PartnerAllowedPlan.destroy({ where: { partner_id: req.params.id } });

            const allowedPlans = await PartnerAllowedPlan.bulkCreate(
                plans.map(p => ({
                    partner_id: req.params.id,
                    plan_id: p.plan_id,
                    custom_price_monthly: p.custom_price_monthly,
                    custom_price_yearly: p.custom_price_yearly,
                    is_active: p.is_active !== false
                }))
            );

            res.json({
                success: true,
                data: allowedPlans
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
