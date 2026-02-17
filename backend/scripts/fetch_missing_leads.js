const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { FacebookLeadForm, Lead, Client } = require('../models');

async function fetchMissingLeads() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ Connected to MongoDB');

    const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

    // Find the form
    const form = await FacebookLeadForm.findOne({ name: 'Navraj-copy-copy' }).populate('page_connection_id');
    if (!form) {
      console.log('❌ Form not found');
      return;
    }

    console.log(`\n📋 Form: ${form.name} (${form.form_id})`);
    console.log(`Page: ${form.page_connection_id.page_name}`);

    const accessToken = form.page_connection_id.access_token;
    if (!accessToken) {
      console.log('❌ No access token');
      return;
    }

    // Fetch leads from Meta API
    console.log('\n🌐 Fetching leads from Meta API...');
    const response = await axios.get(`${GRAPH_API_URL}/${form.form_id}/leads`, {
      params: {
        access_token: accessToken,
        limit: 100
      }
    });

    const metaLeads = response.data.data || [];
    console.log(`Meta API returned ${metaLeads.length} leads`);

    // Get existing leads from DB
    const dbLeads = await Lead.find({ 'metadata.form_id': form.form_id });
    const dbLeadIds = new Set(dbLeads.map(l => l.metadata?.lead_id));

    console.log(`Database leads with this form_id: ${dbLeads.length}`);
    console.log(`Database leads with lead_id in metadata: ${dbLeads.filter(l => l.metadata?.lead_id).length}`);

    console.log(`Database has ${dbLeads.length} leads`);

    // Find missing leads
    const missingLeads = metaLeads.filter(metaLead => !dbLeadIds.has(metaLead.id));

    console.log(`\n❌ Missing leads: ${missingLeads.length}`);

    if (missingLeads.length > 0) {
      console.log('\n📝 Missing lead details:');
      for (const metaLead of missingLeads) {
        console.log(`\nLead ID: ${metaLead.id}`);
        console.log(`Created: ${metaLead.created_time}`);

        // Get lead details
        try {
          const detailResponse = await axios.get(`${GRAPH_API_URL}/${metaLead.id}`, {
            params: {
              access_token: accessToken
            }
          });

          const leadData = detailResponse.data;
          console.log(`Name: ${leadData.field_data?.find(f => f.name === 'full_name')?.values?.[0] || 'N/A'}`);
          console.log(`Email: ${leadData.field_data?.find(f => f.name === 'email')?.values?.[0] || 'N/A'}`);
          console.log(`Phone: ${leadData.field_data?.find(f => f.name === 'phone_number')?.values?.[0] || 'N/A'}`);

        } catch (detailError) {
          console.log(`❌ Error fetching lead details: ${detailError.message}`);
        }
      }

      // Ask if we want to import missing leads
      console.log(`\n🔄 Would you like to import the ${missingLeads.length} missing leads?`);
      console.log('Note: This will create leads in the database for the form\'s client.');

    } else {
      console.log('\n✅ All leads are already in the database');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fetchMissingLeads();