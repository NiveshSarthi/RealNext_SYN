const express = require('express');
const router = express.Router();
const { Client, Subscription, Payment, User, Lead } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireSuperAdmin } = require('../../middleware/roles');

// All routes require super admin
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/admin/analytics/overview
 * @desc Get platform-wide overview stats
 * @access Super Admin
 */
router.get('/overview', async (req, res, next) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalClients,
            activeClients,
            totalUsers,
            activeSubscriptions,
            trialSubscriptions,
            newClientsThisMonth
        ] = await Promise.all([
            Client.countDocuments(),
            Client.countDocuments({ status: 'active' }),
            User.countDocuments({ status: 'active' }),
            Subscription.countDocuments({ status: 'active' }),
            Subscription.countDocuments({ status: 'trial' }),
            Client.countDocuments({ created_at: { $gte: thirtyDaysAgo } })
        ]);

        res.json({
            success: true,
            data: {
                clients: {
                    total: totalClients,
                    active: activeClients,
                    new_this_month: newClientsThisMonth
                },
                users: {
                    total: totalUsers
                },
                subscriptions: {
                    active: activeSubscriptions,
                    trial: trialSubscriptions
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/analytics/revenue
 * @desc Get revenue analytics
 * @access Super Admin
 */
router.get('/revenue', async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;

        const where = { status: 'completed' };
        if (start_date || end_date) {
            where.created_at = {};
            if (start_date) where.created_at.$gte = new Date(start_date);
            if (end_date) where.created_at.$lte = new Date(end_date);
        }

        const payments = await Payment.aggregate([
            { $match: where },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m", date: "$created_at" }
                    },
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            {
                $project: {
                    month: "$_id",
                    total: 1,
                    count: 1,
                    _id: 0
                }
            }
        ]);

        const revenueResult = await Payment.aggregate([
            { $match: where },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        res.json({
            success: true,
            data: {
                total_revenue: totalRevenue || 0,
                monthly_breakdown: payments
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/analytics/clients
 * @desc Get client growth analytics
 * @access Super Admin
 */
router.get('/clients', async (req, res, next) => {
    try {
        const clientsByMonth = await Client.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            { $project: { month: "$_id", count: 1, _id: 0 } }
        ]);

        const clientsByStatus = await Client.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1, _id: 0 } }
        ]);

        const clientsByEnvironment = await Client.aggregate([
            { $group: { _id: "$environment", count: { $sum: 1 } } },
            { $project: { environment: "$_id", count: 1, _id: 0 } }
        ]);

        res.json({
            success: true,
            data: {
                growth: clientsByMonth,
                by_status: clientsByStatus,
                by_environment: clientsByEnvironment
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/analytics/dashboard-stats
 * @desc Get consolidated stats for the Super Admin Dashboard
 * @access Super Admin
 */
router.get('/dashboard-stats', async (req, res, next) => {
    try {
        const [
            activeClients,
            totalUsers,
            revenueResult
        ] = await Promise.all([
            Client.countDocuments({ status: 'active' }),
            User.countDocuments({ status: 'active' }),
            Payment.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalRevenue: revenueResult.length > 0 ? revenueResult[0].total : 0,
                activeClients,
                totalUsers,
                systemLoad: 'Normal' // Placeholder as we don't have real-time monitoring yet
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
