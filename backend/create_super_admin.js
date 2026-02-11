require('dotenv').config();
const mongoose = require('mongoose');
const { testConnection } = require('./config/database');
const { User } = require('./models');

async function createSuperAdmin() {
    try {
        console.log('Creating super admin...');
        await testConnection();

        const adminEmail = 'admin@realnext.com';
        const adminPass = 'RealnextAdmin2024!debug ';

        const existing = await User.findOne({ email: adminEmail });
        if (existing) {
            console.log('Super admin already exists');
            return;
        }

        const user = await User.create({
            email: adminEmail,
            password_hash: adminPass, // Will be hashed by hook
            name: 'Super Admin',
            is_super_admin: true,
            status: 'active',
            email_verified: true
        });

        console.log(`Super admin created: ${user._id}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createSuperAdmin();