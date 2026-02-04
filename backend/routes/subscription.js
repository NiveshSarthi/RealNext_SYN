const express = require('express');
const router = express.Router();
const { Plan, Feature, PlanFeature, Subscription } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @route GET /api/subscription/plans
 * @desc Get all public plans (for pricing page)
 * @access Public
 */
router.get('/plans', optionalAuth, async (req, res, next) => {
    try {
        const where = { is_active: true, is_public: true };

        // If user is part of a partner, only show partner's allowed plans
        if (req.partner) {
            const { PartnerAllowedPlan } = require('../models');
            const allowedPlanIds = await PartnerAllowedPlan.findAll({
                where: { partner_id: req.partner.id, is_active: true },
                attributes: ['plan_id']
            });

            if (allowedPlanIds.length > 0) {
                where.id = allowedPlanIds.map(p => p.plan_id);
            }
        }

        const plans = await Plan.findAll({
            where,
            include: [{
                model: PlanFeature,
                as: 'planFeatures',
                where: { is_enabled: true },
                required: false,
                include: [{
                    model: Feature,
                    where: { is_enabled: true },
                    required: false,
                    attributes: ['id', 'code', 'name', 'description', 'category']
                }]
            }],
            order: [['sort_order', 'ASC'], ['price_monthly', 'ASC']]
        });

        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/subscription/current
 * @desc Get current user's subscription
 * @access Private
 */
router.get('/current', authenticate, async (req, res, next) => {
    try {
        if (!req.tenant) {
            return res.json({
                success: true,
                data: null,
                message: 'No tenant context'
            });
        }

        const subscriptionService = require('../services/subscriptionService');
        const subscription = await subscriptionService.getSubscription(req.tenant.id);

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
                subscription: subscription.get({ plain: true }),
                usage
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/subscription/checkout
 * @desc Create checkout session for subscription
 * @access Private
 */
router.post('/checkout', authenticate, async (req, res, next) => {
    try {
        const { plan_id, billing_cycle } = req.body;

        if (!req.tenant) {
            throw ApiError.badRequest('Tenant context required');
        }

        const plan = await Plan.findByPk(plan_id);
        if (!plan || !plan.is_active) {
            throw ApiError.notFound('Plan not found');
        }

        // Calculate amount
        const amount = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

        // TODO: Integrate with payment gateway (Razorpay)
        // For now, return checkout details

        res.json({
            success: true,
            data: {
                plan: {
                    id: plan.id,
                    name: plan.name,
                    code: plan.code
                },
                billing_cycle: billing_cycle || 'monthly',
                amount,
                currency: plan.currency,
                // checkout_url: 'https://razorpay.com/...',
                // order_id: 'order_xxx'
                message: 'Payment gateway integration pending. Use /api/subscription/activate for manual activation.'
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/subscription/activate
 * @desc Activate subscription (for manual/admin activation)
 * @access Private
 */
router.post('/activate', authenticate, async (req, res, next) => {
    try {
        const { plan_id, billing_cycle } = req.body;

        if (!req.tenant) {
            throw ApiError.badRequest('Tenant context required');
        }

        const subscriptionService = require('../services/subscriptionService');

        // Check for existing subscription
        const existing = await Subscription.findOne({
            where: {
                tenant_id: req.tenant.id,
                status: ['trial', 'active']
            }
        });

        if (existing) {
            // Upgrade existing
            const upgraded = await subscriptionService.upgradePlan(req, existing.id, plan_id);
            return res.json({
                success: true,
                data: upgraded,
                message: 'Subscription upgraded'
            });
        }

        // Create new subscription
        const subscription = await subscriptionService.createSubscription(
            req.tenant.id,
            plan_id,
            req.partner?.id || null,
            billing_cycle || 'monthly'
        );

        res.status(201).json({
            success: true,
            data: subscription,
            message: 'Subscription activated'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/subscription/cancel
 * @desc Cancel subscription
 * @access Private
 */
router.post('/cancel', authenticate, async (req, res, next) => {
    try {
        const { reason, immediate } = req.body;

        if (!req.tenant) {
            throw ApiError.badRequest('Tenant context required');
        }

        const subscription = await Subscription.findOne({
            where: {
                tenant_id: req.tenant.id,
                status: ['trial', 'active']
            }
        });

        if (!subscription) {
            throw ApiError.notFound('No active subscription');
        }

        const subscriptionService = require('../services/subscriptionService');
        const cancelled = await subscriptionService.cancelSubscription(
            req,
            subscription.id,
            reason,
            immediate || false
        );

        res.json({
            success: true,
            data: cancelled,
            message: immediate
                ? 'Subscription cancelled immediately'
                : 'Subscription will be cancelled at end of billing period'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
