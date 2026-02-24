const express = require('express');
const router = express.Router();
const { NetworkConnection, User, Client } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireClientAccess } = require('../middleware/roles');
const { enforceClientScope } = require('../middleware/scopeEnforcer');
const { requireFeature } = require('../middleware/featureGate');
const { auditAction } = require('../middleware/auditLogger');
const { ApiError } = require('../middleware/errorHandler');
const { validate, validators } = require('../utils/validators');

// Middleware
router.use(authenticate, requireClientAccess, enforceClientScope);

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

router.get('/', requireFeature('network'), async (req, res, next) => {
    try {
        ensureClient(req);
        const clientId = req.client?.id;
        const query = clientId ? {
            $or: [
                { from_client_id: clientId },
                { to_client_id: clientId }
            ],
            status: 'accepted'
        } : { status: 'accepted' };

        const connections = await NetworkConnection.find(query)
            .populate({ path: 'from_client_id', select: 'name logo_url' })
            .populate({ path: 'to_client_id', select: 'name logo_url' });

        res.json({
            success: true,
            data: connections
        });
    } catch (error) {
        next(error);
    }
});

router.get('/requests', requireFeature('network'), async (req, res, next) => {
    try {
        ensureClient(req);
        const clientFilter = req.client?.id ? { to_client_id: req.client.id } : {};
        const requests = await NetworkConnection.find({
            ...clientFilter,
            status: 'pending'
        })
            .populate({ path: 'from_client_id', select: 'name logo_url' })
            .populate({ path: 'from_user_id', select: 'name' });

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        next(error);
    }
});

router.post('/connect/:clientId',
    requireFeature('network'),
    auditAction('create', 'network_request'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const toClientId = req.params.clientId;

            if (req.client?.id && toClientId === req.client.id) {
                throw ApiError.badRequest('Cannot connect to self');
            }

            const existing = await NetworkConnection.findOne({
                $or: [
                    { from_client_id: req.client.id, to_client_id: toClientId },
                    { from_client_id: toClientId, to_client_id: req.client.id }
                ]
            });

            if (existing) {
                throw ApiError.conflict('Connection already exists or pending');
            }

            const connection = await NetworkConnection.create({
                from_client_id: req.client.id,
                from_user_id: req.user.id,
                to_client_id: toClientId,
                to_user_id: req.body.to_user_id,
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

router.post('/accept/:id',
    requireFeature('network'),
    auditAction('update', 'network_request_accept'),
    async (req, res, next) => {
        try {
            const connection = await NetworkConnection.findOne({
                _id: req.params.id,
                to_client_id: req.client.id
            });

            if (!connection) throw ApiError.notFound('Request not found');

            connection.status = 'accepted';
            connection.accepted_at = new Date();
            await connection.save();

            res.json({
                success: true,
                message: 'Connection accepted'
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post('/reject/:id',
    requireFeature('network'),
    auditAction('update', 'network_request_reject'),
    async (req, res, next) => {
        try {
            const connection = await NetworkConnection.findOne({
                _id: req.params.id,
                to_client_id: req.client.id
            });

            if (!connection) throw ApiError.notFound('Request not found');

            connection.status = 'rejected';
            await connection.save();

            res.json({
                success: true,
                message: 'Connection rejected'
            });
        } catch (error) {
            next(error);
        }
    }
);

router.get('/search', requireFeature('network'), async (req, res, next) => {
    try {
        const { query } = req.query;
        if (!query) return res.json({ success: true, data: [] });

        const clients = await Client.find({
            name: { $regex: query, $options: 'i' },
            ...(req.client?.id ? { _id: { $ne: req.client.id } } : {}),
            status: 'active'
        })
            .select('id name logo_url address')
            .limit(20);

        res.json({
            success: true,
            data: clients
        });
    } catch (error) {
        next(error);
    }
});

router.get('/stats', requireFeature('network'), async (req, res, next) => {
    try {
        ensureClient(req);
        const clientId = req.client?.id;
        const matchQuery = clientId ? {
            $or: [
                { from_client_id: clientId },
                { to_client_id: clientId }
            ],
            status: 'accepted'
        } : { status: 'accepted' };

        const connectionsCount = await NetworkConnection.countDocuments(matchQuery);

        const pendingQuery = clientId ? { to_client_id: clientId, status: 'pending' } : { status: 'pending' };
        const pendingCount = await NetworkConnection.countDocuments(pendingQuery);

        res.json({
            success: true,
            data: {
                connections: connectionsCount,
                pending_requests: pendingCount,
                trust_score: 85
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
