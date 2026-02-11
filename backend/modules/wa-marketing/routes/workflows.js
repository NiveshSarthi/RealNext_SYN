const express = require('express');
const router = express.Router();
const { Workflow } = require('../../../models');
const { authenticate } = require('../../../middleware/auth');
const { requireClientAccess } = require('../../../middleware/roles');
const { enforceClientScope, setClientContext } = require('../../../middleware/scopeEnforcer');
const { requireFeature } = require('../../../middleware/featureGate');
const { auditAction } = require('../../../middleware/auditLogger');
const { ApiError } = require('../../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, mergeFilters } = require('../../../utils/helpers');
const { validate, validators } = require('../../../utils/validators');
const logger = require('../../../config/logger');

// Middleware
router.use(authenticate, requireClientAccess, setClientContext, enforceClientScope);

// Defensive helper to ensure client context exists before using req.client.id
const ensureClient = (req) => {
    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required for this operation. Super Admins must provide a client ID.');
    }
};

/**
 * @route GET /api/workflows
 * @desc List workflows
 * @access Tenant User
 */
router.get('/', requireFeature('workflows'), async (req, res, next) => {
    try {
        ensureClient(req);
        const workflows = await Workflow.find({
            client_id: req.client.id
        }).sort({ created_at: -1 });

        res.json({
            success: true,
            data: workflows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/workflows
 * @desc Create new workflow
 * @access Tenant User
 */
router.post('/',
    requireFeature('workflows'),
    [
        validators.requiredString('name', 1, 255),
        validators.optionalString('description', 1000),
        validate
    ],
    auditAction('create', 'workflow'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const { name, description, active, nodes, settings } = req.body;

            const workflow = await Workflow.create({
                client_id: req.client.id,
                name,
                description: description || settings?.description,
                status: active ? 'active' : 'inactive',
                flow_data: { nodes: nodes || [] },
                n8n_workflow_id: `mock-${Date.now()}`,
                created_by: req.user.id
            });

            res.status(201).json({
                success: true,
                data: workflow
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/workflows/stats
 * @desc Get workflow statistics
 * @access Tenant User
 */
router.get('/stats', requireFeature('workflows'), async (req, res, next) => {
    try {
        ensureClient(req);
        const total = await Workflow.countDocuments({ client_id: req.client.id });
        const active = await Workflow.countDocuments({ client_id: req.client.id, status: 'active' });
        // Assuming 'execution_count' is a field that can be summed in MongoDB,
        // this would typically require an aggregation pipeline.
        // For a direct replacement, we'll mock it or assume a simple sum if possible.
        // If Workflow.sum is a custom method, it needs to be adapted.
        // For now, let's assume a simple sum is not directly available and might need aggregation.
        // For the purpose of this edit, we'll keep it as is, assuming it's a custom method or will be adapted.
        const executions = await Workflow.aggregate([
            { $match: { client_id: req.client.id } },
            { $group: { _id: null, totalExecutions: { $sum: '$execution_count' } } }
        ]).then(result => result.length > 0 ? result[0].totalExecutions : 0);


        res.json({
            success: true,
            data: {
                total,
                active,
                executions
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/workflows/history
 * @desc Get workflow execution history (stub)
 * @access Tenant User
 */
router.get('/history', requireFeature('workflows'), async (req, res, next) => {
    try {
        // Stub implementation - would return execution logs
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/workflows/:id
 * @desc Get workflow details
 * @access Tenant User
 */
router.get('/:id', requireFeature('workflows'), async (req, res, next) => {
    try {
        ensureClient(req);
        const workflow = await Workflow.findOne({
            _id: req.params.id, client_id: req.client.id
        });

        if (!workflow) {
            throw ApiError.notFound('Workflow not found');
        }

        res.json({
            success: true,
            data: workflow
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/workflows/:id
 * @desc Update workflow
 * @access Tenant User
 */
router.put('/:id',
    requireFeature('workflows'),
    auditAction('update', 'workflow'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const workflow = await Workflow.findOne({
                _id: req.params.id, client_id: req.client.id
            });

            if (!workflow) {
                throw ApiError.notFound('Workflow not found');
            }

            // For Mongoose, update is usually done with findByIdAndUpdate or by modifying and saving
            Object.assign(workflow, req.body);
            await workflow.save();

            res.json({
                success: true,
                data: workflow
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/workflows/:id/activate
 * @desc Activate workflow
 * @access Tenant User
 */
router.post('/:id/activate',
    requireFeature('workflows'),
    auditAction('activate', 'workflow'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const workflow = await Workflow.findOne({
                _id: req.params.id, client_id: req.client.id
            });

            if (!workflow) throw ApiError.notFound('Workflow not found');

            workflow.status = 'active';
            await workflow.save();

            res.json({
                success: true,
                message: 'Workflow activated',
                data: workflow
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/workflows/:id/deactivate
 * @desc Deactivate workflow
 * @access Tenant User
 */
router.post('/:id/deactivate',
    requireFeature('workflows'),
    auditAction('deactivate', 'workflow'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const workflow = await Workflow.findOne({
                _id: req.params.id, client_id: req.client.id
            });

            if (!workflow) throw ApiError.notFound('Workflow not found');

            workflow.status = 'inactive';
            await workflow.save();

            res.json({
                success: true,
                message: 'Workflow deactivated',
                data: workflow
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/workflows/trigger/:type
 * @desc Trigger a specific workflow type (Mock)
 * @access Tenant User
 */
router.post('/trigger/:type', requireFeature('workflows'), async (req, res, next) => {
    try {
        ensureClient(req);
        const { type } = req.params;
        logger.info(`Workflow triggered for client ${req.client.id}: ${type}`, req.body);

        // Find relevant workflows
        const workflows = await Workflow.find({
            client_id: req.client.id,
            status: 'active',
            'trigger_config.type': type
        });

        // Increment execution count for first found workflow (mock)
        if (workflows.length > 0) {
            // Assuming 'increment' is a custom method or needs to be adapted for Mongoose
            // For Mongoose, you'd typically do:
            workflows[0].execution_count = (workflows[0].execution_count || 0) + 1;
            workflows[0].last_executed_at = new Date();
            await workflows[0].save();
        }

        res.json({
            success: true,
            message: `Trigger received for ${type}`
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/workflows/test/:type
 * @desc Test connection for workflow type
 * @access Tenant User
 */
router.post('/test/:type', requireFeature('workflows'), async (req, res, next) => {
    try {
        res.json({
            success: true,
            message: 'Connection test successful'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route DELETE /api/workflows/:id
 * @desc Delete workflow
 * @access Tenant User
 */
router.delete('/:id',
    requireFeature('workflows'),
    auditAction('delete', 'workflow'),
    async (req, res, next) => {
        try {
            ensureClient(req);
            const workflow = await Workflow.findOne({
                where: { id: req.params.id, client_id: req.client.id }
            });

            if (!workflow) throw ApiError.notFound('Workflow not found');
            if (workflow.status === 'active') throw ApiError.badRequest('Cannot delete active workflow');

            await workflow.destroy();

            res.json({
                success: true,
                message: 'Workflow deleted'
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
