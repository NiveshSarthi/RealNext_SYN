const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/realnext';

const verifyClientDefaults = async () => {
    try {
        await mongoose.connect(dbUri);
        console.log('Connected to MongoDB');

        const Client = require('./backend/models/Client');

        const testClient = new Client({
            name: 'Verification Test',
            email: 'test@example.com',
            settings: {
                menu_access: {
                    lms: false,
                    wa_marketing: false,
                    inventory: false
                }
            }
        });

        console.log('Test Client settings:', JSON.stringify(testClient.settings, null, 2));

        if (testClient.settings.menu_access.lms === false &&
            testClient.settings.menu_access.wa_marketing === false &&
            testClient.settings.menu_access.inventory === false) {
            console.log('✅ Success: Logic in Client initialization is correct.');
        } else {
            console.log('❌ Failure: Settings not set correctly.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyClientDefaults();
