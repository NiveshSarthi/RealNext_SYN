const { User } = require('./models');
require('dotenv').config();

async function reset() {
    try {
        const email = 'tenant-user@testcompany.com';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User found. Updating password via Sequelize...');

        // Update password - hooks should run if set up correctly
        user.password_hash = 'Test123!';
        // Note: The hook checks if 'password_hash' changed using .changed().
        await user.save();

        console.log('Password updated successfully via Sequelize.');
        console.log('New Hash (from DB object):', user.password_hash);

    } catch (e) {
        console.error('Error:', e);
    }
}

reset();
