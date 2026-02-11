const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { CatalogItem } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireClientAccess } = require('../../middleware/roles');
const { enforceClientScope } = require('../../middleware/scopeEnforcer');
const { requireFeature } = require('../../middleware/featureGate');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { validate, validators } = require('../../utils/validators');

// Middleware
router.use(authenticate, requireClientAccess, enforceClientScope);

/**
 * @route GET /api/catalog
 * @desc Get catalog items
 */
router.get('/', requireFeature('catalog'), async (req, res, next) => {
    try {
        const { category, search, status } = req.query;
        const query = { client_id: req.client.id };

        if (status) query.status = status;
        if (category) query.category = category;
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        const items = await CatalogItem.find(query)
            .sort({ created_at: -1 });

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
            _id: req.params.id,
            client_id: req.client.id
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
                client_id: req.client.id,
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
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!item) throw ApiError.notFound('Item not found');

            Object.assign(item, req.body);
            await item.save();

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
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!item) throw ApiError.notFound('Item not found');

            await item.deleteOne();

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
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!item) throw ApiError.notFound('Item not found');

            // Mock sync logic
            item.wa_catalog_id = `wa_prod_${Date.now()}`;
            item.metadata = { ...item.metadata, last_sync: new Date() };
            await item.save();

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
        const stats = await CatalogItem.aggregate([
            { $match: { client_id: new mongoose.Types.ObjectId(req.client.id) } },
            {
                $group: {
                    _id: null,
                    total_items: { $sum: 1 },
                    active_items: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                total_items: stats[0]?.total_items || 0,
                active_items: stats[0]?.active_items || 0,
                synced_items: 0 // Mock
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
