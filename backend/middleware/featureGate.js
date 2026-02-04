const { ApiError } = require('./errorHandler');
const { SubscriptionUsage, Subscription, PlanFeature, Feature } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

/**
 * Feature Gating Middleware
 * Checks if the tenant has access to specific features based on subscription
 */

/**
 * Check if feature is enabled for the tenant
 */
const requireFeature = (featureCode) => {
    return async (req, res, next) => {
        // Super admins bypass feature checks
        if (req.user?.is_super_admin) {
            return next();
        }

        // Check if feature is globally disabled
        const feature = await Feature.findOne({ where: { code: featureCode } });
        if (!feature || !feature.is_enabled) {
            throw ApiError.forbidden(`Feature '${featureCode}' is currently unavailable`);
        }

        // Check if tenant has this feature in their plan
        if (!req.features || !req.features[featureCode]) {
            throw ApiError.forbidden(`Your subscription does not include access to '${featureCode}'`);
        }

        // Attach feature limits for use in controller
        req.currentFeature = {
            code: featureCode,
            limits: req.featureLimits[featureCode] || {}
        };

        next();
    };
};

/**
 * Check usage against limits
 */
const checkUsageLimit = (featureCode, limitKey) => {
    return async (req, res, next) => {
        // Super admins bypass limits
        if (req.user?.is_super_admin) {
            return next();
        }

        if (!req.subscription) {
            throw ApiError.forbidden('No active subscription');
        }

        const limits = req.featureLimits[featureCode] || {};
        const maxLimit = limits[limitKey];

        // If no limit is set, allow unlimited
        if (maxLimit === undefined || maxLimit === null || maxLimit === -1) {
            return next();
        }

        // Get current period usage
        const now = new Date();
        const periodStart = new Date(req.subscription.current_period_start);
        const periodEnd = new Date(req.subscription.current_period_end);

        const usage = await SubscriptionUsage.findOne({
            where: {
                subscription_id: req.subscription.id,
                feature_code: featureCode,
                usage_period_start: { [Op.lte]: now },
                usage_period_end: { [Op.gte]: now }
            }
        });

        const currentUsage = usage?.usage_count || 0;

        if (currentUsage >= maxLimit) {
            throw ApiError.forbidden(
                `You have reached your ${limitKey.replace('max_', '').replace('_', ' ')} limit (${maxLimit}). ` +
                `Please upgrade your plan for more.`
            );
        }

        // Attach usage info for controller
        req.usageInfo = {
            featureCode,
            limitKey,
            currentUsage,
            maxLimit,
            remaining: maxLimit - currentUsage
        };

        next();
    };
};

/**
 * Increment usage after successful operation
 */
const incrementUsage = async (req, featureCode, amount = 1) => {
    if (!req.subscription) {
        return;
    }

    const now = new Date();
    const periodStart = new Date(req.subscription.current_period_start);
    const periodEnd = new Date(req.subscription.current_period_end);

    try {
        const [usage, created] = await SubscriptionUsage.findOrCreate({
            where: {
                subscription_id: req.subscription.id,
                feature_code: featureCode,
                usage_period_start: periodStart
            },
            defaults: {
                subscription_id: req.subscription.id,
                feature_code: featureCode,
                usage_period_start: periodStart,
                usage_period_end: periodEnd,
                usage_count: amount
            }
        });

        if (!created) {
            await usage.increment('usage_count', { by: amount });
        }

        logger.debug(`Usage incremented: ${featureCode} for subscription ${req.subscription.id}`);
    } catch (error) {
        logger.error('Failed to increment usage:', error);
        // Don't fail the request if usage tracking fails
    }
};

/**
 * Check if subscription is active
 */
const requireActiveSubscription = (req, res, next) => {
    // Super admins bypass subscription check
    if (req.user?.is_super_admin) {
        return next();
    }

    if (!req.subscription) {
        throw ApiError.forbidden('No active subscription. Please subscribe to a plan.');
    }

    const validStatuses = ['trial', 'active'];
    if (!validStatuses.includes(req.subscription.status)) {
        throw ApiError.forbidden(
            `Your subscription is ${req.subscription.status}. Please renew to continue.`
        );
    }

    // Check if subscription period has ended
    if (new Date() > new Date(req.subscription.current_period_end)) {
        throw ApiError.forbidden('Your subscription has expired. Please renew to continue.');
    }

    next();
};

/**
 * Get usage stats for a feature
 */
const getUsageStats = async (subscriptionId, featureCode) => {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) return null;

    const usage = await SubscriptionUsage.findOne({
        where: {
            subscription_id: subscriptionId,
            feature_code: featureCode,
            usage_period_start: { [Op.lte]: new Date() },
            usage_period_end: { [Op.gte]: new Date() }
        }
    });

    return {
        feature_code: featureCode,
        usage_count: usage?.usage_count || 0,
        period_start: subscription.current_period_start,
        period_end: subscription.current_period_end
    };
};

module.exports = {
    requireFeature,
    checkUsageLimit,
    incrementUsage,
    requireActiveSubscription,
    getUsageStats
};
