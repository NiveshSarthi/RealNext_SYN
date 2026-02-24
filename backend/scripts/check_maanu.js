const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Lead } = require('../models');

async function checkMaanu() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const lead = await Lead.findById('698c738b8d39fb3ea4d9c65b');
        console.log(JSON.stringify(lead, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkMaanu();
