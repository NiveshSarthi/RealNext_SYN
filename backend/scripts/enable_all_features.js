require('dotenv').config();
const { sequelize } = require('../config/database');
const { Feature, Plan, Subscription, PlanFeature, Tenant } = require('../models');

async function enableAllFeatures() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Ensure All Core Features Exist
        console.log('\n--- 1. Resetting Features ---');
        // NUCLEAR: Truncate Features to ensure clean IDs
        try {
            await PlanFeature.destroy({ truncate: true, cascade: true, restartIdentity: true });
        } catch (e) { console.log('PlanFeature truncate failed, trying delete'); await PlanFeature.destroy({ where: {} }); }

        try {
            await Feature.destroy({ where: {}, force: true });
        } catch (e) { console.log('Feature delete failed'); }

        const ALL_FEATURES = [
            { code: 'meta_ads', name: 'Meta Ads Integration', description: 'Sync leads from Facebook' },
            { code: 'crm_sync', name: 'CRM Sync', description: 'Sync leads to external CRM' },
            { code: 'leads', name: 'Lead Management System', description: 'Manage and track leads' },
            { code: 'lms', name: 'Learning Management System', description: 'Employee training courses' },
            { code: 'analytics', name: 'Advanced Analytics', description: 'Deep insights and reporting' },
            { code: 'wa_marketing', name: 'WhatsApp Marketing', description: 'Send broadcasts and automated messages' },
            { code: 'drip_sequences', name: 'Drip Sequences', description: 'Automated follow-up campaigns' },
            { code: 'team_collaboration', name: 'Team Collaboration', description: 'Assign tasks and track performance' },
            { code: 'api_access', name: 'API Access', description: 'Developer API usage' },
            { code: 'workflows', name: 'Workflow Automation', description: 'Custom automation builder' },
            { code: 'real_estate', name: 'Real Estate Portfolio', description: 'Property management' },
            { code: 'team_management', name: 'Team Management', description: 'Manage team members' },
            { code: 'api_access', name: 'API Access', description: 'Access to public API' }
        ];

        console.log('\n--- 1. Ensuring Features Exist ---');
        const featureMap = {};
        for (const f of ALL_FEATURES) {
            const [feature] = await Feature.findOrCreate({
                where: { code: f.code },
                defaults: { ...f, is_active: true }
            });
            featureMap[f.code] = feature;
            console.log(`✅ Feature: ${f.name} (${f.code})`);
        }

        // 2. Create/Update "Pro Plan" with ALL features
        console.log('\n--- 2. Configuring "Pro Plan" ---');

        // NUCLEAR OPTION: Delete existing Pro Plan first to ensure clean slate
        const existingPro = await Plan.findOne({ where: { code: 'pro' } });
        if (existingPro) {
            console.log('  -> Destroying existing Pro Plan to cleanup associations...');
            // Manually delete plan features first if cascade is not set up
            await PlanFeature.destroy({ where: { plan_id: existingPro.id } });
            await existingPro.destroy({ force: true });
        }

        const [proPlan] = await Plan.findOrCreate({
            where: { code: 'pro' },
            defaults: {
                name: 'Pro Plan (All Access)',
                description: 'Full access to all features',
                price_monthly: 99,
                price_yearly: 999,
                trial_days: 30,
                is_active: true,
                is_public: true
            }
        });

        // Enable ALL features for Pro Plan
        console.log(`  -> Ready to link ${Object.keys(featureMap).length} features to plan ${proPlan.id}`);

        const pfsToCreate = Object.keys(featureMap).map(fCode => ({
            plan_id: proPlan.id,
            feature_id: featureMap[fCode].id,
            is_enabled: true
        }));

        try {
            const createdPFs = await PlanFeature.bulkCreate(pfsToCreate, { validate: true });
            console.log(`✅ Successfully bulk created ${createdPFs.length} PlanFeatures.`);

            // Verify immediately
            const verificationCount = await PlanFeature.count({ where: { plan_id: proPlan.id } });
            console.log(`  -> Verification Query Found: ${verificationCount} records.`);

        } catch (e) {
            console.error('❌ BULK CREATE FAILED:', e);
        }

        // 3. Update ALL Tenants to Pro Plan
        console.log('\n--- 3. Updating All Tenants ---');
        const tenants = await Tenant.findAll();
        console.log(`Found ${tenants.length} tenants.`);

        for (const tenant of tenants) {
            // Find or Create Subscription
            let sub = await Subscription.findOne({ where: { tenant_id: tenant.id } });

            const now = new Date();
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);

            if (!sub) {
                console.log(`Creating Subscription for: ${tenant.name}`);
                await Subscription.create({
                    tenant_id: tenant.id,
                    plan_id: proPlan.id,
                    status: 'active',
                    current_period_start: now,
                    current_period_end: nextYear,
                    billing_cycle: 'yearly'
                });
            } else {
                console.log(`Upgrading Subscription for: ${tenant.name}`);
                await sub.update({
                    plan_id: proPlan.id,
                    status: 'active',
                    current_period_start: now,
                    current_period_end: nextYear
                });
            }
        }

        console.log('\n✅ SUCCESS: All tenants now have complete access.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

enableAllFeatures();
