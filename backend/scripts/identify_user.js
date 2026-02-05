require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, TenantUser, Tenant } = require('../models');

async function identifyUser() {
    try {
        await sequelize.authenticate();
        const userId = 'fce51d19-f0e9-4292-95f9-b5f87070882a';

        console.log(`Looking up User ID: ${userId}`);
        const user = await User.findByPk(userId);

        if (user) {
            console.log(`✅ FOUND USER: ${user.email} (${user.name})`);
            console.log(`   Status: ${user.status}`);
            console.log(`   Is Super Admin: ${user.is_super_admin}`);

            const tenantUser = await TenantUser.findOne({
                where: { user_id: user.id },
                include: [{ model: Tenant, as: 'Tenant' }]
            });

            if (tenantUser) {
                console.log(`   ✅ Linked Tenant: ${tenantUser.Tenant.name} (ID: ${tenantUser.tenant_id})`);
                console.log(`      Role: ${tenantUser.role}`);

                if (tenantUser.Tenant.status !== 'active') {
                    console.log(`      ❌ TENANT IS NOT ACTIVE: ${tenantUser.Tenant.status}`);
                }
            } else {
                console.log(`   ❌ NO TENANT LINK FOUND!`);
            }

        } else {
            console.log('❌ User NOT found in database.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

identifyUser();
