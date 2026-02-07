const express = require('express');
const router = express.Router();
const { Template } = require('../../../models');
const { authenticate } = require('../../../middleware/auth');
const { requireTenantAccess } = require('../../../middleware/roles');
const { enforceTenantScope } = require('../../../middleware/scopeEnforcer');
const { requireFeature } = require('../../../middleware/featureGate');
const { auditAction } = require('../../../middleware/auditLogger');
const { ApiError } = require('../../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, mergeFilters } = require('../../../utils/helpers');
const { validate, validators } = require('../../../utils/validators');

// Middleware
router.use(authenticate, requireTenantAccess, enforceTenantScope);

/**
 * @route GET /api/templates
 * @desc List templates
 * @access Tenant User
 */
router.get('/', requireFeature('templates'), async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);
        const sorting = getSorting(req.query, ['name', 'status', 'category', 'created_at'], 'created_at');

        const statusFilter = req.query.status ? { status: req.query.status } : null;
        const categoryFilter = req.query.category ? { category: req.query.category } : null;

        const where = mergeFilters(
            { tenant_id: req.tenant.id },
            statusFilter,
            categoryFilter
        );

        const { count, rows } = await Template.findAndCountAll({
            where,
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
            const {
                name, category, language, components, header_type,
                body_text, footer_text, buttons, metadata
            } = req.body;

            const template = await Template.create({
                tenant_id: req.tenant.id,
                name,
                category,
                language: language || 'en',
                status: 'pending',
                components: components || {},
                header_type,
                body_text,
                footer_text,
                buttons: buttons || [],
                created_by: req.user.id,
                metadata: metadata || {}
            });

            res.status(201).json({
                success: true,
                data: template
            });
        } catch (error) {
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
        const template = await Template.findOne({
            where: { id: req.params.id, tenant_id: req.tenant.id }
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
            const template = await Template.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!template) {
                throw ApiError.notFound('Template not found');
            }

            const updateData = { ...req.body };
            delete updateData.tenant_id;
            delete updateData.id;

            // If template is approved, changes require re-approval
            if (template.status === 'approved' &&
                (updateData.body_text || updateData.header_type || updateData.components)) {
                updateData.status = 'pending';
            }

            await template.update(updateData);

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
            const template = await Template.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!template) {
                throw ApiError.notFound('Template not found');
            }

            await template.destroy();

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
