const http = require('http');
const app = require('./app'); // Assuming there's an app.js
const mongoose = require('mongoose');
require('dotenv').config();

const port = 5099;

const server = http.createServer(app);

server.listen(port, '127.0.0.1', async () => {
    console.log(`Test server running on port ${port}`);
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // First login
        console.log('Logging in...');
        const loginData = JSON.stringify({ email: 'admin@realnext.com', password: 'password123' });

        const loginOptions = {
            hostname: '127.0.0.1',
            port: port,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        };

        const reqLogin = http.request(loginOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const response = JSON.parse(data);
                console.log('Login status:', res.statusCode);
                if (res.statusCode !== 200) {
                    console.error('Login failed:', data);
                    server.close();
                    mongoose.disconnect();
                    return;
                }
                const token = response.access_token;

                // Now create client
                console.log('Creating client...');
                const clientData = JSON.stringify({
                    name: 'Node HTTP Client User',
                    email: 'nodehttp_' + Date.now() + '@example.com',
                    password: 'password123',
                    phone: '1234567890',
                    company_name: 'Node HTTP Inc'
                });

                const clientOptions = {
                    hostname: '127.0.0.1',
                    port: port,
                    path: '/api/admin/clients',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': clientData.length,
                        'Authorization': 'Bearer ' + token
                    }
                };

                const reqClient = http.request(clientOptions, (clientRes) => {
                    let cData = '';
                    clientRes.on('data', chunk => cData += chunk);
                    clientRes.on('end', () => {
                        console.log('Client create status:', clientRes.statusCode);
                        console.log('Client create response:', cData);

                        server.close();
                        mongoose.disconnect();
                    });
                });

                reqClient.on('error', e => console.error(e));
                reqClient.write(clientData);
                reqClient.end();
            });
        });

        reqLogin.on('error', e => console.error(e));
        reqLogin.write(loginData);
        reqLogin.end();

    } catch (e) {
        console.error('Test error:', e);
        server.close();
    }
});
