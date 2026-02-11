const axios = require('axios');

const BASE_URL = 'http://localhost:5006/api';
const SUPER_ADMIN = {
    email: 'admin@realnext.com',
    password: 'RealnextAdmin2024!debug'
};

async function runTest() {
    try {
        console.log('Logging in as super admin...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, SUPER_ADMIN);
        const token = loginRes.data.access_token || loginRes.data.data.access_token;
        console.log('✅ Login successful');

        const authConfig = {
            headers: { Authorization: `Bearer ${token}` }
        };

        console.log('Fetching clients...');
        const clientsRes = await axios.get(`${BASE_URL}/admin/clients`, authConfig);
        const clients = clientsRes.data.data;
        if (clients.length === 0) {
            console.log('No clients found');
            return;
        }

        const client = clients[0];
        console.log(`Found client: ${client.name} (ID: ${client.id}, Status: ${client.status})`);

        const newStatus = client.status === 'active' ? 'inactive' : 'active';
        console.log(`Testing status update to: ${newStatus}...`);

        try {
            const updateRes = await axios.put(`${BASE_URL}/admin/clients/${client.id}/override`, {
                status: newStatus
            }, authConfig);
            console.log('✅ API SUCCESS!', updateRes.data);
        } catch (updateError) {
            console.error('❌ API FAILED');
            if (updateError.response) {
                console.error('Status:', updateError.response.status);
                console.error('Data:', JSON.stringify(updateError.response.data, null, 2));
            } else {
                console.error('Error:', updateError.message);
            }
        }

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

runTest();
