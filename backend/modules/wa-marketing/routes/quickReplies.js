const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { QuickReply } = require('../../../models');
const { authenticate } = require('../../../middleware/auth');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const { requireFeature } = require('../../../middleware/featureGate');
const { auditAction } = require('../../../middleware/auditLogger');
const { ApiError } = require('../../../middleware/errorHandler');
const { validate, validators } = require('../../../utils/validators');

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
 * @route GET /api/quick-replies
 * @desc Get all quick replies
 */
router.get('/', requireFeature('quick_replies'), async (req, res, next) => {
    try {
        ensureClient(req);
        const { category, search } = req.query;
        let query = {};
        if (req.client?.id) {
            query.client_id = req.client.id;
        }

        if (category) query.category = category;
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: searchRegex },
                { shortcut: searchRegex },
                { content: searchRegex }
            ];
        }

        const replies = await QuickReply.find(query)
            .sort({ usage_count: -1, shortcut: 1 });

        res.json({
            success: true,
            data: replies
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/quick-replies
 * @desc Create quick reply
 */
router.post('/',
    requireFeature('quick_replies'),
    [
        validators.requiredString('shortcut'),
        validators.requiredString('title'),
        validators.requiredString('content'),
        validate
    ],
    auditAction('create', 'quick_reply'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const { shortcut, title, content, category } = req.body;

            // Ensure shortcut starts with /
            const formattedShortcut = shortcut.startsWith('/') ? shortcut : `/${shortcut}`;

            const reply = await QuickReply.create({
                client_id: req.client.id,
                shortcut: formattedShortcut,
                title,
                content,
                category,
                created_by: req.user.id
            });

            res.status(201).json({
                success: true,
                data: reply
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /api/quick-replies/:id
 * @desc Update quick reply
 */
router.put('/:id',
    requireFeature('quick_replies'),
    auditAction('update', 'quick_reply'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const reply = await QuickReply.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!reply) throw ApiError.notFound('Quick reply not found');

            Object.assign(reply, req.body);
            await reply.save();

            res.json({
                success: true,
                data: reply
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/quick-replies/:id
 * @desc Delete quick reply
 */
router.delete('/:id',
    requireFeature('quick_replies'),
    auditAction('delete', 'quick_reply'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const reply = await QuickReply.findOne({
                _id: req.params.id,
                client_id: req.client.id
            });

            if (!reply) throw ApiError.notFound('Quick reply not found');

            await reply.deleteOne();

            res.json({
                success: true,
                message: 'Quick reply deleted'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/quick-replies/process
 * @desc Process shortcut in text
 */
router.post('/process', requireFeature('quick_replies'), async (req, res, next) => {
    try {
        ensureClient(req);
        const { message } = req.body;
        if (!message) return res.json({ success: true, data: '' });

        // Find shortcut (stupid simple matching for now)
        // Matches /shortcut at start or preceded by space
        const shortcutMatch = message.match(/(?:^|\s)(\/[\w-]+)/);

        if (shortcutMatch) {
            const shortcut = shortcutMatch[1];
            const clientFilter = req.client?.id ? { client_id: req.client.id } : {};
            const reply = await QuickReply.findOne({
                ...clientFilter,
                shortcut
            });

            if (reply) {
                // Increment usage
                reply.usage_count = (reply.usage_count || 0) + 1;
                await reply.save();

                // Replace shortcut with content
                const processedMessage = message.replace(shortcut, reply.content);
                return res.json({
                    success: true,
                    data: processedMessage,
                    match: reply
                });
            }
        }

        res.json({
            success: true,
            data: message
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/quick-replies/stats/overview
 * @desc Quick reply usage stats
 */
router.get('/stats/overview', requireFeature('quick_replies'), async (req, res, next) => {
    try {
        ensureClient(req);
        const stats = await QuickReply.aggregate([
            { $match: { client_id: new mongoose.Types.ObjectId(req.client.id) } },
            {
                $group: {
                    _id: null,
                    total_replies: { $sum: 1 },
                    total_usage: { $sum: '$usage_count' }
                }
            }
        ]);

        const clientFilter = req.client?.id ? { client_id: req.client.id } : {};
        const topReplies = await QuickReply.find(clientFilter)
            .sort({ usage_count: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                total_replies: stats[0]?.total_replies || 0,
                total_usage: stats[0]?.total_usage || 0,
                top_replies: topReplies
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
