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

        // Match the frontend's expected structure if necessary
        // The frontend expect: { status: 'success', data: [{Message_Blocks}, {Message_Routes}], meta: {...} }
        // If the external API already returns this, just pass it through.
        // Assuming we might need to wrap it based on previous local implementation:

        if (result.Message_Blocks && result.Message_Routes) {
            return res.json({
                status: 'success',
                data: [
                    { Message_Blocks: result.Message_Blocks },
                    { Message_Routes: result.Message_Routes }
                ],
                meta: {
                    id: result.id || result._id,
                    name: result.name,
                    description: result.description,
                    is_active: result.is_active,
                    created_at: result.created_at,
                    updated_at: result.updated_at
                }
            });
        }

        res.json(result);
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
