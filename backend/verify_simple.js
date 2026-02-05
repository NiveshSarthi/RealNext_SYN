const axios = require('axios');

async function check() {
    try {
        await axios.post('http://localhost:5001/api/auth/login', {
            email: 'tenant-user@testcompany.com',
            password: 'Test123!'
        });
        console.log('LOGIN SUCCESS');
    } catch (e) {
        console.log('LOGIN FAILED: ' + (e.response ? e.response.status : e.message));
        if (e.response && e.response.data) {
            console.log('REASON: ' + JSON.stringify(e.response.data));
        }
    }
}
check();
