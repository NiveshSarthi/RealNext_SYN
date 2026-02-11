
const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
const TOKEN = 'YOUR_SUPER_ADMIN_TOKEN_HERE'; // I need to get this or use a script that generates it

async function testConnect() {
    try {
        console.log('Testing /meta-ads/connect as Super Admin...');
        const res = await axios.post(`${API_URL}/meta-ads/connect`,
            { user_token: 'dummy_token' },
            {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Response:', res.data);
    } catch (error) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
    }
}

// Instead of hardcoding token, let's make a script that uses the internals
