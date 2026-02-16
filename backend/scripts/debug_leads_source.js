#!/usr/bin/env node
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Lead } = require('../models');

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/realnext');
        console.log('✅ Connected to MongoDB\n');

        // Check what sources exist
        const sources = await Lead.distinct('source');
        console.log('📊 Unique lead sources in database:');
        sources.forEach(s => console.log(`   • "${s}"`));

        // Check what client_ids exist
        const clients = await Lead.distinct('client_id');
        console.log(`\n👥 Unique client_ids: ${clients.length}`);
        clients.slice(0, 5).forEach(c => console.log(`   • ${c}`));

        // Check leads without form_name grouped by source
        const bySource = await Lead.aggregate([
            {
                $match: {
                    $or: [
                        { form_name: { $exists: false } },
                        { form_name: null },
                        { form_name: '' }
                    ]
                }
            },
            {
                $group: {
                    _id: '$source',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log(`\n📈 Leads WITHOUT form_name by source:`);
        bySource.forEach(item => {
            console.log(`   "${item._id}": ${item.count}`);
        });

        // Check leads without form_name grouped by client_id
        const byClient = await Lead.aggregate([
            {
                $match: {
                    $or: [
                        { form_name: { $exists: false } },
                        { form_name: null },
                        { form_name: '' }
                    ]
                }
            },
            {
                $group: {
                    _id: '$client_id',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        console.log(`\n👥 Leads WITHOUT form_name by client_id:`);
        byClient.forEach(item => {
            console.log(`   ${item._id}: ${item.count}`);
        });

        // Sample a lead to see its structure
        const sampleLead = await Lead.findOne({
            $or: [
                { form_name: { $exists: false } },
                { form_name: null },
                { form_name: '' }
            ]
        });

        if (sampleLead) {
            console.log(`\n🔍 Sample Lead Structure:`);
            console.log(`   name: ${sampleLead.name}`);
            console.log(`   source: ${sampleLead.source}`);
            console.log(`   client_id: ${sampleLead.client_id}`);
            console.log(`   form_name: ${sampleLead.form_name}`);
            console.log(`   metadata.form_id: ${sampleLead.metadata?.form_id}`);
        }

        console.log(`\n✅ Analysis Complete`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
