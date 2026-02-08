const express = require('express');
const router = express.Router();
const { Lead, User } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireTenantAccess } = require('../../middleware/roles');
const { enforceTenantScope } = require('../../middleware/scopeEnforcer');
const { requireFeature, checkUsageLimit, incrementUsage } = require('../../middleware/featureGate');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, buildSearchFilter, mergeFilters, buildDateRangeFilter } = require('../../utils/helpers');
const { createLead, validate, validators } = require('../../utils/validators');
const { Op } = require('sequelize');

// Middleware
router.use(authenticate, requireTenantAccess, enforceTenantScope);

/**
 * @route GET /api/leads
 * @desc List leads for tenant
 * @access Tenant User
 */
router.get('/', requireFeature('leads'), async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);
        const sorting = getSorting(req.query, ['name', 'email', 'status', 'created_at', 'ai_score'], 'created_at');

        // Build filters
        const searchFilter = buildSearchFilter(req.query.search, ['name', 'email', 'phone', 'location']);
        const statusFilter = req.query.status ? { status: req.query.status } : null;
        const sourceFilter = req.query.source ? { source: req.query.source } : null;
        const assignedFilter = req.query.assigned_to ? { assigned_to: req.query.assigned_to } : null;
        const dateFilter = buildDateRangeFilter('created_at', req.query.start_date, req.query.end_date);

        const where = mergeFilters(
            { tenant_id: req.tenant.id },
            searchFilter,
            statusFilter,
            sourceFilter,
            assignedFilter,
            dateFilter
        );

        const { count, rows } = await Lead.findAndCountAll({
            where,
            include: [{
                model: User,
                as: 'assignedUser',
                attributes: ['id', 'name', 'email', 'avatar_url'],
                required: false
            }],
            order: sorting,
            limit: pagination.limit,
            offset: pagination.offset
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
 * @route POST /api/leads
 * @desc Create new lead
 * @access Tenant User
 */
router.post('/',
    requireFeature('leads'),
    checkUsageLimit('leads', 'max_leads'),
    createLead,
    auditAction('create', 'lead'),
    async (req, res, next) => {
        try {
            const {
                name, email, phone, status, source, budget_min, budget_max,
                location, tags, custom_fields, assigned_to, metadata
            } = req.body;

            const lead = await Lead.create({
                tenant_id: req.tenant.id,
                name,
                email,
                phone,
                status: status || 'new',
                source: source || 'manual',
                budget_min,
                budget_max,
                location,
                tags: tags || [],
                custom_fields: custom_fields || {},
                assigned_to: assigned_to || req.user.id,
                metadata: metadata || {}
            });

            // Track usage
            await incrementUsage(req, 'leads');

            res.status(201).json({
                success: true,
                data: lead
            });
        } catch (error) {
            next(error);
        }
    }
);


/**
 * @route GET /api/leads/stats
 * @desc Get lead statistics
 * @access Tenant User
 */
router.get('/stats/overview', requireFeature('leads'), async (req, res, next) => {
    try {
        const { fn, col } = require('sequelize');

        const byStatus = await Lead.findAll({
            where: { tenant_id: req.tenant.id },
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            group: ['status'],
            raw: true
        });

        const bySource = await Lead.findAll({
            where: { tenant_id: req.tenant.id },
            attributes: ['source', [fn('COUNT', col('id')), 'count']],
            group: ['source'],
            raw: true
        });

        const avgScore = await Lead.findAll({
            where: { tenant_id: req.tenant.id, ai_score: { [Op.ne]: null } },
            attributes: [[fn('AVG', col('ai_score')), 'average']],
            raw: true
        });

        res.json({
            success: true,
            data: {
                by_status: byStatus,
                by_source: bySource,
                average_ai_score: parseFloat(avgScore[0]?.average) || 0
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/leads/:id
 * @desc Get lead details
 * @access Tenant User
 */
router.get('/:id', requireFeature('leads'), async (req, res, next) => {
    try {
        const lead = await Lead.findOne({
            where: { id: req.params.id, tenant_id: req.tenant.id },
            include: [{
                model: User,
                as: 'assignedUser',
                attributes: ['id', 'name', 'email', 'avatar_url'],
                required: false
            }]
        });

        if (!lead) {
            throw ApiError.notFound('Lead not found');
        }

        res.json({
            success: true,
            data: lead
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/leads/:id
 * @desc Update lead
 * @access Tenant User
 */
router.put('/:id',
    requireFeature('leads'),
    [
        validators.optionalString('name'),
        validators.email().optional(),
        validators.phone(),
        validate
    ],
    auditAction('update', 'lead'),
    async (req, res, next) => {
        try {
            const lead = await Lead.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!lead) {
                throw ApiError.notFound('Lead not found');
            }

            const updateData = { ...req.body };
            delete updateData.tenant_id; // Prevent tenant change
            delete updateData.id;

            // Track status change
            if (updateData.status && updateData.status !== lead.status) {
                updateData.metadata = {
                    ...lead.metadata,
                    status_history: [
                        ...(lead.metadata?.status_history || []),
                        { from: lead.status, to: updateData.status, at: new Date(), by: req.user.id }
                    ]
                };
            }

            await lead.update(updateData);

            res.json({
                success: true,
                data: lead
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /api/leads/:id/assign
 * @desc Assign lead to user
 * @access Tenant User
 */
router.put('/:id/assign',
    requireFeature('leads'),
    auditAction('assign', 'lead'),
    async (req, res, next) => {
        try {
            const lead = await Lead.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!lead) {
                throw ApiError.notFound('Lead not found');
            }

            const { user_id } = req.body;

            // Verify user is part of tenant
            if (user_id) {
                const { TenantUser } = require('../models');
                const isMember = await TenantUser.findOne({
                    where: { tenant_id: req.tenant.id, user_id }
                });
                if (!isMember) {
                    throw ApiError.badRequest('User is not a team member');
                }
            }

            await lead.update({ assigned_to: user_id || null });

            res.json({
                success: true,
                data: lead
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/leads/:id
 * @desc Delete lead (soft delete)
 * @access Tenant User
 */
router.delete('/:id',
    requireFeature('leads'),
    auditAction('delete', 'lead'),
    async (req, res, next) => {
        try {
            const lead = await Lead.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!lead) {
                throw ApiError.notFound('Lead not found');
            }

            await lead.destroy();

            res.json({
                success: true,
                message: 'Lead deleted'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/leads/import
 * @desc Bulk import leads
 * @access Tenant User
 */
router.post('/import',
    requireFeature('leads'),
    checkUsageLimit('leads', 'max_leads'),
    auditAction('import', 'lead'),
    async (req, res, next) => {
        try {
            const { leads } = req.body;

            if (!Array.isArray(leads) || leads.length === 0) {
                throw ApiError.badRequest('Leads array is required');
            }

            if (leads.length > 500) {
                throw ApiError.badRequest('Cannot import more than 500 leads at once');
            }

            // Map leads to include tenant_id
            const leadsToCreate = leads.map(lead => ({
                ...lead,
                tenant_id: req.tenant.id,
                source: lead.source || 'import',
                status: lead.status || 'new'
            }));

            const created = await Lead.bulkCreate(leadsToCreate, {
                ignoreDuplicates: true,
                validate: true
            });

            // Track usage
            await incrementUsage(req, 'leads', created.length);

            res.status(201).json({
                success: true,
                data: {
                    imported: created.length,
                    total: leads.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/leads/stats
 * @desc Get lead statistics
 * @access Tenant User
 */



module.exports = router;
