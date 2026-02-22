const axios = require('axios');
const mongoose = require('mongoose');
const { User, ClientUser } = require('../models');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });
const fs = require('fs');

async function testCampaignCreation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const testUser = await User.findOne({ email: 'testclient@realnext.com' });

        if (!testUser) {
            fs.writeFileSync('campaign_test_log.txt', 'No test user found.\n');
            process.exit(0);
        }

        const clientUser = await ClientUser.findOne({ user_id: testUser._id });
        const token = jwt.sign(
            { id: testUser._id.toString(), email: testUser.email, role: clientUser.role, client_id: clientUser.client_id.toString() },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1h' }
        );

        const payload = {
            name: 'sdf',
            type: 'broadcast',
            template_name: 'antigravity_debug_v1',
            template_data: {
                language_code: 'en_US',
                variable_mapping: {}
            },
            target_audience: {
                include: ["invalid_contact_id_for_testing"]
            },
            scheduled_at: null,
            metadata: {
                audience_type: 'manual'
            }
        };

        const response = await axios.post('http://127.0.0.1:5062/api/campaigns', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        fs.writeFileSync('campaign_test_log.txt', `SUCCESS: ${response.status}\n${JSON.stringify(response.data, null, 2)}\n`);

    } catch (error) {
        fs.writeFileSync('campaign_test_log.txt', `FAILED: ${error.response?.status}\n${JSON.stringify(error.response?.data || error.message, null, 2)}\n`);
    } finally {
        process.exit(0);
    }
}

testCampaignCreation();
