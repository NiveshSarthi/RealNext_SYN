#!/usr/bin/env node
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { FacebookPageConnection, FacebookLeadForm, Lead } = require('../models');
const logger = require('../config/logger');

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/realnext');
        console.log('✅ Connected to MongoDB');

        // Get all pages
        const pages = await FacebookPageConnection.find({});
        console.log(`\n📍 Total Pages: ${pages.length}`);
        console.log('─'.repeat(80));

        let totalForms = 0;
        let totalLeads = 0;

        for (const page of pages) {
            const forms = await FacebookLeadForm.find({ page_connection_id: page.id });
            const leads = await Lead.find({ 'metadata.page_id': page.page_id });

            totalForms += forms.length;
            totalLeads += leads.length;

            console.log(`\n📄 Page: ${page.page_name}`);
            console.log(`   Page ID: ${page.page_id}`);
            console.log(`   Status: ${page.status}`);
            console.log(`   Lead Sync Enabled: ${page.is_lead_sync_enabled}`);
            console.log(`   Forms: ${forms.length}`);
            console.log(`   Leads: ${leads.length}`);

            if (forms.length > 0) {
                console.log(`   Form Details:`);
                forms.forEach((form, idx) => {
                    console.log(`      ${idx + 1}. ${form.name} (Status: ${form.status}, Leads: ${form.lead_count || 0})`);
                });
            }
        }

        console.log(`\n${'─'.repeat(80)}`);
        console.log(`\n📊 TOTALS:`);
        console.log(`   Total Pages: ${pages.length}`);
        console.log(`   Total Forms: ${totalForms}`);
        console.log(`   Total Leads: ${totalLeads}`);

        const activePages = pages.filter(p => p.status === 'active');
        const syncEnabledPages = pages.filter(p => p.is_lead_sync_enabled !== false);
        console.log(`   Active Pages: ${activePages.length}`);
        console.log(`   Sync Enabled Pages: ${syncEnabledPages.length}`);

        console.log(`\n✅ Diagnosis Complete`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
