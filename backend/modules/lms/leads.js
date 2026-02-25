const express = require('express');
const router = express.Router();
const { Lead, User, ClientUser, LeadStage } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireClientAccess } = require('../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../middleware/scopeEnforcer');
const { requireFeature, checkUsageLimit, incrementUsage } = require('../../middleware/featureGate');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, buildSearchFilter, mergeFilters, buildDateRangeFilter } = require('../../utils/helpers');
const { createLead, validate, validators } = require('../../utils/validators');
const mongoose = require('mongoose');
const waService = require('../../services/waService');
const logger = require('../../config/logger');
const DEFAULT_STAGES = ['Screening', 'Sourcing', 'Walk-in', 'Closure'];

// Middleware
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

// Defensive helper to ensure client context exists before using req.client.id
const ensureClient = (req) => {
    // Super admins can bypass client context check
    if (req.user?.is_super_admin) {
        return;
    }

    if (!req.client?.id) {
        console.error('[LEADS-API] Missing client context. User:', req.user?.email);
        throw ApiError.unauthorized('Client context missing');
    }
};

/**
 * @route GET /api/leads
 * @desc List leads for tenant
 * @access Tenant User
 */
router.get('/', async (req, res, next) => {
    try {
        ensureClient(req);
        const pagination = getPagination(req.query);
        const sorting = getSorting(req.query, { created_at: -1 });

        const where = {};
        if (req.client?.id) {
            where.client_id = req.client.id;
        } else if (!req.user?.is_super_admin) {
            // Non-super admins MUST have a client_id
            throw ApiError.unauthorized('Client context missing');
        }
        // If super admin and no req.client.id, they see ALL leads (no client_id filter)

        // Search Filter
        if (req.query.search) {
            where.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
                { phone: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Status/Stage Filters
        if (req.query.status) where.status = req.query.status;
        if (req.query.stage) where.stage = req.query.stage;

        // Custom Filters
        if (req.query.source) where.source = req.query.source;

        // Lead Visibility Restriction
        const isClientAdmin = req.user?.is_super_admin || (req.clientUser?.role === 'admin');
        if (!isClientAdmin) {
            // Non-admins only see assigned leads
            where.assigned_to = req.user.id;
            console.log(`[LEADS-RESTRICTION] User ${req.user.email} restricted to assigned leads.`);
        } else if (req.query.assigned_to) {
            // Admins can filter by assigned_to
            where.assigned_to = req.query.assigned_to;
        }

        // Ranges
        const budgetMinFilter = req.query.budget_min ? { budget_min: { $gte: parseInt(req.query.budget_min) } } : null;
        const budgetMaxFilter = req.query.budget_max ? { budget_max: { $lte: parseInt(req.query.budget_max) } } : null;
        const aiScoreMinFilter = req.query.ai_score_min ? { ai_score: { $gte: parseInt(req.query.ai_score_min) } } : null;

        if (budgetMinFilter || budgetMaxFilter) {
            where.$and = where.$and || [];
            if (budgetMinFilter) where.$and.push(budgetMinFilter);
            if (budgetMaxFilter) where.$and.push(budgetMaxFilter);
        }
        if (aiScoreMinFilter) {
            where.ai_score = aiScoreMinFilter.ai_score;
        }

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
 * @route GET /api/leads/stats/overview
 * @desc Get lead statistics
 */
router.get('/stats/overview', requireFeature('leads'), async (req, res, next) => {
    try {
        ensureClient(req);
        let matchStage = {};
        if (req.client?.id) {
            matchStage.client_id = new mongoose.Types.ObjectId(req.client.id);
        }

        const [byStatus, byStage] = await Promise.all([
            Lead.aggregate([
                { $match: matchStage },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            Lead.aggregate([
                { $match: matchStage },
                { $group: { _id: "$stage", count: { $sum: 1 } } }
            ])
        ]);

        const startOfToday = new Date().setHours(0, 0, 0, 0);
        const todayCount = await Lead.countDocuments({
            ...matchStage,
            created_at: { $gte: startOfToday }
        });

        const totalLeads = await Lead.countDocuments(matchStage);
        const successfulLeads = await Lead.countDocuments({
            ...matchStage,
            $or: [
                { stage: 'Closure' },
                { stage: 'Walk-in' },
                { status: { $in: ['Hot', 'Warm'] } }
            ]
        });
        const conversionRate = totalLeads > 0 ? (successfulLeads / totalLeads) * 100 : 0;

        res.json({
            success: true,
            data: {
                by_status: byStatus.map(s => ({ status: s._id, count: s.count })),
                by_stage: byStage.map(s => ({ stage: s._id, count: s.count })),
                stats: {
                    total: totalLeads,
                    today: todayCount,
                    conversion_rate: parseFloat(conversionRate.toFixed(1))
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/leads/filters
 * @desc Get unique filter values
 */
router.get('/filters', requireFeature('leads'), async (req, res, next) => {
    try {
        ensureClient(req);
        const matchStage = req.client?.id ? { client_id: new mongoose.Types.ObjectId(req.client.id) } : {};

        const [sources, campaigns, assignedUsers] = await Promise.all([
            Lead.distinct('source', matchStage),
            Lead.distinct('campaign_name', matchStage),
            Lead.distinct('assigned_to', matchStage)
        ]);

        const users = await User.find({ _id: { $in: assignedUsers } }).select('name email');

        res.json({
            success: true,
            data: {
                sources,
                campaigns,
                assigned_users: users
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/leads/stage-metadata
 * @desc Get stages and counts
 */
router.get('/stage-metadata', async (req, res, next) => {
    try {
        ensureClient(req);

        // 1. Get custom stages for client
        const clientFilter = req.client?.id ? { client_id: req.client.id } : {};
        const customStages = await LeadStage.find(clientFilter).sort('order');

        // 2. Build full list: Default + Custom
        const allStageNames = [...DEFAULT_STAGES, ...customStages.map(s => s.name)];

        // 3. Count leads per stage
        const aggregateMatch = req.client?.id ? { client_id: new mongoose.Types.ObjectId(req.client.id) } : {};
        const counts = await Lead.aggregate([
            { $match: aggregateMatch },
            { $group: { _id: "$stage", count: { $sum: 1 } } }
        ]);

        const countMap = counts.reduce((acc, c) => {
            acc[c._id || 'Screening'] = c.count;
            return acc;
        }, {});

        const stages = allStageNames.map(name => {
            const custom = customStages.find(s => s.name === name);
            return {
                name,
                count: countMap[name] || 0,
                color: custom?.color || null,
                is_custom: !!custom
            };
        });

        res.json({ success: true, data: stages });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/leads/stages
 * @desc Get all custom stages for client
 */
router.get('/stages', async (req, res, next) => {
    try {
        ensureClient(req);
        const filter = req.client?.id ? { client_id: req.client.id } : {};
        const stages = await LeadStage.find(filter).sort('order');
        res.json({ success: true, data: stages });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/leads/stages
 * @desc Create new custom stage
 */
router.post('/stages', async (req, res, next) => {
    try {
        ensureClient(req);
        const { name, color, status_mapping } = req.body;

        if (!name) throw ApiError.badRequest('Stage name is required');

        const existing = await LeadStage.findOne({ client_id: req.client.id, name });
        if (existing) throw ApiError.conflict('Stage already exists');

        const lastStage = await LeadStage.findOne({ client_id: req.client.id }).sort('-order');
        const order = lastStage ? lastStage.order + 1 : 10;

        const stage = await LeadStage.create({
            client_id: req.client.id,
            name,
            color,
            order,
            status_mapping
        });

        res.status(201).json({ success: true, data: stage });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/leads/stages/reorder
 * @desc Reorder stages
 */
router.put('/stages/reorder', async (req, res, next) => {
    try {
        ensureClient(req);
        const { ids } = req.body;
        if (!Array.isArray(ids)) throw ApiError.badRequest('IDs array is required');

        const operations = ids.map((id, index) => ({
            updateOne: {
                filter: { _id: id, client_id: req.client.id },
                update: { $set: { order: index } }
            }
        }));

        await LeadStage.bulkWrite(operations);
        res.json({ success: true, message: 'Stages reordered' });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/leads/import
 * @desc Bulk import leads
 */
router.post('/import',
    requireFeature('leads'),
    checkUsageLimit('leads', 'max_leads'),
    auditAction('import', 'lead'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const { leads } = req.body;

            if (!Array.isArray(leads) || leads.length === 0) {
                throw ApiError.badRequest('Leads array is required');
            }

            const leadsToCreate = leads.map(lead => ({
                ...lead,
                client_id: req.client.id,
                source: lead.source || 'import',
                status: lead.status || 'Uncontacted',
                activity_logs: [{
                    type: 'creation',
                    content: 'Lead created via bulk import',
                    user_id: req.user.id,
                    created_at: new Date()
                }]
            }));

            const result = await Lead.insertMany(leadsToCreate, { ordered: false });
            if (result.length > 0) {
                await incrementUsage(req, 'leads', result.length);
            }

            res.status(201).json({
                success: true,
                data: result,
                imported: result.length
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PATCH /api/leads/bulk-move
 * @desc Move multiple leads to a new stage
 */
router.patch('/bulk-move',
    requireFeature('leads'),
    auditAction('bulk_move', 'lead'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const { lead_ids, stage } = req.body;

            if (!Array.isArray(lead_ids) || !stage) {
                throw ApiError.badRequest('lead_ids array and stage are required');
            }

            const query = { _id: { $in: lead_ids } };
            if (!req.user?.is_super_admin && req.client?.id) {
                query.client_id = req.client.id;
            }
            const leads = await Lead.find(query);

            for (const lead of leads) {
                if (lead.stage !== stage) {
                    lead.activity_logs.push({
                        type: 'stage_change',
                        content: `Bulk moved to stage: ${stage}`,
                        old_value: lead.stage,
                        new_value: stage,
                        user_id: req.user.id,
                        created_at: new Date()
                    });
                    lead.stage = stage;
                    await lead.save();
                }
            }

            res.json({
                success: true,
                message: `Successfully moved ${leads.length} leads to ${stage}`,
                data: { modifiedCount: leads.length }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/leads
 * @desc Create new lead
 */
router.post('/',
    requireFeature('leads'),
    checkUsageLimit('leads', 'max_leads'),
    createLead,
    auditAction('create', 'lead'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const leadData = {
                ...req.body,
                client_id: req.client?.id || req.body.client_id, // Allow fallback for Super Admin
                activity_logs: [{
                    type: 'system',
                    content: 'Lead created via API',
                    user_id: req.user.id
                }]
            };

            const lead = await Lead.create(leadData);
            await incrementUsage(req, 'leads');

            if (lead.phone) {
                waService.createContact({
                    name: lead.name || '',
                    number: lead.phone,
                    tags: lead.tags || []
                }).catch(err => console.error('[WFB Sync] Failed to sync new lead:', err.message));
            }

            res.status(201).json({ success: true, data: lead });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/leads/:id
 * @desc Get lead details
 */
router.get('/:id', requireFeature('leads'), async (req, res, next) => {
    try {
        ensureClient(req);

        const query = { _id: req.params.id };
        // Super admins bypass client_id filter if they want, 
        // but if they have a client context, we usually filter.
        // For consistency with other routes, let's check super admin status.
        if (!req.user?.is_super_admin && req.client?.id) {
            query.client_id = req.client.id;
        }

        // Lead Visibility Restriction for Details
        const isClientAdmin = req.user?.is_super_admin || (req.clientUser?.role === 'admin');
        if (!isClientAdmin) {
            query.assigned_to = req.user.id;
        }

        const lead = await Lead.findOne(query)
            .populate({
                path: 'assigned_to',
                select: 'name email avatar_url'
            })
            .populate({
                path: 'activity_logs.user_id',
                select: 'name email avatar_url'
            });

        if (!lead) {
            logger.error(`[LEADS-API] GET Detail Not Found. ID: ${req.params.id}, Query: ${JSON.stringify(query)}`);
            throw ApiError.notFound('Lead not found');
        }

        res.json({ success: true, data: lead });
    } catch (error) {
        next(error);
    }
});



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
            ensureClient(req);
            const query = { _id: req.params.id };
            if (!req.user?.is_super_admin && req.client?.id) {
                query.client_id = req.client.id;
            }
            const lead = await Lead.findOne(query);
            if (!lead) {
                logger.error(`[LEADS-API] Assign - Lead Not Found. ID: ${req.params.id}, Query: ${JSON.stringify(query)}`);
                throw ApiError.notFound('Lead not found');
            }

            const { user_id } = req.body;
            const previousOwner = lead.assigned_to;
            lead.assigned_to = user_id || null;

            // Log Assignment Change
            const newOwner = user_id ? await User.findById(user_id).select('name') : null;
            lead.activity_logs.push({
                type: 'assignment_change',
                content: user_id ? `Lead assigned to ${newOwner?.name || 'User'}` : 'Lead unassigned',
                user_id: req.user.id,
                created_at: new Date()
            });

            await lead.save();

            // Re-populate to get user details in activity logs
            const populatedLead = await Lead.findById(lead._id)
                .populate({ path: 'assigned_to', select: 'name email avatar_url' })
                .populate({ path: 'activity_logs.user_id', select: 'name email avatar_url' });

            res.json({ success: true, data: populatedLead });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /api/leads/:id
 * @desc Update lead
 */
router.put('/:id',
    requireFeature('leads'),
    auditAction('update', 'lead'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const query = { _id: req.params.id };
            if (!req.user?.is_super_admin && req.client?.id) {
                query.client_id = req.client.id;
            }
            const lead = await Lead.findOne(query);
            if (!lead) {
                logger.error(`[LEADS-API] Update - Lead Not Found. ID: ${req.params.id}, Query: ${JSON.stringify(query)}`);
                throw ApiError.notFound('Lead not found');
            }

            const updateData = { ...req.body };
            delete updateData.client_id;
            delete updateData.activity_logs; // Prevent overwriting logs directly

            // Detection for activity logs
            if (updateData.status && updateData.status !== lead.status) {
                lead.activity_logs.push({
                    type: 'status_change',
                    content: `Status updated from ${lead.status} to ${updateData.status}`,
                    old_value: lead.status,
                    new_value: updateData.status,
                    user_id: req.user.id,
                    created_at: new Date()
                });
            }

            if (updateData.stage && updateData.stage !== lead.stage) {
                lead.activity_logs.push({
                    type: 'stage_change',
                    content: `Stage updated from ${lead.stage} to ${updateData.stage}`,
                    old_value: lead.stage,
                    new_value: updateData.stage,
                    user_id: req.user.id,
                    created_at: new Date()
                });
            }

            // General field update log if other major fields change (optional but good)
            const trackedFields = ['name', 'email', 'phone', 'budget_min', 'budget_max', 'location'];
            let changedFields = [];
            trackedFields.forEach(field => {
                if (updateData[field] !== undefined && updateData[field] != lead[field]) {
                    changedFields.push(field);
                }
            });

            if (changedFields.length > 0 && !updateData.status && !updateData.stage) {
                lead.activity_logs.push({
                    type: 'field_update',
                    content: `Updated fields: ${changedFields.join(', ')}`,
                    user_id: req.user.id,
                    created_at: new Date()
                });
            }

            Object.assign(lead, updateData);
            await lead.save();

            // Re-populate to get user details in activity logs
            const populatedLead = await Lead.findById(lead._id)
                .populate({ path: 'assigned_to', select: 'name email avatar_url' })
                .populate({ path: 'activity_logs.user_id', select: 'name email avatar_url' });

            res.json({ success: true, data: populatedLead });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/leads/:id/notes
 * @desc Add a note to a lead
 */
router.post('/:id/notes',
    requireFeature('leads'),
    async (req, res, next) => {
        try {
            ensureClient(req);

            logger.info(`[LEADS-DEBUG] Add Note trigger - User: ${req.user?.email}, ID: ${req.params.id}`);

            const query = { _id: req.params.id };
            if (!req.user?.is_super_admin && req.client?.id) {
                query.client_id = req.client.id;
            }

            logger.info(`[LEADS-DEBUG] Add Note query: ${JSON.stringify(query)}`);

            const lead = await Lead.findOne(query);
            if (!lead) {
                logger.error(`[LEADS-API] Add Note - Lead Not Found. ID: ${req.params.id}, Query: ${JSON.stringify(query)}`);
                throw ApiError.notFound('Lead not found');
            }

            lead.activity_logs.push({
                type: 'note',
                content: req.body.content,
                user_id: req.user.id,
                created_at: new Date()
            });

            await lead.save();
            res.json({ success: true, message: 'Note added' });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/leads/:id
 * @desc Delete lead
 */
router.delete('/:id',
    requireFeature('leads'),
    auditAction('delete', 'lead'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const query = { _id: req.params.id };
            if (!req.user?.is_super_admin && req.client?.id) {
                query.client_id = req.client.id;
            }
            const lead = await Lead.findOne(query);
            if (!lead) {
                logger.error(`[LEADS-API] Delete - Lead Not Found. ID: ${req.params.id}, Query: ${JSON.stringify(query)}`);
                throw ApiError.notFound('Lead not found');
            }

            await lead.deleteOne();
            res.json({ success: true, message: 'Lead deleted' });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
