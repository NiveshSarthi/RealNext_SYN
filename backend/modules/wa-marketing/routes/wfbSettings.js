const express = require('express');
const router = express.Router();
const { WaSetting } = require('../../../models');
const { authenticate } = require('../../../middleware/auth');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const logger = require('../../../config/logger');
const { ApiError } = require('../../../middleware/errorHandler');

// All routes require authentication and target tenant context
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

// Helper
const ensureClient = (req) => {
    // Super admins can skip client context check for GET
    if (req.user?.is_super_admin && req.method === 'GET') {
        return;
    }

    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required for isolated configurations.');
    }
};

/**
 * @route GET /api/wfb-settings/whatsapp
 * @desc Get WhatsApp API Settings natively from Tenant DB
 */
router.get('/whatsapp', async (req, res, next) => {
    try {
        ensureClient(req);
        let settings = await WaSetting.findOne({ client_id: req.client.id });
        if (!settings) {
            settings = { meta_app_id: '', waba_id: '', system_user_token: '', webhook_verify_token: '' };
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        logger.error('[WFB_API] Failed to get local WA Settings', error);
        next(error);
    }
});

/**
 * @route POST /api/wfb-settings/whatsapp
 * @desc Save WhatsApp API Settings natively to Tenant DB
 */
router.post('/whatsapp', async (req, res, next) => {
    try {
        ensureClient(req);
        const { meta_app_id, waba_id, system_user_token, webhook_verify_token } = req.body;

        const settings = await WaSetting.findOneAndUpdate(
            { client_id: req.client.id },
            {
                $set: { meta_app_id, waba_id, system_user_token, webhook_verify_token }
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, data: settings });
    } catch (error) {
        logger.error('[WFB_API] Failed to save local WA Settings', error);
        next(error);
    }
});

/**
 * @route GET /api/wfb-settings/openai
 * @desc Get OpenAI API Settings
 */
router.get('/openai', async (req, res, next) => {
    try {
        ensureClient(req);
        let settings = await WaSetting.findOne({ client_id: req.client.id });
        const openAiData = settings?.metadata?.openai || { api_key: '', model: 'gpt-3.5-turbo' };
        res.json({ success: true, data: openAiData });
    } catch (error) {
        logger.error('[WFB_API] Failed to get local OpenAI Settings', error);
        next(error);
    }
});

/**
 * @route POST /api/wfb-settings/openai
 * @desc Save OpenAI API Settings
 */
router.post('/openai', async (req, res, next) => {
    try {
        ensureClient(req);
        const settings = await WaSetting.findOneAndUpdate(
            { client_id: req.client.id },
            { $set: { 'metadata.openai': req.body } },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: settings.metadata.openai });
    } catch (error) {
        logger.error('[WFB_API] Failed to save local OpenAI Settings', error);
        next(error);
    }
});

/**
 * @route GET /api/wfb-settings/phone-numbers
 * @desc Get registered Phone Numbers for Tenant
 */
router.get('/phone-numbers', async (req, res, next) => {
    try {
        ensureClient(req);
        const settings = await WaSetting.findOne({ client_id: req.client.id });
        const numbers = settings?.phone_numbers || [];
        res.json({ success: true, data: numbers });
    } catch (error) {
        logger.error('[WFB_API] Failed to get local Phone Numbers', error);
        next(error);
    }
});

/**
 * @route POST /api/wfb-settings/phone-numbers
 * @desc Register a new Phone Number for Tenant
 */
router.post('/phone-numbers', async (req, res, next) => {
    try {
        ensureClient(req);
        // Ensure an ID is generated for custom manipulation
        const newPhone = { ...req.body, _id: req.body._id || new Date().getTime().toString() };

        const settings = await WaSetting.findOneAndUpdate(
            { client_id: req.client.id },
            { $push: { phone_numbers: newPhone } },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: newPhone });
    } catch (error) {
        logger.error('[WFB_API] Failed to add local Phone Number', error);
        next(error);
    }
});

/**
 * @route PUT /api/wfb-settings/phone-numbers/:id
 * @desc Update a Phone Number for Tenant
 */
router.put('/phone-numbers/:id', async (req, res, next) => {
    try {
        ensureClient(req);
        const settings = await WaSetting.findOne({ client_id: req.client.id });
        if (!settings) throw new ApiError(404, 'Settings not found');

        const phoneIndex = settings.phone_numbers.findIndex(p => p._id === req.params.id || p.id === req.params.id);
        if (phoneIndex === -1) throw new ApiError(404, 'Phone number not found');

        settings.phone_numbers[phoneIndex] = { ...settings.phone_numbers[phoneIndex], ...req.body };
        settings.markModified('phone_numbers');
        await settings.save();

        res.json({ success: true, data: settings.phone_numbers[phoneIndex] });
    } catch (error) {
        logger.error(`[WFB_API] Failed to update local Phone Number ${req.params.id}`, error);
        next(error);
    }
});

module.exports = router;
