const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const { Campaign } = require('../models');

async function checkDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    const campaigns = await Campaign.find({ name: 'sdf' });
    console.log(JSON.stringify(campaigns, null, 2));
    process.exit(0);
}
checkDB();
