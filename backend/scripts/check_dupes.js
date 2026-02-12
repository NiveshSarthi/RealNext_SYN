const mongoose = require('mongoose');
require('dotenv').config();

async function checkDuplicates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dbProd = mongoose.connection.useDb('synditech_realnext');

        const pages = await dbProd.db.collection('facebook_page_connections').find({}).toArray();
        const pageIds = pages.map(p => p.page_id);
        const duplicates = pageIds.filter((id, index) => pageIds.indexOf(id) !== index);

        console.log('Duplicate Page IDs:', duplicates);
        if (duplicates.length > 0) {
            pages.forEach(p => {
                if (duplicates.includes(p.page_id)) {
                    console.log(`[DUPE] ID: ${p.page_id} | Name: ${p.page_name} | _id: ${p._id}`);
                }
            });
        } else {
            console.log('No duplicate page IDs found.');
        }

        // Also check if some forms are inactive
        const inactiveForms = await dbProd.db.collection('facebook_lead_forms').countDocuments({ status: { $ne: 'active' } });
        console.log(`Total Inactive/Non-Active Forms in DB: ${inactiveForms}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDuplicates();
