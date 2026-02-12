const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const USER_TOKEN = 'EAAWUnDnlyW0BQsOZCnDBlolurRgOZBUiFnbabi9IZBXxg48VoK44D39DmXCOh9hUZClMZBEwhYa8vT5t3nQNsqjkAZC2oEcaHpuHCsKYZAtAZCyGK0FzzPLa1ZCcnqLvMoHgKo3Hhm28F5kyT6ouIfxSuT1YHZBjibcllYCYKF1g3DEUih3rW3hC4zbSDyJxBZBofRl8NPdJFbCG4qgTxgGIBoTd1zoEJEra9fOFjyDKJy6te5MndHkQ5Om7BCEaeMCCbL4PeBhW2zaLZCI4KKf1YPjC9C9lsTmEHreoe3XxXUb3spaQc8rTDTFIW1oSzZA8vOoYDNUv55YG1gXCaPUl09C49ZC8y92gZDZD';
const TARGET_CLIENT_ID = new mongoose.Types.ObjectId('698c328095ac8aa335810d9b');
const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function superSync() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const dbProd = mongoose.connection.useDb('synditech_realnext');

        // 1. Fetch Pages from Meta
        console.log('\n--- Fetching Pages from Meta ---');
        const pagesRes = await axios.get(`${GRAPH_API_URL}/me/accounts`, {
            params: { access_token: USER_TOKEN, fields: 'id,name,access_token', limit: 100 }
        });
        const metaPages = pagesRes.data.data || [];
        console.log(`Found ${metaPages.length} pages on Meta.`);

        for (const mPage of metaPages) {
            console.log(`\nProcessing Page: ${mPage.name} (${mPage.id})`);

            // Upsert Page Connection
            const pageDoc = await dbProd.db.collection('facebook_page_connections').findOneAndUpdate(
                { client_id: TARGET_CLIENT_ID, page_id: mPage.id },
                {
                    $set: {
                        page_name: mPage.name,
                        access_token: mPage.access_token,
                        status: 'active',
                        is_lead_sync_enabled: true,
                        updated_at: new Date()
                    },
                    $setOnInsert: { created_at: new Date() }
                },
                { upsert: true, returnDocument: 'after' }
            );

            const pageId = pageDoc._id || (await dbProd.db.collection('facebook_page_connections').findOne({ page_id: mPage.id }))._id;

            // 2. Fetch ALL Forms for this page
            console.log(`  Fetching forms for ${mPage.name}...`);
            let formsUrl = `${GRAPH_API_URL}/${mPage.id}/leadgen_forms?access_token=${mPage.access_token}&fields=id,name,status,leads_count&limit=100`;
            let pageFormsFetched = 0;

            while (formsUrl) {
                const formsRes = await axios.get(formsUrl);
                const metaForms = formsRes.data.data || [];
                formsUrl = formsRes.data.paging?.next;

                for (const mForm of metaForms) {
                    pageFormsFetched++;
                    // Upsert Form
                    const formDoc = await dbProd.db.collection('facebook_lead_forms').findOneAndUpdate(
                        { client_id: TARGET_CLIENT_ID, form_id: mForm.id },
                        {
                            $set: {
                                name: mForm.name,
                                status: mForm.status === 'ACTIVE' ? 'active' : 'inactive',
                                page_connection_id: pageId,
                                lead_count: mForm.leads_count,
                                updated_at: new Date()
                            },
                            $setOnInsert: { created_at: new Date() }
                        },
                        { upsert: true, returnDocument: 'after' }
                    );

                    // 3. Fetch ALL Leads for this form
                    if (mForm.leads_count > 0) {
                        console.log(`    Syncing leads for form: ${mForm.name} (Meta Count: ${mForm.leads_count})`);
                        let leadsUrl = `${GRAPH_API_URL}/${mForm.id}/leads?access_token=${mPage.access_token}&fields=id,created_time,field_data&limit=100`;
                        let formLeadsCreated = 0;
                        let formLeadsChecked = 0;

                        while (leadsUrl) {
                            try {
                                const leadsRes = await axios.get(leadsUrl);
                                const metaLeads = leadsRes.data.data || [];
                                leadsUrl = leadsRes.data.paging?.next;

                                for (const leadData of metaLeads) {
                                    formLeadsChecked++;
                                    const emailField = leadData.field_data.find(f => f.name.includes('email'))?.values[0];
                                    const phoneField = leadData.field_data.find(f => f.name.includes('phone') || f.name.includes('number'))?.values[0];
                                    const nameField = leadData.field_data.find(f => f.name.includes('name') || f.name.includes('full_name'))?.values[0];

                                    if (!phoneField && !emailField) continue;

                                    const existingLead = await dbProd.db.collection('leads').findOne({
                                        client_id: TARGET_CLIENT_ID,
                                        $or: [
                                            { phone: phoneField || 'N/A' },
                                            { email: emailField || 'N/A' }
                                        ]
                                    });

                                    if (!existingLead) {
                                        await dbProd.db.collection('leads').insertOne({
                                            client_id: TARGET_CLIENT_ID,
                                            name: nameField || 'Facebook Lead',
                                            email: emailField,
                                            phone: phoneField,
                                            source: 'Facebook Ads',
                                            status: 'new',
                                            stage: 'Screening',
                                            metadata: {
                                                facebook_lead_id: leadData.id,
                                                form_id: mForm.id,
                                                page_id: mPage.id,
                                                fetched_at: new Date()
                                            },
                                            created_at: new Date(leadData.created_time),
                                            updated_at: new Date()
                                        });
                                        formLeadsCreated++;
                                    }
                                }
                            } catch (leadErr) {
                                console.error(`      Error fetching leads page: ${leadErr.message}`);
                                break;
                            }
                        }
                        console.log(`    Done. Checked ${formLeadsChecked} leads, Created ${formLeadsCreated} new.`);
                    }
                }
            }
            console.log(`  Finished page ${mPage.name}. Total forms processed: ${pageFormsFetched}`);
        }

        console.log('\n--- Super Sync Complete ---');
        const finalCount = await dbProd.db.collection('leads').countDocuments({ source: 'Facebook Ads' });
        console.log(`Total Facebook Leads in DB: ${finalCount}`);

        process.exit(0);
    } catch (err) {
        console.error('Super Sync failed:', err.message);
        if (err.response?.data?.error) {
            console.error('Meta Error:', err.response.data.error.message);
        }
        process.exit(1);
    }
}

superSync();
