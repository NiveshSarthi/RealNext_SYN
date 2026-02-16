const http = require('http');

console.log('🔐 LOGGING IN TO GET FRESH TOKEN...\n');

const loginData = JSON.stringify({
    email: 'admin@testcompany.com',
    password: 'Test123!'
});

const options = {
    hostname: 'localhost',
    port: 5059,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Status: ${res.statusCode}\n`);
        try {
            const result = JSON.parse(data);
            if (result.access_token) {
                console.log('✅ LOGIN SUCCESSFUL!\n');
                console.log('Access Token:');
                console.log(result.access_token);
                console.log('\nSave this token and use it for API calls.');
                
                // Save token to file for reuse
                const fs = require('fs');
                fs.writeFileSync('fresh_token.json', JSON.stringify({
                    access_token: result.access_token,
                    refresh_token: result.refresh_token,
                    timestamp: new Date().toISOString()
                }, null, 2));
                console.log('\n💾 Token saved to fresh_token.json');
            } else {
                console.log('❌ Login failed:');
                console.log(JSON.stringify(result, null, 2));
            }
        } catch (e) {
            console.log('Raw response:');
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
});

req.write(loginData);
req.end();
