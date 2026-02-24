const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Lead } = require('../models');

async function findLeadWithForm() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const lead = await Lead.findOne({ form_name: { $exists: true, $ne: null, $ne: "" } });
        if (lead) {
            console.log(`Lead Found: ${lead.name} (${lead._id}), Source: ${lead.source}, Form: ${lead.form_name}`);
        } else {
            console.log('No lead found with form_name');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

findLeadWithForm();
