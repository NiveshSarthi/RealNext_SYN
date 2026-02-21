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
const logger = require('../../../config/logger');

// Middleware
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

// Defensive helper to ensure client context exists before using req.client.id
const ensureClient = (req) => {
    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required for this operation. Super Admins must provide a client ID.');
    }
};

/**
 * Helper to sync local leads to external WhatsApp API and get their external IDs
 * @param {Array} localLeadIds - Array of local lead IDs (strings or ObjectIds)
 * @param {String} clientId - Current client ID
 * @returns {Array} - Array of external contact IDs
 */
const syncAudienceContacts = async (localLeadIds, clientId) => {
    if (!localLeadIds || localLeadIds.length === 0) return [];

    console.log(`[DEBUG_SYNC] Resolving ${localLeadIds.length} local leads to external contact IDs for client ${clientId}...`);
    logger.info(`Resolving ${localLeadIds.length} local leads to external contact IDs...`);

    // 1. Fetch leads from local DB
    const leads = await Lead.find({
        _id: { $in: localLeadIds },
        client_id: clientId
    });

    console.log(`[DEBUG_SYNC] Found ${leads.length} leads in database out of ${localLeadIds.length} requested.`);

    if (leads.length === 0) {
        logger.warn('No leads found in database for the selected IDs.');
        return [];
    }

    // 2. Process each lead (syncing if needed)
    const externalIds = [];
    const syncErrors = [];

    for (const lead of leads) {
        try {
            let phone = lead.phone;
            if (!phone) {
                console.log(`[DEBUG_SYNC] Lead ${lead._id} has no phone number. Skipping.`);
                continue;
            }

            // Normalize phone: strip non-digits
            phone = phone.toString().replace(/\D/g, '');

            // Assume 10-digit number is Indian (common context here) and needs 91 prefix
            if (phone.length === 10) {
                phone = '91' + phone;
            }

            console.log(`[DEBUG_SYNC] Processing lead ${lead._id}: Name="${lead.name}", OriginalPhone="${lead.phone}", NormalizedPhone="${phone}"`);

            // Check if already synced (cached in metadata)
            if (lead.metadata?.external_contact_id) {
                console.log(`[DEBUG_SYNC] Lead ${lead._id} already synced with ID: ${lead.metadata.external_contact_id}`);
                externalIds.push(lead.metadata.external_contact_id);
                continue;
            }

            // Sanitize tags to ensure they are strings
            const sanitizerTags = Array.isArray(lead.tags)
                ? lead.tags.filter(t => typeof t === 'string' && t.trim() !== '')
                : ['lead'];

            const contactPayload = {
                name: lead.name || 'Unknown Contact',
                number: phone,
                tags: sanitizerTags.length > 0 ? sanitizerTags : ['lead']
            };

            const extContact = await waService.createContact(contactPayload);

            console.log(`[DEBUG_SYNC] Sync Contact Response for ${phone}:`, JSON.stringify(extContact));

            // Wide extraction strategy: check for id in various nesting levels
            const extId = extContact?.id ||
                extContact?.data?.id ||
                extContact?._id ||
                extContact?.data?._id ||
                extContact?.contact?.id ||
                extContact?.data?.contact?.id;

            if (extId) {
                console.log(`[DEBUG_SYNC] Successfully resolved to external ID: ${extId}`);
                // Save external_id for future use
                if (!lead.metadata) lead.metadata = {};
                lead.metadata.external_contact_id = extId;
                lead.markModified('metadata');
                await lead.save();

                externalIds.push(extId.toString());
            } else {
                console.log(`[DEBUG_SYNC] FAILED: No ID extracted from response for ${phone}`);
                logger.warn(`Could not extract external ID for lead ${phone}`);
            }
        } catch (error) {
            // Capture specific error details from external API
            const errorMsg = error.response?.data?.detail ||
                error.response?.data?.message ||
                (error.response?.data ? JSON.stringify(error.response.data) : error.message);
            console.error(`[DEBUG_SYNC] ERROR syncing lead ${lead._id}:`, errorMsg);
            if (error.response?.data) {
                console.error(`[DEBUG_SYNC] Response data:`, JSON.stringify(error.response.data));
            }
            logger.error(`Failed to sync lead ${lead._id} to external API: ${error.message}`);
            syncErrors.push(errorMsg);
        }
    }

    // Check if we failed completely
    if (externalIds.length === 0 && leads.length > 0) {
        // Collect distinct error messages to give a hint
        const errors = [...new Set(syncErrors)];
        const errorSummary = errors.slice(0, 2).join('; '); // Show first 2 unique errors
        throw new Error(`Sync failed for all ${leads.length} leads. Errors: ${errorSummary || 'No errors captured (likely invalid phone numbers)'}`);
    }

    console.log(`[DEBUG_SYNC] Summary: Successfully resolved ${externalIds.length} of ${leads.length} leads.`);
    logger.info(`Successfully resolved ${externalIds.length} external contact IDs.`);
    return externalIds;
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

        // 1. Fetch Local Campaigns (for SaaS metadata/owner info)
        const campaigns = await Campaign.find(where)
            .sort(sorting)
            .limit(pagination.limit)
            .skip(pagination.offset);

        const count = await Campaign.countDocuments(where);

        // 2. Fetch External Campaigns
        let externalCampaigns = [];
        try {
            const extResponse = await waService.getCampaigns({ limit: pagination.limit });
            console.log(`[DEBUG_CAMPAIGN] Raw External Response Type: ${typeof extResponse}`);
            console.log(`[DEBUG_CAMPAIGN] Raw External Response Keys:`, extResponse ? Object.keys(extResponse) : 'null');

            externalCampaigns = Array.isArray(extResponse) ? extResponse : (extResponse?.data || extResponse?.result || []);
            if (!Array.isArray(externalCampaigns)) externalCampaigns = [];
            console.log(`[DEBUG_CAMPAIGN] Extracted ${externalCampaigns.length} external campaigns.`);
        } catch (extError) {
            const errorMsg = extError.response?.data?.message || extError.message;
            console.error(`[DEBUG_CAMPAIGN] Failed to fetch external campaigns: ${errorMsg}`);
            logger.error(`Failed to fetch external campaigns: ${errorMsg}`);
        }

        // 3. Merge Strategy:
        // - Start with external campaigns (Source of Truth)
        // - Add local campaigns that DON'T have an external_id yet (Drafts)

        const mergedCampaigns = externalCampaigns.map(ext => {
            const local = campaigns.find(loc =>
                (loc.metadata?.external_id && (loc.metadata.external_id === ext._id || loc.metadata.external_id === ext.id))
            );
            return {
                ...ext,
                _id: ext._id || ext.id,
                local_id: local?._id,
                name: ext.name || local?.name || ext.template_name || 'Untitled Campaign',
                total_contacts: ext.total_contacts || ext.contacts || ext.recipient_count || local?.target_audience?.include?.length || 0,
                created_by_name: local?.created_by ? 'RealNexT User' : 'External System',
                is_external: true
            };
        });

        // Add local drafts group that aren't in the external list yet
        campaigns.forEach(loc => {
            const isSynced = mergedCampaigns.some(m => m.local_id?.toString() === loc._id.toString());
            if (!isSynced) {
                mergedCampaigns.push({
                    ...loc.toObject(),
                    _id: loc._id,
                    total_contacts: loc.target_audience?.include?.length || 0,
                    is_external: false,
                    is_local_draft: true
                });
            }
        });

        // Sort by created_at desc (if available, else fallback)
        mergedCampaigns.sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt || 0);
            const dateB = new Date(b.created_at || b.createdAt || 0);
            return dateB - dateA;
        });

        res.json({
            success: true,
            data: mergedCampaigns,
            count: mergedCampaigns.length,
            pagination
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
                    let validContactIds = [];

                    if (target_audience?.type === 'all') {
                        console.log(`[DEBUG_CAMPAIGN] Expanding 'all' audience for client ${req.client.id}`);
                        const allLeads = await Lead.find({ client_id: req.client.id }).select('_id');
                        validContactIds = allLeads.map(l => l._id.toString());
                        console.log(`[DEBUG_CAMPAIGN] expanded 'all' to ${validContactIds.length} contacts`);
                    } else {
                        const contactIds = target_audience?.include || [];
                        validContactIds = contactIds
                            .filter(id => id && (typeof id === 'string' || typeof id === 'object'))
                            .map(id => id.toString());
                    }

                    if (validContactIds.length === 0) {
                        throw new Error('No valid contact IDs provided or found for this audience.');
                    }

                    console.log(`[DEBUG_CAMPAIGN] Validating ${validContactIds.length} contact IDs for client ${req.client.id}`);
                    const syncedContactIds = await syncAudienceContacts(validContactIds, req.client.id);
                    console.log(`[DEBUG_CAMPAIGN] Synced ${syncedContactIds.length} contact IDs`);

                    if (syncedContactIds.length === 0) {
                        console.error(`[DEBUG_CAMPAIGN] SYNC FAILED: No leads found in DB for the provided IDs or they belong to a different client.`);
                        throw ApiError.badRequest('None of the selected leads could be successfully synced with the WhatsApp service. Please check lead phone numbers.');
                    }

                    const externalPayload = {
                        template_name,
                        language_code: template_data?.language_code || 'en_US',
                        contact_ids: syncedContactIds,
                        variable_mapping: template_data?.variable_mapping || {},
                        schedule_time: scheduled_at ? new Date(scheduled_at).toISOString() : null
                    };

                    console.log(`[DEBUG_CAMPAIGN] Triggering External Service with payload:`, JSON.stringify(externalPayload, null, 2));
                    logger.info(`Triggering external campaign for ${campaign._id} with ${validContactIds.length} contacts`);

                    const externalResponse = await waService.createCampaign(externalPayload);
                    console.log(`[DEBUG_CAMPAIGN] External Success:`, JSON.stringify(externalResponse));

                    // Update local campaign with external ID if available
                    if (externalResponse && externalResponse.id) {
                        campaign.metadata = { ...campaign.metadata, external_id: externalResponse.id };
                    }

                    await campaign.save();
                    console.log(`[DEBUG_CAMPAIGN] Status updated to ${targetStatus}`);
                } catch (extError) {
                    const errorMessage = extError.response?.data?.message || extError.message;
                    const errorDetails = extError.response?.data ? JSON.stringify(extError.response.data) : null;

                    console.log(`[DEBUG_CAMPAIGN] External Error: ${errorMessage}`);
                    if (errorDetails) {
                        console.log(`[DEBUG_CAMPAIGN] External Error Details:`, errorDetails);
                    }

                    logger.error(`External API trigger failed for campaign ${campaign._id}:`, {
                        message: errorMessage,
                        details: errorDetails,
                        stack: extError.stack,
                        response: extError.response?.data
                    });

                    // Fallback status
                    campaign.status = 'failed';
                    campaign.metadata = { ...campaign.metadata, error: errorMessage, error_details: errorDetails };
                    await campaign.save();

                    // Throw error to be caught by the outer catch and sent to frontend
                    const descriptiveError = errorDetails
                        ? `WhatsApp API Error: ${errorMessage} - ${errorDetails}`
                        : `WhatsApp API Error: ${errorMessage}`;

                    throw ApiError.badRequest(descriptiveError);
                }
            } else {
                await campaign.save();
                console.log(`[DEBUG_CAMPAIGN] Draft saved: ${campaign._id}`);
            }

            await incrementUsage(req, 'campaigns');

            res.status(201).json({
                success: true,
                message: targetStatus === 'draft' ? 'Campaign saved as draft' : 'Campaign launched successfully',
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
        const localCampaign = await Campaign.findOne({
            _id: req.params.id,
            client_id: req.client.id
        });

        let data = localCampaign ? localCampaign.toObject() : null;

        // If local has external ID, fetch live stats and details
        if (data && data.metadata?.external_id) {
            try {
                const [liveData, logs] = await Promise.all([
                    waService.getCampaignDetail(data.metadata.external_id).catch(() => ({})),
                    waService.getCampaignLogs(data.metadata.external_id).catch(() => [])
                ]);

                // Normalize liveData (if it's an array, it's malformed or a log response)
                const normalizedLive = Array.isArray(liveData) ? {} : (liveData.data || liveData);

                data = {
                    ...data,
                    ...normalizedLive,
                    logs: logs,
                    stats: normalizedLive.stats || data.stats,
                    // Ensure local status takes precedence if live status is missing or 'FAILED' (standardize case)
                    status: (normalizedLive.status || data.status || 'draft').toLowerCase()
                };
            } catch (err) {
                console.error('Failed to fetch live stats:', err.message);
            }
        } else if (!localCampaign) {
            // Try fetching directly as external ID
            try {
                const [liveData, logs] = await Promise.all([
                    waService.getCampaignDetail(req.params.id),
                    waService.getCampaignLogs(req.params.id)
                ]);

                // Normalize
                const normalizedLive = Array.isArray(liveData) ? {} : (liveData.data || liveData);

                data = {
                    ...normalizedLive,
                    logs,
                    _id: req.params.id,
                    is_external_only: true,
                    status: (normalizedLive.status || 'completed').toLowerCase()
                };
            } catch (err) {
                throw ApiError.notFound('Campaign not found local or external');
            }
        }

        res.json({
            success: true,
            data
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
                paused: ['running', 'cancelled'],
                failed: ['running', 'cancelled']
            };

            if (!validTransitions[campaign.status]?.includes(status)) {
                throw ApiError.badRequest(`Cannot change status from ${campaign.status} to ${status}`);
            }

            const updateData = { status };

            if (status === 'running' && !campaign.started_at) {
                updateData.started_at = now;

                // TRIGGER EXTERNAL API IF NOT ALREADY SYNCED
                if (!campaign.metadata?.external_id) {
                    try {
                        console.log(`[DEBUG_CAMPAIGN] Launching local campaign ${campaign._id} to external API`);
                        let validContactIds = [];

                        if (campaign.target_audience?.type === 'all') {
                            console.log(`[DEBUG_CAMPAIGN] Expanding 'all' audience for campaign ${campaign._id} (client: ${req.client.id})`);
                            const allLeads = await Lead.find({ client_id: req.client.id }).select('_id');
                            validContactIds = allLeads.map(l => l._id.toString());
                            console.log(`[DEBUG_CAMPAIGN] expanded 'all' to ${validContactIds.length} contacts`);
                        } else {
                            const contactIds = campaign.target_audience?.include || [];
                            validContactIds = contactIds
                                .filter(id => id && (typeof id === 'string' || typeof id === 'object'))
                                .map(id => id.toString());
                        }

                        if (validContactIds.length === 0) {
                            throw new Error('No valid contact IDs found for this campaign.');
                        }

                        const syncedContactIds = await syncAudienceContacts(validContactIds, req.client.id);

                        if (syncedContactIds.length === 0) {
                            // The error is already thrown inside syncAudienceContacts if all failed, 
                            // but if it returned empty for other reasons (e.g. no valid phones), catch here.
                            throw ApiError.badRequest('None of the selected leads could be successfully synced. Please check if leads have valid phone numbers.');
                        }

                        const externalPayload = {
                            template_name: campaign.template_name,
                            language_code: campaign.template_data?.language_code || 'en_US',
                            contact_ids: syncedContactIds,
                            variable_mapping: campaign.template_data?.variable_mapping || {},
                            schedule_time: null // Immediate
                        };

                        console.log(`[DEBUG_CAMPAIGN] Triggering External Service via Status Update with payload:`, JSON.stringify(externalPayload, null, 2));
                        logger.info(`Triggering external campaign for ${campaign._id} on status change with ${validContactIds.length} contacts`);

                        const externalResponse = await waService.createCampaign(externalPayload);
                        console.log(`[DEBUG_CAMPAIGN] External Success:`, JSON.stringify(externalResponse));

                        if (externalResponse && (externalResponse.id || externalResponse.campaign_id)) {
                            const extId = externalResponse.id || externalResponse.campaign_id;
                            updateData.metadata = { ...campaign.metadata, external_id: extId };
                        }
                    } catch (extError) {
                        const errorMessage = extError.response?.data?.message || extError.message;
                        const errorDetails = extError.response?.data ? JSON.stringify(extError.response.data) : null;

                        console.error('Failed to trigger external campaign on status update:', errorMessage);
                        if (errorDetails) {
                            console.error(`[DEBUG_CAMPAIGN] External Error Details:`, errorDetails);
                        }

                        logger.error(`External API trigger failed for campaign ${campaign._id} on status update:`, {
                            message: errorMessage,
                            details: errorDetails,
                            stack: extError.stack,
                            response: extError.response?.data
                        });

                        // Throw badRequest to be caught by the outer catch and sent to frontend
                        const descriptiveError = errorDetails
                            ? `WhatsApp API Error: ${errorMessage} - ${errorDetails}`
                            : `WhatsApp API Error: ${errorMessage}`;

                        throw ApiError.badRequest(descriptiveError);
                    }
                }
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
            delivery_rate: (((stats.delivered || 0) / total) * 100).toFixed(2),
            read_rate: (((stats.read || 0) / total) * 100).toFixed(2),
            reply_rate: (((stats.replied || 0) / total) * 100).toFixed(2),
            failure_rate: (((stats.failed || 0) / total) * 100).toFixed(2)
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
