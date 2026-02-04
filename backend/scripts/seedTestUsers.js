require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../models');

const {
    User,
    Partner,
    PartnerUser,
    Tenant,
    TenantUser,
    Plan,
    Subscription
} = db;

async function seedTestUsers() {
    try {
        console.log('🌱 Starting test user seeding...\n');

        // Get Free Trial plan
        const trialPlan = await Plan.findOne({ where: { code: 'free_trial' } });
        if (!trialPlan) {
            throw new Error('Free Trial plan not found. Run seedPlans.js first!');
        }

        // Hash password for all test users
        const password = 'Test123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        // ============================================
        // 1. SUPER ADMIN (Already exists from migration)
        // ============================================
        console.log('✓ Super Admin already exists');
        console.log('  Email: admin@realnext.com');
        console.log('  Password: RealnextAdmin2024!debug\n');

        // ============================================
        // 2. CREATE PARTNER & PARTNER ADMIN
        // ============================================
        console.log('📦 Creating Partner and Partner Admin...');

        // Create Partner
        const [partner] = await Partner.findOrCreate({
            where: { email: 'partner@acme.com' },
            defaults: {
                name: 'Acme Resellers',
                email: 'partner@acme.com',
                subdomain: 'acme',
                commission_rate: 15.00,
                status: 'active',
                logo_url: null,
                primary_color: '#FF6B35',
                secondary_color: '#004E89'
            }
        });

        console.log(`✓ Partner created: ${partner.name}`);

        // Create Partner Admin User
        const [partnerAdminUser] = await User.findOrCreate({
            where: { email: 'partner-admin@acme.com' },
            defaults: {
                email: 'partner-admin@acme.com',
                name: 'Partner Admin',
                password_hash: hashedPassword,
                status: 'active',
                is_super_admin: false
            }
        });

        // Link Partner Admin to Partner
        await PartnerUser.findOrCreate({
            where: {
                partner_id: partner.id,
                user_id: partnerAdminUser.id
            },
            defaults: {
                partner_id: partner.id,
                user_id: partnerAdminUser.id,
                role: 'admin',
                is_owner: true,
                status: 'active'
            }
        });

        console.log(`✓ Partner Admin created: ${partnerAdminUser.email}\n`);

        // ============================================
        // 3. CREATE TENANT & TENANT ADMIN
        // ============================================
        console.log('🏢 Creating Tenant and Tenant Admin...');

        // Create Tenant
        const [tenant] = await Tenant.findOrCreate({
            where: { email: 'tenant@testcompany.com' },
            defaults: {
                name: 'Test Company Ltd',
                email: 'tenant@testcompany.com',
                phone: '+919876543210',
                slug: 'test-company',
                partner_id: partner.id,
                status: 'active',
                environment: 'production'
            }
        });

        console.log(`✓ Tenant created: ${tenant.name}`);

        // Create Tenant Admin User
        const [tenantAdminUser] = await User.findOrCreate({
            where: { email: 'tenant-admin@testcompany.com' },
            defaults: {
                email: 'tenant-admin@testcompany.com',
                name: 'Tenant Admin',
                password_hash: hashedPassword,
                phone: '+919876543210',
                status: 'active',
                is_super_admin: false
            }
        });

        // Link Tenant Admin to Tenant
        await TenantUser.findOrCreate({
            where: {
                tenant_id: tenant.id,
                user_id: tenantAdminUser.id
            },
            defaults: {
                tenant_id: tenant.id,
                user_id: tenantAdminUser.id,
                role: 'admin',
                is_owner: true,
                status: 'active'
            }
        });

        console.log(`✓ Tenant Admin created: ${tenantAdminUser.email}`);

        // Create Trial Subscription for Tenant
        const [subscription] = await Subscription.findOrCreate({
            where: { tenant_id: tenant.id, status: 'trial' },
            defaults: {
                tenant_id: tenant.id,
                plan_id: trialPlan.id,
                partner_id: partner.id,
                status: 'trial',
                billing_cycle: 'monthly',
                start_date: new Date(),
                trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        console.log(`✓ Trial subscription created for ${tenant.name}\n`);

        // ============================================
        // 4. CREATE TENANT USER (Limited Access)
        // ============================================
        console.log('👤 Creating Tenant User (Limited Access)...');

        // Create Tenant User
        const [tenantUser] = await User.findOrCreate({
            where: { email: 'tenant-user@testcompany.com' },
            defaults: {
                email: 'tenant-user@testcompany.com',
                name: 'Tenant User',
                password_hash: hashedPassword,
                phone: '+919876543211',
                status: 'active',
                is_super_admin: false
            }
        });

        // Link Tenant User to Tenant with limited role
        await TenantUser.findOrCreate({
            where: {
                tenant_id: tenant.id,
                user_id: tenantUser.id
            },
            defaults: {
                tenant_id: tenant.id,
                user_id: tenantUser.id,
                role: 'user', // Not admin
                is_owner: false,
                status: 'active',
                permissions: {
                    leads: ['view', 'create', 'edit'],
                    campaigns: ['view'],
                    workflows: ['view']
                }
            }
        });

        console.log(`✓ Tenant User created: ${tenantUser.email}\n`);

        // ============================================
        // SUMMARY
        // ============================================
        console.log('\n' + '='.repeat(60));
        console.log('✅ TEST USERS SEEDED SUCCESSFULLY!');
        console.log('='.repeat(60) + '\n');

        console.log('📋 LOGIN CREDENTIALS (All passwords: Test123!):\n');

        console.log('1️⃣  SUPER ADMIN');
        console.log('   Email:    admin@realnext.com');
        console.log('   Password: RealnextAdmin2024!debug');
        console.log('   Redirect: /admin');
        console.log('   Access:   Full system access\n');

        console.log('2️⃣  PARTNER ADMIN');
        console.log('   Email:    partner-admin@acme.com');
        console.log('   Password: Test123!');
        console.log('   Redirect: /partner');
        console.log('   Access:   Manage tenants under Acme Resellers\n');

        console.log('3️⃣  TENANT ADMIN');
        console.log('   Email:    tenant-admin@testcompany.com');
        console.log('   Password: Test123!');
        console.log('   Redirect: /dashboard');
        console.log('   Access:   Full access to Test Company tenant\n');

        console.log('4️⃣  TENANT USER (Limited)');
        console.log('   Email:    tenant-user@testcompany.com');
        console.log('   Password: Test123!');
        console.log('   Redirect: /dashboard');
        console.log('   Access:   Limited access (cannot manage settings/team)\n');

        console.log('='.repeat(60));
        console.log('💡 TIP: Use these credentials to test role-based access!');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Error seeding test users:', error);
        throw error;
    } finally {
        await db.sequelize.close();
    }
}

// Run seeding
seedTestUsers()
    .then(() => {
        console.log('✓ Seeding completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('✗ Seeding failed:', error);
        process.exit(1);
    });
