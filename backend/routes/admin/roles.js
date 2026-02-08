const express = require('express');
const router = express.Router();
const { Role, Permission } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireSuperAdmin } = require('../../middleware/roles');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');

// Middleware
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/admin/roles
 * @desc Get all system roles
 */
router.get('/', async (req, res, next) => {
    try {
        const roles = await Role.findAll({
            where: { tenant_id: null },
            order: [['created_at', 'ASC']]
        });

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/roles
 * @desc Create a new system role
 */
router.post('/', auditAction('create', 'system_role'), async (req, res, next) => {
    try {
        const { name, description, permissions } = req.body;

        if (!name) throw ApiError.badRequest('Role name is required');

        const role = await Role.create({
            name,
            description,
            permissions: permissions || [],
            tenant_id: null,
            is_system: false // Created by admin, but not a hardcoded system code
        });

        res.status(201).json({
            success: true,
            data: role
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/admin/roles/:id
 * @desc Update a system role
 */
router.put('/:id', auditAction('update', 'system_role'), async (req, res, next) => {
    try {
        const role = await Role.findOne({ where: { id: req.params.id, tenant_id: null } });
        if (!role) throw ApiError.notFound('Role not found');

        const { name, description, permissions } = req.body;

        await role.update({
            name: name || role.name,
            description: description || role.description,
            permissions: permissions || role.permissions
        });

        res.json({
            success: true,
            data: role
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route DELETE /api/admin/roles/:id
 * @desc Delete a system role
 */
router.delete('/:id', auditAction('delete', 'system_role'), async (req, res, next) => {
    try {
        const role = await Role.findOne({ where: { id: req.params.id, tenant_id: null } });
        if (!role) throw ApiError.notFound('Role not found');

        // Check for usage
        // const usedCount = await User.count({ where: { system_role_id: role.id } });
        // if (usedCount > 0) throw ApiError.conflict('Role is in use');

        await role.destroy();

        res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
