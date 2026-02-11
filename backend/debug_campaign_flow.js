const axios = require('axios');

const API_URL = 'http://localhost:5006';
const ADMIN_EMAIL = 'client-admin@testcompany.com';
const ADMIN_PASSWORD = 'Test123!';

async function debugCampaignFlow() {
    try {
        console.log('1. Authenticating...');
        const authRes = await axios.post(`${API_URL}/api/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        const token = authRes.data.data.token;
        console.log('   Login successful.');

        console.log('2. Creating Campaign...');
        const payload = {
            name: `Test Campaign ${Date.now()}`,
            type: 'broadcast',
            template_name: 'hello_world',
            template_data: {
                language_code: 'en_US',
                variable_mapping: {}
            },
            target_audience: {
                include: [] // Empty for test to avoid external trigger error blocking us? 
                // Actually, if we want to test creation robustness, we should use empty to just save draft/scheduled.
            },
            scheduled_at: null, // Immediate
            metadata: {
                audience_type: 'all'
            }
        };

        const createRes = await axios.post(`${API_URL}/api/campaigns`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Create Status:', createRes.status);
        console.log('   Created ID:', createRes.data.data._id);

        console.log('3. Listing Campaigns...');
        const listRes = await axios.get(`${API_URL}/api/campaigns?limit=10`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('   List Status:', listRes.status);
        console.log('   Campaigns Count:', listRes.data.data ? listRes.data.data.length : 'N/A');

        if (listRes.data.data && listRes.data.data.length > 0) {
            console.log('   Last Campaign:', listRes.data.data[0].name);
        } else {
            console.log('   WARNING: Campaign list is empty!');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('   Response Status:', error.response.status);
            console.error('   Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

debugCampaignFlow();
