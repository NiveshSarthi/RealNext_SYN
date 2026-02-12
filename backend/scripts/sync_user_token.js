const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const NEW_TOKEN = 'EAAWUnDnlyW0BQsOZCnDBlolurRgOZBUiFnbabi9IZBXxg48VoK44D39DmXCOh9hUZClMZBEwhYa8vT5t3nQNsqjkAZC2oEcaHpuHCsKYZAtAZCyGK0FzzPLa1ZCcnqLvMoHgKo3Hhm28F5kyT6ouIfxSuT1YHZBjibcllYCYKF1g3DEUih3rW3hC4zbSDyJxBZBofRl8NPdJFbCG4qgTxgGIBoTd1zoEJEra9fOFjyDKJy6te5MndHkQ5Om7BCEaeMCCbL4PeBhW2zaLZCI4KKf1YPjC9C9lsTmEHreoe3XxXUb3spaQc8rTDTFIW1oSzZA8vOoYDNUv55YG1gXCaPUl09C49ZC8y92gZDZD';
const TARGET_CLIENT_ID = new mongoose.Types.ObjectId('698c328095ac8aa335810d9b');
const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function syncWithNewToken() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const dbProd = mongoose.connection.useDb('synditech_realnext');

        console.log('Testing provided token...');
        const me = await axios.get(`${GRAPH_API_URL}/me`, { params: { access_token: NEW_TOKEN } });
        console.log('Token is VALID for user: ' + me.data.name);

        // Update the page connection
        const pageResult = await dbProd.db.collection('facebook_page_connections').updateOne(
            { page_id: '1051183454738394' },
            { $set: { access_token: NEW_TOKEN, updated_at: new Date() } }
        );
        console.log('Updated ' + pageResult.modifiedCount + ' page connection(s).');

        // Find the page's actual _id in prod to match forms
        const page = await dbProd.db.collection('facebook_page_connections').findOne({ page_id: '1051183454738394' });
        if (!page) {
            console.error('Page connection not found after update!');
            process.exit(1);
        }

        const forms = await dbProd.db.collection('facebook_lead_forms').find({ page_connection_id: page._id }).toArray();
        console.log('Syncing ' + forms.length + ' forms for this page...');

        let totalNew = 0;
        let totalProcessed = 0;

        for (const form of forms) {
            console.log(`\nForm: ${form.name} (${form.form_id})`);
            let nextUrl = `${GRAPH_API_URL}/${form.form_id}/leads?access_token=${NEW_TOKEN}&fields=id,created_time,field_data&limit=100`;
            let formNew = 0;

            while (nextUrl) {
                try {
                    const response = await axios.get(nextUrl);
                    const leads = response.data.data || [];
                    nextUrl = response.data.paging?.next;

                    for (const leadData of leads) {
                        totalProcessed++;
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
                                    form_id: form.form_id,
                                    page_id: page.page_id,
                                    fetched_at: new Date()
                                },
                                created_at: new Date(leadData.created_time),
                                updated_at: new Date()
                            });
                            formNew++;
                            totalNew++;
                        }
                    }
                } catch (err) {
                    console.error('  Error fetching leads:', err.message);
                    break;
                }
            }
            console.log(`  Done. Recalled ${formNew} new leads.`);
        }

        console.log(`\n\nSync Complete. Processed ${totalProcessed} leads. Created ${totalNew} new leads.`);
        process.exit(0);
    } catch (err) {
        console.error('Operation failed:', err);
        process.exit(1);
    }
}

syncWithNewToken();
