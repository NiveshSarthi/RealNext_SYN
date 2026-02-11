const express = require('express');
const router = express.Router();
const { Client, ClientUser, User, Subscription, Plan } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireSuperAdmin } = require('../../middleware/roles');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting, buildSearchFilter, mergeFilters } = require('../../utils/helpers');
const { validate, validators } = require('../../utils/validators');

// All routes require super admin
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/admin/clients
 * @desc List all clients globally
 * @access Super Admin
 */
router.get('/', async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);
        const sorting = getSorting(req.query, ['name', 'created_at', 'status'], 'created_at');

        const searchFilter = buildSearchFilter(req.query.search, ['name', 'email', 'slug']);
        const statusFilter = req.query.status ? { status: req.query.status } : null;
        const envFilter = req.query.environment ? { environment: req.query.environment } : null;

        const where = mergeFilters(searchFilter, statusFilter, envFilter);

        const rows = await Client.find(where)
            .populate({
                path: 'subscriptions',
                match: { status: { $in: ['trial', 'active'] } },
                populate: { path: 'plan_id', select: 'code name' },
                options: { sort: { created_at: -1 }, limit: 1 }
            })
            .sort(sorting)
            .limit(pagination.limit)
            .skip(pagination.offset);

        const count = await Client.countDocuments(where);

        // Map plan for compatibility if requested structure matches old results
        const rowsWithPlan = rows.map(r => {
            const obj = r.toObject({ virtuals: true });
            if (obj.subscriptions && obj.subscriptions.length > 0) {
                obj.subscription = obj.subscriptions[0];
                obj.plan = obj.subscription.plan_id;
            }
            return obj;
        });

        res.json({
            success: true,
            ...getPaginatedResponse(rowsWithPlan, count, pagination)
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/clients
 * @desc Create new client (Super Admin)
 * @access Super Admin
 */
router.post('/',
    [
        validators.requiredString('name', 2, 255),
        validators.requiredString('email', 5, 255),
        validators.requiredString('password', 8, 100),
        validators.optionalString('phone', 20),
        validators.optionalString('company_name', 255),
        validate
    ],
    auditAction('create', 'client'),
    async (req, res, next) => {
        try {
            const { name, email, password, phone, company_name } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw ApiError.conflict('Email already registered');
            }

            // Create user
            const user = await User.create({
                email,
                password_hash: password, // Will be hashed by the pre-save hook
                name,
                phone,
                email_verified: false,
                status: 'active'
            });

            // Create client
            const client = await Client.create({
                name: company_name || `${name}'s Organization`,
                email,
                phone,
                status: 'active',
                environment: 'production'
            });

            // Make user the client owner
            await ClientUser.create({
                user_id: user._id,
                client_id: client._id,
                role: 'admin',
                is_owner: true,
                status: 'active'
            });

            // Get default plan (if exists)
            const defaultPlan = await Plan.findOne({ code: 'trial' });
            if (defaultPlan) {
                const trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial

                await Subscription.create({
                    client_id: client._id,
                    plan_id: defaultPlan._id,
                    status: 'trial',
                    trial_ends_at: trialEndDate
                });
            }

            res.status(201).json({
                success: true,
                data: {
                    client: client.toObject({ virtuals: true }),
                    user: user.toSafeJSON()
                }
            });
        } catch (error) {
            next(error);
        }
    }
);


/**
 * @route GET /api/admin/clients/:id
 * @desc Get client details
 * @access Super Admin
 */
router.get('/:id', async (req, res, next) => {
    try {
        const client = await Client.findById(req.params.id)
            .populate({
                path: 'clientUsers',
                populate: { path: 'user_id', select: 'name email avatar_url status' }
            })
            .populate({
                path: 'subscriptions',
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
 * @route PUT /api/admin/clients/:id/override
 * @desc Override client settings (Super Admin override)
 * @access Super Admin
 */
router.put('/:id/override',
    auditAction('override', 'client'),
    async (req, res, next) => {
        try {
            const client = await Client.findById(req.params.id);

            if (!client) {
                throw ApiError.notFound('Client not found');
            }

            const { settings, metadata, status, environment, is_demo } = req.body;

            client.settings = settings ? {
                ...client.settings,
                ...settings,
                features: settings.features ? { ...client.settings.features, ...settings.features } : client.settings.features,
                menu_access: settings.menu_access ? { ...client.settings.menu_access, ...settings.menu_access } : client.settings.menu_access,
                _admin_override: true
            } : client.settings;

            client.metadata = metadata ? { ...client.metadata, ...metadata } : client.metadata;
            client.status = status || client.status;
            client.environment = environment || client.environment;
            client.is_demo = is_demo !== undefined ? is_demo : client.is_demo;

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
 * @route POST /api/admin/clients/:id/impersonate
 * @desc Get impersonation token for client
 * @access Super Admin
 */
router.post('/:id/impersonate', auditAction('impersonate', 'client'), async (req, res, next) => {
    try {
        const client = await Client.findById(req.params.id);

        if (!client) {
            throw ApiError.notFound('Client not found');
        }

        // Find owner user
        const ownerMembership = await ClientUser.findOne({
            client_id: client._id,
            is_owner: true
        }).populate('user_id');

        if (!ownerMembership || !ownerMembership.user_id) {
            throw ApiError.notFound('Client owner not found');
        }

        // Generate impersonation token
        const { generateAccessToken, buildTokenPayload } = require('../../utils/jwt');
        const authService = require('../../services/authService');

        const context = await authService.getUserContext(ownerMembership.user_id);
        const payload = buildTokenPayload(ownerMembership.user_id, context);
        payload.impersonated_by = req.user.id;
        payload.impersonation = true;

        const token = generateAccessToken(payload);

        res.json({
            success: true,
            data: {
                token,
                client: client.toObject({ virtuals: true }),
                user: ownerMembership.user_id.toSafeJSON()
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
