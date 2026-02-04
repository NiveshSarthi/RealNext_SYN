const { Plan, Feature, PlanFeature, sequelize } = require('../models');
const logger = require('../config/logger');

async function seedPlans() {
    try {
        await sequelize.authenticate();
        logger.info('Database connection established successfully.');

        // 1. Create Features
        const featuresData = [
            { name: 'CRM & Lead Management', code: 'leads', description: 'Manage leads and contacts', is_public: true },
            { name: 'WhatsApp Marketing', code: 'campaigns', description: 'Bulk messaging and templates', is_public: true },
            { name: 'Workflow Automation', code: 'workflows', description: 'Automated flows and drip sequences', is_public: true },
            { name: 'Inventory Catalog', code: 'catalog', description: 'Property inventory management', is_public: true },
            { name: 'Team Management', code: 'team', description: 'Manage team members and roles', is_public: true },
            { name: 'Analytics', code: 'analytics', description: 'Detailed reporting and insights', is_public: true },
            { name: 'Meta Ads Integration', code: 'meta_ads', description: 'Connect Facebook/Instagram ads', is_public: true },
            { name: 'LMS', code: 'lms', description: 'Learning Management System', is_public: true },
            { name: 'Network', code: 'network', description: 'Agent network management', is_public: true },
            { name: 'Quick Replies', code: 'quick_replies', description: 'Pre-saved responses', is_public: true }
        ];

        const features = [];
        for (const f of featuresData) {
            const [feature] = await Feature.findOrCreate({
                where: { code: f.code },
                defaults: f
            });
            features.push(feature);
        }
        logger.info(`Seeded ${features.length} features.`);

        // 2. Create Plans
        const plansData = [
            {
                name: 'Free Trial',
                code: 'trial',
                description: '14-day full access trial',
                price_monthly: 0,
                price_yearly: 0,
                trial_days: 14,
                billing_period: 'monthly',
                is_public: true,
                is_active: true
            },
            {
                name: 'Starter',
                code: 'starter',
                description: 'Essential tools for individuals',
                price_monthly: 29,
                price_yearly: 290,
                trial_days: 0,
                billing_period: 'monthly',
                is_public: true,
                is_active: true
            },
            {
                name: 'Professional',
                code: 'pro',
                description: 'Advanced automation for growing teams',
                price_monthly: 79,
                price_yearly: 790,
                trial_days: 0,
                billing_period: 'monthly',
                is_public: true,
                is_active: true
            },
            {
                name: 'Enterprise',
                code: 'enterprise',
                description: 'Full suite for large organizations',
                price_monthly: 199,
                price_yearly: 1990,
                trial_days: 0,
                billing_period: 'monthly',
                is_public: true,
                is_active: true
            }
        ];

        for (const p of plansData) {
            const [plan, created] = await Plan.findOrCreate({
                where: { code: p.code },
                defaults: p
            });

            if (created) {
                // Assign features to plan
                // Trial: All features
                if (p.code === 'trial') {
                    for (const f of features) {
                        await PlanFeature.create({ plan_id: plan.id, feature_id: f.id, is_enabled: true });
                    }
                }
                // Starter: Basic features
                else if (p.code === 'starter') {
                    const starterFeatures = ['leads', 'campaigns', 'quick_replies', 'catalog'];
                    for (const f of features) {
                        if (starterFeatures.includes(f.code)) {
                            await PlanFeature.create({ plan_id: plan.id, feature_id: f.id, is_enabled: true });
                        }
                    }
                }
                // Pro: Most features
                else if (p.code === 'pro') {
                    const proFeatures = ['leads', 'campaigns', 'quick_replies', 'catalog', 'workflows', 'team', 'analytics', 'meta_ads'];
                    for (const f of features) {
                        if (proFeatures.includes(f.code)) {
                            await PlanFeature.create({ plan_id: plan.id, feature_id: f.id, is_enabled: true });
                        }
                    }
                }
                // Enterprise: All features
                else if (p.code === 'enterprise') {
                    for (const f of features) {
                        await PlanFeature.create({ plan_id: plan.id, feature_id: f.id, is_enabled: true });
                    }
                }
            }
        }
        logger.info(`Seeded plans successfully.`);

    } catch (error) {
        logger.error('Error seeding plans:', error);
    } finally {
        await sequelize.close();
    }
}

seedPlans();
