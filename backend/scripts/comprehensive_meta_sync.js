const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { FacebookPageConnection, FacebookLeadForm, Lead, Client } = require('../models');

// Flexible field extraction function
function extractLeadFields(fieldData) {
  const extracted = {
    name: null,
    email: null,
    phone: null,
    location: null,
    budget: null
  };

  if (!fieldData || !Array.isArray(fieldData)) {
    return extracted;
  }

  // Define field patterns (case-insensitive, partial matches)
  const patterns = {
    name: [
      /^full\s*name$/i,
      /^name$/i,
      /^first\s*name$/i,
      /^last\s*name$/i,
      /name/i  // Fallback - any field containing "name"
    ],
    email: [
      /^email$/i,
      /^e-mail$/i,
      /^email\s*address$/i,
      /email/i  // Fallback
    ],
    phone: [
      /^phone$/i,
      /^phone\s*number$/i,
      /^mobile$/i,
      /^contact\s*number$/i,
      /^telephone$/i,
      /phone/i,  // Fallback
      /mobile/i,
      /contact/i
    ],
    location: [
      /^location$/i,
      /^city$/i,
      /^address$/i,
      /^state$/i,
      /^area$/i,
      /location/i,  // Fallback
      /city/i,
      /address/i
    ],
    budget: [
      /budget/i,
      /price/i,
      /cost/i,
      /range/i,
      /investment/i
    ]
  };

  // Process each field
  fieldData.forEach(field => {
    const fieldName = field.name?.toLowerCase()?.trim();
    const fieldValue = field.values?.[0]?.trim();

    if (!fieldName || !fieldValue) return;

    // Check each field type
    Object.keys(patterns).forEach(fieldType => {
      if (extracted[fieldType]) return; // Already found

      // Check if field name matches any pattern for this type
      const matches = patterns[fieldType].some(pattern => pattern.test(fieldName));

      if (matches) {
        extracted[fieldType] = fieldValue;
      }
    });
  });

  return extracted;
}

async function comprehensiveMetaSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

    // Get all clients
    const clients = await Client.find({});
    console.log(`\n📊 Found ${clients.length} clients to sync`);

    let totalPages = 0;
    let totalForms = 0;
    let totalLeads = 0;

    for (const client of clients) {
      console.log(`\n🏢 Syncing client: ${client.name} (${client._id})`);

      // Get all page connections for this client
      const pageConnections = await FacebookPageConnection.find({
        client_id: client._id,
        is_lead_sync_enabled: true
      });

      console.log(`   📄 Found ${pageConnections.length} active page connections`);

      for (const pageConnection of pageConnections) {
        totalPages++;
        console.log(`\n   🌐 Syncing page: ${pageConnection.page_name} (${pageConnection.page_id})`);

        try {
          // Sync forms for this page
          const formsResponse = await axios.get(`${GRAPH_API_URL}/${pageConnection.page_id}/leadgen_forms`, {
            params: {
              access_token: pageConnection.access_token,
              limit: 100
            }
          });

          const forms = formsResponse.data.data || [];
          console.log(`      📝 Found ${forms.length} forms on Meta`);

          for (const form of forms) {
            // Check if form exists in our DB
            let dbForm = await FacebookLeadForm.findOne({
              client_id: client._id,
              form_id: form.id
            });

            const isActive = form.status === 'ACTIVE' || form.status === 'active';

            if (!dbForm) {
              // Create new form
              dbForm = await FacebookLeadForm.create({
                client_id: client._id,
                form_id: form.id,
                page_connection_id: pageConnection._id,
                name: form.name,
                status: isActive ? 'active' : 'inactive',
                lead_count: form.leads_count || 0
              });
              console.log(`         ✅ Created form: ${form.name}`);
              totalForms++;
            } else {
              // Update existing form
              dbForm.lead_count = form.leads_count || 0;
              dbForm.status = isActive ? 'active' : 'inactive';
              await dbForm.save();
              console.log(`         🔄 Updated form: ${form.name}`);
            }

            // Sync leads for this form
            await syncLeadsForForm(dbForm, pageConnection);
            totalLeads += dbForm.lead_count;
          }

        } catch (pageError) {
          console.error(`      ❌ Error syncing page ${pageConnection.page_name}:`, pageError.message);
        }
      }
    }

    console.log(`\n📊 COMPREHENSIVE SYNC SUMMARY:`);
    console.log(`   Total Pages: ${totalPages}`);
    console.log(`   Total Forms: ${totalForms}`);
    console.log(`   Total Leads: ${totalLeads}`);
    console.log(`   ✅ All data synchronized with Meta`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function syncLeadsForForm(form, pageConnection) {
  const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

  try {
    // Get all leads from Meta for this form
    const leadsResponse = await axios.get(`${GRAPH_API_URL}/${form.form_id}/leads`, {
      params: {
        access_token: pageConnection.access_token,
        limit: 1000 // Get as many as possible
      }
    });

    const metaLeads = leadsResponse.data.data || [];
    console.log(`            📥 Meta reports ${metaLeads.length} leads for ${form.name}`);

    // Get existing leads from DB
    const existingLeads = await Lead.find({
      'metadata.form_id': form.form_id,
      client_id: form.client_id
    });

    const existingLeadIds = new Set(existingLeads.map(l => l.metadata?.lead_id).filter(Boolean));
    console.log(`            🗄️  DB has ${existingLeads.length} leads (${existingLeadIds.size} with lead_id)`);

    let imported = 0;
    let skipped = 0;

    for (const metaLead of metaLeads) {
      // Skip if already exists
      if (existingLeadIds.has(metaLead.id)) {
        skipped++;
        continue;
      }

      // Check for duplicate by email/phone
      const leadDetailResponse = await axios.get(`${GRAPH_API_URL}/${metaLead.id}`, {
        params: {
          access_token: pageConnection.access_token
        }
      });

      const leadData = leadDetailResponse.data;
      const fieldData = leadData.field_data || [];

      // Extract fields using flexible pattern matching
      const extractedFields = extractLeadFields(fieldData);
      const email = extractedFields.email;
      const phone = extractedFields.phone;
      const fullName = extractedFields.name;
      const city = extractedFields.location;

      // Skip if no contact info
      if (!email && !phone) {
        console.log(`            ⚠️  Skipping lead ${metaLead.id} - no contact info`);
        skipped++;
        continue;
      }

      // Note: We allow multiple leads from the same person across different forms/campaigns
      // This enables proper marketing attribution and multi-touch analysis
      // Only block exact Facebook lead ID duplicates (handled above)

      // Create the lead
      const newLead = await Lead.create({
        client_id: form.client_id,
        name: fullName || 'Facebook Lead',
        email: email,
        phone: phone,
        location: city,
        source: 'Facebook Ads',
        form_name: form.name,
        campaign_name: leadData.ad_name || 'Unknown',
        status: 'Uncontacted',
        stage: 'Screening',
        ai_score: 0,
        metadata: {
          lead_id: metaLead.id,
          form_id: form.form_id,
          page_id: pageConnection.page_id,
          created_time: metaLead.created_time,
          ad_name: leadData.ad_name,
          adset_name: leadData.adset_name,
          campaign_name: leadData.campaign_name,
          field_data: fieldData
        }
      });

      imported++;
    }

    console.log(`            ✅ Imported ${imported} new leads, skipped ${skipped} existing`);

    // Update form lead count
    const actualCount = await Lead.countDocuments({
      'metadata.form_id': form.form_id,
      client_id: form.client_id
    });

    form.lead_count = actualCount;
    await form.save();

  } catch (error) {
    console.error(`            ❌ Error syncing leads for ${form.name}:`, error.message);
  }
}

comprehensiveMetaSync();