const express = require('express');
const router = express.Router();
const { QuickReply } = require('../../../models');
const { authenticate } = require('../../../middleware/auth');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope } = require('../../../middleware/scopeEnforcer');
const { requireFeature } = require('../../../middleware/featureGate');
const { auditAction } = require('../../../middleware/auditLogger');
const { ApiError } = require('../../../middleware/errorHandler');
const { validate, validators } = require('../../../utils/validators');

// Middleware
router.use(authenticate, requireClientAccess, enforceClientScope);

/**
 * @route GET /api/quick-replies
 * @desc Get all quick replies
 */
router.get('/', requireFeature('quick_replies'), async (req, res, next) => {
    try {
        const { category, search } = req.query;
        const where = { tenant_id: req.tenant.id };

        if (category) where.category = category;
        if (search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { shortcut: { [Op.iLike]: `%${search}%` } },
                { content: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const replies = await QuickReply.findAll({
            where,
            order: [['usage_count', 'DESC'], ['shortcut', 'ASC']]
        });

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
            const { shortcut, title, content, category } = req.body;

            // Ensure shortcut starts with /
            const formattedShortcut = shortcut.startsWith('/') ? shortcut : `/${shortcut}`;

            const reply = await QuickReply.create({
                tenant_id: req.tenant.id,
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
            const reply = await QuickReply.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!reply) throw ApiError.notFound('Quick reply not found');

            await reply.update(req.body);

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
            const reply = await QuickReply.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!reply) throw ApiError.notFound('Quick reply not found');

            await reply.destroy();

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
        const { message } = req.body;
        if (!message) return res.json({ success: true, data: '' });

        // Find shortcut (stupid simple matching for now)
        // Matches /shortcut at start or preceded by space
        const shortcutMatch = message.match(/(?:^|\s)(\/[\w-]+)/);

        if (shortcutMatch) {
            const shortcut = shortcutMatch[1];
            const reply = await QuickReply.findOne({
                where: { tenant_id: req.tenant.id, shortcut }
            });

            if (reply) {
                // Increment usage
                await reply.increment('usage_count');

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
 * @route GET /api/quick-replies/stats
 * @desc Quick reply usage stats
 */
router.get('/stats/overview', requireFeature('quick_replies'), async (req, res, next) => {
    try {
        const total = await QuickReply.count({ where: { tenant_id: req.tenant.id } });
        const usage = await QuickReply.sum('usage_count', { where: { tenant_id: req.tenant.id } }) || 0;
        const topReplies = await QuickReply.findAll({
            where: { tenant_id: req.tenant.id },
            order: [['usage_count', 'DESC']],
            limit: 5
        });

        res.json({
            success: true,
            data: {
                total_replies: total,
                total_usage: usage,
                top_replies: topReplies
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
