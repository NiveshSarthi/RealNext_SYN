const mongoose = require('mongoose');
require('dotenv').config();

async function checkCatalog() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const CatalogItem = mongoose.model('CatalogItem', new mongoose.Schema({}, { strict: false }), 'catalog_items');
        const items = await CatalogItem.find({});

        console.log(`Found ${items.length} items in catalog_items collection`);

        items.forEach((item, index) => {
            console.log(`\nItem ${index + 1}:`);
            console.log(`- ID: ${item._id}`);
            console.log(`- Name: ${item.name}`);
            console.log(`- Client ID: ${item.client_id}`);
            console.log(`- Status: ${item.status}`);
            console.log(`- Deleted At: ${item.deleted_at}`);
            console.log(`- Created At: ${item.created_at}`);
        });

        const distinctClients = await CatalogItem.distinct('client_id');
        console.log('\nDistinct Client IDs in catalog:', distinctClients);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkCatalog();
