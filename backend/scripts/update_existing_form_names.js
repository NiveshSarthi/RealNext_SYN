const mongoose = require('mongoose');
const { Lead, FacebookLeadForm } = require('../models');
require('dotenv').config();

async function updateExistingFormNames() {
    try {
        console.log('🔄 Updating existing leads with form names...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://root:Cjmqv@72.61.248.175:5443/?authSource=admin', {
            dbName: 'realnext'
        });

        console.log('✅ Connected to MongoDB\n');

        // Find all leads from Facebook that don't have form_name
        const leadsToUpdate = await Lead.find({
            source: 'Facebook Ads',
            $or: [
                { form_name: { $exists: false } },
                { form_name: null },
                { form_name: '' }
            ]
        });

        console.log(`📊 Found ${leadsToUpdate.length} leads without form_name\n`);

        if (leadsToUpdate.length === 0) {
            console.log('✅ All leads already have form names!');
            await mongoose.disconnect();
            return;
        }

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const lead of leadsToUpdate) {
            try {
                const formId = lead.metadata?.form_id;

                if (!formId) {
                    console.log(`⏭️  Skipping "${lead.name}" - No form_id in metadata`);
                    skipped++;
                    continue;
                }

                // Find the form
                const form = await FacebookLeadForm.findOne({ form_id: formId });

                if (!form) {
                    console.log(`⏭️  Skipping "${lead.name}" - Form ${formId} not found`);
                    skipped++;
                    continue;
                }

                // Update lead with form name
                lead.form_name = form.name;
                await lead.save();

                console.log(`✅ Updated "${lead.name}" → form_name: "${form.name}"`);
                updated++;

            } catch (error) {
                console.error(`❌ Error updating lead "${lead.name}": ${error.message}`);
                errors++;
            }
        }

        console.log(`\n📊 SUMMARY:`);
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);

        await mongoose.disconnect();
        console.log('\n✅ Migration complete!');

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

updateExistingFormNames();
