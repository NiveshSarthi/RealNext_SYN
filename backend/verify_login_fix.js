const axios = require('axios');

async function verifyLogin() {
    try {
        console.log('Attempting login with tenant-user@testcompany.com...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'tenant-user@testcompany.com',
            password: 'Test123!'
        });
        console.log('SUCCESS! Status:', response.status);
        console.log('User:', response.data.data.user.email);
    } catch (error) {
        if (error.response) {
            console.log('FAILED. Status:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
            console.log('Headers:', error.response.headers); // Check for rate limit headers
        } else {
            console.log('Error:', error.message);
        }
    }
}

verifyLogin();
