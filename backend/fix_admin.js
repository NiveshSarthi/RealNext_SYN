const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function fixSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase();
        const adminPass = process.env.SUPER_ADMIN_PASSWORD.trim();

        console.log(`Searching for super admin: ${adminEmail}`);
        const admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Found super admin. Updating password...');
            admin.password_hash = adminPass; // pre-save hook will hash it
            await admin.save();
            console.log('Super admin password updated successfully (trimmed).');
        } else {
            console.log('Super admin not found. It should be seeded by server.js on next start.');
        }

        const allUsers = await User.find({}, 'email');
        console.log('Current users in DB:', allUsers.map(u => u.email));

        await mongoose.disconnect();
        console.log('Disconnected');
    } catch (error) {
        console.error('Error:', error);
    }
}

fixSuperAdmin();
