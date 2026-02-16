const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function triggerFetch() {
    try {
        console.log('Logging in to get internal token...');
        const loginRes = await axios.post('http://127.0.0.1:5059/api/auth/login', {
            email: 'admin@realnext.com',
            password: 'RealnextAdmin2024!debug '
        });

        const token = loginRes.data.access_token;
        console.log('Login successful. Fetching campaigns...');

        const res = await axios.get('http://127.0.0.1:5059/api/campaigns', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('API Response Status:', res.status);
        console.log('Campaigns count:', res.data.data?.length);
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
}

triggerFetch();
