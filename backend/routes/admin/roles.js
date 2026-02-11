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
        const roles = await Role.find({ client_id: null })
            .sort({ created_at: 1 });

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
            client_id: null,
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
        const role = await Role.findOne({ _id: req.params.id, client_id: null });
        if (!role) throw ApiError.notFound('Role not found');

        const { name, description, permissions } = req.body;

        role.name = name || role.name;
        role.description = description || role.description;
        role.permissions = permissions || role.permissions;

        await role.save();

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
        const role = await Role.findOne({ _id: req.params.id, client_id: null });
        if (!role) throw ApiError.notFound('Role not found');

        // Check for usage
        const usedCount = await User.countDocuments({ system_role_id: role._id });
        if (usedCount > 0) throw ApiError.conflict('Role is in use');

        await Role.deleteOne({ _id: role._id });

        res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
