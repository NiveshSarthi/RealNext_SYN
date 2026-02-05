require('dotenv').config();
const { sequelize } = require('../config/database');
const { Feature, Plan, Subscription, PlanFeature, Tenant, User, TenantUser } = require('../models');

async function fixSubscription() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Find Tenant
        const companyName = 'Test Company Ltd';
        const tenant = await Tenant.findOne({ where: { name: companyName } });
        if (!tenant) {
            console.log(`❌ Tenant "${companyName}" not found.`);
            process.exit(1);
        }
        console.log(`✅ Tenant Found: ID=${tenant.id}`);

        // 2. Find or Create 'Starter' Plan
        let plan = await Plan.findOne({ where: { code: 'starter' } });
        if (!plan) {
            console.log('Creating "Starter" Plan...');
            plan = await Plan.create({
                code: 'starter',
                name: 'Starter Plan',
                description: 'Basic plan for testing',
                price_monthly: 0,
                price_yearly: 0,
                trial_days: 14,
                is_active: true,
                is_public: true
            });
        }
        console.log(`✅ Plan Found: ${plan.name} (Code: ${plan.code})`);

        // 3. Ensure 'meta_ads' Feature exists and is enabled for Plan
        let feature = await Feature.findOne({ where: { code: 'meta_ads' } });
        if (!feature) {
            console.log('Creating "meta_ads" Feature...');
            feature = await Feature.create({
                code: 'meta_ads',
                name: 'Meta Ads Integration',
                description: 'Sync leads from Facebook/Instagram',
                is_active: true
            });
        }

        const [pf, pfCreated] = await PlanFeature.findOrCreate({
            where: { plan_id: plan.id, feature_id: feature.id },
            defaults: { is_enabled: true }
        });

        if (!pfCreated && !pf.is_enabled) {
            await pf.update({ is_enabled: true });
            console.log('Updated "meta_ads" to ENABLED for Starter Plan.');
        } else {
            console.log('✅ "meta_ads" is enabled for Starter Plan.');
        }

        // 4. Create Subscription for Tenant
        let subscription = await Subscription.findOne({ where: { tenant_id: tenant.id } });
        if (!subscription) {
            console.log('Creating Trial Subscription...');
            const now = new Date();
            const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

            subscription = await Subscription.create({
                tenant_id: tenant.id,
                plan_id: plan.id,
                status: 'trial',
                billing_cycle: 'monthly',
                current_period_start: now,
                current_period_end: trialEnd,
                trial_ends_at: trialEnd
            });
            console.log('✅ Subscription Created via Script.');
        } else {
            console.log(`✅ Subscription already exists (Status: ${subscription.status}).`);
            // Ensure status is active/trial
            if (!['active', 'trial'].includes(subscription.status)) {
                await subscription.update({ status: 'active' });
                console.log('Updated subscription status to ACTIVE.');
            }
        }

        console.log('\n--- VERIFICATION SUCCESSFUL ---');
        console.log('Tenant Admin should now have access.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixSubscription();
