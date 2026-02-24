const express = require('express');
const router = express.Router();
const { Plan, Feature, PlanFeature, Subscription } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');

// Defensive helper to ensure client context exists before using req.client.id
const ensureClient = (req) => {
    // Super admins can skip client context check for listing (GET)
    if (req.user?.is_super_admin && req.method === 'GET') {
        return;
    }

    if (!req.client || !req.client.id) {
        throw new ApiError(400, 'Client context is required for this operation. Super Admins must provide a client ID.');
    }
};

/**
 * @route GET /api/subscription/plans
 * @desc Get all public plans (for pricing page)
 * @access Public
 */
router.get('/plans', optionalAuth, async (req, res, next) => {
    try {
        const query = { is_active: true, is_public: true };

        const plans = await Plan.find(query)
            .populate({
                path: 'planFeatures',
                match: { is_enabled: true },
                populate: {
                    path: 'feature_id',
                    match: { is_enabled: true },
                    select: 'code name description category'
                }
            })
            .sort({ sort_order: 1, price_monthly: 1 });

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
        ensureClient(req);
        if (!req.client?.id) {
            return res.json({
                success: true,
                data: null,
                message: 'Global Super Admin context (no client selected)'
            });
        }

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
                subscription: subscription.toObject({ virtuals: true }),
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

        if (!req.client) {
            throw ApiError.badRequest('Client context required');
        }

        const plan = await Plan.findById(plan_id);
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

        if (!req.client) {
            throw ApiError.badRequest('Client context required');
        }

        const subscriptionService = require('../services/subscriptionService');

        // Check for existing subscription
        const existing = await Subscription.findOne({
            client_id: req.client.id,
            status: { $in: ['trial', 'active'] }
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
            req.client.id,
            plan_id,
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
        ensureClient(req);
        const { reason, immediate } = req.body;

        const subscription = await Subscription.findOne({
            client_id: req.client.id,
            status: { $in: ['trial', 'active'] }
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
