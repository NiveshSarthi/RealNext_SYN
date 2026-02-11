const mongoose = require('mongoose');
require('dotenv').config();

const test = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('SUCCESS: Connected to MongoDB');
        console.log('Connected DB Name:', mongoose.connection.name);

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('All DBs:', JSON.stringify(dbs.databases.map(d => d.name)));

        // Try to find the user in 'test' if current isn't 'test'
        const usersInCurrent = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log(`Users in ${mongoose.connection.name}:`, usersInCurrent.length);

        process.exit(0);
    } catch (err) {
        console.error('FAILURE:', err.message);
        process.exit(1);
    }
};

test();
