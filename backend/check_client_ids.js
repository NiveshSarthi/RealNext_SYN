const mongoose = require('mongoose');
const { Client } = require('./models');

async function checkIds() {
    try {
        const uri = 'mongodb://root:CjmqvpwJAzemm4CcpcpCohYym9kp9wh8pDPnR6A8aTSP8sAjcXBi8x6ayEU3DfbV@72.61.248.175:5448/synditech_realnext?authSource=admin&directConnection=true';
        await mongoose.connect(uri);
        console.log('Connected');

        const clients = await Client.find().limit(5);
        clients.forEach(c => {
            console.log(`Name: ${c.name}`);
            console.log(`_id: ${c._id}`);
            console.log(`id: ${c.id}`);
            console.log(`JSON id: ${c.toJSON().id}`);
            console.log('---');
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkIds();
