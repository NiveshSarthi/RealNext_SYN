require('dotenv').config();
const { sequelize, User } = require('../models');
const logger = require('../config/logger');

const seedSuperAdmin = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection established.');

        // Force sync ALL models to ensure clean state and internal consistency
        // This creates users, tenants, subscriptions, etc. tables
        await sequelize.sync({ force: true });
        logger.info('All database tables recreated.');


        const adminEmail = process.env.SUPER_ADMIN_EMAIL;
        const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            logger.error('SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env');
            process.exit(1);
        }

        const [user, created] = await User.findOrCreate({
            where: { email: adminEmail },
            defaults: {
                name: 'Super Admin',
                email: adminEmail,
                password_hash: adminPassword, // Will be hashed by hooks
                is_super_admin: true,
                status: 'active',
                email_verified: true
            }
        });

        if (created) {
            logger.info(`Super Admin created: ${adminEmail}`);
        } else {
            // Update existing user to ensure they are super admin and have the correct password
            // Note: We need to explicitly hash the password if we are updating it manually without the hook triggering easily
            // But our User model has beforeUpdate hook which hashes if 'password_hash' is changed.

            user.is_super_admin = true;
            user.status = 'active';
            user.password_hash = adminPassword; // Triggers hook
            await user.save();
            logger.info(`Super Admin updated: ${adminEmail}`);
        }

        process.exit(0);
    } catch (error) {
        logger.error('Failed to seed Super Admin:', error);
        process.exit(1);
    }
};

seedSuperAdmin();
