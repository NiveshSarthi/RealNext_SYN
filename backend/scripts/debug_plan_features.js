require('dotenv').config();
const { sequelize } = require('../config/database');
const { Plan, PlanFeature, Feature } = require('../models');

async function debugPlanFeatures() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const plan = await Plan.findOne({ where: { code: 'pro' } });
        if (!plan) {
            console.log('❌ Pro Plan not found');
            return;
        }
        console.log(`✅ Plan Found: ${plan.name} (ID: ${plan.id})`);

        const features = await Feature.findAll();
        const featureMap = new Map(features.map(f => [f.id, f]));
        console.log(`\nGlobal Features Count: ${features.length}`);
        features.forEach(f => console.log(`  > ${f.code} (${f.id})`));

        const pfs = await PlanFeature.findAll({
            where: { plan_id: plan.id },
            include: [{ model: Feature }]
        });

        console.log(`\nFound ${pfs.length} PlanFeatures:`);
        pfs.forEach(pf => {
            console.log(`- PlanFeature ID: ${pf.id}`);
            console.log(`  Raw feature_id: ${pf.feature_id}`);
            const featureExists = featureMap.has(pf.feature_id);
            console.log(`  Map Lookup Exists? ${featureExists}`);

            console.log(`  Loaded Feature: ${pf.Feature?.code} | Enabled: ${pf.is_enabled}`);
            if (!pf.Feature) {
                console.log(`  ❌ MACRO ERROR: Feature failed to load!`);
            }
        });

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugPlanFeatures();
