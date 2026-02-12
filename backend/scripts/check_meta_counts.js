const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const { FacebookPageConnection, FacebookLeadForm, Lead } = require('../models');

async function checkMetaCounts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const pages = await FacebookPageConnection.find({ status: 'active' });
        console.log(`Found ${pages.length} active pages.`);

        for (const page of pages) {
            console.log(`\n--- Page: ${page.page_name} (${page.page_id}) ---`);

            try {
                const response = await axios.get(`https://graph.facebook.com/v19.0/${page.page_id}/leadgen_forms`, {
                    params: {
                        access_token: page.access_token,
                        fields: 'id,name,status,leads_count',
                        limit: 100
                    }
                });

                const metaForms = response.data.data || [];
                console.log(`Meta reports ${metaForms.length} forms (limit 100).`);

                for (const mForm of metaForms) {
                    const dbForm = await FacebookLeadForm.findOne({ form_id: mForm.id });
                    const dbLeadsCount = await Lead.countDocuments({ 'metadata.form_id': mForm.id });

                    console.log(`Form: ${mForm.name} (${mForm.id})`);
                    console.log(` - Meta Leads Count: ${mForm.leads_count}`);
                    console.log(` - DB Leads Count: ${dbLeadsCount}`);
                    console.log(` - Sync Status: ${dbForm ? 'Synced' : 'MISSING'}`);

                    if (mForm.leads_count > dbLeadsCount) {
                        console.log(` [!] DISCREPANCY: Missing ${mForm.leads_count - dbLeadsCount} leads`);
                    }
                }

                if (response.data.paging?.next) {
                    console.log(' [!] Page has more than 100 forms. Pagination needed.');
                }

            } catch (err) {
                console.error(`Error checking page ${page.page_name}:`, err.message);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Diagnostic failed:', err);
        process.exit(1);
    }
}

checkMetaCounts();
