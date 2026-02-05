require('dotenv').config();
const axios = require('axios');

async function testAuthFlow() {
    const API_URL = 'http://localhost:5000/api';
    const email = 'tenant-admin@testcompany.com';
    const password = 'password123';

    try {
        console.log('=== STEP 1: LOGIN ===');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });

        console.log('✅ Login successful');
        const token = loginRes.data.data.token;
        console.log(`Token (first 50 chars): ${token.substring(0, 50)}...`);

        // Decode JWT payload
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('\n📋 JWT Payload:');
        console.log(JSON.stringify(payload, null, 2));

        console.log('\n=== STEP 2: TEST META-ADS/CONNECT ===');
        try {
            const connectRes = await axios.post(
                `${API_URL}/meta-ads/connect`,
                { user_token: 'test_token_123' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ Connect successful:', connectRes.data);
        } catch (err) {
            console.log('❌ Connect failed:');
            console.log(`   Status: ${err.response?.status}`);
            console.log(`   Error: ${JSON.stringify(err.response?.data, null, 2)}`);

            // Check what the backend received
            console.log('\n🔍 Request headers sent:');
            console.log(`   Authorization: Bearer ${token.substring(0, 30)}...`);
        }

        console.log('\n=== STEP 3: TEST META-ADS/PAGES (GET) ===');
        try {
            const pagesRes = await axios.get(
                `${API_URL}/meta-ads/pages`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ Pages fetch successful:', pagesRes.data);
        } catch (err) {
            console.log('❌ Pages fetch failed:');
            console.log(`   Status: ${err.response?.status}`);
            console.log(`   Error: ${JSON.stringify(err.response?.data, null, 2)}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testAuthFlow();
