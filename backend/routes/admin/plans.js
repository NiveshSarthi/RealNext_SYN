const express = require('express');
const router = express.Router();
const { Plan, PlanFeature, Feature, Subscription } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { requireSuperAdmin } = require('../../middleware/roles');
const { auditAction } = require('../../middleware/auditLogger');
const { ApiError } = require('../../middleware/errorHandler');
const { getPagination, getPaginatedResponse, getSorting } = require('../../utils/helpers');
const { createPlan, validate, validators } = require('../../utils/validators');

// All routes require super admin
router.use(authenticate, requireSuperAdmin);

/**
 * @route GET /api/admin/plans
 * @desc List all plans
 * @access Super Admin
 */
router.get('/', async (req, res, next) => {
    try {
        const sorting = getSorting(req.query, ['name', 'price_monthly', 'sort_order', 'created_at'], 'sort_order');

        const plans = await Plan.find()
            .populate({
                path: 'planFeatures',
                populate: { path: 'feature_id', select: 'id code name category' }
            })
            .sort(sorting);

        // Add subscription counts and format data
        const plansWithCounts = await Promise.all(plans.map(async (plan) => {
            const subCount = await Subscription.countDocuments({
                plan_id: plan._id,
                status: { $in: ['trial', 'active'] }
            });

            const planObj = plan.toObject({ virtuals: true });
            return {
                ...planObj,
                active_subscriptions: subCount
            };
        }));

        res.json({
            success: true,
            data: plansWithCounts
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/admin/plans
 * @desc Create new plan
 * @access Super Admin
 */
router.post('/', createPlan, auditAction('create', 'plan'), async (req, res, next) => {
    try {
        const {
            code, name, description, price_monthly, price_yearly,
            currency, billing_period, trial_days, is_public, sort_order, limits
        } = req.body;

        // Check for existing plan
        const existing = await Plan.findOne({ code });
        if (existing) {
            throw ApiError.conflict('Plan with this code already exists');
        }

        const plan = await Plan.create({
            code,
            name,
            description,
            price_monthly,
            price_yearly,
            currency: currency || 'INR',
            billing_period: billing_period || 'monthly',
            trial_days: trial_days || 14,
            is_public: is_public !== false,
            is_active: true,
            sort_order: sort_order || 0,
            limits: limits || {}
        });

        res.status(201).json({
            success: true,
            data: plan
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/admin/plans/:id
 * @desc Get plan details
 * @access Super Admin
 */
router.get('/:id', async (req, res, next) => {
    try {
        const plan = await Plan.findById(req.params.id)
            .populate({
                path: 'planFeatures',
                populate: { path: 'feature_id' }
            });

        if (!plan) {
            throw ApiError.notFound('Plan not found');
        }

        const subscriptionCount = await Subscription.countDocuments({
            plan_id: plan._id
        });

        res.json({
            success: true,
            data: {
                ...plan.toObject({ virtuals: true }),
                total_subscriptions: subscriptionCount
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/admin/plans/:id
 * @desc Update plan
 * @access Super Admin
 */
router.put('/:id',
    [
        validators.optionalString('name'),
        validators.optionalString('description', 1000),
        validate
    ],
    auditAction('update', 'plan'),
    async (req, res, next) => {
        try {
            const plan = await Plan.findById(req.params.id);

            if (!plan) {
                throw ApiError.notFound('Plan not found');
            }

            const {
                name, description, price_monthly, price_yearly,
                currency, billing_period, trial_days, is_public, is_active, sort_order, limits
            } = req.body;

            plan.name = name || plan.name;
            plan.description = description !== undefined ? description : plan.description;
            plan.price_monthly = price_monthly !== undefined ? price_monthly : plan.price_monthly;
            plan.price_yearly = price_yearly !== undefined ? price_yearly : plan.price_yearly;
            plan.currency = currency || plan.currency;
            plan.billing_period = billing_period || plan.billing_period;
            plan.trial_days = trial_days !== undefined ? trial_days : plan.trial_days;
            plan.is_public = is_public !== undefined ? is_public : plan.is_public;
            plan.is_active = is_active !== undefined ? is_active : plan.is_active;
            plan.sort_order = sort_order !== undefined ? sort_order : plan.sort_order;
            plan.limits = limits ? { ...plan.limits, ...limits } : plan.limits;

            await plan.save();

            res.json({
                success: true,
                data: plan
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /api/admin/plans/:id
 * @desc Delete plan (only if no active subscriptions)
 * @access Super Admin
 */
router.delete('/:id', auditAction('delete', 'plan'), async (req, res, next) => {
    try {
        const plan = await Plan.findById(req.params.id);

        if (!plan) {
            throw ApiError.notFound('Plan not found');
        }

        // Check for active subscriptions
        const activeCount = await Subscription.countDocuments({
            plan_id: plan._id,
            status: { $in: ['trial', 'active'] }
        });

        if (activeCount > 0) {
            throw ApiError.badRequest(`Cannot delete plan with ${activeCount} active subscription(s). Deactivate instead.`);
        }

        // Delete plan features first
        await PlanFeature.deleteMany({ plan_id: plan._id });
        await Plan.deleteOne({ _id: plan._id });

        res.json({
            success: true,
            message: 'Plan deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/admin/plans/:id/features
 * @desc Set features for a plan
 * @access Super Admin
 */
router.put('/:id/features',
    [validators.array('features', true), validate],
    auditAction('update_features', 'plan'),
    async (req, res, next) => {
        try {
            const plan = await Plan.findById(req.params.id);

            if (!plan) {
                throw ApiError.notFound('Plan not found');
            }

            const { features } = req.body;
            // features: [{ feature_id, is_enabled, limits }]

            // Remove existing and add new
            await PlanFeature.deleteMany({ plan_id: req.params.id });

            const planFeatures = await PlanFeature.insertMany(
                features.map(f => ({
                    plan_id: req.params.id,
                    feature_id: f.feature_id,
                    is_enabled: f.is_enabled !== false,
                    limits: f.limits || {}
                }))
            );

            // Reload with features
            const updatedPlan = await Plan.findById(req.params.id)
                .populate({
                    path: 'planFeatures',
                    populate: { path: 'feature_id' }
                });

            res.json({
                success: true,
                data: updatedPlan
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
