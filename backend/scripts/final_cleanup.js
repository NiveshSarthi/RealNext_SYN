const mongoose = require('mongoose');
require('dotenv').config();

async function finalCleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dbProd = mongoose.connection.useDb('synditech_realnext');

        // 1. Force all forms to 'active' status
        const updateStatus = await dbProd.db.collection('facebook_lead_forms').updateMany(
            {},
            { $set: { status: 'active' } }
        );
        console.log(`Updated status to 'active' for ${updateStatus.modifiedCount} forms.`);

        // 2. Update lead_count based on actual data in leads collection
        const forms = await dbProd.db.collection('facebook_lead_forms').find({}).toArray();
        for (const f of forms) {
            const actualLeads = await dbProd.db.collection('leads').countDocuments({ 'metadata.form_id': f.form_id });
            await dbProd.db.collection('facebook_lead_forms').updateOne(
                { _id: f._id },
                { $set: { lead_count: actualLeads } }
            );
        }
        console.log('All lead_counts updated based on actual database records.');

        // 3. Print Final Summary
        console.log('\n--- FINAL UI STATE SUMMARY ---');
        const pages = await dbProd.db.collection('facebook_page_connections').find({}).toArray();
        for (const p of pages) {
            const linkedForms = await dbProd.db.collection('facebook_lead_forms').find({ page_connection_id: p._id, status: 'active' }).toArray();
            const totalLeads = linkedForms.reduce((sum, f) => sum + (f.lead_count || 0), 0);
            console.log(`Page: [${p.page_name}] (ID: ${p.page_id})`);
            console.log(` - Forms Visible in UI: ${linkedForms.length}`);
            console.log(` - Total Leads Visible in UI: ${totalLeads}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

finalCleanup();
