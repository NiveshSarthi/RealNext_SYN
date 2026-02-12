const mongoose = require('mongoose');
require('dotenv').config();

async function runDetailedAudit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dbProd = mongoose.connection.useDb('synditech_realnext');

        const pages = await dbProd.db.collection('facebook_page_connections').find({}).toArray();
        const forms = await dbProd.db.collection('facebook_lead_forms').find({}).toArray();

        console.log('--- PAGES IN DB ---');
        const pageMap = {};
        pages.forEach(p => {
            pageMap[String(p._id)] = p;
            console.log(`Page: [${p.page_name}] | ID: ${p.page_id} | MongoDB _id: ${p._id}`);
        });

        console.log('\n--- FORMS IN DB ---');
        for (const f of forms) {
            const parentPage = pageMap[String(f.page_connection_id)];
            const actualLeads = await dbProd.db.collection('leads').countDocuments({ 'metadata.form_id': f.form_id });

            if (actualLeads > 0 || f.lead_count > 0 || forms.length < 50) {
                console.log(`Form: [${f.name}] (${f.form_id})`);
                console.log(` - Linked Page in DB: ${parentPage ? parentPage.page_name : 'NOT FOUND'} (${f.page_connection_id})`);
                console.log(` - Meta Count Field: ${f.lead_count} | Actual DB Leads: ${actualLeads}`);
            }
        }

        // Summary of leads by page_id in metadata
        console.log('\n--- LEADS BY page_id IN METADATA ---');
        const distinctPageIds = await dbProd.db.collection('leads').distinct('metadata.page_id', { source: 'Facebook Ads' });
        for (const pid of distinctPageIds) {
            const count = await dbProd.db.collection('leads').countDocuments({ 'metadata.page_id': pid, source: 'Facebook Ads' });
            const pageInDb = pages.find(p => p.page_id === pid);
            console.log(`Page ID: ${pid} | Leads: ${count} | Page Name in DB: ${pageInDb ? pageInDb.page_name : 'MISSING'}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runDetailedAudit();
