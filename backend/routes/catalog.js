const express = require('express');
const router = express.Router();
const { CatalogItem } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTenantAccess } = require('../middleware/roles');
const { enforceTenantScope } = require('../middleware/scopeEnforcer');
const { requireFeature } = require('../middleware/featureGate');
const { auditAction } = require('../middleware/auditLogger');
const { ApiError } = require('../middleware/errorHandler');
const { validate, validators } = require('../utils/validators');
const { Op } = require('sequelize');

// Middleware
router.use(authenticate, requireTenantAccess, enforceTenantScope);

/**
 * @route GET /api/catalog
 * @desc Get catalog items
 */
router.get('/', requireFeature('catalog'), async (req, res, next) => {
    try {
        const { category, search, status } = req.query;
        const where = { tenant_id: req.tenant.id };

        if (status) where.status = status;
        if (category) where.category = category;
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const items = await CatalogItem.findAll({
            where,
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/catalog/:id
 * @desc Get catalog item details
 */
router.get('/:id', requireFeature('catalog'), async (req, res, next) => {
    try {
        const item = await CatalogItem.findOne({
            where: { id: req.params.id, tenant_id: req.tenant.id }
        });

        if (!item) throw ApiError.notFound('Item not found');

        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/catalog
 * @desc Create catalog item
 */
router.post('/',
    requireFeature('catalog'),
    [
        validators.requiredString('name')
    ],
    validate,
    auditAction('create', 'catalog_item'),
    async (req, res, next) => {
        try {
            const item = await CatalogItem.create({
                tenant_id: req.tenant.id,
                ...req.body,
                created_by: req.user.id
            });

            res.status(201).json({
                success: true,
                data: item
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /api/catalog/:id
 * @desc Update catalog item
 */
router.put('/:id',
    requireFeature('catalog'),
    auditAction('update', 'catalog_item'),
    async (req, res, next) => {
        try {
            const item = await CatalogItem.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!item) throw ApiError.notFound('Item not found');

            await item.update(req.body);

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/catalog/:id
 * @desc Delete catalog item
 */
router.delete('/:id',
    requireFeature('catalog'),
    auditAction('delete', 'catalog_item'),
    async (req, res, next) => {
        try {
            const item = await CatalogItem.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!item) throw ApiError.notFound('Item not found');

            await item.destroy();

            res.json({
                success: true,
                message: 'Item deleted'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/catalog/:id/sync
 * @desc Sync item to WhatsApp Catalog (Mock)
 */
router.post('/:id/sync',
    requireFeature('catalog'),
    auditAction('sync', 'catalog_item'),
    async (req, res, next) => {
        try {
            const item = await CatalogItem.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!item) throw ApiError.notFound('Item not found');

            // Mock sync logic
            await item.update({
                wa_catalog_id: `wa_prod_${Date.now()}`,
                metadata: { ...item.metadata, last_sync: new Date() }
            });

            res.json({
                success: true,
                message: 'Item synced to WhatsApp'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/catalog/stats/overview
 * @desc Catalog stats
 */
router.get('/stats/overview', requireFeature('catalog'), async (req, res, next) => {
    try {
        const total = await CatalogItem.count({ where: { tenant_id: req.tenant.id } });
        const active = await CatalogItem.count({ where: { tenant_id: req.tenant.id, status: 'active' } });

        res.json({
            success: true,
            data: {
                total_items: total,
                active_items: active,
                synced_items: 0 // Mock
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
