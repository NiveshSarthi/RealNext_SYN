/**
 * Live API invite test — hits testbd.realnext.in/api/team/invite
 * Usage: node scripts/test_live_invite.js <auth_token>
 */
const https = require('https');

const TOKEN = process.argv[2];
if (!TOKEN) {
    console.error('Usage: node scripts/test_live_invite.js <jwt_token>');
    console.error('Get your token from browser DevTools → Network → any request → Authorization header');
    process.exit(1);
}

const body = JSON.stringify({
    email: 'Ratnakerkumar56@gmail.com',
    name: 'Ratnakerkumar',
    role: 'user'
});

const options = {
    hostname: 'testbd.realnext.in',
    port: 443,
    path: '/api/team/invite',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${TOKEN}`
    }
};

console.log('Hitting: POST https://testbd.realnext.in/api/team/invite');

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
            const json = JSON.parse(data);
            console.log('Response:', JSON.stringify(json, null, 2));
            if (json.data?.email_sent !== undefined) {
                console.log('\n--- EMAIL STATUS ---');
                console.log('email_sent:', json.data.email_sent);
                console.log('email_error:', json.data.email_error || 'none');
                console.log('message:', json.data.message);
            }
        } catch {
            console.log('Raw response:', data);
        }
    });
});
req.on('error', e => console.error('Request failed:', e.message));
req.write(body);
req.end();
