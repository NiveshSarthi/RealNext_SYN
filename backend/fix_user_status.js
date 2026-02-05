require('dotenv').config();
const { sequelize, User } = require('./models');

async function fixStatus() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const email = 'tenant-user@testcompany.com';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`User found. Current Status: ${user.status}`);

        user.status = 'active';
        await user.save();

        console.log(`User status updated to: ${user.status}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixStatus();
