const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Lead = require('../models/Lead');

async function debugLeadFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Connected to MongoDB');

    // Find leads from the Navraj-copy-copy form
    const leads = await Lead.find({ 'metadata.form_id': '1356149372829598' });

    console.log(`\n📊 Found ${leads.length} leads for the form`);

    leads.forEach((lead, index) => {
      console.log(`\n--- Lead ${index + 1}: ${lead._id} ---`);
      console.log(`Name: "${lead.name}"`);
      console.log(`Email: "${lead.email}"`);
      console.log(`Phone: "${lead.phone}"`);

      if (lead.metadata && lead.metadata.field_data) {
        console.log('Field Data:');
        lead.metadata.field_data.forEach(field => {
          console.log(`  ${field.name}: "${field.values ? field.values[0] : 'NO VALUES'}"`);
        });
      } else {
        console.log('No field_data in metadata');
      }

      if (lead.metadata && lead.metadata.facebook_form_data) {
        console.log('Facebook Form Data:');
        lead.metadata.facebook_form_data.forEach(field => {
          console.log(`  ${field.name}: "${field.values ? field.values[0] : 'NO VALUES'}"`);
        });
      }
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugLeadFields();