#!/usr/bin/env node
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Lead, FacebookLeadForm } = require('../models');

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/realnext');
        console.log('✅ Connected to MongoDB\n');

        // Find all leads without form_name
        const leadsToUpdate = await Lead.find({
            $or: [
                { form_name: { $exists: false } },
                { form_name: null },
                { form_name: '' }
            ]
        }).limit(5000);

        console.log(`📊 Total leads without form_name: ${leadsToUpdate.length}\n`);

        // Quick sample check
        const sample = leadsToUpdate.slice(0, 5);
        console.log('🔍 Sample of leads with form_id mapping:\n');

        let hasFormId = 0;
        let noFormId = 0;

        for (const lead of sample) {
            const formId = lead.metadata?.form_id;
            console.log(`• ${lead.name.substring(0, 30)}: form_id=${formId || 'NONE'}`);
            if (formId) hasFormId++;
            else noFormId++;
        }

        // Get all unique form_ids from metadata
        const formsWithLeads = await Lead.aggregate([
            {
                $match: {
                    $or: [
                        { form_name: { $exists: false } },
                        { form_name: null },
                        { form_name: '' }
                    ]
                }
            },
            { $group: { _id: '$metadata.form_id', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log(`\n📈 Form distribution in leads without form_name:\n`);
        console.log('─'.repeat(60));

        let totalWithFormId = 0;
        for (const item of formsWithLeads) {
            if (!item._id) continue;
            const form = await FacebookLeadForm.findOne({ form_id: item._id });
            const formName = form?.name || 'UNKNOWN';
            console.log(`${item._id.substring(0, 20)}: ${item.count} leads → "${formName}"`);
            totalWithFormId += item.count;
        }

        console.log('─'.repeat(60));
        console.log(`\n✅ SUCCESS PROJECTION:\n`);
        console.log(`   Leads with form_id: ${totalWithFormId}`);
        console.log(`   Leads without form_id: ${leadsToUpdate.length - totalWithFormId}`);
        console.log(`\n🎯 When you click "Update Existing":`);
        console.log(`   ✅ ${totalWithFormId} leads WILL be updated with their form names`);
        console.log(`   ⏭️  ${leadsToUpdate.length - totalWithFormId} leads will be skipped\n`);

        console.log(`✅ VERIFICATION COMPLETE`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
