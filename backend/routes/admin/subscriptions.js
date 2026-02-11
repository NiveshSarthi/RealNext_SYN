const express = require('express');
const router = express.Router();
const { Subscription, Client, Plan, User } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireSuperAdmin } = require('../../middleware/roles');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { getPagination, getPaginatedResponse } = require('../../utils/helpers');
const { validate, validators } = require('../../utils/validators');
const subscriptionService = require('../../services/subscriptionService');
const logger = require('../../config/logger');

// All routes require super admin
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/admin/subscriptions
 * @desc List all subscriptions globally
 * @access Super Admin
 */
router.get('/', async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);

        const subscriptions = await Subscription.find()
            .populate({
                path: 'client_id',
                select: 'name email'
            })
            .populate({
                path: 'plan_id',
                select: 'name code price_monthly price_yearly'
            })
            .sort({ created_at: -1 })
            .limit(pagination.limit)
            .skip(pagination.offset);

        const count = await Subscription.countDocuments();

        res.json({
            success: true,
            ...getPaginatedResponse(subscriptions, count, pagination)
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/subscriptions
 * @desc Assign subscription to a client
 * @access Super Admin
 */
router.post('/',
    [
        validators.requiredString('client_id', 1, 50),
        validators.requiredString('plan_id', 1, 50),
        validators.optionalString('billing_cycle', 4, 10),
        validators.optionalDate('start_date'),
        validate
    ],
    auditAction('assign', 'subscription'),
    async (req, res, next) => {
        try {
            const { client_id, plan_id, billing_cycle = 'monthly', start_date } = req.body;

            logger.info(`[ADMIN SUBSCRIPTION] Assigning plan ${plan_id} to client ${client_id} by admin ${req.user.id}`);

            // Verify client exists
            const client = await Client.findById(client_id);
            if (!client) {
                throw ApiError.notFound('Client not found');
            }

            // Check for existing active subscription
            const existing = await Subscription.findOne({
                client_id: client_id,
                status: { $in: ['trial', 'active'] }
            });

            if (existing) {
                throw ApiError.conflict(`Client already has an active subscription. Cancel or modify existing subscription first.`);
            }

            // Create subscription
            const subscription = await subscriptionService.createSubscription(client_id, plan_id, billing_cycle);

            if (start_date) {
                subscription.current_period_start = new Date(start_date);
                subscription.current_period_end = subscriptionService.calculatePeriodEnd(new Date(start_date), billing_cycle);
                await subscription.save();
            }

            logger.info(`[ADMIN SUBSCRIPTION] Successfully assigned subscription ${subscription.id} to client ${client_id}`);

            // Populate for response
            await subscription.populate([
                { path: 'client_id', select: 'name email' },
                { path: 'plan_id', select: 'name code price_monthly price_yearly' }
            ]);

            res.status(201).json({
                success: true,
                data: subscription,
                message: 'Subscription assigned successfully'
            });
        } catch (error) {
            logger.error(`[ADMIN SUBSCRIPTION] Failed to assign subscription:`, error);
            next(error);
        }
    }
);

/**
 * @route PUT /api/admin/subscriptions/:id
 * @desc Update subscription (change plan, status, etc.)
 * @access Super Admin
 */
router.put('/:id',
    [
        validators.optionalString('plan_id', 1, 50),
        validators.optionalString('status', 3, 20),
        validators.optionalString('billing_cycle', 4, 10),
        validate
    ],
    auditAction('update', 'subscription'),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { plan_id, status, billing_cycle } = req.body;

            logger.info(`[ADMIN SUBSCRIPTION] Updating subscription ${id} by admin ${req.user.id}`);

            const subscription = await Subscription.findById(id);
            if (!subscription) {
                throw ApiError.notFound('Subscription not found');
            }

            // Update plan if provided
            if (plan_id && plan_id !== subscription.plan_id.toString()) {
                await subscriptionService.upgradePlan({ user: req.user }, id, plan_id, true);
            }

            // Update other fields
            if (status) {
                subscription.status = status;
            }
            if (billing_cycle) {
                subscription.billing_cycle = billing_cycle;
            }

            await subscription.save();

            logger.info(`[ADMIN SUBSCRIPTION] Successfully updated subscription ${id}`);

            // Populate for response
            await subscription.populate([
                { path: 'client_id', select: 'name email' },
                { path: 'plan_id', select: 'name code price_monthly price_yearly' }
            ]);

            res.json({
                success: true,
                data: subscription,
                message: 'Subscription updated successfully'
            });
        } catch (error) {
            logger.error(`[ADMIN SUBSCRIPTION] Failed to update subscription:`, error);
            next(error);
        }
    }
);

/**
 * @route DELETE /api/admin/subscriptions/:id
 * @desc Cancel subscription
 * @access Super Admin
 */
router.delete('/:id', auditAction('cancel', 'subscription'), async (req, res, next) => {
    try {
        const { id } = req.params;

        logger.info(`[ADMIN SUBSCRIPTION] Cancelling subscription ${id} by admin ${req.user.id}`);

        const subscription = await Subscription.findById(id);
        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        subscription.status = 'cancelled';
        subscription.cancelled_at = new Date();
        await subscription.save();

        logger.info(`[ADMIN SUBSCRIPTION] Successfully cancelled subscription ${id}`);

        res.json({
            success: true,
            message: 'Subscription cancelled successfully'
        });
    } catch (error) {
        logger.error(`[ADMIN SUBSCRIPTION] Failed to cancel subscription:`, error);
        next(error);
    }
});

/**
 * @route GET /api/admin/subscriptions/:id
 * @desc Get subscription details
 * @access Super Admin
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const subscription = await Subscription.findById(id)
            .populate({
                path: 'client_id',
                select: 'name email status'
            })
            .populate({
                path: 'plan_id',
                select: 'name code price_monthly price_yearly',
                populate: {
                    path: 'planFeatures',
                    populate: { path: 'feature_id', select: 'code name' }
                }
            });

        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;