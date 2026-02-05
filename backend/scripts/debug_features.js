require('dotenv').config();
const { sequelize } = require('../config/database');
const { Feature, Plan, Subscription, PlanFeature, Tenant, User, TenantUser } = require('../models');

async function debugFeatures() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Check if 'meta_ads' feature exists
        console.log('\n--- Checking Feature: meta_ads ---');
        let feature = await Feature.findOne({ where: { code: 'meta_ads' } });
        if (!feature) {
            console.log('❌ Feature "meta_ads" NOT FOUND in database.');
        } else {
            console.log(`✅ Feature Found: ID=${feature.id}, Code=${feature.code}, Name=${feature.name}`);
        }

        // 2. Check User's Plan and Subscription
        console.log('\n--- Checking Tenant Subscription ---');
        const email = 'tenant-admin@testcompany.com';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('❌ User not found.');
            process.exit(1);
        }

        const tenantUser = await TenantUser.findOne({ where: { user_id: user.id } });
        if (!tenantUser) {
            console.log('❌ Tenant link not found.');
            process.exit(1);
        }

        const tenant = await Tenant.findByPk(tenantUser.tenant_id);
        console.log(`Tenant: ${tenant.name} (ID: ${tenant.id})`);

        const subscription = await Subscription.findOne({
            where: { tenant_id: tenant.id },
            include: [{
                model: Plan,
                as: 'plan',
                include: [{
                    model: PlanFeature,
                    as: 'planFeatures',
                    include: [{ model: Feature }]
                }]
            }]
        });

        if (!subscription) {
            console.log('❌ No active subscription found.');
        } else {
            console.log(`Plan: ${subscription.plan.name} (Code: ${subscription.plan.code})`);
            console.log('Enabled Features:');
            subscription.plan.planFeatures.forEach(pf => {
                const f = pf.Feature;
                const status = pf.is_enabled ? '✅' : '❌';
                console.log(`  ${status} [${f.code}] ${f.name}`);
            });

            // Check if meta_ads is enabled
            const isMetaAdsEnabled = subscription.plan.planFeatures.some(pf =>
                pf.Feature && pf.Feature.code === 'meta_ads' && pf.is_enabled
            );

            if (isMetaAdsEnabled) {
                console.log('\n✅ "meta_ads" is ENABLED for this plan.');
            } else {
                console.log('\n❌ "meta_ads" is NOT ENABLED for this plan.');

                // OPTIONAL: Auto-fix
                console.log('\n--- Attempting Auto-Fix ---');
                // Ensure feature exists
                if (!feature) {
                    feature = await Feature.create({
                        code: 'meta_ads',
                        name: 'Meta Ads Integration',
                        description: 'Sync leads from Facebook/Instagram',
                        is_active: true
                    });
                    console.log('Created "meta_ads" feature.');
                }

                // Enable for plan
                const [pf, created] = await PlanFeature.findOrCreate({
                    where: { plan_id: subscription.plan.id, feature_id: feature.id },
                    defaults: { is_enabled: true }
                });

                if (!created && !pf.is_enabled) {
                    await pf.update({ is_enabled: true });
                    console.log('Updated PlanFeature to ENABLED.');
                } else {
                    console.log('Linked "meta_ads" to Plan.');
                }
            }
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugFeatures();
