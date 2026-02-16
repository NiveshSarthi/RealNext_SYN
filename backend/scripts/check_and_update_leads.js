const mongoose = require('mongoose');
const { Lead, FacebookLeadForm } = require('../models');
require('dotenv').config();

async function checkAndUpdateLeads() {
    try {
        console.log('🔍 Checking all leads in database...\n');

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://root:Cjmqv@72.61.248.175:5443/?authSource=admin', {
            dbName: 'realnext'
        });

        console.log('✅ Connected to MongoDB\n');

        // Find ALL leads first
        const allLeads = await Lead.find();
        console.log(`📊 Total leads in database: ${allLeads.length}\n`);

        // Check leads from Facebook
        const facebookLeads = await Lead.find({ source: 'Facebook Ads' });
        console.log(`📍 Facebook Ads leads: ${facebookLeads.length}`);

        if (facebookLeads.length > 0) {
            console.log('\nFacebook leads sample:');
            for (let i = 0; i < Math.min(3, facebookLeads.length); i++) {
                const lead = facebookLeads[i];
                console.log(`  • ${lead.name}`);
                console.log(`    - form_name: ${lead.form_name || 'EMPTY'}`);
                console.log(`    - metadata.form_id: ${lead.metadata?.form_id || 'NO FORM_ID'}`);
                console.log();
            }
        }

        // Check if forms exist
        const allForms = await FacebookLeadForm.find();
        console.log(`\n📋 Total forms in database: ${allForms.length}`);

        if (allForms.length > 0) {
            console.log('\nForms sample:');
            for (let i = 0; i < Math.min(3, allForms.length); i++) {
                const form = allForms[i];
                console.log(`  • ${form.name} (ID: ${form.form_id})`);
            }
        }

        // Now update leads
        if (facebookLeads.length > 0) {
            console.log('\n🔄 Updating leads with form names...\n');
            let updated = 0;
            let skipped = 0;

            for (const lead of facebookLeads) {
                const formId = lead.metadata?.form_id;

                if (!formId) {
                    console.log(`⏭️  Skipping "${lead.name}" - No form_id`);
                    skipped++;
                    continue;
                }

                const form = await FacebookLeadForm.findOne({ form_id: formId });

                if (!form) {
                    console.log(`⏭️  Skipping "${lead.name}" - Form not found`);
                    skipped++;
                    continue;
                }

                lead.form_name = form.name;
                await lead.save();
                console.log(`✅ Updated "${lead.name}" → "${form.name}"`);
                updated++;
            }

            console.log(`\n📊 Updated: ${updated}, Skipped: ${skipped}`);
        }

        await mongoose.disconnect();
        console.log('\n✅ Done!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkAndUpdateLeads();
