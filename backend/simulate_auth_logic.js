const { User } = require('./models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function test() {
    try {
        console.log('Connecting...');
        // Force Sequelize to sync/connect if needed (models usually handle it)

        const email = 'tenant-user@testcompany.com';
        const password = 'Test123!';

        console.log(`Checking user: ${email}`);
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('User NOT found via Sequelize!');
            return;
        }

        console.log('User found via Sequelize.');
        console.log('Stored Hash in User model:', user.password_hash);

        console.log('Running user.validatePassword(password)...');
        const isValid = await user.validatePassword(password);
        console.log('validatePassword result:', isValid);

        console.log('Running direct bcrypt.compare...');
        const directCompare = await bcrypt.compare(password, user.password_hash);
        console.log('Direct compare result:', directCompare);

    } catch (e) {
        console.error('Error:', e);
    }
}

test();
