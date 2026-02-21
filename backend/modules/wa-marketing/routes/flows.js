const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const waService = require('../../../services/waService');
const logger = require('../../../config/logger');
const { ApiError } = require('../../../middleware/errorHandler');

// Middleware chain for security and client context
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

/**
 * @route GET /api/flows
 * @desc List all flows from WFB External API
 */
router.get('/', async (req, res, next) => {
    try {
        const flows = await waService.getFlows();
        res.json(flows);
    } catch (error) {
        logger.error('Error fetching flows:', error.message);
        next(error);
    }
});

/**
 * @route POST /api/flows
 * @desc Create a new flow in WFB External API
 */
router.post('/', async (req, res, next) => {
    try {
        const { name, categories, description, Message_Blocks, Message_Routes, metadata } = req.body;

        if (!name) {
            throw new ApiError(400, 'Name is required');
        }

        const flowData = {
            name,
            description: description || '',
            Message_Blocks: Message_Blocks || [],
            Message_Routes: Message_Routes || [],
            metadata: metadata || { categories: categories || ['other'] }
        };

        const result = await waService.createFlow(flowData);

        res.status(201).json({
            status: 'success',
            message: 'Flow created successfully',
            flow_id: result.id || result._id, // API might return id or _id
            data: result
        });
    } catch (error) {
        logger.error('Error creating flow:', error.message);
        next(error);
    }
});

/**
 * @route GET /api/flows/:id
 * @desc Get flow details from WFB External API
 */
router.get('/:id', async (req, res, next) => {
    try {
        const result = await waService.getFlow(req.params.id);
        logger.info(`[DEBUG_FLOW] Raw Flow Result Keys: ${result ? Object.keys(result).join(', ') : 'null'}`);
        if (result.data) {
            logger.info(`[DEBUG_FLOW] result.data Keys: ${Object.keys(result.data).join(', ')}`);
        }
        logger.info(`[DEBUG_FLOW] Blocks/Routes presence: ${JSON.stringify({
            blocks: !!result.Message_Blocks,
            data_blocks: !!result.data?.Message_Blocks,
            routes: !!result.Message_Routes,
            data_routes: !!result.data?.Message_Routes
        })}`);
        // The frontend expects: { status: 'success', data: {Message_Blocks: [], Message_Routes: []}, meta: {...} }
        // Note: jsonToFlow supports both { Message_Blocks: [...] } and [{Message_Blocks: [...]}]

        const blocks = result.Message_Blocks || result.data?.Message_Blocks || result.blocks || result.message_blocks || result.data?.blocks || [];
        const routes = result.Message_Routes || result.data?.Message_Routes || result.routes || result.message_routes || result.data?.routes || [];

        return res.json({
            status: 'success',
            data: {
                Message_Blocks: blocks,
                Message_Routes: routes
            },
            meta: {
                id: result.id || result._id || req.params.id,
                name: result.name || result.meta?.name || 'Untitled Flow',
                description: result.description || result.meta?.description || '',
                is_active: result.is_active ?? result.meta?.is_active ?? true,
                created_at: result.created_at || result.meta?.created_at,
                updated_at: result.updated_at || result.meta?.updated_at
            }
        });
    } catch (error) {
        logger.error('Error fetching flow detail:', error.message);
        next(error);
    }
});

/**
 * @route PUT /api/flows/:id
 * @desc Update flow in WFB External API
 */
router.put('/:id', async (req, res, next) => {
    try {
        const result = await waService.updateFlow(req.params.id, req.body);
        res.json({
            status: 'success',
            message: 'Flow updated successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error updating flow:', error.message);
        next(error);
    }
});

/**
 * @route DELETE /api/flows/:id
 * @desc Delete flow from WFB External API
 */
router.delete('/:id', async (req, res, next) => {
    try {
        await waService.deleteFlow(req.params.id);
        res.json({
            status: 'success',
            message: 'Flow deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting flow:', error.message);
        next(error);
    }
});

module.exports = router;
