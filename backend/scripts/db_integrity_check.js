require('dotenv').config();
const { sequelize } = require('../config/database');
const { PlanFeature, Feature, Plan } = require('../models');

async function checkIntegrity() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Raw SQL Check
        console.log('\n--- RAW SQL CHECK ---');
        const [results] = await sequelize.query(`
            SELECT pf.id as pf_id, pf.plan_id, pf.feature_id, pf.is_enabled,
                   f.id as f_id, f.code as f_code
            FROM plan_features pf
            LEFT JOIN features f ON pf.feature_id = f.id
            JOIN plans p ON pf.plan_id = p.id
            WHERE p.code = 'pro'
        `);

        console.log(`Raw SQL Found: ${results.length} rows`);
        results.forEach(row => {
            console.log(`PF: ${row.pf_id} | FID: ${row.feature_id} -> F_CODE: ${row.f_code}`);
            if (!row.f_id) console.log('  ❌ ORPHAN ALERT: Feature ID not found in features table!');
        });

        // 2. Sequelize Check
        console.log('\n--- SEQUELIZE CHECK ---');
        const plan = await Plan.findOne({ where: { code: 'pro' } });
        const pfs = await PlanFeature.findAll({
            where: { plan_id: plan.id },
            include: [{ model: Feature }]
        });

        console.log(`Sequelize Found: ${pfs.length} rows`);
        pfs.forEach(pf => {
            console.log(`PF: ${pf.id} | Feature: ${pf.Feature?.code}`);
            if (!pf.Feature) console.log('  ❌ SEQUELIZE ASSOCIATION FAILED');
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkIntegrity();
