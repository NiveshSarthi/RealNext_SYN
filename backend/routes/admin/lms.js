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
 * @route GET /api/admin/lms/network
 * @desc Get all LMS network connections across clients
 * @access Admin
 */
router.get('/network', requireAdminAccess, async (req, res, next) => {
    try {
        // Mock network data - in real implementation, this would aggregate from all clients
        const network = [
            {
                id: 1,
                name: 'Rajesh Kumar',
                business_name: 'Kumar Realty',
                location: 'Mumbai, Maharashtra',
                clientId: 'client1',
                clientName: 'ABC Realty',
                trust_score: 4.5,
                total_deals: 25,
                status: 'active',
                specializations: ['Residential', 'Commercial']
            },
            {
                id: 2,
                name: 'Priya Sharma',
                business_name: 'Sharma Properties',
                location: 'Delhi, NCR',
                clientId: 'client2',
                clientName: 'XYZ Properties',
                trust_score: 4.2,
                total_deals: 18,
                status: 'active',
                specializations: ['Residential', 'Land']
            },
            {
                id: 3,
                name: 'Amit Patel',
                business_name: 'Patel Real Estate',
                location: 'Ahmedabad, Gujarat',
                clientId: 'client1',
                clientName: 'ABC Realty',
                trust_score: 3.8,
                total_deals: 12,
                status: 'pending',
                specializations: ['Commercial']
            }
        ];

        // Filter for client admin
        const filteredNetwork = req.user.is_super_admin
            ? network
            : network.filter(n => n.clientId === req.client._id.toString());

        res.json({
            success: true,
            data: filteredNetwork
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/lms/leads
 * @desc Get all LMS leads across clients
 * @access Admin
 */
router.get('/leads', requireAdminAccess, async (req, res, next) => {
    try {
        // Mock leads data - in real implementation, this would aggregate from all clients
        const leads = [
            {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+91-9876543210',
                clientId: 'client1',
                clientName: 'ABC Realty',
                status: 'new',
                created_at: new Date('2024-01-15')
            },
            {
                id: 2,
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '+91-9876543211',
                clientId: 'client2',
                clientName: 'XYZ Properties',
                status: 'converted',
                created_at: new Date('2024-01-10')
            },
            {
                id: 3,
                name: 'Bob Johnson',
                email: 'bob@example.com',
                phone: '+91-9876543212',
                clientId: 'client1',
                clientName: 'ABC Realty',
                status: 'qualified',
                created_at: new Date('2024-01-20')
            }
        ];

        // Filter for client admin
        const filteredLeads = req.user.is_super_admin
            ? leads
            : leads.filter(l => l.clientId === req.client._id.toString());

        res.json({
            success: true,
            data: filteredLeads
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/lms/clients/:clientId/leads
 * @desc Create a new lead for a client
 * @access Admin
 */
router.post('/clients/:clientId/leads',
    requireAdminAccess,
    [
        validators.requiredString('name', 1, 100),
        validators.email('email'),
        validators.optionalString('phone', 20),
        validators.optionalString('status', 20),
        validate
    ],
    auditAction('create', 'lms_lead'),
    async (req, res, next) => {
        try {
            const { clientId } = req.params;
            const { name, email, phone, status = 'new' } = req.body;

            // Verify access
            if (!req.user.is_super_admin && req.client._id.toString() !== clientId) {
                throw ApiError.forbidden('Access denied');
            }

            // Verify client has active subscription
            const client = await Client.findById(clientId).populate('subscription');
            if (!client || !client.subscription || !['trial', 'active'].includes(client.subscription.status)) {
                throw ApiError.badRequest('Client does not have an active subscription');
            }

            // Mock lead creation
            const lead = {
                id: Date.now(),
                name,
                email,
                phone,
                status,
                clientId,
                created_by: req.user.id,
                created_at: new Date()
            };

            logger.info(`[ADMIN LMS] Created lead ${lead.id} for client ${clientId}`);

            res.json({
                success: true,
                message: 'Lead created successfully',
                data: lead
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /api/admin/lms/modules
 * @desc Get all LMS modules across clients
 * @access Admin
 */
router.get('/modules', requireAdminAccess, async (req, res, next) => {
    try {
        // Mock modules data - in real implementation, this would aggregate from all clients
        const modules = [
            {
                id: 1,
                title: 'Real Estate Fundamentals',
                description: 'Master the basics of property law and market analysis.',
                clientId: 'client1',
                clientName: 'ABC Realty',
                enrolledUsers: 12,
                completionRate: 75,
                status: 'active',
                duration: '8 hours',
                difficulty: 'Beginner'
            },
            {
                id: 2,
                title: 'Advanced Negotiation',
                description: 'Learn to close high-value deals with confidence.',
                clientId: 'client2',
                clientName: 'XYZ Properties',
                enrolledUsers: 8,
                completionRate: 60,
                status: 'active',
                duration: '6 hours',
                difficulty: 'Advanced'
            },
            {
                id: 3,
                title: 'Digital Marketing Mastery',
                description: 'Generate leads using Facebook and Google Ads.',
                clientId: 'client1',
                clientName: 'ABC Realty',
                enrolledUsers: 15,
                completionRate: 90,
                status: 'active',
                duration: '5 hours',
                difficulty: 'Intermediate'
            }
        ];

        // Filter for client admin
        const filteredModules = req.user.is_super_admin
            ? modules
            : modules.filter(m => m.clientId === req.client._id.toString());

        res.json({
            success: true,
            data: filteredModules
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/lms/overview
 * @desc Get LMS overview for all clients (Super Admin) or specific client (Regular Admin)
 * @access Admin
 */
router.get('/overview', requireAdminAccess, async (req, res, next) => {
    try {
        let clients = [];
        let totalSubscriptions = 0;
        let activeSubscriptions = 0;

        if (req.user.is_super_admin) {
            // Super admin: get all clients with LMS subscriptions
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

        // Mock LMS data - in real implementation, this would come from LMS module
        const lmsStats = {
            totalModules: 15,
            totalEnrollments: clients.length * 5, // Mock
            completionRate: 68,
            averageProgress: 72
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
                    ...lmsStats
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/lms/clients/:clientId/modules
 * @desc Get LMS modules for a specific client
 * @access Admin
 */
router.get('/clients/:clientId/modules', requireAdminAccess, async (req, res, next) => {
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

        // Mock LMS modules data - in real implementation, integrate with LMS module
        const modules = [
            {
                id: 1,
                title: 'Real Estate Fundamentals',
                description: 'Master the basics of property law and market analysis.',
                enrolledUsers: 12,
                completionRate: 75,
                averageScore: 85,
                status: 'active'
            },
            {
                id: 2,
                title: 'Advanced Negotiation',
                description: 'Learn to close high-value deals with confidence.',
                enrolledUsers: 8,
                completionRate: 60,
                averageScore: 78,
                status: 'active'
            },
            {
                id: 3,
                title: 'Digital Marketing Mastery',
                description: 'Generate leads using Facebook and Google Ads.',
                enrolledUsers: 15,
                completionRate: 90,
                averageScore: 92,
                status: 'active'
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
                modules
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/lms/clients/:clientId/modules
 * @desc Create a new LMS module for a client
 * @access Admin
 */
router.post('/clients/:clientId/modules',
    requireAdminAccess,
    [
        validators.requiredString('title', 1, 200),
        validators.requiredString('description', 1, 1000),
        validators.optionalString('duration', 0, 50),
        validators.optionalString('difficulty', 0, 20),
        validate
    ],
    auditAction('create', 'lms_module'),
    async (req, res, next) => {
        try {
            const { clientId } = req.params;
            const { title, description, duration, difficulty } = req.body;

            // Verify access
            if (!req.user.is_super_admin && req.client._id.toString() !== clientId) {
                throw ApiError.forbidden('Access denied');
            }

            // Verify client has active subscription
            const client = await Client.findById(clientId).populate('subscription');
            if (!client || !client.subscription || !['trial', 'active'].includes(client.subscription.status)) {
                throw ApiError.badRequest('Client does not have an active subscription');
            }

            // Mock module creation
            const module = {
                id: Date.now(),
                title,
                description,
                duration,
                difficulty,
                clientId,
                status: 'active',
                enrolledUsers: 0,
                completionRate: 0,
                created_by: req.user.id,
                created_at: new Date()
            };

            logger.info(`[ADMIN LMS] Created module ${module.id} for client ${clientId}`);

            res.json({
                success: true,
                message: 'Module created successfully',
                data: module
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/admin/lms/clients/:clientId/enroll
 * @desc Enroll client users in LMS modules
 * @access Admin
 */
router.post('/clients/:clientId/enroll',
    requireAdminAccess,
    [
        validators.requiredString('moduleId', 1, 50),
        validators.array('userIds', false), // optional array
        validate
    ],
    auditAction('enroll', 'lms_module'),
    async (req, res, next) => {
        try {
            const { clientId } = req.params;
            const { moduleId, userIds } = req.body;

            // Verify access
            if (!req.user.is_super_admin && req.client._id.toString() !== clientId) {
                throw ApiError.forbidden('Access denied');
            }

            // Verify client has active subscription
            const client = await Client.findById(clientId).populate('subscription');
            if (!client || !client.subscription || !['trial', 'active'].includes(client.subscription.status)) {
                throw ApiError.badRequest('Client does not have an active subscription');
            }

            // Mock enrollment - in real implementation, call LMS service
            logger.info(`[ADMIN LMS] Enrolling users in module ${moduleId} for client ${clientId}`);

            res.json({
                success: true,
                message: `Successfully enrolled ${userIds?.length || 0} users in module ${moduleId}`,
                data: {
                    moduleId,
                    enrolledUsers: userIds?.length || 0,
                    clientId
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;