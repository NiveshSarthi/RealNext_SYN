require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, TenantUser, Tenant } = require('../models');

async function checkTenantUserLink() {
    try {
        await sequelize.authenticate();

        const user = await User.findOne({ where: { email: 'tenant-admin@testcompany.com' } });
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);

        const tenantUsers = await TenantUser.findAll({
            where: { user_id: user.id },
            include: [{ model: Tenant, as: 'Tenant' }]
        });

        console.log(`\nFound ${tenantUsers.length} tenant links:`);
        tenantUsers.forEach(tu => {
            console.log(`  - Tenant: ${tu.Tenant.name} (ID: ${tu.tenant_id})`);
            console.log(`    Role: ${tu.role}`);
            console.log(`    Status: ${tu.status}`);
            console.log(`    Tenant Status: ${tu.Tenant.status}`);
        });

        if (tenantUsers.length === 0) {
            console.log('\n❌ NO TENANT LINKS FOUND - This is the problem!');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkTenantUserLink();
