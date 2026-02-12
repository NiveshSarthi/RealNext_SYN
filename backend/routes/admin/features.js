const express = require('express');
const router = express.Router();
const { Feature, PlanFeature } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireSuperAdmin } = require('../../middleware/roles');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { validate, validators } = require('../../utils/validators');

// All routes require super admin
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/admin/features
 * @desc List all features
 * @access Super Admin
 */
router.get('/', async (req, res, next) => {
    try {
        const features = await Feature.find().sort({ category: 1, name: 1 });

        res.json({
            success: true,
            data: features
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/features
 * @desc Create new feature
 * @access Super Admin
 */
router.post('/',
    [
        validators.requiredString('code', 2, 100),
        validators.requiredString('name', 2, 255),
        validators.optionalString('description', 1000),
        validators.optionalString('category', 100),
        validate
    ],
    auditAction('create', 'feature'),
    async (req, res, next) => {
        try {
            const { code, name, description, category, is_core, is_enabled, metadata } = req.body;

            const existing = await Feature.findOne({ code });
            if (existing) {
                throw ApiError.conflict('Feature with this code already exists');
            }

            const feature = await Feature.create({
                code,
                name,
                description,
                category,
                is_core: is_core || false,
                is_enabled: is_enabled !== false,
                metadata: metadata || {}
            });

            res.status(201).json({
                success: true,
                data: feature
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /api/admin/features/:id
 * @desc Update feature
 * @access Super Admin
 */
router.put('/:id',
    [
        validators.optionalString('name'),
        validators.optionalString('description', 1000),
        validate
    ],
    auditAction('update', 'feature'),
    async (req, res, next) => {
        try {
            const feature = await Feature.findById(req.params.id);

            if (!feature) {
                throw ApiError.notFound('Feature not found');
            }

            const { name, description, category, is_core, metadata } = req.body;

            feature.name = name || feature.name;
            feature.description = description !== undefined ? description : feature.description;
            feature.category = category || feature.category;
            feature.is_core = is_core !== undefined ? is_core : feature.is_core;
            feature.metadata = metadata ? { ...feature.metadata, ...metadata } : feature.metadata;

            await feature.save();

            res.json({
                success: true,
                data: feature
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /api/admin/features/:id/toggle
 * @desc Toggle feature globally (kill switch)
 * @access Super Admin
 */
router.put('/:id/toggle',
    auditAction('toggle', 'feature'),
    async (req, res, next) => {
        try {
            const feature = await Feature.findById(req.params.id);

            if (!feature) {
                throw ApiError.notFound('Feature not found');
            }

            const { is_enabled } = req.body;

            feature.is_enabled = is_enabled !== undefined ? is_enabled : !feature.is_enabled;
            await feature.save();

            res.json({
                success: true,
                data: feature,
                message: `Feature ${feature.is_enabled ? 'enabled' : 'disabled'} globally`
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/admin/features/:id
 * @desc Delete feature
 * @access Super Admin
 */
router.delete('/:id', auditAction('delete', 'feature'), async (req, res, next) => {
    try {
        const feature = await Feature.findById(req.params.id);

        if (!feature) {
            throw ApiError.notFound('Feature not found');
        }

        // Check if feature is in use
        const usageCount = await PlanFeature.countDocuments({ feature_id: feature.id });
        if (usageCount > 0 && !req.query.force) {
            throw ApiError.badRequest(`Feature is used in ${usageCount} plan(s). Use ?force=true to delete anyway.`);
        }

        // Remove from all plans
        await PlanFeature.deleteMany({ feature_id: feature.id });
        await Feature.deleteOne({ _id: feature._id });

        res.json({
            success: true,
            message: 'Feature deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/features/seed
 * @desc Seed default features
 * @access Super Admin
 */
router.post('/seed', auditAction('seed', 'features'), async (req, res, next) => {
    try {
        const defaultFeatures = [
            { code: 'leads', name: 'Leads Management', category: 'CRM', is_core: true },
            { code: 'campaigns', name: 'WhatsApp Campaigns', category: 'Marketing' },
            { code: 'templates', name: 'Message Templates', category: 'Marketing' },
            { code: 'workflows', name: 'Automation Workflows', category: 'Automation' },
            { code: 'analytics', name: 'Analytics Dashboard', category: 'Analytics', is_core: true },
            { code: 'network', name: 'Agent Network', category: 'Collaboration' },
            { code: 'quick_replies', name: 'Quick Replies', category: 'Messaging', is_core: true },
            { code: 'catalog', name: 'Product Catalog', category: 'Inventory' },
            { code: 'lms', name: 'Learning Management', category: 'Training' },
            { code: 'meta_ads', name: 'Meta Ads Integration', category: 'Marketing' },
            { code: 'drip_sequences', name: 'Drip Sequences', category: 'Automation' },
            { code: 'white_label', name: 'White Label Branding', category: 'Customization' },
            { code: 'api_access', name: 'API Access', category: 'Integration' }
        ];

        const created = [];
        for (const f of defaultFeatures) {
            let feature = await Feature.findOne({ code: f.code });
            if (!feature) {
                feature = await Feature.create({ ...f, is_enabled: true });
                created.push(feature.code);
            }
        }

        res.json({
            success: true,
            message: `Created ${created.length} new features`,
            created
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
