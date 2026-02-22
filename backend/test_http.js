const axios = require('axios');
const http = require('http');

async function testHttp() {
    try {
        console.log('Testing with http:// ...');
        const res = await axios.get('http://wfb.backend.niveshsarthi.com/health', { timeout: 5000 });
        console.log('HTTP Res:', res.status, res.headers);
    } catch (e) {
        console.log('HTTP Error:', e.message);
    }
}
testHttp();
