const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Lead = require('../models/Lead');

async function analyzeDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check for duplicates by Facebook lead_id
    const leadsWithLeadId = await Lead.find({
      'metadata.lead_id': { $exists: true, $ne: null }
    });

    console.log(`\n📊 Total leads with Facebook lead_id: ${leadsWithLeadId.length}`);

    // Group by lead_id to find duplicates
    const leadIdGroups = {};
    leadsWithLeadId.forEach(lead => {
      const leadId = lead.metadata.lead_id;
      if (!leadIdGroups[leadId]) {
        leadIdGroups[leadId] = [];
      }
      leadIdGroups[leadId].push(lead);
    });

    const duplicateLeadIds = Object.keys(leadIdGroups).filter(id => leadIdGroups[id].length > 1);
    console.log(`❌ Duplicate Facebook lead_ids: ${duplicateLeadIds.length}`);

    if (duplicateLeadIds.length > 0) {
      console.log('\n🔍 Duplicate lead_id details:');
      duplicateLeadIds.slice(0, 10).forEach(leadId => {
        const duplicates = leadIdGroups[leadId];
        console.log(`\nLead ID ${leadId}: ${duplicates.length} duplicates`);
        duplicates.forEach((lead, idx) => {
          console.log(`  ${idx + 1}. ${lead._id} - ${lead.name} - ${lead.email} - ${lead.phone} - Created: ${lead.createdAt}`);
        });
      });
    }

    // Check for duplicates by contact info (phone + email)
    const allLeads = await Lead.find({
      $or: [
        { phone: { $exists: true, $ne: null, $ne: '' } },
        { email: { $exists: true, $ne: null, $ne: '' } }
      ]
    });

    console.log(`\n📞 Total leads with contact info: ${allLeads.length}`);

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

    if (duplicateContacts.length > 0) {
      console.log('\n🔍 Duplicate contact details (first 10):');
      duplicateContacts.slice(0, 10).forEach(contactKey => {
        const [phone, email] = contactKey.split('|');
        const duplicates = contactGroups[contactKey];
        console.log(`\nContact ${phone || 'no-phone'} | ${email || 'no-email'}: ${duplicates.length} duplicates`);
        duplicates.forEach((lead, idx) => {
          const hasLeadId = lead.metadata?.lead_id ? 'YES' : 'NO';
          console.log(`  ${idx + 1}. ${lead._id} - ${lead.name} - Form: ${lead.form_name} - LeadID: ${hasLeadId} - Created: ${lead.createdAt}`);
        });
      });
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`- Leads with Facebook lead_id: ${leadsWithLeadId.length}`);
    console.log(`- Duplicate Facebook lead_ids: ${duplicateLeadIds.length}`);
    console.log(`- Duplicate contact combinations: ${duplicateContacts.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeDuplicates();