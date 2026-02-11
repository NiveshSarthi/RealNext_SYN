const mongoose = require('mongoose');
require('dotenv').config();

const leadSchema = new mongoose.Schema({
    name: String,
    stage: String,
    status: String,
    client_id: mongoose.Schema.Types.ObjectId
}, { collection: 'leads' });

const Lead = mongoose.model('Lead', leadSchema);

const statusMap = {
    'new': 'Uncontacted',
    'contacted': 'Hot',
    'interested': 'Hot',
    'qualified': 'Hot',
    'closed': 'Warm',
    'lost': 'Lost'
};

async function migrateLeads() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const leads = await Lead.find({});
        console.log(`Found ${leads.length} leads to migrate.`);

        for (const lead of leads) {
            const updates = {};
            if (!lead.stage) {
                updates.stage = 'Screening';
            }

            if (lead.status && statusMap[lead.status]) {
                updates.status = statusMap[lead.status];
                // If it's not 'screening' status but was mapped, it might need higher stage?
                // For safety, mapping everything to Screening + Mapped Status first.
            } else if (!lead.status || !['Uncontacted', 'Not Interested', 'Not Responding', 'Dead', 'Hot', 'Warm', 'Cold', 'Lost'].includes(lead.status)) {
                updates.status = 'Uncontacted';
            }

            if (Object.keys(updates).length > 0) {
                await Lead.updateOne({ _id: lead._id }, { $set: updates });
                console.log(`Updated lead ${lead.name || lead._id}: ${JSON.stringify(updates)}`);
            }
        }

        console.log('Migration completed successfully.');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrateLeads();
