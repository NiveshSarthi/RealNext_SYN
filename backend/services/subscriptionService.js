const { Subscription, Plan, PlanFeature, Feature, Client, Invoice, Payment, SubscriptionUsage } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { logSubscriptionEvent } = require('../middleware/auditLogger');
const logger = require('../config/logger');

/**
 * Subscription Service
 * Handles subscription lifecycle management
 */

class SubscriptionService {
    /**
     * Get current subscription for a tenant
     */
    async getSubscription(clientId) {
        const subscription = await Subscription.findOne({ client_id: clientId })
            .populate({
                path: 'plan_id',
                populate: {
                    path: 'planFeatures',
                    populate: { path: 'feature_id' }
                }
            })
            .sort({ created_at: -1 });

        return subscription;
    }

    /**
     * Create a new subscription
     */
    async createSubscription(clientId, planId, billingCycle = 'monthly') {
        const plan = await Plan.findById(planId);
        if (!plan || !plan.is_active) {
            throw ApiError.notFound('Plan not found or inactive');
        }

        // Check for existing active subscription
        const existing = await Subscription.findOne({
            client_id: clientId,
            status: { $in: ['trial', 'active'] }
        });

        if (existing) {
            throw ApiError.conflict('Client already has an active subscription');
        }

        const now = new Date();
        const periodEnd = this.calculatePeriodEnd(now, billingCycle);
        const trialEnd = plan.trial_days > 0
            ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
            : null;

        const subscription = await Subscription.create({
            client_id: clientId,
            plan_id: planId,
            status: trialEnd ? 'trial' : 'active',
            billing_cycle: billingCycle,
            current_period_start: now,
            current_period_end: trialEnd || periodEnd,
            trial_ends_at: trialEnd
        });

        return subscription;
    }

    /**
     * Upgrade subscription to a new plan
     */
    async upgradePlan(req, subscriptionId, newPlanId, immediate = true) {
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        const newPlan = await Plan.findById(newPlanId);
        if (!newPlan || !newPlan.is_active) {
            throw ApiError.notFound('New plan not found or inactive');
        }

        const oldPlan = await Plan.findById(subscription.plan_id);
        const oldData = subscription.toObject({ virtuals: true });

        if (immediate) {
            // Calculate proration
            const proration = this.calculateProration(
                subscription,
                oldPlan,
                newPlan
            );

            subscription.plan_id = newPlanId;
            subscription.status = 'active';
            subscription.proration_date = new Date();
            subscription.metadata = {
                ...subscription.metadata,
                last_upgrade: {
                    from_plan: oldPlan.code,
                    to_plan: newPlan.code,
                    proration: proration,
                    date: new Date()
                }
            };
            await subscription.save();

            // Create invoice for proration if applicable
            if (proration.amount > 0) {
                await this.createProrationInvoice(subscription, proration);
            }
        } else {
            // Schedule upgrade at end of current period
            subscription.metadata = {
                ...subscription.metadata,
                scheduled_upgrade: {
                    new_plan_id: newPlanId,
                    effective_date: subscription.current_period_end
                }
            };
            await subscription.save();
        }

        const newData = subscription.toObject({ virtuals: true });
        await logSubscriptionEvent(req, 'upgrade', oldData, newData);

        return Subscription.findById(subscriptionId).populate('plan_id');
    }

    /**
     * Downgrade subscription
     */
    async downgradePlan(req, subscriptionId, newPlanId) {
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        const newPlan = await Plan.findById(newPlanId);
        if (!newPlan || !newPlan.is_active) {
            throw ApiError.notFound('New plan not found or inactive');
        }

        // Downgrades take effect at end of billing period
        const oldData = subscription.toObject({ virtuals: true });

        subscription.metadata = {
            ...subscription.metadata,
            scheduled_downgrade: {
                new_plan_id: newPlanId,
                effective_date: subscription.current_period_end,
                current_plan_id: subscription.plan_id
            }
        };
        await subscription.save();

        const newData = subscription.toObject({ virtuals: true });
        await logSubscriptionEvent(req, 'downgrade_scheduled', oldData, newData);

        return subscription;
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(req, subscriptionId, reason = null, immediate = false) {
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        const oldData = subscription.toObject({ virtuals: true });

        if (immediate) {
            subscription.status = 'cancelled';
            subscription.cancelled_at = new Date();
            subscription.cancel_reason = reason;
        } else {
            // Cancel at end of period
            subscription.cancelled_at = new Date();
            subscription.cancel_reason = reason;
            subscription.metadata = {
                ...subscription.metadata,
                cancel_at_period_end: true
            };
        }
        await subscription.save();

        const newData = subscription.toObject({ virtuals: true });
        await logSubscriptionEvent(req, 'cancel', oldData, newData);

        return subscription;
    }

    /**
     * Reactivate a cancelled subscription
     */
    async reactivateSubscription(req, subscriptionId) {
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        if (!['cancelled', 'expired', 'suspended'].includes(subscription.status)) {
            throw ApiError.badRequest('Subscription cannot be reactivated');
        }

        const oldData = subscription.toObject({ virtuals: true });
        const now = new Date();
        const periodEnd = this.calculatePeriodEnd(now, subscription.billing_cycle);

        subscription.status = 'active';
        subscription.cancelled_at = null;
        subscription.cancel_reason = null;
        subscription.current_period_start = now;
        subscription.current_period_end = periodEnd;
        subscription.metadata = {
            ...subscription.metadata,
            reactivated_at: now,
            cancel_at_period_end: false
        };
        await subscription.save();

        const newData = subscription.toObject({ virtuals: true });
        await logSubscriptionEvent(req, 'reactivate', oldData, newData);

        return subscription;
    }

    /**
     * Suspend subscription (e.g., for non-payment)
     */
    async suspendSubscription(subscriptionId, reason = 'non_payment') {
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        subscription.status = 'suspended';
        subscription.metadata = {
            ...subscription.metadata,
            suspended_at: new Date(),
            suspend_reason: reason
        };
        await subscription.save();

        // Also suspend the client
        await Client.updateOne(
            { _id: subscription.client_id },
            { $set: { status: 'suspended' } }
        );

        return subscription;
    }

    /**
     * Get usage for a subscription
     */
    async getUsage(subscriptionId, featureCode = null) {
        const where = { subscription_id: subscriptionId };

        if (featureCode) {
            where.feature_code = featureCode;
        }

        const now = new Date();
        where.usage_period_start = { $lte: now };
        where.usage_period_end = { $gte: now };

        const usage = await SubscriptionUsage.find(where);

        return usage;
    }

    /**
     * Calculate period end based on billing cycle
     */
    calculatePeriodEnd(startDate, billingCycle) {
        const end = new Date(startDate);

        if (billingCycle === 'yearly') {
            end.setFullYear(end.getFullYear() + 1);
        } else {
            end.setMonth(end.getMonth() + 1);
        }

        return end;
    }

    /**
     * Calculate proration for plan change
     */
    calculateProration(subscription, oldPlan, newPlan) {
        const now = new Date();
        const periodStart = new Date(subscription.current_period_start);
        const periodEnd = new Date(subscription.current_period_end);

        const totalDays = (periodEnd - periodStart) / (1000 * 60 * 60 * 24);
        const remainingDays = (periodEnd - now) / (1000 * 60 * 60 * 24);

        const oldDailyRate = oldPlan.price_monthly / 30;
        const newDailyRate = newPlan.price_monthly / 30;

        const oldRemaining = oldDailyRate * remainingDays;
        const newCost = newDailyRate * remainingDays;

        return {
            old_plan_credit: parseFloat(oldRemaining.toFixed(2)),
            new_plan_cost: parseFloat(newCost.toFixed(2)),
            amount: parseFloat((newCost - oldRemaining).toFixed(2)),
            remaining_days: Math.round(remainingDays)
        };
    }

    /**
     * Create proration invoice
     */
    async createProrationInvoice(subscription, proration) {
        if (proration.amount <= 0) return null;

        return Invoice.create({
            client_id: subscription.client_id,
            subscription_id: subscription.id,
            amount: proration.amount,
            tax_amount: 0, // Calculate tax as needed
            total_amount: proration.amount,
            status: 'pending',
            due_date: new Date(),
            line_items: [{
                description: 'Plan upgrade proration',
                amount: proration.amount,
                details: proration
            }]
        });
    }

    /**
     * Process scheduled changes (run daily via cron)
     */
    async processScheduledChanges() {
        const now = new Date();

        // Process scheduled upgrades/downgrades
        const subscriptions = await Subscription.find({
            current_period_end: { $lte: now },
            status: { $in: ['trial', 'active'] }
        });

        for (const sub of subscriptions) {
            try {
                const metadata = sub.metadata || {};

                // Handle scheduled downgrade
                if (metadata.scheduled_downgrade) {
                    subscription.plan_id = metadata.scheduled_downgrade.new_plan_id;
                    subscription.current_period_start = now;
                    subscription.current_period_end = this.calculatePeriodEnd(now, subscription.billing_cycle);
                    subscription.metadata = { ...metadata, scheduled_downgrade: null };
                    await subscription.save();
                }
                // Handle cancel at period end
                else if (metadata.cancel_at_period_end) {
                    subscription.status = 'cancelled';
                    await subscription.save();
                }
                // Handle trial end
                else if (subscription.status === 'trial' && subscription.trial_ends_at && now >= subscription.trial_ends_at) {
                    // Convert to active or expire based on payment method
                    if (subscription.payment_method) {
                        subscription.status = 'active';
                        subscription.current_period_start = now;
                        subscription.current_period_end = this.calculatePeriodEnd(now, subscription.billing_cycle);
                    } else {
                        subscription.status = 'expired';
                    }
                    await subscription.save();
                }
            } catch (error) {
                logger.error(`Failed to process subscription ${sub.id}:`, error);
            }
        }
    }
}

module.exports = new SubscriptionService();
