const mongoose = require('mongoose');
require('dotenv').config();

async function runAudit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const dbProd = mongoose.connection.useDb('synditech_realnext');
        const pages = await dbProd.db.collection('facebook_page_connections').find({}).toArray();

        console.log(`\nFound ${pages.length} Pages.`);

        for (const p of pages) {
            const forms = await dbProd.db.collection('facebook_lead_forms').find({ page_connection_id: p._id }).toArray();

            let totalActualLeads = 0;
            for (const f of forms) {
                const count = await dbProd.db.collection('leads').countDocuments({ 'metadata.form_id': f.form_id });
                totalActualLeads += count;
            }

            console.log(`\n-----------------------------------------------------------`);
            console.log(`PAGE: ${p.page_name} (${p.page_id})`);
            console.log(` - Mongo _id: ${p._id}`);
            console.log(` - Forms Found: ${forms.length}`);
            console.log(` - Total Actual Leads in DB: ${totalActualLeads}`);

            if (forms.length > 0) {
                console.log(`   Forms:`);
                for (const f of forms) {
                    const actualLeads = await dbProd.db.collection('leads').countDocuments({ 'metadata.form_id': f.form_id });
                    console.log(`    * [${f.name}] (${f.form_id})`);
                    console.log(`      Meta Count Field: ${f.lead_count} | Actual DB Leads: ${actualLeads}`);
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
}

runAudit();
