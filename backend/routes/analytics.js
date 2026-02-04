const express = require('express');
const router = express.Router();
const { Lead, Campaign, Workflow, LoginHistory, SubscriptionUsage } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTenantAccess } = require('../middleware/roles');
const { enforceTenantScope } = require('../middleware/scopeEnforcer');
const { requireFeature } = require('../middleware/featureGate');
const { Op } = require('sequelize');
const { format, subDays, startOfDay, endOfDay } = require('date-fns');

// Middleware
router.use(authenticate, requireTenantAccess, enforceTenantScope);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get main dashboard stats
 */
router.get('/dashboard', async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;

        // 1. Leads Stats
        const totalLeads = await Lead.count({ where: { tenant_id: tenantId } });
        const newLeads = await Lead.count({
            where: {
                tenant_id: tenantId,
                created_at: { [Op.gte]: subDays(new Date(), 30) }
            }
        });

        // 2. Campaign Stats
        const activeCampaigns = await Campaign.count({
            where: { tenant_id: tenantId, status: 'active' }
        });

        // 3. Workflow Stats
        const activeWorkflows = await Workflow.count({
            where: { tenant_id: tenantId, status: 'active' }
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
        const total = await Lead.count({ where: { tenant_id: req.tenant.id } });
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
        const campaigns = await Campaign.findAll({
            where: { tenant_id: req.tenant.id },
            attributes: ['id', 'name', 'status', 'created_at'], // Add stats cols if available
            limit: 5,
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: campaigns
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
