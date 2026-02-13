const express = require('express');
const router = express.Router();
const { Template } = require('../../../models');
const { authenticate } = require('../../../middleware/auth');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const { requireFeature } = require('../../../middleware/featureGate');
const { auditAction } = require('../../../middleware/auditLogger');
const { ApiError } = require('../../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, mergeFilters } = require('../../../utils/helpers');
const { validate, validators } = require('../../../utils/validators');
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
 * @route GET /api/templates
 * @desc List templates
 * @access Tenant User
 */
router.get('/', requireFeature('templates'), async (req, res, next) => {
    try {
        ensureClient(req);
        const pagination = getPagination(req.query);
        const sorting = getSorting(req.query, ['name', 'status', 'category', 'created_at'], 'created_at');

        const statusFilter = req.query.status ? { status: req.query.status } : null;
        const categoryFilter = req.query.category ? { category: req.query.category } : null;

        const where = mergeFilters(
            { client_id: req.client.id },
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

            console.log('[Template Create Request]', JSON.stringify(req.body, null, 2));

            // 1. Create in External WhatsApp API
            let externalTemplate;
            try {
                externalTemplate = await waService.createTemplate({
                    name,
                    category,
                    language: language || 'en_US',
                    components: components || [],
                    // allow passing other fields if needed by external API
                });
            } catch (extError) {
                // If external creation fails, do not create local record
                throw new ApiError(502, `External WhatsApp API Error: ${extError.response?.data?.error || extError.message}`);
            }

            // 2. Create Local Record
            const template = await Template.create({
                client_id: req.client.id,
                name,
                category,
                language: language || 'en_US',
                status: externalTemplate?.status || 'approved', // Assume approved/pending based on response
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
        const template = await Template.findOne({
            _id: req.params.id,
            client_id: req.client.id
        });

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
            const template = await Template.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

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
