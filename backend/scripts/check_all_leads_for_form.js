const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Lead = require('../models/Lead');

async function checkAllLeadsForForm() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Connected to MongoDB');

    const formId = '1356149372829598'; // From previous output

    // Find ALL leads with this form_id, regardless of client
    const allLeads = await Lead.find({ 'metadata.form_id': formId });

    console.log(`\n📊 Total leads in DB for form ${formId}: ${allLeads.length}`);

    // Also check by lead_id in metadata
    const allLeadsByLeadId = await Lead.find({ 'metadata.lead_id': { $exists: true } });
    console.log(`Total leads with lead_id in metadata: ${allLeadsByLeadId.length}`);

    // Group by various criteria
    const byClient = {};
    const byStatus = {};
    const missingClient = [];
    const missingMetadata = [];

    allLeads.forEach(lead => {
      // By client
      const clientId = lead.client_id ? lead.client_id.toString() : 'NO_CLIENT';
      if (!byClient[clientId]) byClient[clientId] = [];
      byClient[clientId].push(lead);

      // By status
      const status = lead.status || 'NO_STATUS';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(lead);

      // Check for issues
      if (!lead.client_id) missingClient.push(lead);
      if (!lead.metadata || !lead.metadata.form_id) missingMetadata.push(lead);
    });

    console.log('\n👥 By Client:');
    Object.keys(byClient).forEach(clientId => {
      console.log(`  ${clientId}: ${byClient[clientId].length} leads`);
    });

    console.log('\n📈 By Status:');
    Object.keys(byStatus).forEach(status => {
      console.log(`  ${status}: ${byStatus[status].length} leads`);
    });

    if (missingClient.length > 0) {
      console.log(`\n⚠️  ${missingClient.length} leads missing client_id`);
    }

    if (missingMetadata.length > 0) {
      console.log(`\n⚠️  ${missingMetadata.length} leads missing metadata`);
    }

    // Check for potential duplicates (same email/phone)
    const emails = {};
    const phones = {};
    allLeads.forEach(lead => {
      if (lead.email) {
        if (!emails[lead.email]) emails[lead.email] = [];
        emails[lead.email].push(lead);
      }
      if (lead.phone) {
        if (!phones[lead.phone]) phones[lead.phone] = [];
        phones[lead.phone].push(lead);
      }
    });

    console.log('\n📧 Duplicate emails:');
    Object.keys(emails).forEach(email => {
      if (emails[email].length > 1) {
        console.log(`  ${email}: ${emails[email].length} leads`);
      }
    });

    console.log('\n📞 Duplicate phones:');
    Object.keys(phones).forEach(phone => {
      if (phones[phone].length > 1) {
        console.log(`  ${phone}: ${phones[phone].length} leads`);
      }
    });

    // Show recent leads
    console.log('\n🕒 Recent leads (last 10):');
    const recentLeads = allLeads
      .sort((a, b) => (b.created_at || b.createdAt) - (a.created_at || a.createdAt))
      .slice(0, 10);

    recentLeads.forEach(lead => {
      const created = lead.created_at || lead.createdAt;
      console.log(`  ${lead._id} - ${lead.name} - ${lead.email} - Client: ${lead.client_id || 'NONE'} - ${created}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllLeadsForForm();