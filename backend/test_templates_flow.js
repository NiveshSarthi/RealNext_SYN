const http = require('http');

// Helper to make requests
function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: body, headers: res.headers });
            });
        });

        req.on('error', (e) => reject(e));

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

(async () => {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginData = JSON.stringify({
            email: 'admin@realnext.com',
            password: 'RealnextAdmin2024!debug'
        });

        const loginRes = await makeRequest({
            hostname: 'localhost',
            port: 5062,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        }, loginData);

        console.log(`Login Status: ${loginRes.statusCode}`);
        if (loginRes.statusCode !== 200) {
            console.error('Login failed:', loginRes.body);
            return;
        }

        const token = JSON.parse(loginRes.body).accessToken;
        console.log('Token received.');

        // 2. Get Templates
        console.log('Fetching templates...');
        const templatesRes = await makeRequest({
            hostname: 'localhost',
            port: 5062,
            path: '/api/templates',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Templates Status: ${templatesRes.statusCode}`);
        // console.log('Templates Body:', templatesRes.body.substring(0, 200) + '...');

    } catch (err) {
        console.error('Error:', err);
    }
})();
