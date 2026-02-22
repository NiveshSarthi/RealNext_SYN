const express = require('express');
const mongoose = require('mongoose');
const request = require('supertest');
require('dotenv').config();

const adminClientsRoute = require('./routes/admin/clients');
const { User, Client } = require('./models');

const app = express();
app.use(express.json());

// Mock authentication middleware to inject a super admin user
app.use((req, res, next) => {
    req.user = {
        id: new mongoose.Types.ObjectId(), // Fake ID
        email: 'testadmin@realnext.com',
        role: 'admin',
        is_super_admin: true
    };
    next();
});

// Mock requireSuperAdmin middleware if needed (already bypassed by the mock above if the route relies on req.user properly)
// Wait, the route imports its own middleware. We'll mount the route directly, which already has `authenticate` and `requireSuperAdmin`.
// This means our app.use won't bypass the route's OWN middleware if it requires a valid JWT.
// Instead, let's mock the middleware file before requiring the route.

const mockAuth = require('mock-require');
mockAuth('./middleware/auth', {
    authenticate: (req, res, next) => {
        req.user = { id: new mongoose.Types.ObjectId(), role: 'admin', is_super_admin: true };
        next();
    }
});
mockAuth('./middleware/roles', {
    requireSuperAdmin: (req, res, next) => next(),
    requireClientAccess: (req, res, next) => next()
});

const testAdminClientsRoute = require('./routes/admin/clients');
app.use('/api/admin/clients', testAdminClientsRoute);

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to test DB.');

        const res = await request(app)
            .post('/api/admin/clients')
            .send({
                name: 'API Test Sub User',
                email: 'apitest_' + Date.now() + '@example.com',
                password: 'password123',
                phone: '1234567890',
                company_name: 'API Test Inc'
            });

        console.log('API Response Status:', res.status);
        console.log('API Response Body:', res.body);
    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
