const express = require('express');
const router = express.Router();
const { Campaign, Template, Lead } = require('../../../models');
const { authenticate } = require('../../../middleware/auth');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const { requireFeature, checkUsageLimit, incrementUsage } = require('../../../middleware/featureGate');
const { auditAction } = require('../../../middleware/auditLogger');
const { ApiError } = require('../../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, mergeFilters } = require('../../../utils/helpers');
const { createCampaign, validate, validators } = require('../../../utils/validators');
const waService = require('../../../services/waService');

// Middleware
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

// Defensive helper to ensure client context exists before using req.client.id
const ensureClient = (req) => {
    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required for this operation. Super Admins must provide a client ID.');
    }
};

/**
 * @route GET /api/campaigns
 * @desc List campaigns
 * @access Tenant User
 */
router.get('/', requireFeature('campaigns'), async (req, res, next) => {
    try {
        ensureClient(req);
        const pagination = getPagination(req.query);
        const sorting = getSorting(req.query, ['name', 'status', 'type', 'created_at', 'scheduled_at'], 'created_at');

        const statusFilter = req.query.status ? { status: req.query.status } : null;
        const typeFilter = req.query.type ? { type: req.query.type } : null;

        const where = mergeFilters(
            { client_id: req.client.id },
            statusFilter,
            typeFilter
        );

        const campaigns = await Campaign.find(where)
            .sort(sorting)
            .limit(pagination.limit)
            .skip(pagination.offset);

        const count = await Campaign.countDocuments(where);

        res.json({
            success: true,
            ...getPaginatedResponse(campaigns, count, pagination)
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/campaigns
 * @desc Create new campaign
 * @access Tenant User
 */
router.post('/',
    requireFeature('campaigns'),
    checkUsageLimit('campaigns', 'max_campaigns_month'),
    createCampaign,
    auditAction('create', 'campaign'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const {
                name, type, template_name, template_data,
                target_audience, scheduled_at, metadata
            } = req.body;

            // 1. Create Local Campaign
            const campaign = await Campaign.create({
                client_id: req.client.id,
                name,
                type: type || 'broadcast',
                status: 'draft', // Start as draft
                template_name,
                template_data: template_data || {},
                target_audience: target_audience || {},
                scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
                created_by: req.user.id,
                metadata: metadata || {}
            });

            // 2. Trigger External API if launching
            // Check if user intends to launch (immediate or scheduled)
            // Ideally we check a flag or status in body, but based on new.js payload:
            // if scheduled_at is null -> immediate -> running
            // if scheduled_at is set -> scheduled

            let targetStatus = 'draft';
            if (scheduled_at) {
                targetStatus = 'scheduled';
            } else if (!scheduled_at) {
                targetStatus = 'running';
            }

            console.log(`[DEBUG_CAMPAIGN] ID: ${campaign._id}, InitialStatus: draft, Target: ${targetStatus}, Sched: ${scheduled_at}`);

            // Only trigger if we are "launching" (not just saving draft, though front-end only keeps launch button)
            if (targetStatus !== 'draft') {
                try {
                    const contactIds = target_audience?.include || [];
                    console.log(`[DEBUG_CAMPAIGN] Contacts: ${contactIds.length}`);

                    if (contactIds.length > 0) {
                        const externalPayload = {
                            template_name,
                            language_code: template_data?.language_code || 'en_US',
                            contact_ids: contactIds,
                            variable_mapping: template_data?.variable_mapping || {},
                            schedule_time: scheduled_at ? new Date(scheduled_at).toISOString() : null
                        };

                        console.log(`[DEBUG_CAMPAIGN] Triggering External Service...`);
                        logger.info(`Triggering external campaign for ${campaign._id}`);
                        const externalResponse = await waService.createCampaign(externalPayload);
                        console.log(`[DEBUG_CAMPAIGN] External Success: ${JSON.stringify(externalResponse)}`);

                        // Update local campaign with external ID if available
                        if (externalResponse && externalResponse.id) {
                            campaign.metadata = { ...campaign.metadata, external_id: externalResponse.id };
                        }

                        campaign.status = targetStatus;
                        if (targetStatus === 'running') campaign.started_at = new Date();
                        await campaign.save();
                        console.log(`[DEBUG_CAMPAIGN] Status updated to ${targetStatus}`);
                    } else {
                        console.log(`[DEBUG_CAMPAIGN] No contacts. Skipping.`);
                    }
                } catch (extError) {
                    console.log(`[DEBUG_CAMPAIGN] External Error: ${extError.message}`);
                    logger.error(`External API trigger failed for campaign ${campaign._id}:`, extError);
                    // Fallback status
                    campaign.status = 'failed';
                    campaign.metadata = { ...campaign.metadata, error: extError.message };
                    await campaign.save();
                    // We catch but don't fail the request completely so user sees "Failed" status in UI
                }
            }

            await incrementUsage(req, 'campaigns');

            res.status(201).json({
                success: true,
                data: campaign
            });
        } catch (error) {
            next(error);
        }
    });

/**
 * @route GET /api/campaigns/:id
 * @desc Get campaign details
 * @access Tenant User
 */
router.get('/:id', requireFeature('campaigns'), async (req, res, next) => {
    try {
        ensureClient(req);
        const campaign = await Campaign.findOne({
            _id: req.params.id,
            client_id: req.client.id
        });

        if (!campaign) {
            throw ApiError.notFound('Campaign not found');
        }

        res.json({
            success: true,
            data: campaign
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/campaigns/:id
 * @desc Update campaign
 * @access Tenant User
 */
router.put('/:id',
    requireFeature('campaigns'),
    auditAction('update', 'campaign'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const campaign = await Campaign.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found');
            }

            if (['running', 'completed'].includes(campaign.status)) {
                throw ApiError.badRequest('Cannot edit a running or completed campaign');
            }

            const updateData = { ...req.body };
            delete updateData.client_id;
            delete updateData.id;
            delete updateData.stats; // Don't allow direct stats modification

            Object.assign(campaign, updateData);
            await campaign.save();

            res.json({
                success: true,
                data: campaign
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /api/campaigns/:id/status
 * @desc Change campaign status (start, pause, cancel)
 * @access Tenant User
 */
router.put('/:id/status',
    requireFeature('campaigns'),
    [validators.enum('status', ['scheduled', 'running', 'paused', 'cancelled']), validate],
    auditAction('update_status', 'campaign'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const campaign = await Campaign.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found');
            }

            const { status } = req.body;
            const now = new Date();

            // Validate status transitions
            const validTransitions = {
                draft: ['scheduled', 'running'],
                scheduled: ['running', 'cancelled'],
                running: ['paused', 'cancelled', 'completed'],
                paused: ['running', 'cancelled']
            };

            if (!validTransitions[campaign.status]?.includes(status)) {
                throw ApiError.badRequest(`Cannot change status from ${campaign.status} to ${status}`);
            }

            const updateData = { status };

            if (status === 'running' && !campaign.started_at) {
                updateData.started_at = now;
            }

            if (['completed', 'cancelled'].includes(status)) {
                updateData.completed_at = now;
            }

            Object.assign(campaign, updateData);
            await campaign.save();

            res.json({
                success: true,
                data: campaign
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/campaigns/:id
 * @desc Delete campaign
 * @access Tenant User
 */
router.delete('/:id',
    requireFeature('campaigns'),
    auditAction('delete', 'campaign'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const campaign = await Campaign.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found');
            }

            if (campaign.status === 'running') {
                throw ApiError.badRequest('Cannot delete a running campaign');
            }

            await campaign.deleteOne();

            res.json({
                success: true,
                message: 'Campaign deleted'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/campaigns/:id/stats
 * @desc Get campaign statistics
 * @access Tenant User
 */
router.get('/:id/stats', requireFeature('campaigns'), async (req, res, next) => {
    try {
        ensureClient(req);
        const campaign = await Campaign.findOne({
            _id: req.params.id,
            client_id: req.client.id
        });

        if (!campaign) {
            throw ApiError.notFound('Campaign not found');
        }

        const stats = campaign.stats || { sent: 0, delivered: 0, read: 0, failed: 0, replied: 0 };

        // Calculate rates
        const total = stats.sent || 1;
        const rates = {
            delivery_rate: ((stats.delivered / total) * 100).toFixed(2),
            read_rate: ((stats.read / total) * 100).toFixed(2),
            reply_rate: ((stats.replied / total) * 100).toFixed(2),
            failure_rate: ((stats.failed / total) * 100).toFixed(2)
        };

        res.json({
            success: true,
            data: {
                ...stats,
                ...rates
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
