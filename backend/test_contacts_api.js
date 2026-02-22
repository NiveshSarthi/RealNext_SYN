const axios = require('axios');

async function testContactsAPI() {
    try {
        console.log('Logging in as testclient...');
        const loginRes = await axios.post('http://localhost:5062/api/auth/login', {
            email: 'testclient@realnext.com',
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        console.log('Login successful.');

        console.log('\nFetching /api/wa-marketing/contacts...');
        const res = await axios.get('http://localhost:5062/api/wa-marketing/contacts', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Success Contacts API! Status:', res.status);
        console.log('Response Data:', res.data);

        console.log('\nFetching /api/wa-marketing/conversations...');
        const res2 = await axios.get('http://localhost:5062/api/wa-marketing/conversations', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Success Conversations API! Status:', res2.status);
        console.log('Response Data:', res2.data);

    } catch(e) {
        console.log('Error caught:');
        console.log('Message:', e.message);
        if (e.response) {
            console.log('Status:', e.response.status);
            console.log('Data:', e.response.data);
        }
    }
}
testContactsAPI();
