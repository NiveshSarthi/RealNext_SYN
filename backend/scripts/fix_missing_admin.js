require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Tenant, TenantUser } = require('../models');
const bcrypt = require('bcryptjs');

async function fixMissingAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const email = 'tenant-admin@testcompany.com';
        const password = 'Test123!';
        const companyName = 'Test Company Ltd';

        // 1. Check/Create User
        let user = await User.findOne({ where: { email } });
        if (!user) {
            console.log(`Creating missing user: ${email}`);
            const passwordHash = await bcrypt.hash(password, 10);
            user = await User.create({
                email,
                name: 'Tenant Admin',
                password_hash: passwordHash,
                status: 'active',
                email_verified: true
            });
        } else {
            console.log(`User ${email} already exists.`);
        }

        // 2. Check/Create Tenant
        let tenant = await Tenant.findOne({ where: { name: companyName } });
        if (!tenant) {
            console.log(`Creating missing tenant: ${companyName}`);
            tenant = await Tenant.create({
                name: companyName,
                email: 'info@testcompany.com',
                status: 'active',
                environment: 'production'
            });
        } else {
            console.log(`Tenant ${companyName} found (ID: ${tenant.id}).`);
        }

        // 3. Link User to Tenant as Admin (Owner)
        const tenantUser = await TenantUser.findOne({
            where: { user_id: user.id, tenant_id: tenant.id }
        });

        if (!tenantUser) {
            console.log('Linking user to tenant as Admin...');
            await TenantUser.create({
                tenant_id: tenant.id,
                user_id: user.id,
                role: 'admin',
                is_owner: true
            });
        } else {
            console.log('User is already linked to tenant.');
            if (tenantUser.role !== 'admin') {
                console.log('Updating role to admin...');
                await tenantUser.update({ role: 'admin', is_owner: true });
            }
        }

        console.log('✅ FIXED: tenant-admin@testcompany.com should now be able to login.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixMissingAdmin();
