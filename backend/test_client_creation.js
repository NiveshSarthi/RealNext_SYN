const axios = require('axios');

async function run() {
    try {
        console.log('Logging in as superadmin...');
        // Login first to get a token
        const loginRes = await axios.post('http://127.0.0.1:5062/api/auth/login', {
            email: 'admin@realnext.com',
            password: 'RealnextAdmin2024!debug'
        });
        const accessToken = loginRes.data.data?.token || loginRes.data.token || loginRes.data.access_token;
        console.log('Login successful. Token acquired.');

        console.log('Attempting to create a client...');
        const createRes = await axios.post('http://127.0.0.1:5062/api/admin/clients', {
            name: 'Test Client User',
            email: 'testclient_' + Date.now() + '@example.com',
            password: 'password123',
            phone: '1234567890',
            company_name: 'Test Client Inc'
        }, {
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        });

        console.log('Client Created Successfully:', createRes.data);
    } catch (e) {
        console.error('Error during client creation test:');
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Data:', JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }
}

run();
