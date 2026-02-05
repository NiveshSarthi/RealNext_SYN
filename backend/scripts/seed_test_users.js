require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Partner, Tenant, PartnerUser, TenantUser, Plan, Feature, PlanFeature, Subscription } = require('../models');
const bcrypt = require('bcryptjs');

async function seedTestUsers() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // --- CONSTANTS ---
        const SUPER_ADMIN = {
            email: 'admin@realnext.com',
            password: 'RealnextAdmin2024!debug',
            name: 'Super Admin'
        };

        const PARTNER = {
            name: 'Acme Resellers',
            slug: 'acme',
            email: 'info@acme.com',
            adminEmail: 'partner-admin@acme.com',
            password: 'Test123!',
            adminName: 'Partner Admin'
        };

        const TENANT = {
            name: 'Test Company Ltd',
            email: 'info@testcompany.com',
            adminEmail: 'tenant-admin@testcompany.com',
            password: 'Test123!',
            adminName: 'Tenant Admin',
            userEmail: 'tenant-user@testcompany.com',
            userName: 'Tenant User'
        };

        const PLAN_CODE = 'starter';

        // --- HELPERS ---
        async function getHash(password) {
            return await bcrypt.hash(password, 10);
        }

        async function findOrCreateUser(email, name, password, isSuperAdmin = false) {
            let user = await User.findOne({ where: { email } });
            if (!user) {
                console.log(`Creating user: ${email}`);
                // Model hook handles hashing, so pass plain password
                user = await User.create({
                    email,
                    name,
                    password_hash: password,
                    is_super_admin: isSuperAdmin,
                    status: 'active',
                    email_verified: true
                });
            } else {
                console.log(`User exists: ${email}`);
                // Fix possible double-hashing by updating password
                console.log(`  -> Resetting password to ensure correctness...`);
                user.password_hash = password; // Hook will hash this on save/update
                await user.save();

                if (isSuperAdmin && !user.is_super_admin) {
                    await user.update({ is_super_admin: true });
                    console.log(`  -> Promoted to Super Admin`);
                }
            }
            return user;
        }

        // --- 1. SUPER ADMIN ---
        console.log('\n--- 1. Seeding Super Admin ---');
        await findOrCreateUser(SUPER_ADMIN.email, SUPER_ADMIN.name, SUPER_ADMIN.password, true);

        // --- 2. PARTNER ---
        console.log('\n--- 2. Seeding Partner ---');
        let partner = await Partner.findOne({ where: { slug: PARTNER.slug } });
        if (!partner) {
            console.log(`Creating Partner: ${PARTNER.name}`);
            partner = await Partner.create({
                name: PARTNER.name,
                slug: PARTNER.slug,
                email: PARTNER.email,
                status: 'active',
                commission_rate: 15.00
            });
        } else {
            console.log(`Partner exists: ${PARTNER.name}`);
        }

        const partnerAdmin = await findOrCreateUser(PARTNER.adminEmail, PARTNER.adminName, PARTNER.password);

        const partnerUserLink = await PartnerUser.findOne({
            where: { partner_id: partner.id, user_id: partnerAdmin.id }
        });
        if (!partnerUserLink) {
            console.log(`Linking ${PARTNER.adminEmail} to ${PARTNER.name}`);
            await PartnerUser.create({
                partner_id: partner.id,
                user_id: partnerAdmin.id,
                role: 'admin',
                is_owner: true
            });
        }

        // --- 3. TENANT ---
        console.log('\n--- 3. Seeding Tenant ---');
        let tenant = await Tenant.findOne({ where: { name: TENANT.name } });
        if (!tenant) {
            console.log(`Creating Tenant: ${TENANT.name}`);
            tenant = await Tenant.create({
                name: TENANT.name,
                email: TENANT.email,
                status: 'active',
                environment: 'production',
                partner_id: partner.id // Link to Partner
            });
        } else {
            console.log(`Tenant exists: ${TENANT.name}`);
            if (tenant.partner_id !== partner.id) {
                await tenant.update({ partner_id: partner.id });
                console.log(`  -> Linked to Partner: ${PARTNER.name}`);
            }
        }

        // --- 4. TENANT ADMIN ---
        console.log('\n--- 4. Seeding Tenant Admin ---');
        const tenantAdmin = await findOrCreateUser(TENANT.adminEmail, TENANT.adminName, TENANT.password);

        const tenantAdminLink = await TenantUser.findOne({
            where: { tenant_id: tenant.id, user_id: tenantAdmin.id }
        });
        if (!tenantAdminLink) {
            console.log(`Linking Admin ${TENANT.adminEmail} to ${TENANT.name}`);
            await TenantUser.create({
                tenant_id: tenant.id,
                user_id: tenantAdmin.id,
                role: 'admin',
                is_owner: true
            });
        } else if (tenantAdminLink.role !== 'admin') {
            await tenantAdminLink.update({ role: 'admin', is_owner: true });
            console.log(`  -> Promoted to Admin`);
        }

        // --- 5. TENANT USER ---
        console.log('\n--- 5. Seeding Tenant User ---');
        const tenantUser = await findOrCreateUser(TENANT.userEmail, TENANT.userName, TENANT.password);

        const tenantUserLink = await TenantUser.findOne({
            where: { tenant_id: tenant.id, user_id: tenantUser.id }
        });
        if (!tenantUserLink) {
            console.log(`Linking User ${TENANT.userEmail} to ${TENANT.name}`);
            await TenantUser.create({
                tenant_id: tenant.id,
                user_id: tenantUser.id,
                role: 'user',
                is_owner: false,
                permissions: { view_leads: true, view_campaigns: true }
            });
        }

        // --- 6. PLAN & SUBSCRIPTION ---
        console.log('\n--- 6. Seeding Subscription ---');
        let plan = await Plan.findOne({ where: { code: PLAN_CODE } });
        if (!plan) {
            console.log('Creating Starter Plan');
            plan = await Plan.create({
                code: PLAN_CODE,
                name: 'Starter Plan',
                description: 'Basic plan',
                is_active: true
            });
        }

        // Ensure 'meta_ads' feature
        let feature = await Feature.findOne({ where: { code: 'meta_ads' } });
        if (!feature) {
            feature = await Feature.create({ code: 'meta_ads', name: 'Meta Ads', is_active: true });
        }
        await PlanFeature.findOrCreate({
            where: { plan_id: plan.id, feature_id: feature.id },
            defaults: { is_enabled: true }
        });

        const subscription = await Subscription.findOne({ where: { tenant_id: tenant.id } });
        if (!subscription) {
            console.log(`Creating Subscription for ${TENANT.name}`);
            const now = new Date();
            const end = new Date();
            end.setDate(end.getDate() + 30);

            await Subscription.create({
                tenant_id: tenant.id,
                plan_id: plan.id,
                status: 'active',
                current_period_start: now,
                current_period_end: end
            });
        } else {
            if (subscription.status !== 'active') {
                await subscription.update({ status: 'active' });
                console.log('  -> Activated subscription');
            }
        }

        console.log('\n✅ SEEDING COMPLETE');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedTestUsers();
