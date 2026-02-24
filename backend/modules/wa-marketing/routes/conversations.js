const express = require('express');
const router = express.Router();
const { WaConversation, WaMessage } = require('../../../models');
const waService = require('../../../services/waService');
const { authenticate } = require('../../../middleware/auth');
const { requireFeature } = require('../../../middleware/featureGate');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const { ApiError } = require('../../../middleware/errorHandler');
const logger = require('../../../config/logger');

// All Live Chat routes require authentication, client context, and WA Marketing feature
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);
router.use(requireFeature('campaigns')); // Using campaigns as feature gate for all WA Marketing features

const ensureClient = (req) => {
    // Super admins can skip client context check for GET
    if (req.user?.is_super_admin && req.method === 'GET') {
        return;
    }

    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required.');
    }
};

/**
 * @route GET /api/wa-marketing/conversations
 * @desc Get all active conversations from local DB
 */
router.get('/', async (req, res, next) => {
    try {
        ensureClient(req);

        let query = {};
        if (req.client?.id) {
            query.client_id = req.client.id;
        }
        if (req.query.search) {
            query.$or = [
                { phone_number: { $regex: req.query.search, $options: 'i' } },
                { contact_name: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const conversations = await WaConversation.find(query)
            .sort({ last_timestamp: -1 })
            .limit(50); // Pagination can be added later

        res.json({
            success: true,
            data: {
                data: conversations,
                pagination: { current_page: 1, total_pages: 1, total_count: conversations.length }
            }
        });
    } catch (error) {
        logger.error('[WA Chat] Failed to fetch local conversations:', error);
        next(error);
    }
});

/**
 * @route GET /api/wa-marketing/conversations/:number/messages
 * @desc Get chat history for a specific phone number from local DB
 */
router.get('/:number/messages', async (req, res, next) => {
    try {
        ensureClient(req);
        const phoneNumber = req.params.number;

        const clientFilter = req.client?.id ? { client_id: req.client.id } : {};
        const conversation = await WaConversation.findOne({
            ...clientFilter,
            phone_number: phoneNumber
        });

        if (!conversation) {
            return res.json({ success: true, data: [] });
        }

        const messages = await WaMessage.find({
            ...clientFilter,
            conversation_id: conversation._id
        }).sort({ timestamp: 1 });

        // Reset unread count if viewing
        if (conversation.unread_count > 0) {
            conversation.unread_count = 0;
            await conversation.save();
        }

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        logger.error(`[WA Chat] Failed to fetch local messages for ${req.params.number}:`, error);
        next(error);
    }
});

/**
 * @route POST /api/wa-marketing/conversations/send
 * @desc Send a live chat message and store locally
 */
router.post('/send', async (req, res, next) => {
    try {
        ensureClient(req);
        const { to, message, phone_number_id } = req.body;
        if (!to || !message) {
            return res.status(400).json({ success: false, message: 'Message recipient and text are required' });
        }

        // 1. Ensure conversation exists locally
        let conversation = await WaConversation.findOne({ ...clientFilter, phone_number: to });
        if (!conversation) {
            conversation = await WaConversation.create({
                client_id: req.client.id,
                phone_number: to,
                contact_name: to,
                last_message: message,
                last_timestamp: new Date()
            });
        } else {
            conversation.last_message = message;
            conversation.last_timestamp = new Date();
            await conversation.save();
        }

        // 2. Save Message locally
        const newMessage = await WaMessage.create({
            client_id: req.client.id,
            conversation_id: conversation._id,
            body: message,
            direction: 'outgoing',
            type: 'text',
            status: 'sent',
            timestamp: new Date()
        });

        // 3. Attempt external send (try/catch to allow local saving even if WFB is offline)
        try {
            const payload = { to, message };
            if (phone_number_id) payload.phone_number_id = phone_number_id;

            const wfbResult = await waService.sendLiveMessage(payload);
            newMessage.external_id = wfbResult?.messages?.[0]?.id;
            newMessage.status = 'delivered';
            await newMessage.save();
        } catch (wfbError) {
            logger.warn(`[WA Chat] Failed external WFB send for ${to}. Saved locally.`, wfbError.message);
            newMessage.status = 'failed';
            await newMessage.save();
        }

        res.json({
            success: true,
            message: 'Message processed',
            data: newMessage
        });
    } catch (error) {
        logger.error('[WA Chat] Failed to process message locally:', error);
        next(error);
    }
});

module.exports = router;
