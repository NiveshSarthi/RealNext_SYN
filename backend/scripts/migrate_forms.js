const mongoose = require('mongoose');
require('dotenv').config();

async function migrateForms() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const dbTest = mongoose.connection.useDb('test');
        const dbProd = mongoose.connection.useDb('synditech_realnext');

        const testForms = await dbTest.db.collection('facebook_lead_forms').find({}).toArray();
        console.log(`Found ${testForms.length} forms in [test] db.`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const tForm of testForms) {
            const { _id, page_connection_id, ...formData } = tForm;

            // Find the test page ID
            const testPage = await dbTest.db.collection('facebook_page_connections').findOne({ _id: page_connection_id });
            if (!testPage) {
                console.warn(`Skipping form ${tForm.name}: Parent page connection not found in test db.`);
                continue;
            }

            // Find matching prod page ID
            const prodPage = await dbProd.db.collection('facebook_page_connections').findOne({ page_id: testPage.page_id });
            if (!prodPage) {
                console.warn(`Skipping form ${tForm.name}: Parent page (${testPage.page_name}) not found in prod db.`);
                continue;
            }

            // Check if form already exists in prod
            const existing = await dbProd.db.collection('facebook_lead_forms').findOne({ form_id: tForm.form_id });
            if (!existing) {
                await dbProd.db.collection('facebook_lead_forms').insertOne({
                    ...formData,
                    page_connection_id: prodPage._id
                });
                migratedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`Migration complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateForms();
