const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login for ratification...');
        const res = await axios.post('http://localhost:5062/api/auth/login', {
            email: 'testclient@realnext.com',
            password: 'password123'
        });
        console.log('Success:', res.data);
    } catch (e) {
        console.log('Error:', e.response?.data || e.message);
    }
}
testLogin();
