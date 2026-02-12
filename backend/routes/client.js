const express = require('express');
const router = express.Router();
const { Client, ClientUser, User, Subscription, Plan, Lead, Campaign } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireClientAccess, requireClientAdmin, requireClientManager } = require('../middleware/roles');
const { enforceClientScope } = require('../middleware/scopeEnforcer');
const { requireActiveSubscription } = require('../middleware/featureGate');
const { auditAction } = require('../middleware/auditLogger');
const { ApiError } = require('../middleware/errorHandler');
const { validate, validators } = require('../utils/validators');
const { getPagination, getPaginatedResponse, getSorting, buildSearchFilter, mergeFilters } = require('../utils/helpers');

// All routes require authentication and client access
router.use(authenticate, requireClientAccess, enforceClientScope);

/**
 * @route GET /api/client/profile
 * @desc Get current client profile
 * @access Client User
 */
router.get('/profile', async (req, res, next) => {
    try {
        const client = await Client.findById(req.client.id)
            .populate({
                path: 'subscriptions',
                match: { status: { $in: ['trial', 'active'] } },
                populate: { path: 'plan_id' }
            });

        if (!client) {
            throw ApiError.notFound('Client not found');
        }

        res.json({
            success: true,
            data: client
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/client/profile
 * @desc Update client profile
 * @access Client Admin
 */
router.put('/profile',
    requireClientAdmin,
    [
        validators.optionalString('name'),
        validators.phone(),
        validators.optionalString('address', 500),
        validators.url('logo_url'),
        validate
    ],
    auditAction('update', 'client'),
    async (req, res, next) => {
        try {
            const client = await Client.findById(req.client.id);
            if (!client) {
                throw ApiError.notFound('Client not found');
            }

            const { name, phone, address, logo_url, website, settings } = req.body;

            client.name = name || client.name;
            client.phone = phone || client.phone;
            client.address = address || client.address;
            client.logo_url = logo_url || client.logo_url;
            client.website = website || client.website;
            if (settings) {
                client.settings = { ...client.settings, ...settings };
            }

            await client.save();

            res.json({
                success: true,
                data: client
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/client/users
 * @desc List client team members
 * @access Client User
 */
router.get('/users', async (req, res, next) => {
    try {
        const clientUsers = await ClientUser.find({ client_id: req.client.id })
            .populate({
                path: 'user_id',
                select: 'name email avatar_url phone status last_login_at'
            });

        res.json({
            success: true,
            data: clientUsers
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/client/users
 * @desc Add team member to client
 * @access Client Admin
 */
router.post('/users',
    requireClientAdmin,
    [
        validators.email(),
        validators.optionalString('name', 100),
        validators.enum('role', ['admin', 'manager', 'user'], false),
        validate
    ],
    auditAction('add_user', 'client'),
    async (req, res, next) => {
        try {
            const { email, name, role, permissions, department } = req.body;

            // Check subscription limits
            if (req.plan?.limits?.max_users) {
                const currentCount = await ClientUser.countDocuments({ client_id: req.client.id });
                if (currentCount >= req.plan.limits.max_users) {
                    throw ApiError.forbidden(`User limit reached (${req.plan.limits.max_users}). Upgrade your plan for more.`);
                }
            }

            // Find or create user
            let user = await User.findOne({ email });

            if (!user) {
                // Create new user with temporary password
                user = await User.create({
                    email,
                    name: name || email.split('@')[0],
                    status: 'pending',
                    // In production, generate temp password and send email
                    password_hash: 'temppassword123'
                });
            }

            // Check if already a member
            const existing = await ClientUser.findOne({
                client_id: req.client.id,
                user_id: user.id
            });

            if (existing) {
                throw ApiError.conflict('User is already a team member');
            }

            const clientUser = await ClientUser.create({
                client_id: req.client.id,
                user_id: user.id,
                role: role || 'user',
                permissions: permissions || [],
                department
            });

            res.status(201).json({
                success: true,
                data: {
                    ...clientUser.toObject(),
                    user: user.toSafeJSON()
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /api/client/users/:userId
 * @desc Update team member
 * @access Client Admin
 */
router.put('/users/:userId',
    requireClientAdmin,
    auditAction('update_user', 'client'),
    async (req, res, next) => {
        try {
            const clientUser = await ClientUser.findOne({
                client_id: req.client.id,
                user_id: req.params.userId
            });

            if (!clientUser) {
                throw ApiError.notFound('Team member not found');
            }

            // Prevent changing own role if you're the only admin
            if (clientUser.user_id.toString() === req.user.id.toString() && req.body.role !== clientUser.role) {
                const adminCount = await ClientUser.countDocuments({
                    client_id: req.client.id,
                    role: 'admin'
                });
                if (adminCount <= 1) {
                    throw ApiError.badRequest('Cannot change role: you are the only admin');
                }
            }

            const { role, permissions, department } = req.body;

            if (role) clientUser.role = role;
            if (permissions) clientUser.permissions = permissions;
            if (department !== undefined) clientUser.department = department;

            await clientUser.save();

            res.json({
                success: true,
                data: clientUser
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/client/users/:userId
 * @desc Remove team member
 * @access Client Admin
 */
router.delete('/users/:userId',
    requireClientAdmin,
    auditAction('remove_user', 'client'),
    async (req, res, next) => {
        try {
            const clientUser = await ClientUser.findOne({
                client_id: req.client.id,
                user_id: req.params.userId
            });

            if (!clientUser) {
                throw ApiError.notFound('Team member not found');
            }

            if (clientUser.is_owner) {
                throw ApiError.badRequest('Cannot remove client owner');
            }

            if (clientUser.user_id.toString() === req.user.id.toString()) {
                throw ApiError.badRequest('Cannot remove yourself');
            }

            await ClientUser.deleteOne({ _id: clientUser._id });

            res.json({
                success: true,
                message: 'Team member removed'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/client/subscription
 * @desc Get current subscription
 * @access Client User
 */
router.get('/subscription', async (req, res, next) => {
    try {
        const subscriptionService = require('../services/subscriptionService');
        const subscription = await subscriptionService.getSubscription(req.client.id);

        if (!subscription) {
            return res.json({
                success: true,
                data: null,
                message: 'No active subscription'
            });
        }

        const usage = await subscriptionService.getUsage(subscription.id);

        res.json({
            success: true,
            data: {
                ...subscription.toObject({ virtuals: true }),
                usage
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/client/stats
 * @desc Get client dashboard stats
 * @access Client User
 */
router.get('/stats', async (req, res, next) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // In Mongoose, we use counts on the models
        const [leadCount, newLeadsThisMonth, campaignCount, activeCampaigns, teamCount] = await Promise.all([
            Lead.countDocuments({ client_id: req.client.id }),
            Lead.countDocuments({ client_id: req.client.id, created_at: { $gte: thirtyDaysAgo } }),
            Campaign.countDocuments({ client_id: req.client.id }),
            Campaign.countDocuments({ client_id: req.client.id, status: 'running' }),
            ClientUser.countDocuments({ client_id: req.client.id })
        ]);

        res.json({
            success: true,
            data: {
                leads: {
                    total: leadCount,
                    new_this_month: newLeadsThisMonth
                },
                campaigns: {
                    total: campaignCount,
                    active: activeCampaigns
                },
                team: {
                    count: teamCount
                },
                subscription: req.subscription ? {
                    plan: req.plan?.name,
                    status: req.subscription.status,
                    days_remaining: Math.max(0, Math.ceil((new Date(req.subscription.current_period_end) - now) / (1000 * 60 * 60 * 24)))
                } : null
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
