const mongoose = require('mongoose');
require('dotenv').config();

async function runFinalAudit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dbProd = mongoose.connection.useDb('synditech_realnext');

        const pages = await dbProd.db.collection('facebook_page_connections').find({}).toArray();
        const forms = await dbProd.db.collection('facebook_lead_forms').find({}).toArray();

        console.log('--- PAGES ---');
        const pMap = {};
        pages.forEach(p => {
            pMap[String(p._id)] = p;
            console.log(`_id: ${p._id} | Name: [${p.page_name}] | Page ID: ${p.page_id}`);
        });

        console.log('\n--- FORMS SUMMARY ---');
        const distr = {};
        for (const f of forms) {
            const pid = String(f.page_connection_id);
            distr[pid] = (distr[pid] || 0) + 1;
        }

        for (const pid in distr) {
            const page = pMap[pid];
            console.log(`Linked Page _id: ${pid} (${page ? page.page_name : 'NOT FOUND'}) | Forms: ${distr[pid]}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runFinalAudit();
