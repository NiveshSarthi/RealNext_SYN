const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Use the same target client ID from previous migration
const TARGET_CLIENT_ID = new mongoose.Types.ObjectId('698c328095ac8aa335810d9b');
const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function migrateAndFetch() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const dbTest = mongoose.connection.useDb('test');
        const dbProd = mongoose.connection.useDb('synditech_realnext');

        // 1. Migrate Facebook Page Connections
        console.log('\n--- Migrating Facebook Page Connections ---');
        const testPages = await dbTest.db.collection('facebook_page_connections').find({}).toArray();
        console.log(`Found ${testPages.length} pages in [test] db.`);

        let migratedPagesCount = 0;
        const pageIdMap = {}; // old_id -> new_id

        for (const tPage of testPages) {
            const { _id, ...pageData } = tPage;
            const existing = await dbProd.db.collection('facebook_page_connections').findOne({ page_id: tPage.page_id });

            let newPage;
            if (!existing) {
                const result = await dbProd.db.collection('facebook_page_connections').insertOne({
                    ...pageData,
                    client_id: TARGET_CLIENT_ID,
                    status: 'active',
                    is_lead_sync_enabled: true
                });
                newPage = { _id: result.insertedId, ...pageData };
                migratedPagesCount++;
            } else {
                newPage = existing;
                console.log(`Page ${tPage.page_name} already exists in prod.`);
            }
            pageIdMap[String(_id)] = newPage._id;
        }
        console.log(`Migrated ${migratedPagesCount} new pages.`);

        // 2. Migrate Facebook Lead Forms
        console.log('\n--- Migrating Facebook Lead Forms ---');
        const testForms = await dbTest.db.collection('facebook_lead_forms').find({}).toArray();
        console.log(`Found ${testForms.length} forms in [test] db.`);

        let migratedFormsCount = 0;
        for (const tForm of testForms) {
            const { _id, page_connection_id, ...formData } = tForm;
            const newPageId = pageIdMap[String(page_connection_id)];

            if (!newPageId) {
                console.warn(`Skipping form ${tForm.name}: Parent page not found in migration.`);
                continue;
            }

            const existing = await dbProd.db.collection('facebook_lead_forms').findOne({ form_id: tForm.form_id });
            if (!existing) {
                await dbProd.db.collection('facebook_lead_forms').insertOne({
                    ...formData,
                    client_id: TARGET_CLIENT_ID,
                    page_connection_id: newPageId,
                    status: 'active'
                });
                migratedFormsCount++;
            } else {
                console.log(`Form ${tForm.name} already exists in prod.`);
            }
        }
        console.log(`Migrated ${migratedFormsCount} new forms.`);

        // 3. Fetch ALL Leads from Meta
        console.log('\n--- Fetching ALL Leads from Meta API ---');
        const activeForms = await dbProd.db.collection('facebook_lead_forms').find({ status: 'active' }).toArray();
        console.log(`Processing ${activeForms.length} active forms.`);

        let totalNewLeads = 0;

        for (const form of activeForms) {
            const page = await dbProd.db.collection('facebook_page_connections').findOne({ _id: form.page_connection_id });
            if (!page || !page.access_token) {
                console.warn(`Skipping form ${form.name}: No page access token.`);
                continue;
            }

            console.log(`\nForm: ${form.name} (${form.form_id})`);

            let nextUrl = `${GRAPH_API_URL}/${form.form_id}/leads?access_token=${page.access_token}&fields=id,created_time,field_data&limit=100`;
            let formNewLeads = 0;
            let pageCount = 0;

            while (nextUrl) {
                try {
                    const response = await axios.get(nextUrl);
                    const leads = response.data.data || [];
                    nextUrl = response.data.paging?.next;
                    pageCount++;

                    console.log(`  Fetched page ${pageCount} (${leads.length} leads)...`);

                    for (const leadData of leads) {
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
                            formNewLeads++;
                            totalNewLeads++;
                        }
                    }
                } catch (err) {
                    console.error(`  Error fetching leads for form ${form.name}:`, err.message);
                    if (err.response?.data?.error) {
                        console.error('  Meta Error:', err.response.data.error.message);
                    }
                    break; // Move to next form on error
                }
            }
            console.log(`  Done. Created ${formNewLeads} new leads for this form.`);
        }

        console.log(`\n\nMigration and Sync complete. Total new leads created: ${totalNewLeads}`);

        // Final count
        const finalLeadsCount = await dbProd.db.collection('leads').countDocuments({});
        console.log(`Total Leads in DB: ${finalLeadsCount}`);

        process.exit(0);
    } catch (err) {
        console.error('Operation failed:', err);
        process.exit(1);
    }
}

migrateAndFetch();
