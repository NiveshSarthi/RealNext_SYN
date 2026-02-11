const express = require('express');
const router = express.Router();
const { Lead, Campaign, Workflow, LoginHistory, SubscriptionUsage } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireClientAccess } = require('../middleware/roles');
const { enforceClientScope } = require('../middleware/scopeEnforcer');
const { requireFeature } = require('../middleware/featureGate');
const { format, subDays, startOfDay, endOfDay } = require('date-fns');

// Middleware
router.use(authenticate, requireClientAccess, enforceClientScope);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get main dashboard stats
 */
router.get('/dashboard', async (req, res, next) => {
    try {
        const clientId = req.client.id;

        // 1. Leads Stats
        const totalLeads = await Lead.countDocuments({ client_id: clientId });
        const thirtyDaysAgo = subDays(new Date(), 30);
        const newLeads = await Lead.countDocuments({
            client_id: clientId,
            created_at: { $gte: thirtyDaysAgo }
        });

        // 2. Campaign Stats
        const activeCampaigns = await Campaign.countDocuments({
            client_id: clientId,
            status: 'active'
        });

        // 3. Workflow Stats
        const activeWorkflows = await Workflow.countDocuments({
            client_id: clientId,
            status: 'active'
        });

        res.json({
            success: true,
            data: {
                leads: {
                    total: totalLeads,
                    new_30_days: newLeads,
                    growth: totalLeads > 0 ? (newLeads / totalLeads) * 100 : 0
                },
                campaigns: {
                    active: activeCampaigns
                },
                workflows: {
                    active: activeWorkflows
                },
                messages: {
                    sent: 1250, // Mock until Message model exists
                    delivered: 1200,
                    read: 980
                },
                recent_activity: [] // Populate with audit logs if needed
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/analytics/overview
 * @desc General overview (similar to dashboard but more detailed)
 */
router.get('/overview', async (req, res, next) => {
    try {
        // Reuse dashboard logic or expand
        res.redirect('/api/analytics/dashboard');
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/analytics/conversations
 * @desc Conversation metrics
 */
router.get('/conversations', async (req, res, next) => {
    try {
        // Mock data for charts
        const labels = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'MMM dd'));
        const data = Array.from({ length: 7 }, () => Math.floor(Math.random() * 50));

        res.json({
            success: true,
            data: {
                labels,
                datasets: [
                    { label: 'Conversations', data }
                ]
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/analytics/messages
 * @desc Message metrics
 */
router.get('/messages', async (req, res, next) => {
    try {
        // Mock data
        res.json({
            success: true,
            data: {
                sent: 5000,
                delivered: 4800,
                read: 3500,
                failed: 200
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/analytics/contacts
 * @desc Contact growth analytics
 */
router.get('/contacts', async (req, res, next) => {
    try {
        // Real data from Leads
        const total = await Lead.countDocuments({ client_id: req.client.id });
        res.json({
            success: true,
            data: { total, active: total }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/analytics/campaigns
 * @desc Campaign performance
 */
router.get('/campaigns', async (req, res, next) => {
    try {
        const campaigns = await Campaign.find({ client_id: req.client.id })
            .select('id name status created_at')
            .limit(5)
            .sort({ created_at: -1 });

        res.json({
            success: true,
            data: campaigns
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
