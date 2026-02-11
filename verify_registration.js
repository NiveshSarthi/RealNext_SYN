const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/realnext';
const testData = {
    name: 'Verification User',
    email: 'verify-task-' + Date.now() + '@example.com',
    password: 'Password123!',
    company_name: 'Verification Corp'
};

const verifyRegistrationDefaults = async () => {
    try {
        await mongoose.connect(dbUri);
        console.log('Connected to MongoDB');

        const authService = require('./backend/services/authService');
        const { User, Client } = require('./backend/models/index');

        console.log(`🚀 Simulating registration for: ${testData.email}`);
        const result = await authService.register(testData, { ip: '127.0.0.1', get: () => 'Internal Script' });

        const client = await Client.findById(result.client._id);
        console.log('Client settings found:');
        console.log(JSON.stringify(client.settings, null, 2));

        const expectedAccess = {
            lms: false,
            wa_marketing: false,
            inventory: false
        };

        const actualAccess = client.settings.menu_access;
        let success = true;

        for (const key in expectedAccess) {
            if (actualAccess[key] !== expectedAccess[key]) {
                console.error(`❌ Mismatch for ${key}: expected ${expectedAccess[key]}, got ${actualAccess[key]}`);
                success = false;
            }
        }

        if (success) {
            console.log('✅ Success: Default menu access is correctly restricted.');
        } else {
            console.log('❌ Failure: Default menu access is not restricted as expected.');
        }

        // Cleanup
        await User.deleteOne({ _id: result.user.id });
        await Client.deleteOne({ _id: client._id });
        console.log('🧹 Cleanup complete.');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Fatal Error during verification:', error);
        process.exit(1);
    }
};

verifyRegistrationDefaults();
