const mongoose = require('mongoose');
require('dotenv').config();

async function fixDataAndSummarize() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const dbProd = mongoose.connection.useDb('synditech_realnext');

        const pages = await dbProd.db.collection('facebook_page_connections').find({}).toArray();
        const forms = await dbProd.db.collection('facebook_lead_forms').find({}).toArray();
        const leads = await dbProd.db.collection('leads').find({ source: 'Facebook Ads' }).toArray();

        console.log(`\nCounts in DB:`);
        console.log(` - Pages: ${pages.length}`);
        console.log(` - Forms: ${forms.length}`);
        console.log(` - Facebook Leads: ${leads.length}`);

        // 1. Fix lead_count in forms
        console.log(`\n--- Fixing lead_count in forms ---`);
        let fixedFormsCount = 0;
        for (const f of forms) {
            const actualCount = await dbProd.db.collection('leads').countDocuments({ 'metadata.form_id': f.form_id });
            if (f.lead_count !== actualCount) {
                await dbProd.db.collection('facebook_lead_forms').updateOne(
                    { _id: f._id },
                    { $set: { lead_count: actualCount } }
                );
                fixedFormsCount++;
            }
        }
        console.log(`Fixed lead_count for ${fixedFormsCount} forms.`);

        // 2. Identify and summarize linkage
        console.log(`\n--- Current Page -> Forms Linkage Summary ---`);
        for (const p of pages) {
            const linkedForms = await dbProd.db.collection('facebook_lead_forms').find({ page_connection_id: p._id }).toArray();
            const totalLeads = linkedForms.reduce((sum, f) => sum + (f.lead_count || 0), 0);

            console.log(`\nPage: [${p.page_name}] (ID: ${p.page_id})`);
            console.log(` - Forms linked in DB: ${linkedForms.length}`);
            console.log(` - Total Leads (sum of form lead_count): ${totalLeads}`);

            if (linkedForms.length > 0) {
                linkedForms.forEach(f => {
                    if (f.lead_count > 0) {
                        console.log(`   * Form: ${f.name} | leads: ${f.lead_count}`);
                    }
                });
            }
        }

        // 3. Find "orphaned" forms or leads
        console.log(`\n--- Orphaned Data Check ---`);
        const orphanedForms = [];
        for (const f of forms) {
            const pageExists = pages.some(p => String(p._id) === String(f.page_connection_id));
            if (!pageExists) {
                orphanedForms.push(f);
            }
        }
        console.log(`Orphaned Forms (no valid page_connection_id): ${orphanedForms.length}`);
        orphanedForms.forEach(f => console.log(` - ${f.name} (${f.form_id})`));

        const orphanedLeadsCount = await dbProd.db.collection('leads').countDocuments({
            source: 'Facebook Ads',
            'metadata.form_id': { $nin: forms.map(f => f.form_id) }
        });
        console.log(`Leads without a matching form_id in DB: ${orphanedLeadsCount}`);

        process.exit(0);
    } catch (err) {
        console.error('Operation failed:', err);
        process.exit(1);
    }
}

fixDataAndSummarize();
