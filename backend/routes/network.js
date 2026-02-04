const express = require('express');
const router = express.Router();
const { NetworkConnection, User, Tenant } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTenantAccess } = require('../middleware/roles');
const { enforceTenantScope } = require('../middleware/scopeEnforcer');
const { requireFeature } = require('../middleware/featureGate');
const { auditAction } = require('../middleware/auditLogger');
const { ApiError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const { validate, validators } = require('../utils/validators');

// Middleware
router.use(authenticate, requireTenantAccess, enforceTenantScope);

/**
 * @route GET /api/network
 * @desc Get my network connections
 */
router.get('/', requireFeature('network'), async (req, res, next) => {
    try {
        const connections = await NetworkConnection.findAll({
            where: {
                [Op.or]: [
                    { from_tenant_id: req.tenant.id },
                    { to_tenant_id: req.tenant.id }
                ],
                status: 'accepted'
            },
            include: [
                { model: Tenant, as: 'FromTenant', attributes: ['name', 'logo_url'] },
                { model: Tenant, as: 'ToTenant', attributes: ['name', 'logo_url'] }
            ]
        });

        res.json({
            success: true,
            data: connections
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/network/requests
 * @desc Get pending network requests
 */
router.get('/requests', requireFeature('network'), async (req, res, next) => {
    try {
        const requests = await NetworkConnection.findAll({
            where: {
                to_tenant_id: req.tenant.id,
                status: 'pending'
            },
            include: [
                { model: Tenant, as: 'FromTenant', attributes: ['name', 'logo_url'] },
                { model: User, as: 'FromUser', attributes: ['name'] }
            ]
        });

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/network/connect/:tenantId
 * @desc Send connection request
 */
router.post('/connect/:tenantId',
    requireFeature('network'),
    auditAction('create', 'network_request'),
    async (req, res, next) => {
        try {
            const toTenantId = req.params.tenantId;

            if (toTenantId === req.tenant.id) {
                throw ApiError.badRequest('Cannot connect to self');
            }

            const existing = await NetworkConnection.findOne({
                where: {
                    [Op.or]: [
                        { from_tenant_id: req.tenant.id, to_tenant_id: toTenantId },
                        { from_tenant_id: toTenantId, to_tenant_id: req.tenant.id }
                    ]
                }
            });

            if (existing) {
                throw ApiError.conflict('Connection already exists or pending');
            }

            const connection = await NetworkConnection.create({
                from_tenant_id: req.tenant.id,
                from_user_id: req.user.id,
                to_tenant_id: toTenantId,
                to_user_id: req.body.to_user_id, // Optional target user
                status: 'pending',
                message: req.body.message
            });

            res.status(201).json({
                success: true,
                message: 'Connection request sent',
                data: connection
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/network/accept/:id
 * @desc Accept connection request
 */
router.post('/accept/:id',
    requireFeature('network'),
    auditAction('update', 'network_request_accept'),
    async (req, res, next) => {
        try {
            const connection = await NetworkConnection.findOne({
                where: { id: req.params.id, to_tenant_id: req.tenant.id }
            });

            if (!connection) throw ApiError.notFound('Request not found');

            await connection.update({
                status: 'accepted',
                accepted_at: new Date()
            });

            res.json({
                success: true,
                message: 'Connection accepted'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/network/reject/:id
 * @desc Reject connection request
 */
router.post('/reject/:id',
    requireFeature('network'),
    auditAction('update', 'network_request_reject'),
    async (req, res, next) => {
        try {
            const connection = await NetworkConnection.findOne({
                where: { id: req.params.id, to_tenant_id: req.tenant.id }
            });

            if (!connection) throw ApiError.notFound('Request not found');

            await connection.update({ status: 'rejected' });

            res.json({
                success: true,
                message: 'Connection rejected'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/network/search
 * @desc Search for agents/tenants
 */
router.get('/search', requireFeature('network'), async (req, res, next) => {
    try {
        const { query } = req.query;
        if (!query) return res.json({ success: true, data: [] });

        const tenants = await Tenant.findAll({
            where: {
                name: { [Op.iLike]: `%${query}%` },
                id: { [Op.ne]: req.tenant.id }, // Exclude self
                status: 'active'
            },
            attributes: ['id', 'name', 'logo_url', 'address'],
            limit: 20
        });

        res.json({
            success: true,
            data: tenants
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/network/stats
 * @desc Network statistics
 */
router.get('/stats', requireFeature('network'), async (req, res, next) => {
    try {
        const connections = await NetworkConnection.count({
            where: {
                [Op.or]: [
                    { from_tenant_id: req.tenant.id },
                    { to_tenant_id: req.tenant.id }
                ],
                status: 'accepted'
            }
        });

        const pending = await NetworkConnection.count({
            where: {
                to_tenant_id: req.tenant.id,
                status: 'pending'
            }
        });

        res.json({
            success: true,
            data: {
                connections,
                pending_requests: pending,
                trust_score: 85 // Mock static score
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
