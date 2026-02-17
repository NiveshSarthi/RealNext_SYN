const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { FacebookLeadForm, Lead } = require('../models');

async function checkMetaVsDbLeads() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Connected to MongoDB');

    // Find the Navraj-copy-copy form
    const form = await FacebookLeadForm.findOne({ name: 'Navraj-copy-copy' }).populate('page_connection_id');
    if (!form) {
      console.log('❌ Form not found');
      return;
    }

    console.log(`\n📋 Form: ${form.name}`);
    console.log(`Form ID: ${form.form_id}`);
    console.log(`Stored lead_count: ${form.lead_count}`);
    console.log(`Meta leads_count: ${form.leads_count || 'N/A'}`);

    // Count actual leads in DB for this form
    const dbLeads = await Lead.find({ 'metadata.form_id': form.form_id });
    console.log(`\n📊 Database leads for this form: ${dbLeads.length}`);

    // Group by client_id
    const clientGroups = {};
    dbLeads.forEach(lead => {
      const clientId = lead.client_id?.toString() || 'NO_CLIENT';
      if (!clientGroups[clientId]) {
        clientGroups[clientId] = [];
      }
      clientGroups[clientId].push(lead);
    });

    console.log('\n👥 Leads grouped by client:');
    Object.keys(clientGroups).forEach(clientId => {
      console.log(`Client ${clientId}: ${clientGroups[clientId].length} leads`);
      // Show sample lead IDs
      const sampleIds = clientGroups[clientId].slice(0, 3).map(l => l._id.toString());
      console.log(`  Sample IDs: ${sampleIds.join(', ')}`);
    });

    // Check for leads without client_id
    const leadsWithoutClient = dbLeads.filter(l => !l.client_id);
    if (leadsWithoutClient.length > 0) {
      console.log(`\n⚠️  ${leadsWithoutClient.length} leads without client_id!`);
    }

    // Check Meta API for current count
    const axios = require('axios');
    const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';
    const accessToken = form.page_connection_id?.access_token || 'NO_TOKEN';

    if (accessToken !== 'NO_TOKEN') {
      try {
        const response = await axios.get(`${GRAPH_API_URL}/${form.form_id}`, {
          params: {
            access_token: accessToken,
            fields: 'leads_count,name'
          }
        });

        console.log(`\n🌐 Meta API response:`);
        console.log(`Name: ${response.data.name}`);
        console.log(`Meta leads_count: ${response.data.leads_count}`);

      } catch (apiError) {
        console.log(`\n❌ Meta API error: ${apiError.response?.data?.error?.message || apiError.message}`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMetaVsDbLeads();