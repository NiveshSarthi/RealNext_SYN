const mongoose = require('mongoose');
require('dotenv').config();

async function checkLinkage() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dbProd = mongoose.connection.useDb('synditech_realnext');

        const pages = await dbProd.db.collection('facebook_page_connections').find({}).toArray();
        const forms = await dbProd.db.collection('facebook_lead_forms').find({}).toArray();

        console.log('--- PAGES ---');
        const pMap = {};
        pages.forEach(p => {
            pMap[String(p._id)] = p;
            console.log(`[${p.page_name}] | ID: ${p.page_id} | MongoDB _id: ${p._id}`);
        });

        console.log('\n--- FORMS LINKAGE ---');
        // Count forms by linked page _id
        const distribution = {};
        for (const f of forms) {
            const pid = String(f.page_connection_id);
            distribution[pid] = (distribution[pid] || 0) + 1;
        }

        for (const pid in distribution) {
            const page = pMap[pid];
            console.log(`Page _id: ${pid} | Name in DB: ${page ? page.page_name : 'UNKNOWN'} | Page ID: ${page ? page.page_id : 'N/A'} | Forms: ${distribution[pid]}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkLinkage();
