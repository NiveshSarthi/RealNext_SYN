const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

async function testApi() {
    const baseURL = 'https://wfb.backend.niveshsarthi.com';
    const email = 'ratnaker@gmail.com';
    const password = '123';

    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${baseURL}/auth/login`, { email, password }, { httpsAgent });
        const token = loginRes.data.access_token || loginRes.data.token || loginRes.data.data?.token;
        console.log('Logged in successfully.');

        const api = axios.create({
            baseURL,
            httpsAgent,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Test 1: Current format (v1 campaigns)
        console.log('\n--- Test 1: v1 campaigns (current) ---');
        try {
            const res1 = await api.post('/api/v1/campaigns', {
                name: 'Antigravity Test 1',
                template_name: 'antigravity_debug_v1',
                language_code: 'en_US',
                contact_ids: [],
                variable_mapping: {}
            });
            console.log('Result 1:', res1.data);
        } catch (e) {
            console.log('Fail 1:', e.response?.data || e.message);
        }

        // Test 2: 'language' instead of 'language_code' (v1 campaigns)
        console.log('\n--- Test 2: language instead of language_code (v1) ---');
        try {
            const res2 = await api.post('/api/v1/campaigns', {
                name: 'Antigravity Test 2',
                template_name: 'antigravity_debug_v1',
                language: 'en_US',
                contact_ids: [],
                variable_mapping: {}
            });
            console.log('Result 2:', res2.data);
        } catch (e) {
            console.log('Fail 2:', e.response?.data || e.message);
        }

        // Test 3: Legacy root-level campaigns/send
        console.log('\n--- Test 3: root /campaigns/send ---');
        try {
            const res3 = await api.post('/campaigns/send', {
                name: 'Antigravity Test 3',
                template_name: 'antigravity_debug_v1',
                language: 'en_US',
                contact_ids: [],
                variable_mapping: {}
            });
            console.log('Result 3:', res3.data);
        } catch (e) {
            console.log('Fail 3:', e.response?.data || e.message);
        }

        // Test 4: Check Templates
        console.log('\n--- Checking Templates ---');
        const templatesRes = await api.get('/api/v1/templates');
        const templates = templatesRes.data;
        console.log('Templates Count:', Array.isArray(templates) ? templates.length : 'Not an array');
        if (Array.isArray(templates) && templates.length > 0) {
            console.log('First Template Sample:', JSON.stringify(templates[0], null, 2));
        }

    } catch (e) {
        console.error('Core Error:', e.response?.data || e.message);
    }
}

testApi();
