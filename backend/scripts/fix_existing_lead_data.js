const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Lead = require('../models/Lead');

async function fixExistingLeadData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Connected to MongoDB');

    // Find leads that have field_data but missing name/phone/email
    const leadsToFix = await Lead.find({
      $or: [
        { name: 'Unknown' },
        { name: 'Facebook Lead' },
        { phone: 'undefined' },
        { email: 'undefined' }
      ],
      'metadata.field_data': { $exists: true }
    });

    console.log(`\n📊 Found ${leadsToFix.length} leads to fix`);

    let fixed = 0;

    for (const lead of leadsToFix) {
      const fieldData = lead.metadata.field_data || [];
      let updates = {};

      // Extract correct field values
      const email = fieldData.find(f => f.name === 'email' || f.name.includes('email'))?.values?.[0];
      const fullName = fieldData.find(f => f.name === 'full name' || f.name === 'full_name' || f.name.includes('name'))?.values?.[0];
      const phone = fieldData.find(f => f.name === 'phone' || f.name === 'phone_number' || f.name.includes('phone'))?.values?.[0];
      const city = fieldData.find(f => f.name === 'city' || f.name.includes('location'))?.values?.[0];

      // Update fields that are missing or incorrect
      if ((lead.name === 'Unknown' || lead.name === 'Facebook Lead') && fullName) {
        updates.name = fullName;
      }

      if ((!lead.phone || lead.phone === 'undefined') && phone) {
        updates.phone = phone;
      }

      if ((!lead.email || lead.email === 'undefined') && email) {
        updates.email = email;
      }

      if (city && !lead.location) {
        updates.location = city;
      }

      if (Object.keys(updates).length > 0) {
        await Lead.updateOne({ _id: lead._id }, { $set: updates });
        console.log(`✅ Fixed lead ${lead._id}:`, updates);
        fixed++;
      }
    }

    console.log(`\n📊 Fixed ${fixed} leads`);

    // Verify the fixes
    console.log('\n🔍 Verification - checking fixed leads:');
    const fixedLeads = await Lead.find({
      'metadata.form_id': '1356149372829598'
    }).select('name email phone location');

    fixedLeads.forEach(lead => {
      console.log(`${lead._id}: "${lead.name}" - "${lead.email}" - "${lead.phone}" - "${lead.location}"`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixExistingLeadData();