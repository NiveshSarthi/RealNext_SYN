const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SUPER_ADMIN_ID = '67ba9872e4142d76ee178051'; // Updated from previous verification

const generateToken = (userId, isSuperAdmin = false) => {
    return jwt.sign(
        { id: userId, is_super_admin: isSuperAdmin },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
};

const testRoutes = async () => {
    const token = generateToken(SUPER_ADMIN_ID, true);
    const headers = { 'Authorization': `Bearer ${token}` };

    const routes = [
        '/team',
        '/client/profile',
        '/client/users',
        '/client/subscription',
        '/client/stats',
        '/analytics/dashboard',
        '/roles',
        '/network',
        '/subscription/current'
    ];

    console.log('Testing Core Routes for Super Admin (No Client ID)...');

    for (const route of routes) {
        try {
            const response = await axios.get(`${API_URL}${route}`, { headers });
            console.log(`✅ ${route}: Success (${response.status})`);
        } catch (error) {
            console.error(`❌ ${route}: Failed (${error.response?.status}) - ${JSON.stringify(error.response?.data || error.message)}`);
        }
    }

    console.log('\nTesting Blocked Operations for Super Admin (No Client ID)...');

    // Test a POST route that should be blocked without client context
    try {
        await axios.post(`${API_URL}/team/invite`, { email: 'test@example.com', name: 'Test' }, { headers });
        console.log('❌ /team/invite: Unexpected Success (Should have failed)');
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ /team/invite: Correctly Blocked (400 Bad Request)');
        } else {
            console.error(`❌ /team/invite: Failed with unexpected status (${error.response?.status})`);
        }
    }
};

testRoutes();
