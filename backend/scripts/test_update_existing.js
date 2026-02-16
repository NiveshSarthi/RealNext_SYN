#!/usr/bin/env node
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Lead, FacebookLeadForm } = require('../models');

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/realnext');
        console.log('✅ Connected to MongoDB\n');

        // Find all leads without form_name (same logic as the UPDATE-EXISTING endpoint)
        const leadsToUpdate = await Lead.find({
            $or: [
                { form_name: { $exists: false } },
                { form_name: null },
                { form_name: '' }
            ]
        });

        console.log(`📊 Found ${leadsToUpdate.length} leads without form_name\n`);
        console.log('─'.repeat(80));

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        // Sample the first 10 to show what will happen
        const sampleSize = Math.min(10, leadsToUpdate.length);
        console.log(`\n🔍 SAMPLE: Checking first ${sampleSize} leads:\n`);

        for (let i = 0; i < sampleSize; i++) {
            const lead = leadsToUpdate[i];
            const formId = lead.metadata?.form_id;

            console.log(`${i + 1}. Lead: "${lead.name}" (${lead.email || lead.phone})`);
            console.log(`   Current form_name: "${lead.form_name || 'EMPTY'}"`);

            if (!formId) {
                console.log(`   ❌ SKIP: No form_id in metadata\n`);
                skipped++;
                continue;
            }

            // Find the form
            const form = await FacebookLeadForm.findOne({ form_id: formId });

            if (!form) {
                console.log(`   ❌ SKIP: Form not found (form_id: ${formId})\n`);
                skipped++;
                continue;
            }

            console.log(`   ✅ WILL UPDATE with: "${form.name}"`);
            console.log(`   From form: ${form.name}\n`);
            updated++;
        }

        console.log('─'.repeat(80));
        console.log(`\n📈 PROJECTION FOR ALL ${leadsToUpdate.length} LEADS:\n`);

        // Now do a real estimate for all
        console.log(`⏳ Analyzing all leads to estimate success rate...\n`);

        let totalUpdatable = 0;
        let totalSkippable = 0;

        for (const lead of leadsToUpdate) {
            const formId = lead.metadata?.form_id;
            if (!formId) {
                totalSkippable++;
                continue;
            }

            const form = await FacebookLeadForm.findOne({ form_id: formId });
            if (!form) {
                totalSkippable++;
                continue;
            }

            totalUpdatable++;
        }

        console.log(`✅ Updatable (have form): ${totalUpdatable}`);
        console.log(`❌ Skippable (no form): ${totalSkippable}`);
        console.log(`─`.repeat(80));
        console.log(`\n🎯 When you click "Update Existing":`);
        console.log(`   • ${totalUpdatable} leads WILL get their form_name populated`);
        console.log(`   • ${totalSkippable} leads will be skipped (no form found)`);
        console.log(`\n💡 Leads will have their form_name updated like:`);
        console.log(`   "No Form" → "Amolik Concordia sector 97 Faridabad"`);
        console.log(`   "No Form" → "BUILDER FLOOR_sept"`);
        console.log(`   etc.\n`);

        console.log(`✅ DRY-RUN COMPLETE - Ready to execute!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
