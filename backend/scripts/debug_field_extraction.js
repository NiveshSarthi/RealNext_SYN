const mongoose = require('mongoose');
const axios = require('axios');
const { FacebookPageConnection, FacebookLeadForm } = require('../models');

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

// Test field extraction with real data
async function debugFieldExtraction() {
  try {
    console.log('🔍 [DEBUG] Starting field extraction debug...');

    // Connect to database
    await mongoose.connect('mongodb://root:CjmqvpwJAzemm4CcpcpCohYym9kp9wh8pDPnR6A8aTSP8sAjcXBi8x6ayEU3DfbV@72.61.248.175:5448/?directConnection=true');

    // Get enabled pages
    const enabledPages = await FacebookPageConnection.find({
      is_lead_sync_enabled: true,
      status: 'active'
    });

    if (enabledPages.length === 0) {
      console.log('ℹ️ [DEBUG] No pages have lead sync enabled');
      return;
    }

    for (const page of enabledPages) {
      console.log(`📄 [DEBUG] Checking page: ${page.page_name}`);

      // Get forms for this page
      const forms = await FacebookLeadForm.find({
        client_id: page.client_id,
        page_connection_id: page._id
      });

      for (const form of forms) {
        console.log(`📋 [DEBUG] Checking form: ${form.name} (${form.form_id})`);

        try {
          // Fetch a few leads to examine field structure
          const response = await axios.get(`${GRAPH_API_URL}/${form.form_id}/leads`, {
            params: {
              access_token: page.access_token,
              fields: 'id,created_time,field_data,campaign_name,adset_name,ad_name',
              limit: 3 // Just a few for debugging
            },
            timeout: 20000
          });

          const leads = response.data.data || [];
          console.log(`📥 [DEBUG] Fetched ${leads.length} leads from ${form.name}`);

          leads.forEach((lead, index) => {
            console.log(`\n--- Lead ${index + 1} ---`);
            console.log(`ID: ${lead.id}`);
            console.log(`Created: ${lead.created_time}`);
            console.log('Field Data:');
            console.log(JSON.stringify(lead.field_data, null, 2));

            // Test extraction
            const extracted = extractLeadFields(lead.field_data || []);
            console.log('Extracted Fields:');
            console.log(JSON.stringify(extracted, null, 2));
            console.log('--- End Lead ---\n');
          });

        } catch (formError) {
          console.error(`❌ [DEBUG] Error fetching from form ${form.name}:`, formError.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ [DEBUG] Fatal error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Copy of the extraction function for testing
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
      /location/i
    ],
    budget: [
      /^budget$/i,
      /^price\s*range$/i,
      /^amount$/i,
      /budget/i
    ]
  };

  // Extract fields
  fieldData.forEach(field => {
    const key = field.name?.toLowerCase() || '';
    const value = field.values?.[0] || '';

    console.log(`[EXTRACT] Checking field: "${field.name}" = "${value}"`);

    // Check each pattern
    Object.keys(patterns).forEach(fieldType => {
      if (extracted[fieldType] === null) {
        const fieldPatterns = patterns[fieldType];
        const matches = fieldPatterns.some(pattern => pattern.test(key));
        if (matches) {
          console.log(`[EXTRACT] Matched ${fieldType}: "${field.name}" -> "${value}"`);
          extracted[fieldType] = value;
        }
      }
    });
  });

  return extracted;
}

// Run if called directly
if (require.main === module) {
  debugFieldExtraction();
}

module.exports = { debugFieldExtraction };