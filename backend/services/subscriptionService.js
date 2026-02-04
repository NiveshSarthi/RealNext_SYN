const { Subscription, Plan, PlanFeature, Feature, Tenant, Invoice, Payment, SubscriptionUsage } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { logSubscriptionEvent } = require('../middleware/auditLogger');
const { Op } = require('sequelize');
const logger = require('../config/logger');

/**
 * Subscription Service
 * Handles subscription lifecycle management
 */

class SubscriptionService {
    /**
     * Get current subscription for a tenant
     */
    async getSubscription(tenantId) {
        const subscription = await Subscription.findOne({
            where: { tenant_id: tenantId },
            include: [{
                model: Plan,
                as: 'plan',
                include: [{
                    model: PlanFeature,
                    as: 'planFeatures',
                    include: [{ model: Feature }]
                }]
            }],
            order: [['created_at', 'DESC']]
        });

        return subscription;
    }

    /**
     * Create a new subscription
     */
    async createSubscription(tenantId, planId, partnerId = null, billingCycle = 'monthly') {
        const plan = await Plan.findByPk(planId);
        if (!plan || !plan.is_active) {
            throw ApiError.notFound('Plan not found or inactive');
        }

        // Check for existing active subscription
        const existing = await Subscription.findOne({
            where: {
                tenant_id: tenantId,
                status: ['trial', 'active']
            }
        });

        if (existing) {
            throw ApiError.conflict('Tenant already has an active subscription');
        }

        const now = new Date();
        const periodEnd = this.calculatePeriodEnd(now, billingCycle);
        const trialEnd = plan.trial_days > 0
            ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
            : null;

        const subscription = await Subscription.create({
            tenant_id: tenantId,
            plan_id: planId,
            partner_id: partnerId,
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
        const subscription = await Subscription.findByPk(subscriptionId);
        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        const newPlan = await Plan.findByPk(newPlanId);
        if (!newPlan || !newPlan.is_active) {
            throw ApiError.notFound('New plan not found or inactive');
        }

        const oldPlan = await Plan.findByPk(subscription.plan_id);
        const oldData = subscription.get({ plain: true });

        if (immediate) {
            // Calculate proration
            const proration = this.calculateProration(
                subscription,
                oldPlan,
                newPlan
            );

            await subscription.update({
                plan_id: newPlanId,
                status: 'active',
                proration_date: new Date(),
                metadata: {
                    ...subscription.metadata,
                    last_upgrade: {
                        from_plan: oldPlan.code,
                        to_plan: newPlan.code,
                        proration: proration,
                        date: new Date()
                    }
                }
            });

            // Create invoice for proration if applicable
            if (proration.amount > 0) {
                await this.createProrationInvoice(subscription, proration);
            }
        } else {
            // Schedule upgrade at end of current period
            await subscription.update({
                metadata: {
                    ...subscription.metadata,
                    scheduled_upgrade: {
                        new_plan_id: newPlanId,
                        effective_date: subscription.current_period_end
                    }
                }
            });
        }

        await logSubscriptionEvent(req, 'upgrade', oldData, subscription.get({ plain: true }));

        return subscription.reload({
            include: [{ model: Plan, as: 'plan' }]
        });
    }

    /**
     * Downgrade subscription
     */
    async downgradePlan(req, subscriptionId, newPlanId) {
        const subscription = await Subscription.findByPk(subscriptionId);
        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        const newPlan = await Plan.findByPk(newPlanId);
        if (!newPlan || !newPlan.is_active) {
            throw ApiError.notFound('New plan not found or inactive');
        }

        // Downgrades take effect at end of billing period
        const oldData = subscription.get({ plain: true });

        await subscription.update({
            metadata: {
                ...subscription.metadata,
                scheduled_downgrade: {
                    new_plan_id: newPlanId,
                    effective_date: subscription.current_period_end,
                    current_plan_id: subscription.plan_id
                }
            }
        });

        await logSubscriptionEvent(req, 'downgrade_scheduled', oldData, subscription.get({ plain: true }));

        return subscription;
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(req, subscriptionId, reason = null, immediate = false) {
        const subscription = await Subscription.findByPk(subscriptionId);
        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        const oldData = subscription.get({ plain: true });

        if (immediate) {
            await subscription.update({
                status: 'cancelled',
                cancelled_at: new Date(),
                cancel_reason: reason
            });
        } else {
            // Cancel at end of period
            await subscription.update({
                cancelled_at: new Date(),
                cancel_reason: reason,
                metadata: {
                    ...subscription.metadata,
                    cancel_at_period_end: true
                }
            });
        }

        await logSubscriptionEvent(req, 'cancel', oldData, subscription.get({ plain: true }));

        return subscription;
    }

    /**
     * Reactivate a cancelled subscription
     */
    async reactivateSubscription(req, subscriptionId) {
        const subscription = await Subscription.findByPk(subscriptionId);
        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        if (!['cancelled', 'expired', 'suspended'].includes(subscription.status)) {
            throw ApiError.badRequest('Subscription cannot be reactivated');
        }

        const oldData = subscription.get({ plain: true });
        const now = new Date();
        const periodEnd = this.calculatePeriodEnd(now, subscription.billing_cycle);

        await subscription.update({
            status: 'active',
            cancelled_at: null,
            cancel_reason: null,
            current_period_start: now,
            current_period_end: periodEnd,
            metadata: {
                ...subscription.metadata,
                reactivated_at: now,
                cancel_at_period_end: false
            }
        });

        await logSubscriptionEvent(req, 'reactivate', oldData, subscription.get({ plain: true }));

        return subscription;
    }

    /**
     * Suspend subscription (e.g., for non-payment)
     */
    async suspendSubscription(subscriptionId, reason = 'non_payment') {
        const subscription = await Subscription.findByPk(subscriptionId);
        if (!subscription) {
            throw ApiError.notFound('Subscription not found');
        }

        await subscription.update({
            status: 'suspended',
            metadata: {
                ...subscription.metadata,
                suspended_at: new Date(),
                suspend_reason: reason
            }
        });

        // Also suspend the tenant
        await Tenant.update(
            { status: 'suspended' },
            { where: { id: subscription.tenant_id } }
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
        where.usage_period_start = { [Op.lte]: now };
        where.usage_period_end = { [Op.gte]: now };

        const usage = await SubscriptionUsage.findAll({ where });

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
            tenant_id: subscription.tenant_id,
            subscription_id: subscription.id,
            partner_id: subscription.partner_id,
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
        const subscriptions = await Subscription.findAll({
            where: {
                current_period_end: { [Op.lte]: now },
                status: ['trial', 'active']
            }
        });

        for (const sub of subscriptions) {
            try {
                const metadata = sub.metadata || {};

                // Handle scheduled downgrade
                if (metadata.scheduled_downgrade) {
                    await sub.update({
                        plan_id: metadata.scheduled_downgrade.new_plan_id,
                        current_period_start: now,
                        current_period_end: this.calculatePeriodEnd(now, sub.billing_cycle),
                        metadata: { ...metadata, scheduled_downgrade: null }
                    });
                }
                // Handle cancel at period end
                else if (metadata.cancel_at_period_end) {
                    await sub.update({ status: 'cancelled' });
                }
                // Handle trial end
                else if (sub.status === 'trial' && sub.trial_ends_at && now >= sub.trial_ends_at) {
                    // Convert to active or expire based on payment method
                    if (sub.payment_method) {
                        await sub.update({
                            status: 'active',
                            current_period_start: now,
                            current_period_end: this.calculatePeriodEnd(now, sub.billing_cycle)
                        });
                    } else {
                        await sub.update({ status: 'expired' });
                    }
                }
            } catch (error) {
                logger.error(`Failed to process subscription ${sub.id}:`, error);
            }
        }
    }
}

module.exports = new SubscriptionService();
