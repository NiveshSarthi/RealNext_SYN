const mongoose = require('mongoose');
require('dotenv').config();
const Lead = require('../models/Lead');
const Client = require('../models/Client');

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const totalLeads = await Lead.countDocuments({});
        console.log('Total Leads in DB:', totalLeads);

        const clients = await Client.find({});
        console.log('Total Clients:', clients.length);

        for (const client of clients) {
            const clientLeads = await Lead.countDocuments({ client_id: client._id });
            const leadsWithStage = await Lead.countDocuments({ client_id: client._id, stage: { $exists: true, $ne: null } });
            const stages = await Lead.aggregate([
                { $match: { client_id: client._id } },
                { $group: { _id: '$stage', count: { $sum: 1 } } }
            ]);
            console.log(`Client: ${client.name} (${client._id})`);
            console.log(`  Leads: ${clientLeads}`);
            console.log(`  With Stage: ${leadsWithStage}`);
            console.log(`  Stages Break-down:`, stages);
        }

        const sampleLeads = await Lead.find({ stage: { $exists: false } }).limit(5);
        if (sampleLeads.length > 0) {
            console.log('Sample Leads without Stage:');
            sampleLeads.forEach(l => console.log(`  - ${l.name} (Status: ${l.status}, Created: ${l.created_at})`));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Diagnosis failed:', err);
    }
}

diagnose();
