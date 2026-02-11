require('dotenv').config();
const mongoose = require('mongoose');
const { testConnection } = require('../config/database');
const { User, Tenant, TenantUser, Partner, PartnerUser, Role, Permission, Plan, Feature, PlanFeature } = require('../models');
const logger = require('../config/logger');

async function seed() {
    try {
        logger.info('Starting MongoDB Seeding...');
        await testConnection();

        // 1. Initial Permissions
        const permissions = [
            { code: 'leads:read', name: 'Read Leads', category: 'leads', is_system: true },
            { code: 'leads:write', name: 'Write Leads', category: 'leads', is_system: true },
            { code: 'campaigns:read', name: 'Read Campaigns', category: 'marketing', is_system: true },
            { code: 'campaigns:write', name: 'Write Campaigns', category: 'marketing', is_system: true },
            { code: 'team:manage', name: 'Manage Team', category: 'team', is_system: true },
            { code: 'settings:manage', name: 'Manage Settings', category: 'settings', is_system: true }
        ];

        for (const perm of permissions) {
            await Permission.findOneAndUpdate({ code: perm.code }, perm, { upsert: true });
        }
        logger.info('Permissions seeded');

        // 2. Initial Roles
        const systemRoles = [
            { name: 'Admin', description: 'Full access', permissions: ['*'], is_system: true, is_default: false },
            { name: 'Manager', description: 'Can manage team and leads', permissions: ['leads:*', 'team:manage'], is_system: true, is_default: false },
            { name: 'User', description: 'Regular user access', permissions: ['leads:read'], is_system: true, is_default: true }
        ];

        for (const role of systemRoles) {
            await Role.findOneAndUpdate({ name: role.name, tenant_id: null }, role, { upsert: true });
        }
        logger.info('System roles seeded');

        // 3. Initial Features
        const features = [
            { code: 'leads', name: 'Lead Management', category: 'core', is_core: true },
            { code: 'campaigns', name: 'WhatsApp Campaigns', category: 'marketing' },
            { code: 'workflows', name: 'Automation Workflows', category: 'automation' },
            { code: 'analytics', name: 'Advanced Analytics', category: 'core' }
        ];

        for (const feat of features) {
            await Feature.findOneAndUpdate({ code: feat.code }, feat, { upsert: true });
        }
        logger.info('Features seeded');

        // 4. Plans
        const plans = [
            { code: 'starter', name: 'Starter Plan', price_monthly: 0, trial_days: 14, is_active: true, is_public: true },
            { code: 'pro', name: 'Professional Plan', price_monthly: 999, trial_days: 14, is_active: true, is_public: true }
        ];

        for (const planData of plans) {
            const plan = await Plan.findOneAndUpdate({ code: planData.code }, planData, { upsert: true, new: true });

            // Link features to Pro plan
            if (plan.code === 'pro') {
                const allFeatures = await Feature.find();
                for (const f of allFeatures) {
                    await PlanFeature.findOneAndUpdate(
                        { plan_id: plan._id, feature_id: f._id },
                        { is_enabled: true },
                        { upsert: true }
                    );
                }
            }
        }
        logger.info('Plans and plan features seeded');

        // 5. Test Users (Same as in server.js but manually triggered here)
        const adminEmail = 'admin@realnext.com';
        const adminPass = 'RealnextAdmin2024!debug ';

        logger.info(`Checking for user: ${adminEmail}`);
        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            logger.info('Seeding Super Admin...');
            admin = await User.create({
                email: adminEmail,
                password_hash: adminPass,
                name: 'Super Admin',
                is_super_admin: true,
                status: 'active',
                email_verified: true
            });
            logger.info('Super Admin created');

            const tenant = await Tenant.create({
                name: 'RealNext Admin',
                email: adminEmail,
                status: 'active',
                environment: 'production'
            });

            await TenantUser.create({
                tenant_id: tenant._id,
                user_id: admin._id,
                role: 'admin',
                is_owner: true
            });
            logger.info('Super Admin seeded');
        } else {
            logger.info('Super Admin already exists, updating password...');
            admin.password_hash = adminPass;
            await admin.save();
            logger.info('Super Admin password updated');
        }

        const allUsers = await User.find({}, 'email name is_super_admin');
        logger.info('Current Users in DB:');
        console.log(JSON.stringify(allUsers, null, 2));

        logger.info('Seeding Complete!');
        process.exit(0);
    } catch (error) {
        logger.error('Seeding failed at some point:');
        console.error(error);
        process.exit(1);
    }
}

seed();
