const express = require('express');
const router = express.Router();
const { Lead, User } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireClientAccess } = require('../../middleware/roles');
const { enforceClientScope } = require('../../middleware/scopeEnforcer');
const { requireFeature, checkUsageLimit, incrementUsage } = require('../../middleware/featureGate');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, buildSearchFilter, mergeFilters, buildDateRangeFilter } = require('../../utils/helpers');
const { createLead, validate, validators } = require('../../utils/validators');
const mongoose = require('mongoose');

// Middleware
router.use(authenticate, requireClientAccess, enforceClientScope);

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
            { client_id: req.client.id },
            searchFilter,
            statusFilter,
            sourceFilter,
            assignedFilter,
            dateFilter
        );

        const leads = await Lead.find(where)
            .populate({
                path: 'assigned_to',
                select: 'name email avatar_url'
            })
            .sort(sorting)
            .limit(pagination.limit)
            .skip(pagination.offset);

        const count = await Lead.countDocuments(where);

        res.json({
            success: true,
            ...getPaginatedResponse(leads, count, pagination)
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
                client_id: req.client.id,
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
        const byStatus = await Lead.aggregate([
            { $match: { client_id: new mongoose.Types.ObjectId(req.client.id) } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const bySource = await Lead.aggregate([
            { $match: { client_id: new mongoose.Types.ObjectId(req.client.id) } },
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);

        const avgScore = await Lead.aggregate([
            { $match: { client_id: new mongoose.Types.ObjectId(req.client.id), ai_score: { $ne: null } } },
            { $group: { _id: null, average: { $avg: '$ai_score' } } }
        ]);

        res.json({
            success: true,
            data: {
                by_status: byStatus.map(s => ({ status: s._id, count: s.count })),
                by_source: bySource.map(s => ({ source: s._id, count: s.count })),
                average_ai_score: avgScore[0]?.average || 0
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
            _id: req.params.id,
            client_id: req.client.id
        }).populate({
            path: 'assigned_to',
            select: 'name email avatar_url'
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
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!lead) {
                throw ApiError.notFound('Lead not found');
            }

            const updateData = { ...req.body };
            delete updateData.client_id; // Prevent client change
            delete updateData.id;

            // Track status change
            if (updateData.status && updateData.status !== lead.status) {
                const history = { from: lead.status, to: updateData.status, at: new Date(), by: req.user.id };
                if (!lead.metadata) lead.metadata = {};
                if (!lead.metadata.status_history) lead.metadata.status_history = [];
                lead.metadata.status_history.push(history);
                lead.markModified('metadata');
            }

            Object.assign(lead, updateData);
            await lead.save();

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
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!lead) {
                throw ApiError.notFound('Lead not found');
            }

            const { user_id } = req.body;

            // Verify user is part of client
            if (user_id) {
                const { ClientUser } = require('../../models');
                const isMember = await ClientUser.findOne({
                    client_id: req.client.id,
                    user_id
                });
                if (!isMember) {
                    throw ApiError.badRequest('User is not a team member');
                }
            }

            lead.assigned_to = user_id || null;
            await lead.save();

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
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!lead) {
                throw ApiError.notFound('Lead not found');
            }

            await lead.deleteOne();

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

            // Map leads to include client_id
            const leadsToCreate = leads.map(lead => ({
                ...lead,
                client_id: req.client.id,
                source: lead.source || 'import',
                status: lead.status || 'new'
            }));

            const result = await Lead.insertMany(leadsToCreate, { ordered: false });

            // Track usage
            await incrementUsage(req, 'leads', result.length);

            res.status(201).json({
                success: true,
                data: {
                    imported: result.length,
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
