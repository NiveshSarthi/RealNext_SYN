const axios = require('axios');

const BASE_URL = 'http://localhost:5006/api';

async function testLogin() {
    try {
        console.log('Attempting to login...');
        const credentials = {
            email: "ratnakerkumar56@gmail.com",
            password: "Ratnaker@123"
        };

        const res = await axios.post(`${BASE_URL}/auth/login`, credentials);

        console.log('✅ Login Successful!', res.data);

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.statusText);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Network Error:', error.message);
        }
    }
}

testLogin();
