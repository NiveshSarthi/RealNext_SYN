const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5006';
const ADMIN_EMAIL = 'client-admin@testcompany.com';
const ADMIN_PASSWORD = 'Test123!';

function log(message) {
    console.log(message);
    fs.appendFileSync('debug_output.txt', message + '\n');
}

async function debugCampaignFlow() {
    try {
        if (fs.existsSync('debug_output.txt')) fs.unlinkSync('debug_output.txt');

        log('1. Authenticating...');
        const authRes = await axios.post(`${API_URL}/api/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        const token = authRes.data.data.token;
        log('   Login successful.');

        log('1.5. Fetching Leads...');
        let leadsRes = await axios.get(`${API_URL}/api/leads?limit=5`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        let leads = leadsRes.data.data || [];
        log(`   Found ${leads.length} leads.`);

        if (leads.length === 0) {
            log('   No leads found. Creating a test lead...');
            try {
                const leadPayload = {
                    name: "Test User",
                    phone: "919876543210",
                    email: "test@example.com",
                    source: "manual"
                };
                const leadCreateRes = await axios.post(`${API_URL}/api/leads`, leadPayload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                log('   Created Test Lead ID: ' + leadCreateRes.data.data._id);
                leads = [leadCreateRes.data.data];
            } catch (leadError) {
                log('   Failed to create test lead: ' + leadError.message);
                if (leadError.response) log('   Lead Error Data: ' + JSON.stringify(leadError.response.data));
            }
        }

        const contactIds = leads.map(l => l._id);

        if (contactIds.length > 0) {
            log('2. Creating Campaign with ' + contactIds.length + ' Leads...');
            const payload = {
                name: `Test Campaign ${Date.now()}`,
                type: 'broadcast',
                template_name: 'hello_world',
                template_data: {
                    language_code: 'en_US',
                    variable_mapping: {}
                },
                target_audience: {
                    include: contactIds
                },
                scheduled_at: null, // Immediate
                metadata: {
                    audience_type: 'all'
                }
            };

            const createRes = await axios.post(`${API_URL}/api/campaigns`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            log('   Create Status: ' + createRes.status);
            log('   Created Campaign: ' + JSON.stringify(createRes.data.data, null, 2));
        } else {
            log('   Skipping creation because no leads available.');
        }

    } catch (error) {
        log('Error: ' + error.message);
        if (error.response) {
            log('   Response Status: ' + error.response.status);
            log('   Response Data: ' + JSON.stringify(error.response.data, null, 2));
        }
    }
}

debugCampaignFlow();
