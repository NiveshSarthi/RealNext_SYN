const mongoose = require('mongoose');
require('dotenv').config();

const test = async () => {
    try {
        const uri = 'mongodb://root:CjmqvpwJAzemm4CcpcpCohYym9kp9wh8pDPnR6A8aTSP8sAjcXBi8x6ayEU3DfbV@72.61.248.175:5448/?authSource=admin&directConnection=true';
        await mongoose.connect(uri);
        console.log('SUCCESS: Connected to MongoDB Cluster');

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();

        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            const db = mongoose.connection.useDb(dbName);
            const collections = await db.db.listCollections().toArray();

            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments({ email: 'admin@realnext.com' });
                if (count > 0) {
                    console.log(`FOUND USER IN DB: ${dbName}, COLLECTION: ${col.name}`);
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('FAILURE:', err.message);
        process.exit(1);
    }
};

test();
