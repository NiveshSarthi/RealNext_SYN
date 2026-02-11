
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();
const { jwt: jwtConfig } = require('../config/jwt');
const { User, Client } = require('../models');
const { testConnection } = require('../config/database');

async function verify() {
    await testConnection();

    // 1. Get a Super Admin
    const superAdmin = await User.findOne({ is_super_admin: true });
    if (!superAdmin) {
        console.error('No Super Admin found in DB!');
        return;
    }
    console.log(`Found Super Admin: ${superAdmin.email}`);

    // 2. Generate a Token
    const token = jwt.sign({ sub: superAdmin._id }, jwtConfig.accessSecret, { expiresIn: '1h' });
    console.log('Generated Token for Super Admin');

    // 3. Get a random client
    const client = await Client.findOne();
    if (!client) {
        console.error('No Client found in DB!');
        return;
    }
    console.log(`Testing with Client: ${client.name} (ID: ${client._id})`);

    // 4. Call an API with x-client-id
    const axios = require('axios');
    const port = process.env.PORT || 5006;
    const baseUrl = `http://localhost:${port}/api`;

    try {
        console.log(`Calling GET /meta-ads/pages with x-client-id...`);
        const res = await axios.get(`${baseUrl}/meta-ads/pages`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-client-id': client._id.toString()
            }
        });
        console.log('Success! Pages:', res.data.data?.length || 0);
        console.log('Response Status:', res.status);
    } catch (error) {
        console.error('API Call Failed:');
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    }

    process.exit();
}

verify();
