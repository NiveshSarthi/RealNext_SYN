const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function checkMetaFormsWithPageTokens() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dbProd = mongoose.connection.useDb('synditech_realnext');

        const pages = await dbProd.db.collection('facebook_page_connections').find({}).toArray();

        console.log('--- META FORMS CHECK ---');
        for (const p of pages) {
            const dbFormsCount = await dbProd.db.collection('facebook_lead_forms').countDocuments({ page_connection_id: p._id });
            console.log(`\nPage: [${p.page_name}] (ID: ${p.page_id})`);
            console.log(` - Forms in DB: ${dbFormsCount}`);

            if (!p.access_token) {
                console.log(` - [!] NO ACCESS TOKEN in DB for this page.`);
                continue;
            }

            try {
                const res = await axios.get(`${GRAPH_API_URL}/${p.page_id}/leadgen_forms`, {
                    params: { access_token: p.access_token, fields: 'id,name,status,leads_count', limit: 50 }
                });
                const metaForms = res.data.data || [];
                console.log(` - Meta reports: ${metaForms.length} forms.`);
                if (metaForms.length > 0) {
                    metaForms.forEach(f => {
                        console.log(`   * Form: ${f.name} (ID: ${f.id}) | Status: ${f.status} | Leads: ${f.leads_count}`);
                    });
                }
            } catch (err) {
                console.log(` - [!] Error fetching from Meta: ${err.response?.data?.error?.message || err.message}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMetaFormsWithPageTokens();
