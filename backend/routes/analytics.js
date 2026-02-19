const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Lead, Campaign, Workflow, CatalogItem, SubscriptionUsage } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireClientAccess } = require('../middleware/roles');
const { enforceClientScope } = require('../middleware/scopeEnforcer');
const { subDays, startOfDay, format, eachDayOfInterval } = require('date-fns');

// Middleware
router.use(authenticate, requireClientAccess, enforceClientScope);

// ─── Helper ──────────────────────────────────────────────────────────────────
const clientOid = (req) => new mongoose.Types.ObjectId(req.client.id);

/**
 * @route GET /api/analytics/dashboard
 * @desc Full dashboard — all sections in one call
 */
router.get('/dashboard', async (req, res, next) => {
    try {
        const cid = clientOid(req);
        const days = parseInt(req.query.period) || 30;
        const since = subDays(new Date(), days);

        // ── Run all aggregations in parallel ──────────────────────────────
        const [
            leadStageAgg,
            leadSourceAgg,
            leadStatusAgg,
            leadTimeAgg,
            campaignStatsAgg,
            campaignTypeAgg,
            catalogAgg,
            recentActivity,
        ] = await Promise.all([
            // Lead by stage
            Lead.aggregate([
                { $match: { client_id: cid, deleted_at: null } },
                { $group: { _id: '$stage', count: { $sum: 1 } } }
            ]),

            // Lead by source (top 8)
            Lead.aggregate([
                { $match: { client_id: cid, deleted_at: null, source: { $ne: null, $ne: '' } } },
                { $group: { _id: '$source', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 }
            ]),

            // Lead by status
            Lead.aggregate([
                { $match: { client_id: cid, deleted_at: null } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Lead volume per day (time-series)
            Lead.aggregate([
                { $match: { client_id: cid, created_at: { $gte: since }, deleted_at: null } },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Campaign aggregate stats
            Campaign.aggregate([
                { $match: { client_id: cid, deleted_at: null } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        active: { $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] } },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                        draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                        sent: { $sum: { $ifNull: ['$stats.sent', 0] } },
                        delivered: { $sum: { $ifNull: ['$stats.delivered', 0] } },
                        read: { $sum: { $ifNull: ['$stats.read', 0] } },
                        failed: { $sum: { $ifNull: ['$stats.failed', 0] } },
                        replied: { $sum: { $ifNull: ['$stats.replied', 0] } },
                    }
                }
            ]),

            // Campaign by type
            Campaign.aggregate([
                { $match: { client_id: cid, deleted_at: null } },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),

            // Inventory / Catalog
            CatalogItem.aggregate([
                { $match: { client_id: cid } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                        sold: { $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] } },
                        draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                        synced: { $sum: { $cond: [{ $ne: ['$wa_catalog_id', null] }, 1, 0] } },
                        avgPrice: { $avg: '$price' },
                        totalValue: { $sum: '$price' },
                    }
                }
            ]),

            // Recent lead activity (last 10 logs across all leads)
            Lead.aggregate([
                { $match: { client_id: cid, deleted_at: null, 'activity_logs.0': { $exists: true } } },
                { $sort: { updated_at: -1 } },
                { $limit: 30 },
                { $unwind: '$activity_logs' },
                { $sort: { 'activity_logs.created_at': -1 } },
                { $limit: 10 },
                {
                    $project: {
                        leadName: '$name',
                        type: '$activity_logs.type',
                        content: '$activity_logs.content',
                        timestamp: '$activity_logs.created_at'
                    }
                }
            ]),
        ]);

        // ── Totals ────────────────────────────────────────────────────────
        const totalLeads = await Lead.countDocuments({ client_id: cid, deleted_at: null });
        const newLeads = await Lead.countDocuments({ client_id: cid, created_at: { $gte: since }, deleted_at: null });
        const activeWorkflows = await Workflow.countDocuments({ client_id: cid, status: 'active' });

        // ── Build lead time-series with all days (fill gaps) ──────────────
        const interval = eachDayOfInterval({ start: since, end: new Date() });
        const dailyLeadMap = Object.fromEntries(leadTimeAgg.map(r => [r._id, r.count]));
        const leadTrend = interval.map(d => ({
            date: format(d, 'yyyy-MM-dd'),
            count: dailyLeadMap[format(d, 'yyyy-MM-dd')] || 0
        }));

        // ── Catalog by category ────────────────────────────────────────────
        const catalogByCategory = await CatalogItem.aggregate([
            { $match: { client_id: cid } },
            { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
            { $sort: { count: -1 } }
        ]);

        const camp = campaignStatsAgg[0] || {};
        const cat = catalogAgg[0] || {};

        res.json({
            success: true,
            data: {
                period_days: days,
                leads: {
                    total: totalLeads,
                    new_in_period: newLeads,
                    growth_pct: totalLeads > 0 ? Math.round((newLeads / totalLeads) * 100) : 0,
                    by_stage: leadStageAgg,
                    by_source: leadSourceAgg,
                    by_status: leadStatusAgg,
                    trend: leadTrend,
                },
                campaigns: {
                    total: camp.total || 0,
                    active: camp.active || 0,
                    completed: camp.completed || 0,
                    draft: camp.draft || 0,
                    by_type: campaignTypeAgg,
                    messages: {
                        sent: camp.sent || 0,
                        delivered: camp.delivered || 0,
                        read: camp.read || 0,
                        failed: camp.failed || 0,
                        replied: camp.replied || 0,
                    }
                },
                workflows: {
                    active: activeWorkflows
                },
                inventory: {
                    total: cat.total || 0,
                    active: cat.active || 0,
                    sold: cat.sold || 0,
                    draft: cat.draft || 0,
                    synced_to_wa: cat.synced || 0,
                    avg_price: Math.round(cat.avgPrice || 0),
                    total_value: Math.round(cat.totalValue || 0),
                    by_category: catalogByCategory,
                },
                recent_activity: recentActivity,
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/analytics/overview
 */
router.get('/overview', (req, res) => res.redirect('/api/analytics/dashboard'));

/**
 * @route GET /api/analytics/conversations
 */
router.get('/conversations', async (req, res, next) => {
    try {
        const days = parseInt(req.query.period) || 7;
        const since = subDays(new Date(), days);
        const interval = eachDayOfInterval({ start: since, end: new Date() });
        const labels = interval.map(d => format(d, 'MMM dd'));
        // Placeholder — real data would come from a messages collection
        const data = interval.map(() => Math.floor(Math.random() * 30 + 5));
        res.json({ success: true, data: { labels, datasets: [{ label: 'Messages', data }] } });
    } catch (error) { next(error); }
});

/**
 * @route GET /api/analytics/messages
 */
router.get('/messages', async (req, res, next) => {
    try {
        const cid = clientOid(req);
        const stats = await Campaign.aggregate([
            { $match: { client_id: cid, deleted_at: null } },
            {
                $group: {
                    _id: null,
                    sent: { $sum: { $ifNull: ['$stats.sent', 0] } },
                    delivered: { $sum: { $ifNull: ['$stats.delivered', 0] } },
                    read: { $sum: { $ifNull: ['$stats.read', 0] } },
                    failed: { $sum: { $ifNull: ['$stats.failed', 0] } }
                }
            }
        ]);
        const s = stats[0] || {};
        res.json({ success: true, data: { sent: s.sent || 0, delivered: s.delivered || 0, read: s.read || 0, failed: s.failed || 0 } });
    } catch (error) { next(error); }
});

/**
 * @route GET /api/analytics/contacts
 */
router.get('/contacts', async (req, res, next) => {
    try {
        const cid = clientOid(req);
        const total = await Lead.countDocuments({ client_id: cid, deleted_at: null });
        res.json({ success: true, data: { total, active: total } });
    } catch (error) { next(error); }
});

/**
 * @route GET /api/analytics/campaigns
 */
router.get('/campaigns', async (req, res, next) => {
    try {
        const cid = clientOid(req);
        const campaigns = await Campaign.find({ client_id: cid, deleted_at: null })
            .select('name status type stats created_at')
            .limit(10)
            .sort({ created_at: -1 });
        res.json({ success: true, data: campaigns });
    } catch (error) { next(error); }
});

module.exports = router;
