const axios = require('axios');
const https = require('https');

async function test() {
    try {
        console.log('Testing without custom agent...');
        const res1 = await axios.get('https://wfb.backend.niveshsarthi.com/health', { timeout: 5000 });
        console.log('Res1:', res1.status);
    } catch (e) {
        console.log('Error 1:', e.message);
    }

    try {
        console.log('Testing with rejectUnauthorized: false...');
        const agent = new https.Agent({ rejectUnauthorized: false });
        const res2 = await axios.get('https://wfb.backend.niveshsarthi.com/health', { httpsAgent: agent, timeout: 5000 });
        console.log('Res2:', res2.status);
    } catch (e) {
        console.log('Error 2:', e.message);
    }
}

test();
