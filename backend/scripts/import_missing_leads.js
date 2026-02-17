const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { FacebookLeadForm, Lead, Client } = require('../models');

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

async function importMissingLeads() {
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

    const accessToken = form.page_connection_id.access_token;
    const clientId = form.client_id;

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

    // Get existing leads from DB for this form
    const existingLeads = await Lead.find({ 'metadata.form_id': form.form_id });
    const existingEmails = new Set(existingLeads.map(l => l.email?.toLowerCase()).filter(Boolean));
    const existingLeadIds = new Set(existingLeads.map(l => l.metadata?.lead_id).filter(Boolean));

    console.log(`Existing leads in DB: ${existingLeads.length}`);
    console.log(`Existing emails: ${existingEmails.size}`);
    console.log(`Existing lead_ids: ${existingLeadIds.size}`);

    let imported = 0;
    let skipped = 0;

    for (const metaLead of metaLeads) {
      // Skip if already exists by lead_id
      if (existingLeadIds.has(metaLead.id)) {
        console.log(`⏭️  Skipping lead ${metaLead.id} - already exists by lead_id`);
        skipped++;
        continue;
      }

      // Fetch detailed lead data
      const detailResponse = await axios.get(`${GRAPH_API_URL}/${metaLead.id}`, {
        params: {
          access_token: accessToken
        }
      });

      const leadData = detailResponse.data;
      const fieldData = leadData.field_data || [];

      // Extract lead information using flexible pattern matching
      const extractedFields = extractLeadFields(fieldData);
      const email = extractedFields.email;
      const fullName = extractedFields.name;
      const phone = extractedFields.phone;
      const city = extractedFields.location;

      // Skip if email already exists (potential duplicate)
      if (email && existingEmails.has(email.toLowerCase())) {
        console.log(`⏭️  Skipping lead ${metaLead.id} - email ${email} already exists`);
        skipped++;
        continue;
      }

      // Find a system user for activity logs (first user of the client)
      const ClientUser = require('../models/ClientUser');
      const systemUser = await ClientUser.findOne({ client_id: clientId });
      const userId = systemUser ? systemUser.user_id : null;

      if (!userId) {
        console.log(`⏭️  Skipping lead ${metaLead.id} - no user found for client`);
        skipped++;
        continue;
      }

      // Create the lead
      const newLead = await Lead.create({
        client_id: clientId,
        name: fullName || 'Unknown',
        email: email,
        phone: phone,
        location: city,
        source: 'facebook',
        form_name: form.name,
        campaign_name: 'Unknown', // Could be enhanced
        status: 'Uncontacted',
        stage: 'Screening',
        ai_score: 0,
        metadata: {
          form_id: form.form_id,
          lead_id: metaLead.id,
          page_id: form.page_connection_id.page_id,
          created_time: metaLead.created_time,
          field_data: fieldData
        },
        activity_logs: [{
          type: 'creation',
          content: 'Lead imported from Facebook',
          user_id: userId,
          created_at: new Date()
        }]
      });

      console.log(`✅ Imported lead: ${newLead.name} (${newLead.email}) - ID: ${newLead._id}`);
      imported++;
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`Imported: ${imported}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total processed: ${metaLeads.length}`);

    // Update form lead count
    const totalLeads = await Lead.countDocuments({ 'metadata.form_id': form.form_id });
    await FacebookLeadForm.updateOne(
      { _id: form._id },
      { $set: { lead_count: totalLeads } }
    );
    console.log(`\n✅ Updated form lead_count to ${totalLeads}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

importMissingLeads();