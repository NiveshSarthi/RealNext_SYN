const express = require('express');
const router = express.Router();
const { User, ClientUser, Client, Role } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireClientAccess } = require('../middleware/roles');
const { enforceClientScope } = require('../middleware/scopeEnforcer');
const { ApiError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

// Middleware
router.use(authenticate, requireClientAccess, enforceClientScope);

/**
 * @route GET /api/team
 * @desc Get all team members for the tenant
 */
router.get('/', async (req, res, next) => {
    try {
        const clientId = req.client.id;

        const [teamMembers, superAdmins] = await Promise.all([
            ClientUser.find({ client_id: clientId })
                .populate({
                    path: 'user_id',
                    select: 'name email phone avatar_url status last_login_at created_at'
                })
                .populate({
                    path: 'role_id',
                    select: 'name description permissions'
                })
                .sort({ created_at: -1 }),
            User.find({
                $or: [
                    { is_super_admin: true },
                    { system_role_id: { $ne: null } }
                ]
            })
                .select('name email phone avatar_url status last_login_at created_at is_super_admin system_role_id')
        ]);

        const memberMap = new Map();

        // Add Client Members first
        teamMembers.forEach(tm => {
            if (tm.user_id) {
                memberMap.set(tm.user_id._id.toString(), {
                    id: tm._id,
                    user_id: tm.user_id._id,
                    name: tm.user_id.name,
                    email: tm.user_id.email,
                    phone: tm.user_id.phone,
                    avatar_url: tm.user_id.avatar_url,
                    status: tm.user_id.status,
                    role: tm.role,
                    role_id: tm.role_id?._id,
                    custom_role: tm.role_id ? {
                        id: tm.role_id._id,
                        name: tm.role_id.name,
                        description: tm.role_id.description
                    } : null,
                    is_owner: tm.is_owner,
                    department: tm.department,
                    last_login_at: tm.user_id.last_login_at,
                    joined_at: tm.created_at
                });
            }
        });

        // Add Super Admins and System Users if not already present
        superAdmins.forEach(sa => {
            if (!memberMap.has(sa._id.toString())) {
                memberMap.set(sa._id.toString(), {
                    id: sa._id, // Using user ID as fallback ID
                    user_id: sa._id,
                    name: sa.name,
                    email: sa.email,
                    phone: sa.phone,
                    avatar_url: sa.avatar_url,
                    status: sa.status,
                    role: sa.is_super_admin ? 'admin' : 'system_user', // Differentiate roles
                    role_id: null,
                    custom_role: null,
                    is_owner: false,
                    department: 'Global',
                    last_login_at: sa.last_login_at,
                    joined_at: sa.created_at,
                    is_super_admin: sa.is_super_admin
                });
            }
        });

        const formattedMembers = Array.from(memberMap.values());

        res.json({
            success: true,
            data: formattedMembers
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/team/invite
 * @desc Invite a new team member
 */
router.post('/invite', async (req, res, next) => {
    try {
        const { email, name, role, role_id, department } = req.body;
        const clientId = req.client.id;

        // Validate required fields
        if (!email || !name) {
            throw ApiError.badRequest('Email and name are required');
        }

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create new user with temporary password
            const tempPassword = Math.random().toString(36).slice(-10);
            user = await User.create({
                email,
                name,
                password_hash: tempPassword,
                status: 'active'
            });

            // TODO: Send invitation email with temp password
            logger.info(`New user created: ${email} with temp password: ${tempPassword}`);
        }

        // Check if user is already a team member
        const existingMember = await ClientUser.findOne({
            client_id: clientId,
            user_id: user.id
        });

        if (existingMember) {
            throw ApiError.conflict('User is already a team member');
        }

        // Create client user relationship
        const clientUser = await ClientUser.create({
            client_id: clientId,
            user_id: user.id,
            role: role || 'user',
            role_id: role_id || null,
            department: department || null,
            is_owner: false
        });

        // Fetch the created member with associations
        const newMember = await ClientUser.findById(clientUser._id)
            .populate({
                path: 'user_id',
                select: 'name email phone avatar_url status'
            })
            .populate({
                path: 'role_id',
                select: 'name description'
            });

        res.status(201).json({
            success: true,
            data: {
                id: newMember._id,
                user_id: newMember.user_id?._id,
                name: newMember.user_id?.name,
                email: newMember.user_id?.email,
                role: newMember.role,
                role_id: newMember.role_id?._id,
                custom_role: newMember.role_id,
                department: newMember.department,
                is_owner: newMember.is_owner
            },
            message: 'Team member invited successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PATCH /api/team/:userId
 * @desc Update team member role/details
 */
router.patch('/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { role, role_id, department, status } = req.body;
        const clientId = req.client.id;

        const clientUser = await ClientUser.findOne({
            client_id: clientId,
            user_id: userId
        });

        if (!clientUser) {
            throw ApiError.notFound('Team member not found');
        }

        // Prevent modifying the owner
        if (clientUser.is_owner) {
            throw ApiError.forbidden('Cannot modify the client owner');
        }

        // Update fields
        if (role !== undefined) clientUser.role = role;
        if (role_id !== undefined) clientUser.role_id = role_id;
        if (department !== undefined) clientUser.department = department;

        await clientUser.save();

        // If status is being updated, update the user record
        if (status !== undefined) {
            await User.updateOne(
                { _id: userId },
                { $set: { status } }
            );
        }

        // Fetch updated member
        const updatedMember = await ClientUser.findById(clientUser._id)
            .populate({
                path: 'user_id',
                select: 'name email status'
            })
            .populate({
                path: 'role_id',
                select: 'name description'
            });

        res.json({
            success: true,
            data: updatedMember,
            message: 'Team member updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route DELETE /api/team/:userId
 * @desc Remove a team member
 */
router.delete('/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const clientId = req.client.id;

        const clientUser = await ClientUser.findOne({
            client_id: clientId,
            user_id: userId
        });

        if (!clientUser) {
            throw ApiError.notFound('Team member not found');
        }

        // Prevent removing the owner
        if (clientUser.is_owner) {
            throw ApiError.forbidden('Cannot remove the client owner');
        }

        await ClientUser.deleteOne({ _id: clientUser._id });

        res.json({
            success: true,
            message: 'Team member removed successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
