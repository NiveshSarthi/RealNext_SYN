const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireSuperAdmin, requireClientAdmin } = require('../../middleware/roles');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { getPagination, getPaginatedResponse } = require('../../utils/helpers');
const { validate, validators } = require('../../utils/validators');
const { Client, Subscription, Plan } = require('../../models');
const logger = require('../../config/logger');

// All routes require authentication
router.use(authenticate);

// Super admin has full access, regular admin has restricted access
const requireAdminAccess = (req, res, next) => {
    if (req.user?.is_super_admin) {
        return next(); // Super admin full access
    }
    // Regular admin: check if they have permission or if it's their client's data
    if (req.clientUser?.role === 'admin') {
        return next();
    }
    throw ApiError.forbidden('Admin access required');
};

/**
 * @route GET /api/admin/wa-marketing/flows
 * @desc Get all WA Marketing flows across clients
 * @access Admin
 */
router.get('/flows', requireAdminAccess, async (req, res, next) => {
    try {
        // Mock flows data - in real implementation, this would aggregate from all clients
        const flows = [
            {
                id: 1,
                name: 'Lead Generation Flow',
                description: 'Automated flow for capturing and nurturing leads',
                clientId: 'client1',
                clientName: 'ABC Realty',
                status: 'active',
                triggers: ['new_lead', 'website_form'],
                steps: 5,
                conversions: 45,
                created_at: new Date('2024-01-15')
            },
            {
                id: 2,
                name: 'Property Inquiry Flow',
                description: 'Handle property inquiries with automated responses',
                clientId: 'client2',
                clientName: 'XYZ Properties',
                status: 'active',
                triggers: ['property_inquiry'],
                steps: 3,
                conversions: 28,
                created_at: new Date('2024-01-10')
            },
            {
                id: 3,
                name: 'Follow-up Flow',
                description: 'Automated follow-up for interested prospects',
                clientId: 'client1',
                clientName: 'ABC Realty',
                status: 'draft',
                triggers: ['follow_up'],
                steps: 4,
                conversions: 0,
                created_at: new Date('2024-01-20')
            }
        ];

        // Filter for client admin
        const filteredFlows = req.user.is_super_admin
            ? flows
            : flows.filter(f => f.clientId === req.client._id.toString());

        res.json({
            success: true,
            data: filteredFlows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/wa-marketing/quick-replies
 * @desc Get all WA Marketing quick replies across clients
 * @access Admin
 */
router.get('/quick-replies', requireAdminAccess, async (req, res, next) => {
    try {
        // Mock quick replies data - in real implementation, this would aggregate from all clients
        const replies = [
            {
                id: 1,
                title: 'Property Availability',
                message: 'Thank you for your interest! Let me check the availability of this property for you.',
                clientId: 'client1',
                clientName: 'ABC Realty',
                category: 'Inquiry Response',
                usage_count: 25,
                status: 'active',
                created_at: new Date('2024-01-15')
            },
            {
                id: 2,
                title: 'Schedule Visit',
                message: 'Great! I can help you schedule a visit to view this property. What day works best for you?',
                clientId: 'client2',
                clientName: 'XYZ Properties',
                category: 'Scheduling',
                usage_count: 18,
                status: 'active',
                created_at: new Date('2024-01-10')
            },
            {
                id: 3,
                title: 'Price Discussion',
                message: 'I understand pricing is important. Let me provide you with detailed pricing information.',
                clientId: 'client1',
                clientName: 'ABC Realty',
                category: 'Pricing',
                usage_count: 12,
                status: 'active',
                created_at: new Date('2024-01-20')
            }
        ];

        // Filter for client admin
        const filteredReplies = req.user.is_super_admin
            ? replies
            : replies.filter(r => r.clientId === req.client._id.toString());

        res.json({
            success: true,
            data: filteredReplies
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/wa-marketing/meta-ads
 * @desc Get all WA Marketing meta ads campaigns across clients
 * @access Admin
 */
router.get('/meta-ads', requireAdminAccess, async (req, res, next) => {
    try {
        // Mock meta ads campaigns data - in real implementation, this would aggregate from all clients
        const campaigns = [
            {
                id: 1,
                name: 'Luxury Apartments Campaign',
                description: 'Targeted ads for luxury apartment listings',
                clientId: 'client1',
                clientName: 'ABC Realty',
                platform: 'Facebook',
                status: 'active',
                budget: 5000,
                spent: 1250,
                impressions: 45000,
                clicks: 450,
                conversions: 12,
                ctr: 1.0,
                cpc: 2.78,
                created_at: new Date('2024-01-15')
            },
            {
                id: 2,
                name: 'Commercial Properties',
                description: 'Ads targeting commercial property investors',
                clientId: 'client2',
                clientName: 'XYZ Properties',
                platform: 'Instagram',
                status: 'active',
                budget: 3000,
                spent: 890,
                impressions: 32000,
                clicks: 320,
                conversions: 8,
                ctr: 1.0,
                cpc: 2.78,
                created_at: new Date('2024-01-10')
            },
            {
                id: 3,
                name: 'Land Plots Promotion',
                description: 'Promote available land plots in prime locations',
                clientId: 'client1',
                clientName: 'ABC Realty',
                platform: 'Facebook',
                status: 'paused',
                budget: 2000,
                spent: 450,
                impressions: 18000,
                clicks: 180,
                conversions: 5,
                ctr: 1.0,
                cpc: 2.50,
                created_at: new Date('2024-01-20')
            }
        ];

        // Filter for client admin
        const filteredCampaigns = req.user.is_super_admin
            ? campaigns
            : campaigns.filter(c => c.clientId === req.client._id.toString());

        res.json({
            success: true,
            data: filteredCampaigns
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/wa-marketing/overview
 * @desc Get WA Marketing overview for all clients (Super Admin) or specific client (Regular Admin)
 * @access Admin
 */
router.get('/overview', requireAdminAccess, async (req, res, next) => {
    try {
        let clients = [];
        let totalSubscriptions = 0;
        let activeSubscriptions = 0;

        if (req.user.is_super_admin) {
            // Super admin: get all clients with WA Marketing subscriptions
            clients = await Client.find()
                .populate({
                    path: 'subscription',
                    match: { status: { $in: ['trial', 'active'] } }
                })
                .select('name email subscription')
                .sort({ created_at: -1 });

            totalSubscriptions = await Subscription.countDocuments({
                status: { $in: ['trial', 'active'] }
            });

            activeSubscriptions = await Subscription.countDocuments({
                status: 'active'
            });
        } else {
            // Regular admin: only their client
            const client = await Client.findById(req.client._id)
                .populate('subscription')
                .select('name email subscription');

            if (client) {
                clients = [client];
                totalSubscriptions = client.subscription ? 1 : 0;
                activeSubscriptions = client.subscription?.status === 'active' ? 1 : 0;
            }
        }

        // Mock WA Marketing data - in real implementation, this would come from WA Marketing module
        const waMarketingStats = {
            totalFlows: 25,
            activeFlows: 18,
            totalQuickReplies: 45,
            totalCampaigns: 12,
            activeCampaigns: 8,
            totalMessages: 12500,
            deliveredMessages: 11800,
            readMessages: 9200,
            conversionRate: 3.2
        };

        res.json({
            success: true,
            data: {
                clients: clients.map(c => ({
                    id: c._id,
                    name: c.name,
                    email: c.email,
                    subscription: c.subscription ? {
                        status: c.subscription.status,
                        plan: c.subscription.plan_id,
                        billing_cycle: c.subscription.billing_cycle
                    } : null
                })),
                stats: {
                    totalClients: clients.length,
                    totalSubscriptions,
                    activeSubscriptions,
                    ...waMarketingStats
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/wa-marketing/clients/:clientId/flows
 * @desc Get WA Marketing flows for a specific client
 * @access Admin
 */
router.get('/clients/:clientId/flows', requireAdminAccess, async (req, res, next) => {
    try {
        const { clientId } = req.params;

        // Verify access
        if (!req.user.is_super_admin && req.client._id.toString() !== clientId) {
            throw ApiError.forbidden('Access denied');
        }

        // Verify client exists and has active subscription
        const client = await Client.findById(clientId).populate('subscription');
        if (!client) {
            throw ApiError.notFound('Client not found');
        }

        if (!client.subscription || !['trial', 'active'].includes(client.subscription.status)) {
            throw ApiError.badRequest('Client does not have an active subscription');
        }

        // Mock WA Marketing flows data - in real implementation, integrate with WA Marketing module
        const flows = [
            {
                id: 1,
                name: 'Lead Generation Flow',
                description: 'Automated flow for capturing and nurturing leads',
                status: 'active',
                triggers: ['new_lead', 'website_form'],
                steps: 5,
                conversions: 45,
                last_run: new Date('2024-01-20'),
                created_at: new Date('2024-01-15')
            },
            {
                id: 2,
                name: 'Property Inquiry Flow',
                description: 'Handle property inquiries with automated responses',
                status: 'active',
                triggers: ['property_inquiry'],
                steps: 3,
                conversions: 28,
                last_run: new Date('2024-01-19'),
                created_at: new Date('2024-01-10')
            }
        ];

        res.json({
            success: true,
            data: {
                client: {
                    id: client._id,
                    name: client.name,
                    subscription: {
                        status: client.subscription.status,
                        plan: client.subscription.plan_id
                    }
                },
                flows
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/wa-marketing/clients/:clientId/flows
 * @desc Create a new WA Marketing flow for a client
 * @access Admin
 */
router.post('/clients/:clientId/flows',
    requireAdminAccess,
    [
        validators.requiredString('name', 1, 200),
        validators.requiredString('description', 1, 1000),
        validators.array('triggers', true),
        validate
    ],
    auditAction('create', 'wa_flow'),
    async (req, res, next) => {
        try {
            const { clientId } = req.params;
            const { name, description, triggers } = req.body;

            // Verify access
            if (!req.user.is_super_admin && req.client._id.toString() !== clientId) {
                throw ApiError.forbidden('Access denied');
            }

            // Verify client has active subscription
            const client = await Client.findById(clientId).populate('subscription');
            if (!client || !client.subscription || !['trial', 'active'].includes(client.subscription.status)) {
                throw ApiError.badRequest('Client does not have an active subscription');
            }

            // Mock flow creation
            const flow = {
                id: Date.now(),
                name,
                description,
                triggers,
                clientId,
                status: 'draft',
                steps: 0,
                conversions: 0,
                created_by: req.user.id,
                created_at: new Date()
            };

            logger.info(`[ADMIN WA MARKETING] Created flow ${flow.id} for client ${clientId}`);

            res.json({
                success: true,
                message: 'Flow created successfully',
                data: flow
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/admin/wa-marketing/clients/:clientId/quick-replies
 * @desc Create a new quick reply for a client
 * @access Admin
 */
router.post('/clients/:clientId/quick-replies',
    requireAdminAccess,
    [
        validators.requiredString('title', 1, 200),
        validators.requiredString('message', 1, 1000),
        validators.optionalString('category', 50),
        validate
    ],
    auditAction('create', 'wa_quick_reply'),
    async (req, res, next) => {
        try {
            const { clientId } = req.params;
            const { title, message, category } = req.body;

            // Verify access
            if (!req.user.is_super_admin && req.client._id.toString() !== clientId) {
                throw ApiError.forbidden('Access denied');
            }

            // Verify client has active subscription
            const client = await Client.findById(clientId).populate('subscription');
            if (!client || !client.subscription || !['trial', 'active'].includes(client.subscription.status)) {
                throw ApiError.badRequest('Client does not have an active subscription');
            }

            // Mock quick reply creation
            const reply = {
                id: Date.now(),
                title,
                message,
                category,
                clientId,
                status: 'active',
                usage_count: 0,
                created_by: req.user.id,
                created_at: new Date()
            };

            logger.info(`[ADMIN WA MARKETING] Created quick reply ${reply.id} for client ${clientId}`);

            res.json({
                success: true,
                message: 'Quick reply created successfully',
                data: reply
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/admin/wa-marketing/clients/:clientId/meta-ads
 * @desc Create a new meta ads campaign for a client
 * @access Admin
 */
router.post('/clients/:clientId/meta-ads',
    requireAdminAccess,
    [
        validators.requiredString('name', 1, 200),
        validators.requiredString('description', 1, 1000),
        validators.requiredString('platform', 1, 50),
        validators.requiredNumber('budget', 0),
        validate
    ],
    auditAction('create', 'wa_meta_ad'),
    async (req, res, next) => {
        try {
            const { clientId } = req.params;
            const { name, description, platform, budget } = req.body;

            // Verify access
            if (!req.user.is_super_admin && req.client._id.toString() !== clientId) {
                throw ApiError.forbidden('Access denied');
            }

            // Verify client has active subscription
            const client = await Client.findById(clientId).populate('subscription');
            if (!client || !client.subscription || !['trial', 'active'].includes(client.subscription.status)) {
                throw ApiError.badRequest('Client does not have an active subscription');
            }

            // Mock campaign creation
            const campaign = {
                id: Date.now(),
                name,
                description,
                platform,
                budget: parseFloat(budget),
                clientId,
                status: 'draft',
                spent: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                created_by: req.user.id,
                created_at: new Date()
            };

            logger.info(`[ADMIN WA MARKETING] Created meta ads campaign ${campaign.id} for client ${clientId}`);

            res.json({
                success: true,
                message: 'Meta ads campaign created successfully',
                data: campaign
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;