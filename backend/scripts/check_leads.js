const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Lead } = require('../models');

async function checkLeads() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const leads = await Lead.find({}).sort({ created_at: -1 }).limit(10);
        console.log('Last 10 leads:');
        leads.forEach(l => {
            console.log(`Name: ${l.name}, Source: ${l.source}, Form: ${l.form_name}, Campaign: ${l.campaign_name}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkLeads();
