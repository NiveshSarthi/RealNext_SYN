#!/usr/bin/env node
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Lead } = require('../models');

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/realnext');
        console.log('✅ Connected to MongoDB\n');

        // Get all leads grouped by form_name
        const leads = await Lead.find({}).select('form_name name email');
        
        const formGrouped = {};
        leads.forEach(lead => {
            const formName = lead.form_name || 'No Form';
            if (!formGrouped[formName]) {
                formGrouped[formName] = [];
            }
            formGrouped[formName].push(lead);
        });

        console.log('📊 LEADS BY FORM NAME:\n');
        console.log('─'.repeat(80));

        const sortedForms = Object.entries(formGrouped)
            .sort((a, b) => b[1].length - a[1].length);

        let totalLeads = 0;
        sortedForms.forEach(([formName, formsLeads], idx) => {
            const count = formsLeads.length;
            totalLeads += count;
            console.log(`${idx + 1}. "${formName}": ${count} leads`);
        });

        console.log('─'.repeat(80));
        console.log(`\n✅ Total Unique Forms: ${sortedForms.length}`);
        console.log(`✅ Total Leads: ${totalLeads}`);
        console.log(`\n💡 This is why you see only ${sortedForms.filter(f => f[1].length > 0).length} form names in the table!`);
        console.log(`   (Only forms with at least 1 lead are displayed)`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
