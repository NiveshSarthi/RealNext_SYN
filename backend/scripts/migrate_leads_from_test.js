const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const sourceDb = mongoose.connection.useDb('test');
        const targetDb = mongoose.connection.useDb('synditech_realnext');

        const targetClientId = new mongoose.Types.ObjectId('698c328095ac8aa335810d9b'); // Direct Test Co
        console.log('Target Client ID:', targetClientId);

        const leads = await sourceDb.db.collection('leads').find({}).toArray();
        console.log(`Found ${leads.length} leads in [test] database`);

        if (leads.length === 0) {
            console.log('No leads to migrate.');
            process.exit(0);
        }

        const migratedLeads = leads.map(l => {
            const { _id, ...data } = l;
            return {
                ...data,
                client_id: targetClientId,
                stage: l.stage || 'Screening',
                status: l.status || 'Uncontacted',
                created_at: l.created_at || l.createdAt || new Date(),
                updated_at: l.updated_at || l.updatedAt || new Date()
            };
        });

        console.log(`Prepared ${migratedLeads.length} leads for migration.`);

        // Insert into target
        const result = await targetDb.db.collection('leads').insertMany(migratedLeads);
        console.log(`Successfully migrated ${result.insertedCount} leads to [synditech_realnext]`);

        // Optionally clear source
        // await sourceDb.db.collection('leads').deleteMany({});

        await mongoose.disconnect();
        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
