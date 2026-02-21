const express = require('express');
const router = express.Router();
const { Flow } = require('../../../models');
const { authenticate } = require('../../../middleware/auth');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const logger = require('../../../config/logger');
const { ApiError } = require('../../../middleware/errorHandler');

// Flows are stored locally in MongoDB (WFB external API has no /flows endpoint)
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

// Defensive helper
const ensureClient = (req) => {
    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required.');
    }
};


// 1. List flows
router.get('/', async (req, res) => {
    try {
        const clientId = req.client?.id;
        if (!clientId) return res.status(400).json({ message: 'Client context required' });

        const flows = await Flow.find({ client_id: clientId }).sort({ updated_at: -1 });
        res.json(flows);
    } catch (error) {
        logger.error('Error fetching flows:', error.message);
        res.status(500).json({ message: 'Server error fetching flows' });
    }
});

// 2. Create flow
router.post('/', async (req, res) => {
    try {
        const clientId = req.client?.id;
        if (!clientId) return res.status(400).json({ message: 'Client context required' });

        const { name, categories, description, Message_Blocks, Message_Routes, metadata } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const flow = await Flow.create({
            client_id: clientId,
            name,
            description: description || '',
            Message_Blocks: Message_Blocks || [],
            Message_Routes: Message_Routes || [],
            metadata: metadata || { categories: categories || ['other'] },
            created_by: req.user?.id
        });

        res.status(201).json({
            status: 'success',
            message: 'Flow created successfully',
            flow_id: flow._id,
            data: flow
        });
    } catch (error) {
        logger.error('Error creating flow:', error.message);
        res.status(500).json({ message: `Server error creating flow: ${error.message}` });
    }
});

// 3. Get single flow
router.get('/:id', async (req, res) => {
    try {
        const clientId = req.client?.id;
        const flow = await Flow.findOne({ _id: req.params.id, client_id: clientId });

        if (!flow) {
            return res.status(404).json({ message: 'Flow not found' });
        }

        res.json({
            status: 'success',
            data: [
                { Message_Blocks: flow.Message_Blocks },
                { Message_Routes: flow.Message_Routes }
            ],
            meta: {
                id: flow._id,
                name: flow.name,
                description: flow.description,
                is_active: flow.is_active,
                created_at: flow.created_at,
                updated_at: flow.updated_at
            }
        });
    } catch (error) {
        logger.error('Error fetching flow:', error.message);
        res.status(500).json({ message: 'Server error fetching flow' });
    }
});

// 4. Update flow
router.put('/:id', async (req, res) => {
    try {
        const clientId = req.client?.id;
        const flow = await Flow.findOne({ _id: req.params.id, client_id: clientId });

        if (!flow) {
            return res.status(404).json({ message: 'Flow not found' });
        }

        const { name, description, Message_Blocks, Message_Routes, is_active, metadata } = req.body;

        if (name !== undefined) flow.name = name;
        if (description !== undefined) flow.description = description;
        if (Message_Blocks !== undefined) flow.Message_Blocks = Message_Blocks;
        if (Message_Routes !== undefined) flow.Message_Routes = Message_Routes;
        if (is_active !== undefined) flow.is_active = is_active;
        if (metadata !== undefined) flow.metadata = metadata;

        await flow.save();

        res.json({
            status: 'success',
            message: 'Flow updated successfully',
            data: flow
        });
    } catch (error) {
        logger.error('Error updating flow:', error.message);
        res.status(500).json({ message: 'Server error updating flow' });
    }
});

// 5. Delete flow
router.delete('/:id', async (req, res) => {
    try {
        const clientId = req.client?.id;
        const result = await Flow.deleteOne({ _id: req.params.id, client_id: clientId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Flow not found' });
        }

        res.json({
            status: 'success',
            message: 'Flow deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting flow:', error.message);
        res.status(500).json({ message: 'Server error deleting flow' });
    }
});

module.exports = router;
