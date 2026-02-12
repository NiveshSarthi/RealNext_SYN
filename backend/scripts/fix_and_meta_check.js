const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const USER_TOKEN = 'EAAWUnDnlyW0BQsOZCnDBlolurRgOZBUiFnbabi9IZBXxg48VoK44D39DmXCOh9hUZClMZBEwhYa8vT5t3nQNsqjkAZC2oEcaHpuHCsKYZAtAZCyGK0FzzPLa1ZCcnqLvMoHgKo3Hhm28F5kyT6ouIfxSuT1YHZBjibcllYCYKF1g3DEUih3rW3hC4zbSDyJxBZBofRl8NPdJFbCG4qgTxgGIBoTd1zoEJEra9fOFjyDKJy6te5MndHkQ5Om7BCEaeMCCbL4PeBhW2zaLZCI4KKf1YPjC9C9lsTmEHreoe3XxXUb3spaQc8rTDTFIW1oSzZA8vOoYDNUv55YG1gXCaPUl09C49ZC8y92gZDZD';
const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function fixAndCheck() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dbProd = mongoose.connection.useDb('synditech_realnext');

        // 1. Update lead_count in FORMS
        console.log('--- Updating lead_count in all forms ---');
        const forms = await dbProd.db.collection('facebook_lead_forms').find({}).toArray();
        let totalFixed = 0;
        for (const f of forms) {
            const actualLeads = await dbProd.db.collection('leads').countDocuments({ 'metadata.form_id': f.form_id });
            if (f.lead_count !== actualLeads) {
                await dbProd.db.collection('facebook_lead_forms').updateOne(
                    { _id: f._id },
                    { $set: { lead_count: actualLeads } }
                );
                totalFixed++;
            }
        }
        console.log(`Updated lead_count for ${totalFixed} forms.`);

        // 2. Check Meta for 0-form pages
        console.log('\n--- Checking Meta for pages with 0 forms in DB ---');
        const pages = await dbProd.db.collection('facebook_page_connections').find({}).toArray();
        for (const p of pages) {
            const dbFormsCount = await dbProd.db.collection('facebook_lead_forms').countDocuments({ page_connection_id: p._id });
            if (dbFormsCount === 0) {
                console.log(`Checking Page [${p.page_name}] (${p.page_id}) on Meta...`);
                try {
                    const res = await axios.get(`${GRAPH_API_URL}/${p.page_id}/leadgen_forms`, {
                        params: { access_token: USER_TOKEN, fields: 'id,name', limit: 50 }
                    });
                    const metaForms = res.data.data || [];
                    console.log(` -> Meta reports ${metaForms.length} forms.`);
                    if (metaForms.length > 0) {
                        console.log(` [!] SYNC MISS: Page has ${metaForms.length} forms on Meta but 0 in DB.`);
                    }
                } catch (err) {
                    console.error(` -> Error checking Meta: ${err.message}`);
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixAndCheck();
