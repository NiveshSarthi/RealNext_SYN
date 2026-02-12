const mongoose = require('mongoose');
require('dotenv').config();

const leadSchema = new mongoose.Schema({
    name: String,
    stage: String,
    status: String,
    client_id: mongoose.Schema.Types.ObjectId
}, { collection: 'leads' });

const Lead = mongoose.model('Lead', leadSchema);

async function checkLeads() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const totalLeads = await Lead.countDocuments();
        console.log(`Total Leads: ${totalLeads}`);

        const leadsWithNoStage = await Lead.find({ stage: { $exists: false } });
        console.log(`Leads with no stage: ${leadsWithNoStage.length}`);

        const leadsWithInvalidStatus = await Lead.find({ status: { $nin: ['Uncontacted', 'Not Interested', 'Not Responding', 'Dead', 'Hot', 'Warm', 'Cold', 'Lost'] } });
        console.log(`Leads with invalid status: ${leadsWithInvalidStatus.length}`);

        if (leadsWithNoStage.length > 0) {
            console.log('Sample leads with no stage:');
            leadsWithNoStage.slice(0, 5).forEach(l => console.log(` - ${l.name} (Status: ${l.status})`));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkLeads();
