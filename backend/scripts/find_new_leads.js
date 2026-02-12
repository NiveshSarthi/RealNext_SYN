const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    console.log('Checking for leads created after:', oneHourAgo.toISOString());

    const dbs = ['synditech_realnext', 'test'];
    for (const dbName of dbs) {
        const db = mongoose.connection.useDb(dbName);
        const count = await db.db.collection('leads').countDocuments({
            $or: [
                { created_at: { $gt: oneHourAgo } },
                { createdAt: { $gt: oneHourAgo } }
            ]
        });
        console.log(`[${dbName}] New Leads: ${count}`);
        if (count > 0) {
            const leads = await db.db.collection('leads').find({
                $or: [
                    { created_at: { $gt: oneHourAgo } },
                    { createdAt: { $gt: oneHourAgo } }
                ]
            }).toArray();
            console.log(leads.map(l => ({ name: l.name, phone: l.phone, stage: l.stage, status: l.status, client_id: l.client_id })));
        }
    }
    process.exit(0);
}

run();
