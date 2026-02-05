const axios = require('axios');

async function testFullFlow() {
    const API_URL = 'http://localhost:5000/api';
    const email = 'tenant-admin@testcompany.com';
    const password = 'password123';

    try {
        console.log('1. Attempting Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });

        if (loginRes.data.success) {
            console.log('✅ Login Successful');
            const token = loginRes.data.data.token;
            console.log(`   Token: ${token.substring(0, 20)}...`);

            // Decode payload (manual)
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                console.log(`   Detailed Payload:`);
                console.log(`   - sub: ${payload.sub}`);
                console.log(`   - tenant_id: ${payload.tenant_id}`);
                console.log(`   - role: ${payload.tenant_role}`);
            }

            console.log('\n2. Testing Meta Ads Access (Protected Route)...');
            try {
                const featureRes = await axios.get(`${API_URL}/meta-ads/pages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Access Access Granted!');
                console.log('   Data:', featureRes.data);
            } catch (err) {
                console.log('❌ Access Denied / Error:');
                if (err.response) {
                    console.log(`   Status: ${err.response.status}`);
                    console.log(`   Message: ${JSON.stringify(err.response.data)}`);
                } else {
                    console.log('   Error:', err.message);
                }
            }

        } else {
            console.log('❌ Login Failed (Logic Error)');
        }

    } catch (error) {
        console.log('❌ Login Request Failed:');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data: ${JSON.stringify(error.response.data)}`);
        } else {
            console.log('   Error:', error.message);
        }
    }
}

testFullFlow();
