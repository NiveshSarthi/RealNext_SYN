require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, TenantUser, Tenant, Subscription } = require('../models');
const authService = require('../services/authService');

async function debugContext() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const email = 'tenant-admin@testcompany.com';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('❌ User not found');
            return;
        }
        console.log(`✅ User found: ${user.id} (${user.email})`);

        // Check TenantUser manually
        const tenantLinks = await TenantUser.findAll({
            where: { user_id: user.id },
            include: [{ model: Tenant, as: 'Tenant' }]
        });

        console.log(`\nFound ${tenantLinks.length} Tenant Links:`);
        tenantLinks.forEach(link => {
            console.log(`- Tenant: ${link.Tenant?.name} (ID: ${link.tenant_id})`);
            console.log(`  Role: ${link.role}, Owner: ${link.is_owner}`);
            console.log(`  Tenant Status: ${link.Tenant?.status}`);
        });

        // Test authService.getUserContext
        console.log('\nTesting authService.getUserContext()...');
        const context = await authService.getUserContext(user);

        console.log('Context Result:');
        console.log(JSON.stringify(context, null, 2));

        if (!context.tenant) {
            console.log('❌ Context MISSING tenant!');
        } else {
            console.log(`✅ Context has tenant: ${context.tenant.id}`);
        }

        if (!context.subscription) {
            console.log('❌ Context MISSING subscription!');
        } else {
            console.log(`✅ Context has subscription: ${context.subscription.id}`);
            console.log(`   Plan: ${context.planCode}`);
            console.log(`   Features: ${JSON.stringify(context.features)}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugContext();
