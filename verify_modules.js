const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/realnext';

const verifyMigrations = async () => {
    try {
        await mongoose.connect(dbUri);
        console.log('Connected to MongoDB');

        const { QuickReply, CatalogItem, ClientUser } = require('./backend/models/index');

        // Get a test client
        const clientUser = await ClientUser.findOne();
        if (!clientUser) {
            console.error('No client user found for testing.');
            return;
        }

        const clientId = clientUser.client_id;
        const userId = clientUser.user_id;

        console.log(`🧪 Testing with Client: ${clientId}, User: ${userId}`);

        // 1. Test Quick Reply Creation
        const qr = await QuickReply.create({
            client_id: clientId,
            shortcut: '/test_migration',
            title: 'Migration Test',
            content: 'This is a test',
            created_by: userId
        });
        console.log('✅ Quick Reply created successfully.');

        // 2. Test Inventory Creation
        const item = await CatalogItem.create({
            client_id: clientId,
            name: 'Migration Item',
            description: 'Testing migration',
            created_by: userId
        });
        console.log('✅ Inventory item created successfully.');

        // 3. Test Aggregate (Stats)
        const qrStats = await QuickReply.aggregate([
            { $match: { client_id: clientId } },
            { $group: { _id: null, total: { $sum: 1 } } }
        ]);
        console.log('✅ Quick Reply stats aggregated successfully:', qrStats[0]?.total);

        const itemStats = await CatalogItem.aggregate([
            { $match: { client_id: clientId } },
            { $group: { _id: null, total: { $sum: 1 } } }
        ]);
        console.log('✅ Inventory stats aggregated successfully:', itemStats[0]?.total);

        // Cleanup
        await QuickReply.deleteOne({ _id: qr._id });
        await CatalogItem.deleteOne({ _id: item._id });
        console.log('🧹 Cleanup complete.');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Fatal Verification Error:', error);
        process.exit(1);
    }
};

verifyMigrations();
