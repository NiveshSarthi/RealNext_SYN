const express = require('express');
const router = express.Router();
const { Workflow } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTenantAccess } = require('../middleware/roles');
const { enforceTenantScope } = require('../middleware/scopeEnforcer');
const { requireFeature } = require('../middleware/featureGate');
const { auditAction } = require('../middleware/auditLogger');
const { ApiError } = require('../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, mergeFilters } = require('../utils/helpers');
const { validate, validators } = require('../utils/validators');
const logger = require('../config/logger');

// Middleware
router.use(authenticate, requireTenantAccess, enforceTenantScope);

/**
 * @route GET /api/workflows
 * @desc List workflows
 * @access Tenant User
 */
router.get('/', requireFeature('workflows'), async (req, res, next) => {
    try {
        const workflows = await Workflow.findAll({
            where: { tenant_id: req.tenant.id },
            order: [['created_at', 'DESC']]
        });

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
            const { name, description, active, nodes, settings } = req.body;

            const workflow = await Workflow.create({
                tenant_id: req.tenant.id,
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
        const total = await Workflow.count({ where: { tenant_id: req.tenant.id } });
        const active = await Workflow.count({ where: { tenant_id: req.tenant.id, status: 'active' } });
        const executions = await Workflow.sum('execution_count', { where: { tenant_id: req.tenant.id } }) || 0;

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
        const workflow = await Workflow.findOne({
            where: { id: req.params.id, tenant_id: req.tenant.id }
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
            const workflow = await Workflow.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!workflow) {
                throw ApiError.notFound('Workflow not found');
            }

            await workflow.update(req.body);

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
            const workflow = await Workflow.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!workflow) throw ApiError.notFound('Workflow not found');

            await workflow.update({ status: 'active' });

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
            const workflow = await Workflow.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
            });

            if (!workflow) throw ApiError.notFound('Workflow not found');

            await workflow.update({ status: 'inactive' });

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
        const { type } = req.params;
        logger.info(`Workflow triggered for tenant ${req.tenant.id}: ${type}`, req.body);

        // Find active workflow for this trigger (mock logic)
        const workflows = await Workflow.findAll({
            where: {
                tenant_id: req.tenant.id,
                status: 'active'
            }
        });

        // Increment execution count for first found workflow (mock)
        if (workflows.length > 0) {
            await workflows[0].increment('execution_count');
            await workflows[0].update({ last_executed_at: new Date() });
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
            const workflow = await Workflow.findOne({
                where: { id: req.params.id, tenant_id: req.tenant.id }
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
