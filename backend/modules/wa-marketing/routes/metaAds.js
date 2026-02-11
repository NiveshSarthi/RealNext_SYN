

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../../../middleware/auth');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const { requireFeature } = require('../../../middleware/featureGate');
const { auditAction } = require('../../../middleware/auditLogger');
const { ApiError } = require('../../../middleware/errorHandler');
const logger = require('../../../config/logger');
const { FacebookPageConnection, FacebookLeadForm, Lead } = require('../../../models');

// Middleware
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

// Defensive helper to ensure client context exists before using req.client.id
const ensureClient = (req) => {
    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required for this operation. Super Admins must provide a client ID.');
    }
};

const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * @route POST /api/meta-ads/connect
 * @desc Connect Facebook Account & Fetch Pages
 */
router.post('/connect', requireFeature('meta_ads'), async (req, res, next) => {
    // const t = await sequelize.transaction();
    try {
        ensureClient(req);
        const { user_token } = req.body;
        if (!user_token) throw new ApiError(400, 'User Access Token is required');

        // 1. Fetch Pages this user manages
        const response = await axios.get(`${GRAPH_API_URL}/me/accounts`, {
            params: {
                access_token: user_token,
                fields: 'id,name,access_token,tasks',
                limit: 100
            }
        });

        const pages = response.data.data || [];
        const connectedPages = [];

        for (const page of pages) {
            // Upsert Page Connection
            const [connection] = await FacebookPageConnection.upsert({
                client_id: req.client.id,
                page_id: page.id,
                page_name: page.name,
                access_token: page.access_token, // Page Access Token
                status: 'active',
                last_sync_at: new Date()
            });
            connectedPages.push(connection);
        }

        // await t.commit();

        res.json({
            success: true,
            message: `Connected ${connectedPages.length} pages`,
            data: connectedPages
        });
    } catch (error) {
        // await t.rollback();
        // Handle Graph API errors
        if (error.response?.data?.error) {
            return next(new ApiError(400, `Facebook API Error: ${error.response.data.error.message}`));
        }
        next(error);
    }
});

/**
 * @route GET /api/meta-ads/pages
 * @desc Get connected pages
 */
router.get('/pages', requireFeature('meta_ads'), async (req, res, next) => {
    try {
        ensureClient(req);
        const pages = await FacebookPageConnection.findAll({
            where: { client_id: req.client.id },
            include: [{ model: FacebookLeadForm, as: 'leadForms' }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: pages });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/meta-ads/sync-forms
 * @desc Fetch Lead Forms for all active pages
 */
router.post('/sync-forms', requireFeature('meta_ads'), async (req, res, next) => {
    try {
        ensureClient(req);
        const pages = await FacebookPageConnection.findAll({
            where: { client_id: req.client.id, status: 'active' }
        });

        let newFormsCount = 0;

        for (const page of pages) {
            try {
                const response = await axios.get(`${GRAPH_API_URL}/${page.page_id}/leadgen_forms`, {
                    params: {
                        access_token: page.access_token,
                        fields: 'id,name,status,leads_count',
                        limit: 100
                    }
                });

                const forms = response.data.data || [];
                for (const form of forms) {
                    if (form.status === 'ACTIVE') {
                        const [savedForm, created] = await FacebookLeadForm.findOrCreate({
                            where: {
                                client_id: req.client.id,
                                form_id: form.id
                            },
                            defaults: {
                                page_connection_id: page.id,
                                name: form.name,
                                status: 'active'
                            }
                        });
                        if (created) newFormsCount++;
                    }
                }
            } catch (pageError) {
                logger.error(`Failed to sync forms for page ${page.page_name}: ${pageError.message}`);
                // Continue to next page even if one fails
            }
        }

        res.json({ success: true, new_forms: newFormsCount, message: 'Forms synced successfully' });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/meta-ads/fetch-leads
 * @desc Manually fetch leads from forms
 */
router.post('/fetch-leads', requireFeature('meta_ads'), async (req, res, next) => {
    try {
        ensureClient(req);
        const forms = await FacebookLeadForm.findAll({
            where: { client_id: req.client.id, status: 'active' },
            include: [{ model: FacebookPageConnection, as: 'pageConnection' }]
        });

        let newLeadsCount = 0;
        let skippedCount = 0;

        for (const form of forms) {
            try {
                if (!form.pageConnection || !form.pageConnection.access_token) continue;

                // Skip if lead sync is disabled for this page
                if (!form.pageConnection.is_lead_sync_enabled) {
                    logger.info(`Skipping form ${form.name} - sync disabled for page ${form.pageConnection.page_name}`);
                    continue;
                }

                let nextUrl = `${GRAPH_API_URL}/${form.form_id}/leads?access_token=${form.pageConnection.access_token}&fields=id,created_time,field_data&limit=100`;
                let pageCount = 0;
                const MAX_PAGES = 20; // Fetch up to 2000 leads max per sync to avoid timeout

                while (nextUrl && pageCount < MAX_PAGES) {
                    const response = await axios.get(nextUrl);
                    const leads = response.data.data || [];

                    // Update nextUrl for pagination
                    nextUrl = response.data.paging?.next;
                    pageCount++;
                    for (const leadData of leads) {
                        // Normalize Field Data
                        // field_data is [{ name: 'email', values: ['...'] }, ...]
                        const emailField = leadData.field_data.find(f => f.name.includes('email'))?.values[0];
                        const phoneField = leadData.field_data.find(f => f.name.includes('phone') || f.name.includes('number'))?.values[0];
                        const nameField = leadData.field_data.find(f => f.name.includes('name') || f.name.includes('full_name'))?.values[0];

                        if (!phoneField && !emailField) continue; // Skip empty leads

                        // Check if lead exists (deduplication)
                        const existingLead = await Lead.findOne({
                            client_id: req.client.id,
                            $or: [
                                { phone: phoneField || 'N/A' },
                                { email: emailField || 'N/A' }
                            ]
                        });

                        if (!existingLead) {
                            await Lead.create({
                                client_id: req.client.id,
                                name: nameField || 'Facebook Lead',
                                email: emailField,
                                phone: phoneField,
                                source: 'Facebook Ads',
                                status: 'new',
                                metadata: {
                                    facebook_lead_id: leadData.id,
                                    form_id: form.form_id,
                                    page_id: form.pageConnection.page_id
                                }
                            });
                            newLeadsCount++;
                        } else {
                            skippedCount++;
                        }
                    }
                }
            } catch (formError) {
                logger.error(`Failed to fetch leads from form ${form.name}: ${formError.message}`);
                // Continue
            }
        }

        res.json({
            success: true,
            newLeadsCreated: newLeadsCount,
            duplicatesSkipped: skippedCount
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PATCH /api/meta-ads/pages/:pageId/toggle-sync
 * @desc Toggle lead sync for a specific page
 */
router.patch('/pages/:pageId/toggle-sync', requireFeature('meta_ads'), async (req, res, next) => {
    try {
        ensureClient(req);
        const { pageId } = req.params;
        const { is_enabled } = req.body;

        if (typeof is_enabled !== 'boolean') {
            throw ApiError.badRequest('is_enabled must be a boolean');
        }

        const page = await FacebookPageConnection.findOne({
            where: {
                id: pageId,
                client_id: req.client.id
            }
        });

        if (!page) {
            throw ApiError.notFound('Page connection not found');
        }

        page.is_lead_sync_enabled = is_enabled;
        await page.save();

        logger.info(`Lead sync ${is_enabled ? 'enabled' : 'disabled'} for page ${page.page_name} (client: ${req.client.id})`);

        res.json({
            success: true,
            message: `Lead sync ${is_enabled ? 'enabled' : 'disabled'} for ${page.page_name}`,
            data: page
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/meta-ads/webhook
 * @desc Facebook Webhook Verification
 */
router.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'your_verify_token_here';

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verified');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

/**
 * @route POST /api/meta-ads/webhook
 * @desc Receive Facebook Lead Webhooks
 */
router.post('/webhook', async (req, res) => {
    try {
        const body = req.body;

        // Respond to Facebook immediately
        res.status(200).send('EVENT_RECEIVED');

        // Process webhook asynchronously
        if (body.object === 'page') {
            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    if (change.field === 'leadgen') {
                        const leadgenId = change.value.leadgen_id;
                        const pageId = change.value.page_id;
                        const formId = change.value.form_id;

                        logger.info(`📩 Webhook received: Lead ${leadgenId} from page ${pageId}, form ${formId}`);

                        // Find the page connection
                        const pageConnection = await FacebookPageConnection.findOne({
                            where: { page_id: pageId }
                        });

                        if (!pageConnection) {
                            logger.warn(`Page ${pageId} not connected in our system`);
                            continue;
                        }

                        // Check if lead sync is enabled for this page
                        if (!pageConnection.is_lead_sync_enabled) {
                            logger.info(`⏭️ Skipping lead ${leadgenId} - sync disabled for page ${pageConnection.page_name}`);
                            continue;
                        }

                        // Find the form
                        const leadForm = await FacebookLeadForm.findOne({
                            where: { form_id: formId }
                        });

                        if (!leadForm) {
                            logger.warn(`Form ${formId} not found in our system`);
                            continue;
                        }

                        // Fetch lead data from Facebook
                        try {
                            const leadResponse = await axios.get(`${GRAPH_API_URL}/${leadgenId}`, {
                                params: {
                                    access_token: pageConnection.access_token,
                                    fields: 'id,created_time,field_data'
                                }
                            });

                            const leadData = leadResponse.data;
                            const fieldData = leadData.field_data || [];

                            // Extract fields
                            const emailField = fieldData.find(f => f.name.includes('email'))?.values[0];
                            const phoneField = fieldData.find(f => f.name.includes('phone') || f.name.includes('number'))?.values[0];
                            const nameField = fieldData.find(f => f.name.includes('name') || f.name.includes('full_name'))?.values[0];

                            if (!phoneField && !emailField) {
                                logger.warn(`Lead ${leadgenId} has no phone or email, skipping`);
                                continue;
                            }

                            // Check for duplicates
                            const existingLead = await Lead.findOne({
                                client_id: pageConnection.client_id,
                                $or: [
                                    { phone: phoneField || 'N/A' },
                                    { email: emailField || 'N/A' }
                                ]
                            });

                            if (existingLead) {
                                logger.info(`Lead ${leadgenId} already exists (${existingLead.name}), skipping`);
                                continue;
                            }

                            // Create the lead
                            const newLead = await Lead.create({
                                client_id: pageConnection.client_id,
                                name: nameField || 'Facebook Lead',
                                email: emailField,
                                phone: phoneField,
                                source: 'Facebook Ads',
                                status: 'new',
                                metadata: {
                                    facebook_lead_id: leadgenId,
                                    form_id: formId,
                                    page_id: pageId,
                                    webhook_received_at: new Date()
                                }
                            });

                            logger.info(`✅ Created lead: ${newLead.name} (ID: ${newLead.id})`);

                            // Update form lead count
                            await leadForm.increment('lead_count');
                            await leadForm.update({ last_lead_fetched_at: new Date() });

                        } catch (fetchError) {
                            logger.error(`Failed to fetch lead ${leadgenId}: ${fetchError.message}`);
                        }
                    }
                }
            }
        }
    } catch (error) {
        logger.error('Webhook processing error:', error);
        // Don't throw - we already responded to Facebook
    }
});

// Other endpoints (Analytics, etc.) could be added here similar to before
// Keeping the original structure for analytics if it's still needed, or removing if strictly replacing.
// I will keep a minimal analytics endpoint for the UI to not break.

router.get('/analytics', async (req, res) => {
    res.json({ success: true, data: { status: 'Real analytics not yet implemented, use fetched leads.' } });
});

module.exports = router;

