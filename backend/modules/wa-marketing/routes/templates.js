const express = require('express');
const router = express.Router();
const { Template } = require('../../../models');
const { authenticate } = require('../../../middleware/auth');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const { requireFeature } = require('../../../middleware/featureGate');
const { auditAction } = require('../../../middleware/auditLogger');
const { ApiError } = require('../../../middleware/errorHandler');
const logger = require('../../../config/logger');
const { getPagination, getPaginatedResponse, getSorting, mergeFilters } = require('../../../utils/helpers');
const { validate, validators } = require('../../../utils/validators');
const waService = require('../../../services/waService');

// Middleware
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

// Defensive helper to ensure client context exists before using req.client.id
const ensureClient = (req) => {
    // Super admins can skip client context check for listing (GET)
    if (req.user?.is_super_admin && req.method === 'GET') {
        return;
    }

    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required for this operation. Super Admins must provide a client ID.');
    }
};

/**
 * @route GET /api/templates
 * @desc List templates
 * @access Tenant User
 */
router.get('/', requireFeature('templates'), async (req, res, next) => {
    try {
        ensureClient(req);
        const pagination = getPagination(req.query);
        const sorting = getSorting(req.query, ['name', 'status', 'category', 'created_at'], 'created_at');

        // --- START SYNC ---
        // Trigger sync: either for specific client OR master account for Super Admin
        if (req.client?.id || req.user?.is_super_admin) {
            const syncClientId = req.client?.id;
            try {
                // Fetch external templates (passing null if no client, triggers master sync in waService)
                const externalTemplates = await waService.getTemplates({}, syncClientId);

                if (Array.isArray(externalTemplates) && externalTemplates.length > 0) {
                    // Determine which local client to map these templates to
                    let localClientId = syncClientId;

                    if (!localClientId && req.user?.is_super_admin) {
                        // For Super Admin with no context, find the "Master" client
                        const masterClient = await Client.findOne({ $or: [{ name: /Admin/i }, { email: /admin/i }] }) || await Client.findOne({});
                        if (masterClient) {
                            localClientId = masterClient._id;
                            logger.info(`Using Master Client ${masterClient.name} (${localClientId}) for Super Admin sync`);
                        }
                    }

                    if (localClientId) {
                        // Upsert logic
                        const bulkOps = externalTemplates.map(ext => ({
                            updateOne: {
                                filter: {
                                    client_id: localClientId,
                                    name: ext.name
                                },
                                update: {
                                    $set: {
                                        status: ext.status,
                                        category: ext.category,
                                        language: ext.language,
                                        components: ext.components,
                                        wa_template_id: ext.id,
                                        metadata: { external_id: ext.id, external_response: ext }
                                    },
                                    $setOnInsert: {
                                        client_id: localClientId,
                                        created_by: req.user.id,
                                        buttons: [] // Default if missing
                                    }
                                },
                                upsert: true
                            }
                        }));
                        await Template.bulkWrite(bulkOps);
                        logger.info(`Synced ${externalTemplates.length} templates from external API for ${syncClientId ? 'client ' + syncClientId : 'MASTER account'}`);
                    }
                }
            } catch (syncError) {
                logger.warn(`Template sync failed for ${syncClientId || 'MASTER'}:`, syncError.message);
            }
        }
        // --- END SYNC ---

        const statusFilter = req.query.status ? { status: req.query.status } : null;
        const categoryFilter = req.query.category ? { category: req.query.category } : null;

        // Core filter: if client context exists, use it. If not (Super Admin), don't filter by client_id.
        const clientFilter = req.client?.id ? { client_id: req.client.id } : {};

        const where = mergeFilters(
            clientFilter,
            statusFilter,
            categoryFilter
        );

        const templates = await Template.find(where)
            .sort(sorting)
            .limit(pagination.limit)
            .skip(pagination.offset);

        const count = await Template.countDocuments(where);

        res.json({
            success: true,
            ...getPaginatedResponse(templates, count, pagination)
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/templates
 * @desc Create new template
 * @access Tenant User
 */
router.post('/',
    requireFeature('templates'),
    [
        validators.requiredString('name', 1, 255),
        validators.optionalString('category', 50),
        validate
    ],
    auditAction('create', 'template'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const {
                name, category, language, components, header_type,
                body_text, footer_text, buttons, metadata
            } = req.body;

            // Normalize template name (Meta requirements: lowercase, alphanumeric, and underscores)
            const normalizedName = (name || '')
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');

            // Normalize category (TRANSACTIONAL -> MARKETING)
            const normalizedCategory = (category || 'MARKETING').toUpperCase() === 'TRANSACTIONAL' ? 'MARKETING' : category.toUpperCase();

            logger.info(`[Template Create Request] ${JSON.stringify({ ...req.body, name: normalizedName, category: normalizedCategory }, null, 2)}`);

            // 1. Create in External WhatsApp API
            let externalTemplate;
            // Ensure language is valid (en -> en_US)
            const languageCode = (language === 'en' || !language) ? 'en_US' : language;

            try {
                const templatePayload = {
                    name: normalizedName,
                    category: normalizedCategory,
                    language: languageCode,
                    components: components || [],
                };
                externalTemplate = await waService.createTemplate(templatePayload, req.client?.id);
            } catch (extError) {
                // Determine actual error message from WFB response
                let errorMsg = extError.message;
                const errorData = extError.response?.data;

                logger.error(`External WhatsApp API Error Detail: ${JSON.stringify(errorData || {}, null, 2)}`);

                if (errorData?.detail) {
                    try {
                        // Sometimes detail is a stringified JSON from Meta
                        const parsedDetail = typeof errorData.detail === 'string' ? JSON.parse(errorData.detail) : errorData.detail;
                        errorMsg = parsedDetail.error?.message || parsedDetail.message || errorData.detail;
                    } catch (e) {
                        errorMsg = errorData.detail;
                    }
                } else if (errorData?.error?.message) {
                    errorMsg = errorData.error.message;
                } else if (errorData?.message) {
                    errorMsg = errorData.message;
                }

                throw new ApiError(400, `External WhatsApp API Error: ${errorMsg}`);
            }

            // Normalize status to match local enum ['pending', 'approved', 'rejected', 'disabled']
            let normalizedStatus = 'pending';
            const rawStatus = (externalTemplate?.status || 'pending').toLowerCase();
            if (['pending', 'approved', 'rejected', 'disabled'].includes(rawStatus)) {
                normalizedStatus = rawStatus;
            } else if (rawStatus === 'success' || rawStatus === 'created') {
                normalizedStatus = 'pending'; // WFB returns success but Meta/Local use pending for new templates
            }

            // 2. Create Local Record
            const template = await Template.create({
                client_id: req.client.id,
                name,
                category,
                language: languageCode,
                status: normalizedStatus,
                components: components || {},
                header_type,
                body_text,
                footer_text,
                buttons: buttons || [],
                created_by: req.user.id,
                metadata: {
                    ...(metadata || {}),
                    external_id: externalTemplate?.id,
                    external_response: externalTemplate
                },
                wa_template_id: externalTemplate?.id
            });

            res.status(201).json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error('[Template Create Error]', error);
            logger.error(`Failed to create template: ${error.message}`, { stack: error.stack, body: req.body });
            next(error);
        }
    }
);

/**
 * @route GET /api/templates/:id
 * @desc Get template details
 * @access Tenant User
 */
router.get('/:id', requireFeature('templates'), async (req, res, next) => {
    try {
        ensureClient(req);
        const query = { _id: req.params.id };
        if (req.client?.id) {
            query.client_id = req.client.id;
        }
        const template = await Template.findOne(query);

        if (!template) {
            throw ApiError.notFound('Template not found');
        }

        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/templates/:id
 * @desc Update template
 * @access Tenant User
 */
router.put('/:id',
    requireFeature('templates'),
    auditAction('update', 'template'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const query = { _id: req.params.id };
            if (req.client?.id) {
                query.client_id = req.client.id;
            }
            const template = await Template.findOne(query);

            if (!template) {
                throw ApiError.notFound('Template not found');
            }

            const updateData = { ...req.body };
            delete updateData.client_id;
            delete updateData.id;

            // If template is approved, changes require re-approval
            if (template.status === 'approved' &&
                (updateData.body_text || updateData.header_type || updateData.components)) {
                updateData.status = 'pending';
            }

            Object.assign(template, updateData);
            await template.save();

            res.json({
                success: true,
                data: template
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/templates/:id
 * @desc Delete template
 * @access Tenant User
 */
router.delete('/:id',
    requireFeature('templates'),
    auditAction('delete', 'template'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const template = await Template.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!template) {
                throw ApiError.notFound('Template not found');
            }

            await template.deleteOne();

            res.json({
                success: true,
                message: 'Template deleted'
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
