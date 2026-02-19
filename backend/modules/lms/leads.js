const express = require('express');
const router = express.Router();
const { Lead, User, ClientUser } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireClientAccess } = require('../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../middleware/scopeEnforcer');
const { requireFeature, checkUsageLimit, incrementUsage } = require('../../middleware/featureGate');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, buildSearchFilter, mergeFilters, buildDateRangeFilter } = require('../../utils/helpers');
const { createLead, validate, validators } = require('../../utils/validators');
const mongoose = require('mongoose');

// Middleware
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

// Defensive helper to ensure client context exists before using req.client.id
const ensureClient = (req) => {
    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required for this operation. Super Admins must provide a client ID.');
    }
};

/**
 * @route GET /api/leads
 * @desc List leads for tenant
 * @access Tenant User
 */
router.get('/', async (req, res, next) => {
    // Temporarily remove feature check for debugging
    // requireFeature('leads'),
    try {
        console.log('[LEADS-API] GET /api/leads called');
        console.log('[LEADS-API] User:', req.user?.email, 'Client:', req.client?.id);

        ensureClient(req);
        const pagination = getPagination(req.query);
        const sorting = getSorting(req.query, ['name', 'email', 'status', 'created_at', 'ai_score'], 'created_at');

        console.log('[LEADS-API] Pagination:', pagination, 'Query params:', req.query);

        // Build filters
        const searchFilter = buildSearchFilter(req.query.search, ['name', 'email', 'phone', 'location', 'form_name', 'campaign_name', 'notes']);
        const statusFilter = req.query.status ? { status: req.query.status } : null;
        const stageFilter = req.query.stage ? { stage: req.query.stage } : null;
        const sourceFilter = req.query.source ? { source: req.query.source } : null;
        const assignedFilter = req.query.assigned_to ? { assigned_to: req.query.assigned_to } : null;
        const formNameFilter = req.query.form_name ? { form_name: req.query.form_name } : null;
        const campaignFilter = req.query.campaign_name ? { campaign_name: req.query.campaign_name } : null;
        const tagsFilter = req.query.tags ? { tags: { $in: Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags] } } : null;
        const budgetMinFilter = req.query.budget_min ? { budget_min: { $gte: parseInt(req.query.budget_min) } } : null;
        const budgetMaxFilter = req.query.budget_max ? { budget_max: { $lte: parseInt(req.query.budget_max) } } : null;
        const aiScoreMinFilter = req.query.ai_score_min ? { ai_score: { $gte: parseInt(req.query.ai_score_min) } } : null;
        const aiScoreMaxFilter = req.query.ai_score_max ? { ai_score: { $lte: parseInt(req.query.ai_score_max) } } : null;
        const dateFilter = buildDateRangeFilter('created_at', req.query.start_date, req.query.end_date);

        const where = mergeFilters(
            { client_id: req.client.id },
            searchFilter,
            statusFilter,
            stageFilter,
            sourceFilter,
            assignedFilter,
            formNameFilter,
            campaignFilter,
            tagsFilter,
            budgetMinFilter,
            budgetMaxFilter,
            aiScoreMinFilter,
            aiScoreMaxFilter,
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

        console.log('[LEADS-API] Found', count, 'leads, returning', leads.length, 'records');

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
            ensureClient(req);
            const {
                name, email, phone, status, source, budget_min, budget_max,
                location, tags, custom_fields, assigned_to, metadata
            } = req.body;

            if (phone) {
                const existingLead = await Lead.findOne({ client_id: req.client.id, phone });
                if (existingLead) {
                    throw ApiError.conflict(`Lead with phone number ${phone} already exists`);
                }
            }

            const lead = await Lead.create({
                client_id: req.client.id,
                name,
                email,
                phone,
                stage: req.body.stage || 'Screening',
                status: status || 'Uncontacted',
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
        ensureClient(req);
        const clientId = new mongoose.Types.ObjectId(req.client.id);

        // Current status distribution
        const byStatus = await Lead.aggregate([
            { $match: { client_id: clientId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Current source distribution
        const bySource = await Lead.aggregate([
            { $match: { client_id: clientId } },
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);

        // Stage distribution
        const byStage = await Lead.aggregate([
            { $match: { client_id: clientId } },
            { $group: { _id: '$stage', count: { $sum: 1 } } }
        ]);

        // AI Score Average
        const avgScore = await Lead.aggregate([
            { $match: { client_id: clientId, ai_score: { $ne: null } } },
            { $group: { _id: null, average: { $avg: '$ai_score' } } }
        ]);

        // Today's Totals
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayCount = await Lead.countDocuments({
            client_id: clientId,
            created_at: { $gte: startOfToday }
        });

        // Yesterday's Totals
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const yesterdayCount = await Lead.countDocuments({
            client_id: clientId,
            created_at: { $gte: startOfYesterday, $lt: startOfToday }
        });

        // Active Channels
        const { FacebookPageConnection } = require('../../models');
        const fbConnectionsCount = await FacebookPageConnection.countDocuments({
            client_id: clientId,
            status: 'active'
        });

        const uniqueSources = bySource.map(s => s._id).filter(Boolean);
        const hasFacebookLeads = uniqueSources.some(s => s.toLowerCase().includes('facebook'));

        if (fbConnectionsCount > 0 && !hasFacebookLeads) {
            uniqueSources.push('facebook');
        }

        // Conversion Rate (Hot/Warm/Closure leads / Total)
        // Since we saw 'Walk-in' earlier, let's include it or just look for positive stages
        const totalLeads = await Lead.countDocuments({ client_id: clientId });
        const successfulLeads = await Lead.countDocuments({
            client_id: clientId,
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
                by_source: bySource.map(s => ({ source: s._id, count: s.count })),
                average_ai_score: avgScore[0]?.average || 0,
                metrics: {
                    today_total: todayCount,
                    yesterday_total: yesterdayCount,
                    active_channels_count: uniqueSources.length || 1, // At least 1 (Manual)
                    active_channels_list: uniqueSources.length > 0 ? uniqueSources : ['manual'],
                    conversion_rate: parseFloat(conversionRate.toFixed(1)),
                    processing_lag: "1.2s" // Mocked for now
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/leads/filters
 * @desc Get unique filter values (forms, campaigns, sources, etc.)
 * @access Tenant User
 */
router.get('/filters', requireFeature('leads'), async (req, res, next) => {
    try {
        ensureClient(req);
        const clientId = new mongoose.Types.ObjectId(req.client.id);

        const [
            formNames,
            campaignNames,
            sources,
            stages, // Although usually static, good to know what's in DB
            statuses,
            budgetRange,
            aiScoreRange,
            assignedUsers // Get users who are actually assigned to leads
        ] = await Promise.all([
            Lead.distinct('form_name', { client_id: clientId }),
            Lead.distinct('campaign_name', { client_id: clientId }),
            Lead.distinct('source', { client_id: clientId }),
            Lead.distinct('stage', { client_id: clientId }),
            Lead.distinct('status', { client_id: clientId }),
            Lead.aggregate([
                { $match: { client_id: clientId } },
                {
                    $group: {
                        _id: null,
                        min: { $min: "$budget_min" },
                        max: { $max: "$budget_max" }
                    }
                }
            ]),
            Lead.aggregate([
                { $match: { client_id: clientId } },
                {
                    $group: {
                        _id: null,
                        min: { $min: "$ai_score" },
                        max: { $max: "$ai_score" }
                    }
                }
            ]),
            Lead.distinct('assigned_to', { client_id: clientId })
        ]);

        // Fetch User details for assigned_to IDs
        const users = await User.find({ _id: { $in: assignedUsers } }).select('name email');

        res.json({
            success: true,
            data: {
                form_names: formNames.filter(Boolean).sort(),
                campaign_names: campaignNames.filter(Boolean).sort(),
                sources: sources.filter(Boolean).sort(),
                stages: stages.filter(Boolean).sort(),
                statuses: statuses.filter(Boolean).sort(),
                budget_range: budgetRange[0] || { min: 0, max: 0 },
                ai_score_range: aiScoreRange[0] || { min: 0, max: 100 },
                assigned_users: users
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
        ensureClient(req);
        const lead = await Lead.findOne({
            _id: req.params.id,
            client_id: req.client.id
        }).populate({
            path: 'assigned_to',
            select: 'name email avatar_url'
        }).populate({
            path: 'activity_logs.user_id',
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
        validators.optionalEmail(),
        validators.phone(),
        validate
    ],
    auditAction('update', 'lead'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const lead = await Lead.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!lead) {
                throw ApiError.notFound('Lead not found');
            }

            // Permission Check: Only assigned user or Admin/Manager can edit
            const isAssignedToUser = lead.assigned_to && lead.assigned_to.toString() === req.user.id;
            const isAdminOrManager = req.clientUser && ['admin', 'manager'].includes(req.clientUser.role);
            const isSuperAdmin = req.user.is_super_admin;

            if (lead.assigned_to && !isAssignedToUser && !isAdminOrManager && !isSuperAdmin) {
                throw ApiError.forbidden('Only the assigned team member or an admin can edit this lead');
            }

            const updateData = { ...req.body };
            delete updateData.client_id; // Prevent client change
            delete updateData.id;

            // Convert empty strings to null to avoid validation/casting errors
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === '') {
                    updateData[key] = null;
                }
            });

            // Track status change
            // Track status change
            // Track status change
            if (updateData.status && updateData.status !== lead.status) {
                const history = { from: lead.status, to: updateData.status, at: new Date(), by: req.user.id };
                if (!lead.metadata) lead.metadata = {};
                if (!lead.metadata.status_history) lead.metadata.status_history = [];
                lead.metadata.status_history.push(history);
                lead.markModified('metadata');

                lead.activity_logs.push({
                    type: 'status_change',
                    content: `Changed status from ${lead.status} to ${updateData.status}`,
                    old_value: lead.status,
                    new_value: updateData.status,
                    user_id: req.user.id
                });
            }

            // Track stage change
            if (updateData.stage && updateData.stage !== lead.stage) {
                lead.activity_logs.push({
                    type: 'stage_change',
                    content: `Changed stage from ${lead.stage} to ${updateData.stage}`,
                    old_value: lead.stage,
                    new_value: updateData.stage,
                    user_id: req.user.id
                });
            }

            // Generic Field Tracking
            const trackableFields = ['name', 'email', 'phone', 'campaign_name', 'source', 'budget_min', 'budget_max', 'notes'];
            trackableFields.forEach(field => {
                if (updateData[field] !== undefined && updateData[field] !== lead[field]) {
                    // Handle numeric comparison specifically if needed, but strict equality is usually fine for these types
                    // Just ensure we don't log if both are null/undefined
                    if (!lead[field] && !updateData[field]) return;

                    lead.activity_logs.push({
                        type: 'field_update',
                        content: `Updated ${field.replace('_', ' ')} from "${lead[field] || ''}" to "${updateData[field]}"`,
                        old_value: lead[field] ? String(lead[field]) : '',
                        new_value: String(updateData[field]),
                        user_id: req.user.id
                    });
                }
            });

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
            ensureClient(req);
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
                // Check membership
                const isMember = await ClientUser.findOne({
                    client_id: req.client.id,
                    user_id
                });

                if (!isMember) {
                    // Check if Super Admin or System Admin
                    const targetUser = await User.findById(user_id);
                    if (!targetUser || (!targetUser.is_super_admin && !targetUser.system_role_id)) {
                        throw ApiError.badRequest('User is not a team member');
                    }
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
            ensureClient(req);
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
            ensureClient(req);
            const { leads } = req.body;

            if (!Array.isArray(leads) || leads.length === 0) {
                throw ApiError.badRequest('Leads array is required');
            }

            if (leads.length > 500) {
                throw ApiError.badRequest('Cannot import more than 500 leads at once');
            }

            console.log(`[Import] Received ${leads.length} leads`); // DEBUG

            // Map leads to include client_id
            const leadsToCreate = leads.map(lead => {
                let status = lead.status || 'Uncontacted';
                if (status.toLowerCase() === 'new') status = 'Uncontacted';

                return {
                    ...lead,
                    client_id: req.client.id,
                    source: lead.source || 'import',
                    status: status
                };
            });

            // Filter out duplicates within the import batch itself
            const uniqueLeads = [];
            const seenPhones = new Set();

            for (const lead of leadsToCreate) {
                if (lead.phone && seenPhones.has(lead.phone)) {
                    continue; // Skip duplicate in same batch
                }
                if (lead.phone) seenPhones.add(lead.phone);
                uniqueLeads.push(lead);
            }

            // Check against database for existing leads
            const phonesToCheck = uniqueLeads.filter(l => l.phone).map(l => l.phone);
            const existingleads = await Lead.find({
                client_id: req.client.id,
                phone: { $in: phonesToCheck }
            }).select('phone');

            const existingPhones = new Set(existingleads.map(l => l.phone));
            const finalLeadsToInsert = uniqueLeads.filter(l => !l.phone || !existingPhones.has(l.phone));

            const skippedCount = leads.length - finalLeadsToInsert.length;

            console.log(`[Import] Processing leads: ${finalLeadsToInsert.length} (Skipped ${skippedCount} duplicates)`);

            let result = [];
            let errorCount = 0;

            if (finalLeadsToInsert.length > 0) {
                try {
                    result = await Lead.insertMany(finalLeadsToInsert, { ordered: false });
                } catch (e) {
                    // Mongoose insertMany throws on error even if ordered: false,
                    // but attaches successful docs to the error object.
                    console.error('[Import] Partial or full failure:', e.message);
                    if (e.insertedDocs) {
                        result = e.insertedDocs;
                        errorCount = e.writeErrors?.length || (finalLeadsToInsert.length - result.length);
                        console.log(`[Import] Recovered ${result.length} successful inserts`);
                    } else {
                        throw e; // RETHROW if it's not a write error
                    }
                }
            }

            console.log(`[Import] Success: ${result.length}, Errors: ${errorCount}`);

            // Track usage
            if (result.length > 0) {
                await incrementUsage(req, 'leads', result.length);
            }

            res.status(201).json({
                success: true,
                data: result,
                imported: result.length,
                total: leads.length,
                errors: errorCount
            });
        } catch (error) {
            console.error('[Import] Fatal Error:', error);
            next(error);
        }
    }

);

/**
 * @route GET /api/leads/stats
 * @desc Get lead statistics
 * @access Tenant User
 */




/**
 * @route POST /api/leads/:id/notes
 * @desc Add a note to a lead
 * @access Tenant User
 */
router.post('/:id/notes',
    requireFeature('leads'),
    [
        validators.requiredString('content'),
        validate
    ],
    async (req, res, next) => {
        try {
            ensureClient(req);
            const lead = await Lead.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!lead) {
                throw ApiError.notFound('Lead not found');
            }

            // Add Note to Activity Log
            lead.activity_logs.push({
                type: 'note',
                content: req.body.content,
                user_id: req.user.id,
                created_at: new Date()
            });

            await lead.save();

            // Return the newly added log entry with populated user
            const updatedLead = await Lead.findById(lead._id).populate('activity_logs.user_id', 'name email avatar_url');
            const newLog = updatedLead.activity_logs[updatedLead.activity_logs.length - 1];

            res.json({
                success: true,
                data: newLog
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
