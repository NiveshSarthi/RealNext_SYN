const express = require('express');
const router = express.Router();
const { User, Role } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireSuperAdmin } = require('../../middleware/roles');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');

// Middleware
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/admin/team
 * @desc Get all super admin team members
 */
router.get('/', async (req, res, next) => {
    try {
        const teamMembers = await User.findAll({
            where: {
                // Should return users who have a system_role_id OR are strictly super_admin
                [require('sequelize').Op.or]: [
                    { is_super_admin: true },
                    { system_role_id: { [require('sequelize').Op.ne]: null } }
                ]
            },
            attributes: ['id', 'name', 'email', 'phone', 'is_super_admin', 'system_role_id', 'status', 'last_login_at', 'created_at'],
            include: [
                {
                    model: Role,
                    as: 'systemRole', // Ensure association exists in User model (User.belongsTo(Role, { as: 'systemRole', foreignKey: 'system_role_id' }))
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: teamMembers
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/team/invite
 * @desc Invite a new super admin team member
 */
router.post('/invite', auditAction('invite', 'admin_team'), async (req, res, next) => {
    try {
        const { email, name, system_role_id } = req.body;

        if (!email || !name) {
            throw ApiError.badRequest('Email and name are required');
        }

        // Check user existence
        let user = await User.findOne({ where: { email } });
        if (user) {
            // If user exists, just update their system role
            user.system_role_id = system_role_id || null;
            // Ensure they are NOT marked as generic super admin unless explicitly requested?
            // For now, let's assume this grants them access.
            await user.save();
        } else {
            // Create new user
            const bcrypt = require('bcryptjs');
            const tempPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            user = await User.create({
                email,
                name,
                password_hash: hashedPassword,
                status: 'active',
                system_role_id: system_role_id || null,
                is_super_admin: false // Default to false, permissions handled via system_role
            });

            // TODO: Send email
            console.log(`[ADMIN-TEAM] Created user ${email} with temp password: ${tempPassword}`);
        }

        res.status(201).json({
            success: true,
            data: user,
            message: 'Team member invited successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route DELETE /api/admin/team/:id
 * @desc Remove access for a team member
 */
router.delete('/:id', auditAction('remove', 'admin_team'), async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        // Prevent deleting self
        if (user.id === req.user.id) {
            throw ApiError.forbidden('Cannot remove yourself');
        }

        user.system_role_id = null;
        user.is_super_admin = false;
        await user.save();

        res.json({
            success: true,
            message: 'Team member removed successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
