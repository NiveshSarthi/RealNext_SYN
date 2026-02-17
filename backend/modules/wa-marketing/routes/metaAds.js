

const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { authenticate } = require('../../../middleware/auth');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const { requireFeature } = require('../../../middleware/featureGate');
const { auditAction } = require('../../../middleware/auditLogger');
const { ApiError } = require('../../../middleware/errorHandler');
const logger = require('../../../config/logger');
const { FacebookPageConnection, FacebookLeadForm, Lead } = require('../../../models');

// Flexible field extraction function
function extractLeadFields(fieldData) {
  const extracted = {
    name: null,
    email: null,
    phone: null,
    location: null,
    budget: null
  };

  if (!fieldData || !Array.isArray(fieldData)) {
    return extracted;
  }

  // Define field patterns (case-insensitive, partial matches)
  const patterns = {
    name: [
      /^full\s*name$/i,
      /^name$/i,
      /^first\s*name$/i,
      /^last\s*name$/i,
      /name/i  // Fallback - any field containing "name"
    ],
    email: [
      /^email$/i,
      /^e-mail$/i,
      /^email\s*address$/i,
      /email/i  // Fallback
    ],
    phone: [
      /^phone$/i,
      /^phone\s*number$/i,
      /^mobile$/i,
      /^contact\s*number$/i,
      /^telephone$/i,
      /phone/i,  // Fallback
      /mobile/i,
      /contact/i
    ],
    location: [
      /^location$/i,
      /^city$/i,
      /^address$/i,
      /^state$/i,
      /^area$/i,
      /location/i,  // Fallback
      /city/i,
      /address/i
    ],
    budget: [
      /budget/i,
      /price/i,
      /cost/i,
      /range/i,
      /investment/i
    ]
  };

  // Process each field
  fieldData.forEach(field => {
    const fieldName = field.name?.toLowerCase()?.trim();
    const fieldValue = field.values?.[0]?.trim();

    if (!fieldName || !fieldValue) return;

    // Check each field type
    Object.keys(patterns).forEach(fieldType => {
      if (extracted[fieldType]) return; // Already found

      // Check if field name matches any pattern for this type
      const matches = patterns[fieldType].some(pattern => pattern.test(fieldName));

      if (matches) {
        extracted[fieldType] = fieldValue;
      }
    });
  });

  return extracted;
}

// Public Webhook Routes (Move BEFORE middleware)
/**
 * @route GET /api/meta-ads/webhook
 * @desc Facebook Webhook Verification
 */
router.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'synditech_realnext_secret_2024';

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info(`🔍 Meta Webhook Verification Attempt - mode: ${mode}, token: ${token}`);

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            logger.info('✅ Webhook verified successfully');
            return res.status(200).send(challenge);
        } else {
            logger.warn(`❌ Webhook verification failed: Expected="${VERIFY_TOKEN}", Received="${token}"`);
            return res.status(403).send('Verification failed');
        }
    } else {
        logger.warn('⚠️ Webhook request missing hub.mode or hub.verify_token');
        return res.status(400).send('Invalid request');
    }
});

/**
 * @route POST /api/meta-ads/webhook
 * @desc Receive Facebook Lead Webhooks
 */
router.post('/webhook', async (req, res) => {
    try {
        const body = req.body;

        // Verify webhook signature
        const signature = req.get('X-Hub-Signature-256');
        if (signature) {
            // Note: For proper verification, use raw body. This uses parsed body.
            const expectedSignature = crypto.createHmac('sha256', process.env.FACEBOOK_APP_SECRET).update(JSON.stringify(body)).digest('hex');
            const providedSignature = signature.replace('sha256=', '');
            if (providedSignature !== expectedSignature) {
                logger.warn('Invalid webhook signature');
                return res.status(403).send('Forbidden');
            }
        } else {
            logger.warn('No webhook signature provided');
            // In production, return 403
        }

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
                            page_id: pageId
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
                            form_id: formId,
                            client_id: pageConnection.client_id
                        });

                        if (!leadForm) {
                            logger.warn(`Form ${formId} not found in our system`);
                            continue;
                        }

                        // Check if this lead has already been processed
                        const existingFacebookLead = await Lead.findOne({
                            client_id: pageConnection.client_id,
                            'metadata.facebook_lead_id': leadgenId
                        });

                        if (existingFacebookLead) {
                            logger.info(`Lead ${leadgenId} already processed, skipping`);
                            continue;
                        }

                        // Fetch lead data from Facebook
                        try {
                            const leadResponse = await axios.get(`${GRAPH_API_URL}/${leadgenId}`, {
                                params: {
                                    access_token: pageConnection.access_token,
                                    fields: 'id,created_time,field_data,campaign_name,adset_name,ad_name'
                                }
                            });

                            const leadData = leadResponse.data;
                            const fieldData = leadData.field_data || [];

                            // Extract fields using flexible pattern matching
                            const extractedFields = extractLeadFields(fieldData);
                            const emailField = extractedFields.email;
                            const phoneField = extractedFields.phone;
                            const nameField = extractedFields.name;

                            if (!phoneField && !emailField) {
                                logger.warn(`Lead ${leadgenId} has no phone or email, skipping`);
                                continue;
                            }

                            // Note: We allow multiple leads from the same person across different forms/campaigns
                            // This enables proper marketing attribution and multi-touch analysis
                            // Only block exact Facebook lead ID duplicates (handled above)

                            // Create the lead
                            const newLead = await Lead.create({
                                client_id: pageConnection.client_id,
                                name: nameField || 'Facebook Lead',
                                email: emailField,
                                phone: phoneField,
                                source: 'Facebook Ads',
                                status: 'new',
                                campaign_name: leadData.campaign_name,
                                form_name: leadForm.name,
                                metadata: {
                                    facebook_lead_id: leadgenId,
                                    form_id: formId,
                                    page_id: pageId,
                                    adset_name: leadData.adset_name,
                                    ad_name: leadData.ad_name,
                                    webhook_received_at: new Date(),
                                    facebook_form_data: fieldData // Save all form answers
                                }
                            });

                            logger.info(`✅ Created lead: ${newLead.name} (ID: ${newLead.id})`);

                            // Update form lead count
                            await FacebookLeadForm.updateOne(
                                { _id: leadForm._id },
                                {
                                    $inc: { lead_count: 1 },
                                    $set: { last_lead_fetched_at: new Date() }
                                }
                            );

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

/**
 * @route GET /api/meta-ads/webhook/health
 * @desc Webhook health check
 */
router.get('/webhook/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Webhook endpoint is healthy',
        timestamp: new Date().toISOString()
    });
});

/**
 * @route GET /api/meta-ads/diagnostic
 * @desc Diagnostic endpoint to troubleshoot Facebook integration
 * @access Public (can include token in query)
 */
router.get('/diagnostic', async (req, res) => {
    try {
        const { token, page_id } = req.query;

        if (!token) {
            return res.json({
                error: 'Please provide a token query parameter',
                example: '/api/meta-ads/diagnostic?token=YOUR_TOKEN&page_id=OPTIONAL_PAGE_ID'
            });
        }

        const diagnostic = {
            timestamp: new Date(),
            results: []
        };

        // Test 1: Token validity
        try {
            const tokenRes = await axios.get(`https://graph.facebook.com/me`, {
                params: { access_token: token }
            });
            diagnostic.results.push({
                test: 'Token Validity',
                status: 'PASS',
                message: `Token belongs to: ${tokenRes.data.name || 'Unknown User'}`,
                data: { id: tokenRes.data.id, name: tokenRes.data.name }
            });
        } catch (err) {
            diagnostic.results.push({
                test: 'Token Validity',
                status: 'FAIL',
                error: err.response?.data?.error?.message || err.message
            });
            return res.json(diagnostic);
        }

        // Test 2: Get token permissions/scopes
        try {
            const scopeRes = await axios.get(`https://graph.facebook.com/me/permissions`, {
                params: { access_token: token }
            });
            const permissions = scopeRes.data.data.map(p => p.permission);
            
            const requiredPerms = ['pages_read_engagement', 'pages_manage_metadata', 'pages_read_user_content', 'leads_retrieval'];
            const missingPerms = requiredPerms.filter(p => !permissions.includes(p));

            diagnostic.results.push({
                test: 'Token Permissions',
                status: missingPerms.length === 0 ? 'PASS' : 'WARNING',
                allPermissions: permissions,
                requiredPermissions: requiredPerms,
                missingPermissions: missingPerms,
                message: missingPerms.length > 0 
                    ? `Missing permissions: ${missingPerms.join(', ')}`
                    : 'All required permissions present'
            });
        } catch (err) {
            diagnostic.results.push({
                test: 'Token Permissions',
                status: 'ERROR',
                error: err.message
            });
        }

        // Test 3: Get all pages accessible to this token
        try {
            const pagesRes = await axios.get(`https://graph.facebook.com/me/accounts`, {
                params: { 
                    access_token: token,
                    fields: 'id,name,access_token'
                }
            });
            
            const pages = pagesRes.data.data || [];
            diagnostic.results.push({
                test: 'Pages Access',
                status: pages.length > 0 ? 'PASS' : 'WARNING',
                totalPages: pages.length,
                pages: pages.map(p => ({ id: p.id, name: p.name }))
            });

            // Test 4: Get forms for each page (if provided or first page)
            if (pages.length > 0) {
                const targetPages = page_id 
                    ? pages.filter(p => p.id === page_id) 
                    : pages.slice(0, 1);

                for (const page of targetPages) {
                    try {
                        const formsRes = await axios.get(`https://graph.facebook.com/${page.id}/leadgen_forms`, {
                            params: {
                                access_token: page.access_token,
                                fields: 'id,name,status,leads_count',
                                limit: 100
                            }
                        });

                        const forms = formsRes.data.data || [];
                        diagnostic.results.push({
                            test: `Forms for Page: ${page.name}`,
                            status: 'PASS',
                            pageId: page.id,
                            totalForms: forms.length,
                            forms: forms.map(f => ({
                                id: f.id,
                                name: f.name,
                                status: f.status,
                                leads_count: f.leads_count
                            }))
                        });
                    } catch (formErr) {
                        diagnostic.results.push({
                            test: `Forms for Page: ${page.name}`,
                            status: 'ERROR',
                            pageId: page.id,
                            error: formErr.response?.data?.error?.message || formErr.message
                        });
                    }
                }
            }
        } catch (err) {
            diagnostic.results.push({
                test: 'Pages Access',
                status: 'ERROR',
                error: err.response?.data?.error?.message || err.message
            });
        }

        // Summary
        const passCount = diagnostic.results.filter(r => r.status === 'PASS').length;
        const failCount = diagnostic.results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;

        diagnostic.summary = {
            totalTests: diagnostic.results.length,
            passed: passCount,
            issues: failCount,
            recommendation: failCount === 0 
                ? '✅ Integration looks good!' 
                : '⚠️ Fix the issues above to complete setup'
        };

        res.json(diagnostic);
    } catch (error) {
        logger.error('[DIAGNOSTIC] Error:', error);
        res.status(500).json({
            error: 'Diagnostic failed',
            message: error.message
        });
    }
});

// Middleware for Protected Routes
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

// Defensive helper to ensure client context exists before using req.client.id
const ensureClient = (req) => {
    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required for this operation. Super Admins must provide a client ID.');
    }
};

const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const exchangeToken = async (shortToken) => {
    const response = await axios.get(`${GRAPH_API_URL}/oauth/access_token`, {
        params: {
            grant_type: 'fb_exchange_token',
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            fb_exchange_token: shortToken
        }
    });
    return response.data.access_token;
};

/**
 * @route POST /api/meta-ads/connect
 * @desc Connect Facebook Account & Fetch Pages
 */
router.post('/connect', requireFeature('meta_ads'), async (req, res, next) => {
    try {
        ensureClient(req);
        const { user_token } = req.body;
        if (!user_token) throw new ApiError(400, 'User Access Token is required');

        // Exchange for long-lived user token
        const longLivedUserToken = await exchangeToken(user_token);

        // 1. Fetch Pages this user manages
        const response = await axios.get(`${GRAPH_API_URL}/me/accounts`, {
            params: {
                access_token: longLivedUserToken,
                fields: 'id,name,access_token,tasks',
                limit: 100
            }
        });

        const pages = response.data.data || [];
        const connectedPages = [];

        for (const page of pages) {
            // Exchange page token for long-lived
            const longLivedPageToken = await exchangeToken(page.access_token);

            // Upsert Page Connection using Mongoose findOneAndUpdate
            const connection = await FacebookPageConnection.findOneAndUpdate(
                { client_id: req.client.id, page_id: page.id },
                {
                    page_name: page.name,
                    access_token: longLivedPageToken, // Long-lived Page Access Token
                    status: 'active',
                    last_sync_at: new Date()
                },
                { upsert: true, new: true }
            );
            connectedPages.push(connection);
        }

        res.json({
            success: true,
            message: `Connected ${connectedPages.length} pages`,
            data: connectedPages
        });
    } catch (error) {
        // Handle Graph API errors
        if (error.response?.data?.error) {
            return next(new ApiError(400, `Facebook API Error: ${error.response.data.error.message}`));
        }
        next(error);
    }
});

/**
 * @route POST /api/meta-ads/webhooks/register
 * @desc Register webhooks for all connected pages
 */
router.post('/webhooks/register', requireFeature('meta_ads'), async (req, res, next) => {
    try {
        ensureClient(req);

        const pages = await FacebookPageConnection.find({
            client_id: req.client.id,
            status: 'active'
        });

        if (pages.length === 0) {
            return res.json({
                success: true,
                message: 'No active pages found to register webhooks for',
                data: { registered: 0, failed: 0 }
            });
        }

        const results = {
            registered: 0,
            failed: 0,
            details: []
        };

        const webhookUrl = process.env.META_WEBHOOK_URL || `${req.protocol}://${req.get('host')}/api/meta-ads/webhook`;

        for (const page of pages) {
            try {
                logger.info(`[WEBHOOK-REG] Registering webhook for page: ${page.page_name} (${page.page_id})`);

                // Subscribe to leadgen events for this page
                const response = await axios.post(`${GRAPH_API_URL}/${page.page_id}/subscribed_apps`, {
                    subscribed_fields: 'leadgen',
                    access_token: page.access_token
                });

                // Update page with webhook registration status
                page.webhook_registered = true;
                page.webhook_url = webhookUrl;
                page.last_webhook_registration = new Date();
                await page.save();

                results.registered++;
                results.details.push({
                    page_id: page.page_id,
                    page_name: page.page_name,
                    status: 'success',
                    message: 'Webhook registered successfully'
                });

                logger.info(`[WEBHOOK-REG] ✅ Successfully registered webhook for page: ${page.page_name}`);

            } catch (error) {
                logger.error(`[WEBHOOK-REG] ❌ Failed to register webhook for page ${page.page_name}:`, error.message);

                results.failed++;
                results.details.push({
                    page_id: page.page_id,
                    page_name: page.page_name,
                    status: 'failed',
                    error: error.response?.data?.error?.message || error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Webhook registration completed: ${results.registered} successful, ${results.failed} failed`,
            data: results
        });

    } catch (error) {
        logger.error('[WEBHOOK-REG] Webhook registration failed:', error);
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
        const pages = await FacebookPageConnection.find({
            client_id: req.client.id
        })
            .populate('leadForms')
            .sort({ created_at: -1 });
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
        const pages = await FacebookPageConnection.find({
            client_id: req.client.id,
            status: 'active'
        });

        logger.info(`[SYNC-FORMS] Starting sync for ${pages.length} pages`);

        let newFormsCount = 0;
        let updatedFormsCount = 0;
        let totalFormsFound = 0;
        let skippedForms = 0;

        for (const page of pages) {
            try {
                logger.info(`[SYNC-FORMS] Syncing forms for page: ${page.page_name} (${page.page_id})`);
                
                let formsUrl = `${GRAPH_API_URL}/${page.page_id}/leadgen_forms?access_token=${page.access_token}&fields=id,name,status,leads_count&limit=100`;
                let pageFormsCount = 0;
                let pageNewCount = 0;

                while (formsUrl) {
                    try {
                        const response = await axios.get(formsUrl);
                        const forms = response.data.data || [];
                        formsUrl = response.data.paging?.next;

                        logger.debug(`[SYNC-FORMS] Page ${page.page_name}: Found ${forms.length} forms in this batch`);

                        for (const form of forms) {
                            try {
                                totalFormsFound++;
                                pageFormsCount++;

                                // Log form details for debugging
                                logger.debug(`[SYNC-FORMS] Processing form: ${form.name} (ID: ${form.id}, Status: ${form.status})`);

                                // IMPORTANT: Don't filter by status - get ALL forms and let user decide visibility
                                const isActive = form.status === 'ACTIVE' || form.status === 'active';

                                let savedForm = await FacebookLeadForm.findOne({
                                    client_id: req.client.id,
                                    form_id: form.id
                                });

                                if (!savedForm) {
                                    savedForm = await FacebookLeadForm.create({
                                        client_id: req.client.id,
                                        form_id: form.id,
                                        page_connection_id: page.id,
                                        name: form.name,
                                        status: isActive ? 'active' : 'inactive',
                                        lead_count: form.leads_count || 0
                                    });
                                    newFormsCount++;
                                    pageNewCount++;
                                    logger.info(`[SYNC-FORMS] ✅ Created new form: ${form.name} (Status: ${form.status})`);
                                } else {
                                    // Update lead count and status for existing forms
                                    const oldStatus = savedForm.status;
                                    savedForm.lead_count = form.leads_count || 0;
                                    savedForm.status = isActive ? 'active' : 'inactive';
                                    
                                    if (oldStatus !== savedForm.status) {
                                        logger.info(`[SYNC-FORMS] Updated form status: ${form.name} (${oldStatus} → ${savedForm.status})`);
                                    }
                                    
                                    await savedForm.save();
                                    updatedFormsCount++;
                                }
                            } catch (formError) {
                                logger.error(`[SYNC-FORMS] Error processing form ${form.id}: ${formError.message}`);
                                skippedForms++;
                            }
                        }
                    } catch (batchError) {
                        logger.error(`[SYNC-FORMS] Error fetching forms batch for page ${page.page_id}: ${batchError.message}`);
                        if (batchError.response?.data?.error) {
                            logger.error(`[SYNC-FORMS] Facebook API Error:`, batchError.response.data.error);
                        }
                        break; // Stop pagination if error occurs
                    }
                }

                logger.info(`[SYNC-FORMS] ✅ Page ${page.page_name}: Synced ${pageFormsCount} forms (${pageNewCount} new)`);

            } catch (pageError) {
                logger.error(`[SYNC-FORMS] ❌ Failed to sync forms for page ${page.page_name}: ${pageError.message}`);
                if (pageError.response?.data?.error) {
                    logger.error(`[SYNC-FORMS] Facebook API Error:`, pageError.response.data.error);
                }
            }
        }

        logger.info(`[SYNC-FORMS] 📊 Sync Summary: Total=${totalFormsFound}, New=${newFormsCount}, Updated=${updatedFormsCount}, Skipped=${skippedForms}`);

        res.json({ 
            success: true, 
            new_forms: newFormsCount,
            updated_forms: updatedFormsCount,
            total_forms_found: totalFormsFound,
            skipped_forms: skippedForms,
            message: `Synced ${totalFormsFound} forms (${newFormsCount} new, ${updatedFormsCount} updated)` 
        });
    } catch (error) {
        logger.error(`[SYNC-FORMS] Fatal error:`, error);
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
        const forms = await FacebookLeadForm.find({
            client_id: req.client.id
        }).populate('pageConnection');

        logger.info(`[FETCH-LEADS] Starting lead fetch for ${forms.length} forms`);

        let newLeadsCount = 0;
        let skippedCount = 0;
        let processedLeads = 0;
        let errorCount = 0;
        let formProcessed = 0;

        for (const form of forms) {
            try {
                // Check if form and page are available
                if (!form.pageConnection) {
                    logger.warn(`[FETCH-LEADS] Form ${form.name} has no page connection`);
                    continue;
                }

                if (!form.pageConnection.access_token) {
                    logger.warn(`[FETCH-LEADS] Page ${form.pageConnection.page_name} has no access token`);
                    continue;
                }

                // Check if lead sync is enabled for this page
                if (!form.pageConnection.is_lead_sync_enabled) {
                    logger.debug(`[FETCH-LEADS] Skipping form ${form.name} - auto-sync disabled for page ${form.pageConnection.page_name}`);
                    continue;
                }

                logger.info(`[FETCH-LEADS] Processing form: ${form.name} (ID: ${form.form_id})`);
                formProcessed++;

                let nextUrl = `${GRAPH_API_URL}/${form.form_id}/leads?access_token=${form.pageConnection.access_token}&fields=id,created_time,field_data,campaign_name,adset_name,ad_name&limit=100`;
                let formLeadsProcessed = 0;
                let formNewLeads = 0;

                while (nextUrl) {
                    try {
                        const response = await axios.get(nextUrl);
                        const leads = response.data.data || [];
                        nextUrl = response.data.paging?.next;

                        logger.debug(`[FETCH-LEADS] Form ${form.name}: Processing ${leads.length} leads in this batch`);

                        for (const leadData of leads) {
                            try {
                                processedLeads++;

                                // Normalize Field Data
                                const emailField = leadData.field_data?.find(f => f.name?.includes('email'))?.values?.[0];
                                const phoneField = leadData.field_data?.find(f => 
                                    f.name?.includes('phone') || f.name?.includes('number')
                                )?.values?.[0];
                                const nameField = leadData.field_data?.find(f => 
                                    f.name?.includes('name') || f.name?.includes('full_name')
                                )?.values?.[0];

                                // Skip if no contact info
                                if (!phoneField && !emailField) {
                                    logger.debug(`[FETCH-LEADS] Skipping lead ${leadData.id} - no email or phone`);
                                    continue;
                                }

                                // Check if lead exists (deduplication)
                                const existingLead = await Lead.findOne({
                                    client_id: req.client.id,
                                    $or: [
                                        { email: emailField },
                                        { phone: phoneField }
                                    ]
                                });

                                if (!existingLead) {
                                    await Lead.create({
                                        client_id: req.client.id,
                                        name: nameField || 'Facebook Lead',
                                        email: emailField,
                                        phone: phoneField,
                                        source: 'Facebook Ads',
                                        status: 'Uncontacted',
                                        stage: 'Screening',
                                        campaign_name: leadData.campaign_name,
                                        form_name: form.name,
                                        metadata: {
                                            facebook_lead_id: leadData.id,
                                            form_id: form.form_id,
                                            page_id: form.pageConnection.page_id,
                                            adset_name: leadData.adset_name,
                                            ad_name: leadData.ad_name,
                                            fetched_at: new Date(),
                                            facebook_form_data: leadData.field_data || [] // Save all form answers
                                        },
                                        created_at: new Date(leadData.created_time)
                                    });
                                    newLeadsCount++;
                                    formNewLeads++;
                                    logger.debug(`[FETCH-LEADS] ✅ Created lead: ${nameField || 'Unknown'} (${emailField || phoneField})`);
                                } else {
                                    // Update metadata for existing leads if needed
                                    if (!existingLead.metadata?.facebook_form_data) {
                                        existingLead.metadata = existingLead.metadata || {};
                                        existingLead.metadata.facebook_form_data = leadData.field_data || [];
                                        existingLead.markModified('metadata');
                                        await existingLead.save();
                                        logger.debug(`[FETCH-LEADS] Updated metadata for existing lead: ${existingLead.name}`);
                                    }
                                    skippedCount++;
                                }

                                formLeadsProcessed++;
                            } catch (leadError) {
                                logger.error(`[FETCH-LEADS] Error processing individual lead: ${leadError.message}`);
                                errorCount++;
                            }
                        }
                    } catch (batchError) {
                        logger.error(`[FETCH-LEADS] Error fetching leads batch for form ${form.name}: ${batchError.message}`);
                        if (batchError.response?.data?.error) {
                            logger.error(`[FETCH-LEADS] Facebook API Error:`, batchError.response.data.error);
                        }
                        break; // Stop pagination if error and move to next form
                    }
                }

                logger.info(`[FETCH-LEADS] ✅ Form ${form.name}: Processed ${formLeadsProcessed} leads (${formNewLeads} new)`);

            } catch (formError) {
                logger.error(`[FETCH-LEADS] ❌ Failed to fetch leads from form ${form.name}: ${formError.message}`);
                if (formError.response?.data?.error) {
                    logger.error(`[FETCH-LEADS] Facebook API Error:`, formError.response.data.error);
                }
                errorCount++;
            }
        }

        logger.info(`[FETCH-LEADS] 📊 Summary: Processed ${formProcessed} forms, ${processedLeads} total leads, ${newLeadsCount} new, ${skippedCount} duplicates, ${errorCount} errors`);

        res.json({
            success: true,
            newLeadsCreated: newLeadsCount,
            duplicatesSkipped: skippedCount,
            totalProcessed: processedLeads,
            formsProcessed: formProcessed,
            errors: errorCount,
            message: `Fetched ${newLeadsCount} new leads, skipped ${skippedCount} duplicates`
        });
    } catch (error) {
        logger.error(`[FETCH-LEADS] Fatal error:`, error);
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
            throw new ApiError(400, 'is_enabled must be a boolean');
        }

        const page = await FacebookPageConnection.findOne({
            _id: pageId,
            client_id: req.client.id
        });

        if (!page) {
            throw new ApiError(404, 'Page connection not found');
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
 * @route POST /api/meta-ads/update-existing-forms
 * @desc Retroactively update all existing leads with their form names
 */
router.post('/update-existing-forms', authenticate, async (req, res, next) => {
    try {
        logger.info(`[UPDATE-FORMS] Starting retroactive update`);

        // Find all Facebook leads without form_name, grouped by client
        // Process per client to maintain data isolation
        const clientIds = await Lead.distinct('client_id', {
            source: 'Facebook Ads',
            $or: [
                { form_name: { $exists: false } },
                { form_name: null },
                { form_name: '' }
            ]
        });

        logger.info(`[UPDATE-FORMS] Found ${clientIds.length} clients with leads to update`);

        let totalUpdated = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        for (const clientId of clientIds) {
            logger.info(`[UPDATE-FORMS] Processing client ${clientId}`);

            const leadsToUpdate = await Lead.find({
                client_id: clientId,
                source: 'Facebook Ads',
                $or: [
                    { form_name: { $exists: false } },
                    { form_name: null },
                    { form_name: '' }
                ]
            });

            logger.info(`[UPDATE-FORMS] Client ${clientId}: Found ${leadsToUpdate.length} leads to update`);

            let updated = 0;
            let skipped = 0;
            let errors = 0;

        for (const lead of leadsToUpdate) {
            try {
                const formId = lead.metadata?.form_id;

                if (!formId) {
                    logger.debug(`[UPDATE-FORMS] Skipping lead ${lead.name} - No form_id in metadata`);
                    skipped++;
                    continue;
                }

                // Find the form by form_id and client_id
                const form = await FacebookLeadForm.findOne({
                    form_id: formId,
                    client_id: lead.client_id
                });

                if (!form) {
                    logger.debug(`[UPDATE-FORMS] Skipping lead ${lead.name} - Form ${formId} not found`);
                    skipped++;
                    continue;
                }

                // Update lead with form name
                lead.form_name = form.name;
                await lead.save();

                logger.debug(`[UPDATE-FORMS] ✅ Updated lead "${lead.name}" with form_name: "${form.name}"`);
                updated++;

            } catch (leadError) {
                logger.error(`[UPDATE-FORMS] Error updating lead: ${leadError.message}`);
                errors++;
            }
        }

        logger.info(`[UPDATE-FORMS] Client ${clientId} Summary: Updated=${updated}, Skipped=${skipped}, Errors=${errors}`);

        totalUpdated += updated;
        totalSkipped += skipped;
        totalErrors += errors;
        }

        logger.info(`[UPDATE-FORMS] 📊 Total Summary: Updated=${totalUpdated}, Skipped=${totalSkipped}, Errors=${totalErrors}`);

        res.json({
            success: true,
            updated: totalUpdated,
            skipped: totalSkipped,
            errors: totalErrors,
            message: `Updated ${totalUpdated} leads with form names across ${clientIds.length} clients`
        });

    } catch (error) {
        logger.error(`[UPDATE-FORMS] Fatal error: ${error.message}`);
        next(error);
    }
});

// Other endpoints (Analytics, etc.) could be added here similar to before
// Keeping the original structure for analytics if it's still needed, or removing if strictly replacing.
// I will keep a minimal analytics endpoint for the UI to not break.

router.get('/analytics', async (req, res) => {
    res.json({ success: true, data: { status: 'Real analytics not yet implemented, use fetched leads.' } });
});

/**
 * @route POST /api/meta-ads/webhooks/register
 * @desc Register webhooks for all connected pages
 */
router.post('/webhooks/register', requireFeature('meta_ads'), async (req, res) => {
  try {
    const pages = await FacebookPageConnection.find({
      client_id: req.client.id,
      is_lead_sync_enabled: true
    });

    const results = [];
    for (const page of pages) {
      try {
        // Subscribe to page events
        const subscribeResponse = await axios.post(`${GRAPH_API_URL}/${page.page_id}/subscribed_apps`, {
          access_token: page.access_token,
          subscribed_fields: 'leadgen'
        });

        results.push({
          page_id: page.page_id,
          page_name: page.page_name,
          status: 'success',
          response: subscribeResponse.data
        });

        logger.info(`✅ Webhook registered for page: ${page.page_name}`);

      } catch (pageError) {
        logger.error(`❌ Failed to register webhook for page ${page.page_name}:`, pageError.message);
        results.push({
          page_id: page.page_id,
          page_name: page.page_name,
          status: 'error',
          error: pageError.message
        });
      }
    }

    res.json({
      success: true,
      message: `Webhook registration completed for ${pages.length} pages`,
      results
    });

  } catch (error) {
    logger.error('Webhook registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register webhooks',
      error: error.message
    });
  }
});

module.exports = router;

