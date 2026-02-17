const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { FacebookLeadForm, Lead } = require('../models');

async function fixFormLeadCounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Connected to MongoDB');

    // Get all forms
    const forms = await FacebookLeadForm.find({});
    console.log(`Found ${forms.length} forms to check`);

    let updatedCount = 0;

    for (const form of forms) {
      // Count actual leads for this form
      const actualLeads = await Lead.countDocuments({
        'metadata.form_id': form.form_id
      });

      if (form.lead_count !== actualLeads) {
        console.log(`Updating ${form.name}: ${form.lead_count} -> ${actualLeads}`);
        await FacebookLeadForm.updateOne(
          { _id: form._id },
          { $set: { lead_count: actualLeads } }
        );
        updatedCount++;
      }
    }

    console.log(`\n✅ Updated lead_count for ${updatedCount} forms`);

    // Now check the specific form
    const navrajForm = await FacebookLeadForm.findOne({ name: 'Navraj-copy-copy' });
    if (navrajForm) {
      console.log(`\nNavraj-copy-copy form lead_count: ${navrajForm.lead_count}`);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixFormLeadCounts();