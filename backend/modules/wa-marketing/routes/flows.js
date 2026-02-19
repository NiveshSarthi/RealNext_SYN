const express = require('express');
const router = express.Router();
const Flow = require('../models/Flow');
// We need auth middleware. Assuming it's available in backend/middleware/auth
// Adjust path if necessary based on folder structure.
// Given: backend/middleware/auth.js and we are in backend/modules/wa-marketing/routes/flows.js
// Path to middleware: ../../../middleware/auth
const { authenticate } = require('../../../middleware/auth');

// 1. List flows
router.get('/', authenticate, async (req, res) => {
    try {
        const flows = await Flow.find({ client_id: req.client.id })
            .sort({ updated_at: -1 })
            .select('id name description is_active updated_at created_at');

        res.json(flows);
    } catch (error) {
        console.error('Error fetching flows:', error);
        res.status(500).json({ message: 'Server error fetching flows' });
    }
});

// 2. Create flow
router.post('/', authenticate, async (req, res) => {
    try {
        require('fs').writeFileSync('debug_flow_context.txt', `User: ${JSON.stringify(req.user, null, 2)}\nClient: ${JSON.stringify(req.client, null, 2)}\nBody: ${JSON.stringify(req.body, null, 2)}\n`);
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const newFlow = new Flow({
            client_id: req.client.id,
            name,
            description,
            created_by: req.user.id,
            Message_Blocks: [],
            Message_Routes: []
        });

        const savedFlow = await newFlow.save();

        res.status(201).json({
            status: 'success',
            message: 'Flow created successfully',
            flow_id: savedFlow.id
        });
    } catch (error) {
        console.error('Error creating flow:', error);
        require('fs').writeFileSync('debug_flow_error.txt', `Error: ${error.message}\nStack: ${error.stack}\n`);
        res.status(500).json({ message: `Server error creating flow: ${error.message}` });
    }
});

// 3. Get single flow
router.get('/:id', authenticate, async (req, res) => {
    try {
        const flow = await Flow.findOne({
            _id: req.params.id,
            client_id: req.client.id
        });

        if (!flow) {
            return res.status(404).json({ message: 'Flow not found' });
        }

        // Return strictly formatted response as per guide
        res.json({
            status: 'success',
            data: [
                { Message_Blocks: flow.Message_Blocks || [] },
                { Message_Routes: flow.Message_Routes || [] }
            ],
            meta: {
                id: flow.id,
                name: flow.name,
                description: flow.description
            }
        });
    } catch (error) {
        console.error('Error fetching flow:', error);
        res.status(500).json({ message: 'Server error fetching flow' });
    }
});

// 4. Update flow
router.put('/:id', authenticate, async (req, res) => {
    try {
        const updateData = {};
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.description !== undefined) updateData.description = req.body.description;
        if (req.body.Message_Blocks) updateData.Message_Blocks = req.body.Message_Blocks;
        if (req.body.Message_Routes) updateData.Message_Routes = req.body.Message_Routes;

        const flow = await Flow.findOneAndUpdate(
            { _id: req.params.id, client_id: req.client.id },
            { $set: updateData },
            { new: true }
        );

        if (!flow) {
            return res.status(404).json({ message: 'Flow not found' });
        }

        res.json({
            status: 'success',
            message: 'Flow updated successfully'
        });
    } catch (error) {
        console.error('Error updating flow:', error);
        res.status(500).json({ message: 'Server error updating flow' });
    }
});

// 5. Delete flow
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const flow = await Flow.findOneAndDelete({
            _id: req.params.id,
            client_id: req.client.id
        });

        if (!flow) {
            return res.status(404).json({ message: 'Flow not found' });
        }

        res.json({
            status: 'success',
            message: 'Flow deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting flow:', error);
        res.status(500).json({ message: 'Server error deleting flow' });
    }
});

module.exports = router;
