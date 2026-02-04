const express = require('express');
const router = express.Router();
const { Tenant, Partner, Subscription, Payment, User, Lead } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireSuperAdmin } = require('../../middleware/roles');
const { Op, fn, col, literal } = require('sequelize');

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
            totalTenants,
            activeTenants,
            totalPartners,
            activePartners,
            totalUsers,
            activeSubscriptions,
            trialSubscriptions,
            newTenantsThisMonth
        ] = await Promise.all([
            Tenant.count(),
            Tenant.count({ where: { status: 'active' } }),
            Partner.count(),
            Partner.count({ where: { status: 'active' } }),
            User.count({ where: { status: 'active' } }),
            Subscription.count({ where: { status: 'active' } }),
            Subscription.count({ where: { status: 'trial' } }),
            Tenant.count({ where: { created_at: { [Op.gte]: thirtyDaysAgo } } })
        ]);

        res.json({
            success: true,
            data: {
                tenants: {
                    total: totalTenants,
                    active: activeTenants,
                    new_this_month: newTenantsThisMonth
                },
                partners: {
                    total: totalPartners,
                    active: activePartners
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

        const dateFilter = {};
        if (start_date) dateFilter[Op.gte] = new Date(start_date);
        if (end_date) dateFilter[Op.lte] = new Date(end_date);

        const where = Object.keys(dateFilter).length
            ? { created_at: dateFilter, status: 'completed' }
            : { status: 'completed' };

        const payments = await Payment.findAll({
            where,
            attributes: [
                [fn('SUM', col('amount')), 'total'],
                [fn('COUNT', col('id')), 'count'],
                [fn('DATE_TRUNC', 'month', col('created_at')), 'month']
            ],
            group: [fn('DATE_TRUNC', 'month', col('created_at'))],
            order: [[fn('DATE_TRUNC', 'month', col('created_at')), 'ASC']],
            raw: true
        });

        const totalRevenue = await Payment.sum('amount', { where });

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
 * @route GET /api/admin/analytics/tenants
 * @desc Get tenant growth analytics
 * @access Super Admin
 */
router.get('/tenants', async (req, res, next) => {
    try {
        const tenantsByMonth = await Tenant.findAll({
            attributes: [
                [fn('DATE_TRUNC', 'month', col('created_at')), 'month'],
                [fn('COUNT', col('id')), 'count']
            ],
            group: [fn('DATE_TRUNC', 'month', col('created_at'))],
            order: [[fn('DATE_TRUNC', 'month', col('created_at')), 'ASC']],
            raw: true
        });

        const tenantsByStatus = await Tenant.findAll({
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            group: ['status'],
            raw: true
        });

        const tenantsByEnvironment = await Tenant.findAll({
            attributes: ['environment', [fn('COUNT', col('id')), 'count']],
            group: ['environment'],
            raw: true
        });

        res.json({
            success: true,
            data: {
                growth: tenantsByMonth,
                by_status: tenantsByStatus,
                by_environment: tenantsByEnvironment
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/analytics/partners
 * @desc Get partner performance analytics
 * @access Super Admin
 */
router.get('/partners', async (req, res, next) => {
    try {
        const partners = await Partner.findAll({
            attributes: ['id', 'name', 'slug', 'commission_rate', 'created_at'],
            include: [{
                model: Tenant,
                as: 'tenants',
                attributes: ['id'],
                required: false
            }]
        });

        const partnerStats = await Promise.all(partners.map(async (partner) => {
            const tenantCount = partner.tenants?.length || 0;

            const activeSubscriptions = await Subscription.count({
                where: {
                    partner_id: partner.id,
                    status: ['trial', 'active']
                }
            });

            const totalRevenue = await Payment.sum('amount', {
                include: [{
                    model: require('../../models').Invoice,
                    where: { partner_id: partner.id }
                }],
                where: { status: 'completed' }
            });

            return {
                id: partner.id,
                name: partner.name,
                slug: partner.slug,
                tenant_count: tenantCount,
                active_subscriptions: activeSubscriptions,
                total_revenue: totalRevenue || 0,
                commission_rate: partner.commission_rate,
                estimated_commission: (totalRevenue || 0) * (partner.commission_rate / 100)
            };
        }));

        res.json({
            success: true,
            data: partnerStats
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
