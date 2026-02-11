const mongoose = require('mongoose');
require('dotenv').config();

const test = async () => {
    try {
        const uri = 'mongodb://root:CjmqvpwJAzemm4CcpcpCohYym9kp9wh8pDPnR6A8aTSP8sAjcXBi8x6ayEU3DfbV@72.61.248.175:5448/?authSource=admin&directConnection=true';
        await mongoose.connect(uri);
        console.log('SUCCESS: Connected to Cluster');

        const dbs = ['test', 'realnext-dev', 'synditech_realnext'];
        for (const dbName of dbs) {
            const db = mongoose.connection.useDb(dbName);
            const count = await db.collection('users').countDocuments({ email: 'admin@realnext.com' });
            console.log(`DB: ${dbName}, Users with matching email: ${count}`);
            if (count > 0) {
                const user = await db.collection('users').findOne({ email: 'admin@realnext.com' });
                console.log(`User in ${dbName}:`, JSON.stringify(user));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('FAILURE:', err.message);
        process.exit(1);
    }
};

test();
