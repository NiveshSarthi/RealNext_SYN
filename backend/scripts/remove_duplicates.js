const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Lead = require('../models/Lead');
const FacebookLeadForm = require('../models/FacebookLeadForm');

async function removeDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all leads with contact info
    const allLeads = await Lead.find({
      $or: [
        { phone: { $exists: true, $ne: null, $ne: '' } },
        { email: { $exists: true, $ne: null, $ne: '' } }
      ]
    });

    console.log(`📊 Total leads with contact info: ${allLeads.length}`);

    // Group by contact combination
    const contactGroups = {};
    allLeads.forEach(lead => {
      const key = `${lead.phone || ''}|${lead.email || ''}`;
      if (!contactGroups[key]) {
        contactGroups[key] = [];
      }
      contactGroups[key].push(lead);
    });

    const duplicateContacts = Object.keys(contactGroups).filter(key => contactGroups[key].length > 1);
    console.log(`❌ Duplicate contact combinations: ${duplicateContacts.length}`);

    let totalRemoved = 0;

    for (const contactKey of duplicateContacts) {
      const duplicates = contactGroups[contactKey];
      const [phone, email] = contactKey.split('|');

      console.log(`\n🔍 Processing duplicates for: ${phone || 'no-phone'} | ${email || 'no-email'}`);
      console.log(`   Found ${duplicates.length} duplicates`);

      // Separate leads with and without Facebook lead_id
      const withLeadId = duplicates.filter(lead => lead.metadata?.lead_id);
      const withoutLeadId = duplicates.filter(lead => !lead.metadata?.lead_id);

      console.log(`   With Facebook lead_id: ${withLeadId.length}`);
      console.log(`   Without Facebook lead_id: ${withoutLeadId.length}`);

      if (withLeadId.length > 0 && withoutLeadId.length > 0) {
        // Keep the one with Facebook lead_id, remove the others
        const toKeep = withLeadId[0]; // Keep the first one with lead_id
        const toRemove = [...withLeadId.slice(1), ...withoutLeadId]; // Remove extras with lead_id and all without

        console.log(`   Keeping: ${toKeep._id} (${toKeep.metadata?.lead_id ? 'with' : 'without'} lead_id)`);
        console.log(`   Removing ${toRemove.length} duplicates`);

        for (const lead of toRemove) {
          await Lead.findByIdAndDelete(lead._id);
          console.log(`   ❌ Removed: ${lead._id}`);
          totalRemoved++;
        }
      } else if (withLeadId.length > 1) {
        // Multiple with lead_id - this shouldn't happen, but keep the first one
        const toKeep = withLeadId[0];
        const toRemove = withLeadId.slice(1);

        console.log(`   Multiple with lead_id - keeping first, removing ${toRemove.length} extras`);

        for (const lead of toRemove) {
          await Lead.findByIdAndDelete(lead._id);
          console.log(`   ❌ Removed duplicate with lead_id: ${lead._id}`);
          totalRemoved++;
        }
      }
      // If only without lead_id, keep all (no duplicates to remove)
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`Total duplicates removed: ${totalRemoved}`);

    // Update form lead counts after cleanup
    console.log(`\n🔄 Updating form lead counts...`);
    const forms = await FacebookLeadForm.find({});
    for (const form of forms) {
      const actualCount = await Lead.countDocuments({
        'metadata.form_id': form.form_id,
        client_id: form.client_id
      });
      if (form.lead_count !== actualCount) {
        await FacebookLeadForm.updateOne(
          { _id: form._id },
          { $set: { lead_count: actualCount } }
        );
        console.log(`   Updated ${form.name}: ${form.lead_count} → ${actualCount}`);
      }
    }

    // Final verification
    const finalDuplicates = await Lead.aggregate([
      {
        $match: {
          $or: [
            { phone: { $exists: true, $ne: null, $ne: '' } },
            { email: { $exists: true, $ne: null, $ne: '' } }
          ]
        }
      },
      {
        $group: {
          _id: { phone: '$phone', email: '$email' },
          count: { $sum: 1 },
          leads: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`\n✅ Final check - remaining duplicates: ${finalDuplicates.length}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

removeDuplicates();