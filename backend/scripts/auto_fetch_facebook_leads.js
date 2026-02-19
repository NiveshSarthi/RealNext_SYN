const mongoose = require('mongoose');
const axios = require('axios');
const { FacebookPageConnection, FacebookLeadForm, Lead } = require('../models');

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

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

    // Check each pattern
    Object.keys(patterns).forEach(fieldType => {
      if (extracted[fieldType] === null) {
        const fieldPatterns = patterns[fieldType];
        const matches = fieldPatterns.some(pattern => pattern.test(key));
        if (matches) {
          extracted[fieldType] = value;
        }
      }
    });
  });

  return extracted;
}

async function autoFetchFacebookLeads() {
  const timeout = 90 * 1000; // 90 seconds timeout (reasonable for 2-minute intervals)
  const startTime = Date.now();

  try {
    console.log('🔄 [AUTO-FETCH] Starting Facebook leads fetch...');

    // Check if mongoose is already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('🔌 [AUTO-FETCH] Connecting to database...');
      await Promise.race([
        mongoose.connect('mongodb://root:CjmqvpwJAzemm4CcpcpCohYym9kp9wh8pDPnR6A8aTSP8sAjcXBi8x6ayEU3DfbV@72.61.248.175:5448/?directConnection=true'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database connection timeout')), 15000)
        )
      ]);
    }

    // Get all pages with lead sync enabled
    const enabledPages = await FacebookPageConnection.find({
      is_lead_sync_enabled: true,
      status: 'active'
    });

    console.log(`📊 [AUTO-FETCH] Found ${enabledPages.length} pages with lead sync enabled`);

    if (enabledPages.length === 0) {
      console.log('ℹ️ [AUTO-FETCH] No pages have lead sync enabled');
      return;
    }

    // Pre-fetch a system user (Client Owner) for activity logs
    // In a real multi-tenant system, we might look this up per client
    const { User } = require('../models');
    let systemUserId = null;

    // Helper to get system user per client
    const getSystemUser = async (clientId) => {
      try {
        // Find owner or any admin for this client
        const user = await User.findOne({ client_id: clientId, role: { $in: ['owner', 'admin'] } });
        return user ? user._id : null;
      } catch (e) {
        return null;
      }
    };

    let totalLeadsFetched = 0;

    for (const page of enabledPages) {
      try {
        console.log(`🔍 [AUTO-FETCH] Checking page: ${page.page_name}`);

        // Get all forms for this page
        const forms = await FacebookLeadForm.find({
          client_id: page.client_id,
          page_connection_id: page._id
        });

        console.log(`📋 [AUTO-FETCH] Found ${forms.length} forms for ${page.page_name}`);

        for (const form of forms) {
          try {
            // Check if we're approaching timeout
            if (Date.now() - startTime > timeout - 30000) { // 30 second buffer
              console.log(`⏰ [AUTO-FETCH] Approaching timeout, skipping remaining forms for ${page.page_name}`);
              break;
            }

            // Add delay between API calls to prevent rate limiting (1 second between calls)
            if (totalLeadsFetched > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Fetch leads from Facebook with timeout and retry logic
            let response;
            let retryCount = 0;
            const maxRetries = 2;

            while (retryCount <= maxRetries) {
              try {
                response = await Promise.race([
                  axios.get(`${GRAPH_API_URL}/${form.form_id}/leads`, {
                    params: {
                      access_token: page.access_token,
                      fields: 'id,created_time,field_data,campaign_name,adset_name,ad_name',
                      limit: 50 // Reduced limit to be more conservative
                    },
                    timeout: 20000 // 20 second timeout per request
                  }),
                  new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Facebook API timeout')), 20000)
                  )
                ]);
                break; // Success, exit retry loop
              } catch (apiError) {
                retryCount++;
                if (retryCount <= maxRetries) {
                  console.log(`⚠️ [AUTO-FETCH] API call failed, retrying (${retryCount}/${maxRetries})...`);
                  await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
                } else {
                  console.error(`❌ [AUTO-FETCH] API call failed after ${maxRetries} retries:`, apiError.message);
                  break;
                }
              }
            }

            if (!response) continue; // Skip this form if all retries failed

            const leads = response.data.data || [];
            console.log(`📥 [AUTO-FETCH] Fetched ${leads.length} leads from form: ${form.name}`);

            for (const fbLead of leads) {
              // Check if lead already exists
              const existingLead = await Lead.findOne({
                client_id: page.client_id,
                'metadata.facebook_lead_id': fbLead.id
              });

              if (existingLead) {
                // Update if newer
                const fbTime = new Date(fbLead.created_time);
                const existingTime = existingLead.created_at;

                if (fbTime > existingTime) {
                  console.log(`🔄 [AUTO-FETCH] Updating existing lead: ${existingLead.name}`);
                  // Update logic here if needed
                }
                continue;
              }

              // Extract fields
              const fieldData = fbLead.field_data || [];
              const extractedFields = extractLeadFields(fieldData);

              console.log(`⚠️ [AUTO-FETCH] Skipping lead ${fbLead.id} - no phone or email`);
              continue;
            }

            // Get valid user ID for activity log
            const systemUserId = await getSystemUser(page.client_id);
            if (!systemUserId) {
              console.error(`❌ [AUTO-FETCH] Could not find system user for client ${page.client_id}`);
              continue;
            }

            // Create new lead
            const newLead = await Lead.create({
              client_id: page.client_id,
              name: extractedFields.name || 'Facebook Lead',
              email: extractedFields.email,
              phone: extractedFields.phone,
              location: extractedFields.location,
              source: 'Facebook Ads',
              status: 'Uncontacted',
              stage: 'Screening',
              campaign_name: fbLead.campaign_name,
              form_name: form.name,
              metadata: {
                facebook_lead_id: fbLead.id,
                form_id: form.form_id,
                page_id: page.page_id,
                adset_name: fbLead.adset_name,
                ad_name: fbLead.ad_name,
                created_time: fbLead.created_time,
                field_data: fieldData,
                auto_fetched_at: new Date()
              },
              activity_logs: [{
                type: 'creation',
                content: 'Lead auto-fetched from Facebook',
                user_id: systemUserId, // System/Owner
                created_at: new Date()
              }]
            });

            console.log(`✅ [AUTO-FETCH] Created lead: ${newLead.name} (${newLead.email || newLead.phone})`);
            totalLeadsFetched++;

            // Update form lead count
            await FacebookLeadForm.updateOne(
              { _id: form._id },
              {
                $inc: { lead_count: 1 },
                $set: { last_lead_fetched_at: new Date() }
              }
            );
          }

          } catch (formError) {
          console.error(`❌ [AUTO-FETCH] Error fetching from form ${form.name}:`, formError.message);
        }
      }

      } catch (pageError) {
      console.error(`❌ [AUTO-FETCH] Error processing page ${page.page_name}:`, pageError.message);
    }
  }

    console.log(`🎉 [AUTO-FETCH] Completed! Fetched ${totalLeadsFetched} new leads total`);

} catch (error) {
  console.error('❌ [AUTO-FETCH] Fatal error:', error.message);
} finally {
  // Only disconnect if we connected in this function
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}
}

// Run if called directly
if (require.main === module) {
  autoFetchFacebookLeads();
}

module.exports = { autoFetchFacebookLeads };