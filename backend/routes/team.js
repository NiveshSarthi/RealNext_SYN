const express = require('express');
const router = express.Router();
const { User, ClientUser, Client, Role } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireClientAccess } = require('../middleware/roles');
const { enforceClientScope } = require('../middleware/scopeEnforcer');
const { ApiError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

/**
 * @route  GET /api/team/test-email?to=email@example.com
 * @desc   Test SMTP connection and send a test email (admin only — requires auth)
 * @access Private
 */
router.get('/test-email', authenticate, async (req, res) => {
    const to = req.query.to || req.user?.email;
    const results = { smtpConfig: {}, verifyOk: false, sendOk: false };

    results.smtpConfig = {
        host: process.env.SMTP_HOST || '(not set)',
        port: process.env.SMTP_PORT || '587 (default)',
        user: process.env.SMTP_USER || '(not set)',
        passLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0,
        secure: process.env.SMTP_SECURE,
        fromName: process.env.FROM_NAME,
        frontendUrl: process.env.FRONTEND_URL,
        nodeEnv: process.env.NODE_ENV,
    };

    try {
        // Step 1 — verify connection
        await emailService.transporter.verify();
        results.verifyOk = true;
    } catch (e) {
        results.verifyError = e.message;
        return res.json({ success: false, step: 'verify', ...results });
    }

    try {
        // Step 2 — send test email
        const info = await emailService.transporter.sendMail({
            from: `"${process.env.FROM_NAME || 'RealNext'}" <${process.env.SMTP_USER}>`,
            to,
            subject: 'SMTP Test — RealNext Live Server',
            html: `<p>SMTP is working correctly on the live server (${process.env.NODE_ENV}).<br>Sent at: ${new Date().toISOString()}</p>`
        });
        results.sendOk = true;
        results.messageId = info.messageId;
        results.accepted = info.accepted;
        return res.json({ success: true, to, ...results });
    } catch (e) {
        results.sendError = e.message;
        results.sendCode = e.code;
        return res.json({ success: false, step: 'send', ...results });
    }
});

// Defensive helper to ensure client context exists before using req.client.id
const ensureClient = (req) => {
    // Super admins can skip client context check for listing (GET)
    if (req.user?.is_super_admin && req.method === 'GET') {
        return;
    }

    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required for this operation. Super Admins must provide a client ID.');
    }
};

// Middleware — applied to all routes below this line
router.use(authenticate, requireClientAccess, enforceClientScope);


/**
 * @route GET /api/team
 * @desc Get all team members for the tenant
 */
router.get('/', async (req, res, next) => {
    try {
        ensureClient(req);
        const clientId = req.client?.id;

        const [teamMembers, superAdmins] = await Promise.all([
            clientId ? ClientUser.find({ client_id: clientId })
                .populate({
                    path: 'user_id',
                    select: 'name email phone avatar_url status last_login_at created_at'
                })
                .populate({
                    path: 'role_id',
                    select: 'name description permissions'
                })
                .sort({ created_at: -1 }) : [],
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
        ensureClient(req);
        const { email, name, password, role, role_id, department } = req.body;
        const clientId = req.client.id;

        // Validate required fields
        if (!email || !name) {
            throw ApiError.badRequest('Email and name are required');
        }

        // Hoist these so they're accessible throughout the function
        let userPassword = password || null;
        let emailSent = false;
        let emailError = null;
        let isNewUser = false;

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            isNewUser = true;
            // Generate temporary password if none provided
            if (!userPassword) {
                userPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
                logger.info(`Generating temp password for new user: ${email}`);
            }

            user = await User.create({
                email,
                name,
                password_hash: userPassword,
                status: 'active'
            });
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

        // Send invitation email (for new users with credentials, or for existing users being added)
        try {
            const loginUrl = `${process.env.FRONTEND_URL || 'https://realnext.in'}/auth/login`;
            const invitedBy = req.user?.name || req.user?.email || 'Administrator';

            await emailService.sendTeamInvitation({
                email,
                name,
                // Only expose plain-text password for new accounts (existing users already know theirs)
                password: isNewUser ? userPassword : '(your existing password)',
                loginUrl,
                invitedBy
            });

            emailSent = true;
            logger.info(`Team invitation email sent to ${email}`);
        } catch (err) {
            emailError = err.message;
            logger.error(`Failed to send invitation email to ${email}:`, err);
            // Don't fail the invitation — just report it
        }

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

        // Build response
        const responseData = {
            id: newMember._id,
            user_id: newMember.user_id?._id,
            name: newMember.user_id?.name,
            email: newMember.user_id?.email,
            role: newMember.role,
            role_id: newMember.role_id?._id,
            custom_role: newMember.role_id,
            department: newMember.department,
            is_owner: newMember.is_owner,
            email_sent: emailSent,
        };

        if (!emailSent) {
            responseData.email_error = emailError || 'Email delivery failed';
        }

        // For new users with auto-generated passwords, include in response
        // so admin can share manually if email failed
        if (isNewUser && !password) {
            responseData.generated_password = userPassword;
            responseData.message = emailSent
                ? `Invitation sent to ${email}. Login credentials have been emailed.`
                : `Team member created. Email failed — please share password manually: ${userPassword}`;
        } else {
            responseData.message = emailSent
                ? `Invitation sent to ${email}.`
                : `Team member added. Invitation email could not be delivered.`;
        }

        res.status(201).json({
            success: true,
            data: responseData
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
        ensureClient(req);
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
        ensureClient(req);
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
