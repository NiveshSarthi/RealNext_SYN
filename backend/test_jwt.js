const axios = require('axios');
const jwt = require('jsonwebtoken');

async function debugAuth() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5062/api/auth/login', {
            email: 'testclient@realnext.com',
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        console.log('Token Payload:', jwt.decode(token));
    } catch (e) {
        console.log('Error:', e.response?.status, e.response?.data || e.message);
    }
}
debugAuth();
