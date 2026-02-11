const mongoose = require('mongoose');
const path = require('path');
const { Client } = require('./models');

async function testUpdate() {
    try {
        const uri = 'mongodb://root:CjmqvpwJAzemm4CcpcpCohYym9kp9wh8pDPnR6A8aTSP8sAjcXBi8x6ayEU3DfbV@72.61.248.175:5448/synditech_realnext?authSource=admin&directConnection=true';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const client = await Client.findOne();
        if (!client) {
            console.log('No client found to test with');
            return;
        }

        console.log(`Original status: ${client.status}`);
        const newStatus = client.status === 'active' ? 'inactive' : 'active';
        console.log(`Setting status to: ${newStatus}`);

        client.status = newStatus;
        await client.save();
        console.log('Update successful!');

        const updated = await Client.findById(client._id);
        console.log(`New status in DB: ${updated.status}`);

    } catch (error) {
        console.error('Update failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testUpdate();
