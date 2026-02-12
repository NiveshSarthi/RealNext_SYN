const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const clientId = '698c35c51b812cbbda14a036';
    console.log('Searching for leads with client_id:', clientId);

    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();

    for (const dbInfo of dbs.databases) {
        const dbName = dbInfo.name;
        if (['admin', 'local', 'config'].includes(dbName)) continue;

        const db = mongoose.connection.useDb(dbName);
        const collections = await db.db.listCollections().toArray();
        for (const col of collections) {
            if (col.name === 'leads') {
                const count = await db.db.collection('leads').countDocuments({ client_id: new mongoose.Types.ObjectId(clientId) });
                const countStr = await db.db.collection('leads').countDocuments({ client_id: clientId });
                console.log(`[${dbName}] Leads (ObjectId): ${count}, (String): ${countStr}`);
            }
        }
    }
    process.exit(0);
}

run();
