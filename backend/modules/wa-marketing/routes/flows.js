const express = require('express');
const router = express.Router();
// Remove Flow model dependency as we are switching to external API
// const Flow = require('../models/Flow');
const waService = require('../../../services/waService');
const { authenticate } = require('../../../middleware/auth');
const logger = require('../../../config/logger');

// 1. List flows
router.get('/', authenticate, async (req, res) => {
    try {
        // Proxy to External API
        const flows = await waService.getFlows();
        // Assuming external API returns the list or { data: list }
        // Adjust if necessary depending on actual external response structure
        // If flows is { data: [...] }, return flows.data
        const flowList = Array.isArray(flows) ? flows : (flows.data || []);

        res.json(flowList);
    } catch (error) {
        console.error('Error fetching flows:', error.message);
        res.status(500).json({ message: 'Server error fetching flows from external service' });
    }
});

// 2. Create flow
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, categories, clone_flow_id } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        // Construct payload for external API
        // The doc doesn't specify payload for /flows POST exactly, assuming standard fields
        const payload = {
            name,
            categories: categories || ['other'],
            clone_flow_id // Optional
        };

        const newFlow = await waService.createFlow(payload);

        res.status(201).json({
            status: 'success',
            message: 'Flow created successfully',
            flow_id: newFlow.id || newFlow._id,
            data: newFlow
        });
    } catch (error) {
        console.error('Error creating flow:', error.message);
        res.status(500).json({ message: `Server error creating flow: ${error.message}` });
    }
});

// 3. Get single flow
router.get('/:id', authenticate, async (req, res) => {
    try {
        const flow = await waService.getFlow(req.params.id);

        if (!flow) {
            return res.status(404).json({ message: 'Flow not found' });
        }

        // Return response matching frontend expectations if possible, or just pass through
        // The previous local implementation returned { status: 'success', data: [ {Message_Blocks}, {Message_Routes} ], meta: {...} }
        // We should check if the external API returns compatible structure.
        // Assuming External API returns standard flow object.
        // We might need to transform it if the frontend relies heavily on specific structure.

        res.json({
            status: 'success',
            data: flow // Pass through external data
        });
    } catch (error) {
        console.error('Error fetching flow:', error.message);
        res.status(500).json({ message: 'Server error fetching flow' });
    }
});

// 4. Update flow
router.put('/:id', authenticate, async (req, res) => {
    try {
        const updateData = req.body;
        // Construct payload. API doc for PUT /flows/{flow_id} "Update flow structure"
        // Typically accepts name, validation_schema, etc.
        // We pass the body through.

        const updatedFlow = await waService.updateFlow(req.params.id, updateData);

        res.json({
            status: 'success',
            message: 'Flow updated successfully',
            data: updatedFlow
        });
    } catch (error) {
        console.error('Error updating flow:', error.message);
        res.status(500).json({ message: 'Server error updating flow' });
    }
});

// 5. Delete flow
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await waService.deleteFlow(req.params.id);

        res.json({
            status: 'success',
            message: 'Flow deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting flow:', error.message);
        res.status(500).json({ message: 'Server error deleting flow' });
    }
});

module.exports = router;
