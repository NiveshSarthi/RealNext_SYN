const mongoose = require('mongoose');
const { Feature } = require('./models');
require('dotenv').config();

async function addGlobalFeature() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        let feature = await Feature.findOne({ code: 'campaigns' });
        if (!feature) {
            console.log('Campaigns feature missing. Creating...');
            await Feature.create({
                name: 'Campaigns',
                code: 'campaigns',
                module: 'wa_marketing',
                is_active: true,
                is_enabled: true
            });
            console.log('Created campaigns feature globally.');
        } else {
            console.log('Campaigns feature already exists. Enabled:', feature.is_enabled);
            if (!feature.is_enabled) {
                feature.is_enabled = true;
                await feature.save();
            }
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}
addGlobalFeature();
