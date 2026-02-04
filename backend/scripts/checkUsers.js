require('dotenv').config();
const db = require('../models');

async function checkUsers() {
    try {
        console.log('Checking existing users in database...\n');

        const users = await db.User.findAll({
            attributes: ['id', 'email', 'name', 'is_super_admin', 'status'],
            include: [
                {
                    model: db.TenantUser,
                    as: 'tenantMemberships',
                    include: [{ model: db.Tenant, as: 'tenant' }]
                },
                {
                    model: db.PartnerUser,
                    as: 'partnerMemberships',
                    include: [{ model: db.Partner, as: 'partner' }]
                }
            ]
        });

        console.log(`Found ${users.length} users:\n`);

        users.forEach(user => {
            console.log(`Email: ${user.email}`);
            console.log(`Name: ${user.name}`);
            console.log(`Super Admin: ${user.is_super_admin}`);
            console.log(`Status: ${user.status}`);

            if (user.tenantMemberships && user.tenantMemberships.length > 0) {
                console.log('Tenant Access:');
                user.tenantMemberships.forEach(tm => {
                    console.log(`  - ${tm.tenant?.name} (${tm.role})`);
                });
            }

            if (user.partnerMemberships && user.partnerMemberships.length > 0) {
                console.log('Partner Access:');
                user.partnerMemberships.forEach(pm => {
                    console.log(`  - ${pm.partner?.name} (${pm.role})`);
                });
            }
            console.log('---\n');
        });

        await db.sequelize.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkUsers();
