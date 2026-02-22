const axios = require('axios');

async function testWfbCampaign() {
    const baseURL = 'https://wfbbackend.niveshsarthi.com';
    const email = 'ratnaker@gmail.com';
    const password = '123';

    try {
        console.log('Logging into WFB...');
        const loginRes = await axios.post(`${baseURL}/auth/login`, { email, password });
        const token = loginRes.data.access_token;
        console.log('Login Success. Token acquired.');

        const api = axios.create({
            baseURL,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Test with INVALID template_name
        console.log('Testing with INVALID template_name...');
        const payload4 = {
            template_name: 'THIS_TEMPLATE_DOES_NOT_EXIST_XYZ_123',
            language_code: 'en_US',
            contact_ids: ['699a9354cb46ffb55f5bafc9'],
            variable_mapping: {}
        };

        try {
            const res4 = await api.post('/api/v1/campaigns', payload4);
            console.log('invalid template_name Result:', res4.data);
        } catch (e) {
            console.log('invalid template_name Error:', e.response?.status, JSON.stringify(e.response?.data));
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response?.data) console.error('Response:', error.response.data);
    }
}

testWfbCampaign();
