const { User, TenantUser, PartnerUser, Tenant, Partner, Subscription, Plan, PlanFeature, Feature, LoginHistory } = require('../models');
const { generateAccessToken, generateRefreshToken, buildTokenPayload, revokeAllUserTokens } = require('../utils/jwt');
const { ApiError } = require('../middleware/errorHandler');
const { logAuthEvent } = require('../middleware/auditLogger');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

/**
 * Authentication Service
 * Handles login, registration, token management
 */


console.log('AuthService File Loaded:', __filename);

class AuthService {
    /**
     * Login with email and password
     */
    async login(email, password, req) {
        console.log('TRACE 1: Start');
        const normalizedEmail = email ? email.trim().toLowerCase() : '';
        console.log(`DEBUG LOGIN: Input '${email}' -> Normalized '${normalizedEmail}'`);

        const user = await User.findOne({ where: { email: normalizedEmail } });
        console.log('TRACE 2: User found? ' + (!!user));

        if (!user) {
            console.log('TRACE 2b: User NOT FOUND');
            await logAuthEvent(req, 'login_failed', false, null, 'User not found');
            throw ApiError.unauthorized('Debug: User not found');
        }

        console.log('TRACE 3: Status check');
        if (user.status !== 'active') {
            console.log('TRACE 3b: User INACTIVE');
            await logAuthEvent(req, 'login_failed', false, user.id, 'Account suspended');
            throw ApiError.unauthorized('Account is suspended or inactive');
        }

        const validPassword = await user.validatePassword(password);
        // const validPassword = true; // FORCE SUCCESS FOR DEBUGGING

        console.log('TRACE 5: Check PWD result: ' + validPassword);
        if (!validPassword) {
            console.log('TRACE 5b: Failed PWD');
            await logAuthEvent(req, 'login_failed', false, user.id, 'Invalid password');
            throw ApiError.unauthorized('Invalid email or password');
        }

        console.log("TRACE 6: REACHED RETURN REAL");

        // Get user context (tenant/partner)
        const context = await this.getUserContext(user);

        // Generate tokens
        const tokenPayload = buildTokenPayload(user, context);
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = await generateRefreshToken(
            user.id,
            req.get('User-Agent'),
            req.ip
        );

        // Update last login
        await user.update({ last_login_at: new Date() });

        // Log successful login
        await this.logLogin(user.id, 'password', true, req);
        await logAuthEvent(req, 'login', true, user.id);

        return {
            user: user.toSafeJSON(),
            token: accessToken,
            refresh_token: refreshToken,
            context: {
                tenant: context.tenant,
                tenantRole: context.tenantRole,
                partner: context.partner,
                partnerRole: context.partnerRole,
                subscription: context.subscription ? {
                    plan_code: context.planCode,
                    status: context.subscription.status,
                    features: context.features
                } : null
            }
        };
    }

    /**
     * Register new user
     */
    async register(userData, req, partnerCode = null) {
        // Check if user exists
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) {
            throw ApiError.conflict('Email already registered');
        }

        // Find partner if referral code provided
        let partner = null;
        if (partnerCode) {
            partner = await Partner.findOne({
                where: { referral_code: partnerCode, status: 'active' }
            });
        }

        // Create user
        const user = await User.create({
            email: userData.email,
            password_hash: userData.password,
            name: userData.name,
            phone: userData.phone,
            email_verified: false,
            status: 'active'
        });

        // Create tenant for the user
        const tenant = await Tenant.create({
            name: userData.company_name || `${userData.name}'s Organization`,
            email: userData.email,
            phone: userData.phone,
            partner_id: partner?.id || null,
            status: 'active',
            environment: 'production'
        });

        // Make user the tenant owner
        await TenantUser.create({
            tenant_id: tenant.id,
            user_id: user.id,
            role: 'admin',
            is_owner: true,
            permissions: []
        });

        // Create trial subscription if default plan exists
        await this.createTrialSubscription(tenant.id, partner?.id);

        // Get user context
        const context = await this.getUserContext(user);

        // Generate tokens
        const tokenPayload = buildTokenPayload(user, context);
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = await generateRefreshToken(user.id);

        // Log registration
        await logAuthEvent(req, 'register', true, user.id);

        return {
            user: user.toSafeJSON(),
            token: accessToken,
            refresh_token: refreshToken,
            tenant: tenant.get({ plain: true })
        };
    }

    /**
     * Google OAuth login/signup
     */
    async googleAuth(googleData, req) {
        let user = await User.findOne({
            where: { google_id: googleData.id }
        });

        // Check if user exists by email but no google_id
        if (!user) {
            user = await User.findOne({ where: { email: googleData.email } });
            if (user) {
                // Link Google account
                await user.update({
                    google_id: googleData.id,
                    email_verified: true,
                    avatar_url: user.avatar_url || googleData.picture
                });
            }
        }

        // Create new user if doesn't exist
        if (!user) {
            user = await User.create({
                email: googleData.email,
                name: googleData.name,
                google_id: googleData.id,
                avatar_url: googleData.picture,
                email_verified: true,
                status: 'active'
            });

            // Create tenant for new user
            const tenant = await Tenant.create({
                name: `${googleData.name}'s Organization`,
                email: googleData.email,
                status: 'active',
                environment: 'production'
            });

            await TenantUser.create({
                tenant_id: tenant.id,
                user_id: user.id,
                role: 'admin',
                is_owner: true
            });

            await this.createTrialSubscription(tenant.id);
        }

        if (user.status !== 'active') {
            throw ApiError.unauthorized('Account is suspended');
        }

        // Get context and generate tokens
        const context = await this.getUserContext(user);
        const tokenPayload = buildTokenPayload(user, context);
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = await generateRefreshToken(user.id);

        await user.update({ last_login_at: new Date() });
        await this.logLogin(user.id, 'google', true, req);

        return {
            user: user.toSafeJSON(),
            token: accessToken,
            refresh_token: refreshToken,
            context: {
                tenant: context.tenant,
                partner: context.partner
            }
        };
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(userId, req) {
        const user = await User.findByPk(userId);
        if (!user || user.status !== 'active') {
            throw ApiError.unauthorized('Invalid user');
        }

        const context = await this.getUserContext(user);
        const tokenPayload = buildTokenPayload(user, context);
        const accessToken = generateAccessToken(tokenPayload);

        return { token: accessToken };
    }

    /**
     * Logout - revoke all tokens
     */
    async logout(userId) {
        await revokeAllUserTokens(userId);
        return { success: true };
    }

    /**
     * Get user context (tenant, partner, subscription)
     */
    async getUserContext(user) {
        const context = {};

        // Get tenant membership (prefer owner)
        const tenantUser = await TenantUser.findOne({
            where: { user_id: user.id },
            include: [{ model: Tenant, as: 'Tenant', where: { status: 'active' } }],
            order: [['is_owner', 'DESC']]
        });

        if (tenantUser?.Tenant) {
            context.tenant = tenantUser.Tenant.get({ plain: true });
            context.tenantRole = tenantUser.role;

            // Get subscription
            const subscription = await Subscription.findOne({
                where: {
                    tenant_id: tenantUser.Tenant.id,
                    status: ['trial', 'active']
                },
                include: [{
                    model: Plan,
                    as: 'plan',
                    include: [{
                        model: PlanFeature,
                        as: 'planFeatures',
                        where: { is_enabled: true },
                        required: false,
                        include: [{ model: Feature }]
                    }]
                }],
                order: [['created_at', 'DESC']]
            });

            if (subscription) {
                context.subscription = subscription.get({ plain: true });
                context.planCode = subscription.plan?.code;
                context.features = subscription.plan?.planFeatures
                    ?.filter(pf => pf.Feature?.is_enabled)
                    .map(pf => pf.Feature.code) || [];
            }
        }

        // Get partner membership
        const partnerUser = await PartnerUser.findOne({
            where: { user_id: user.id },
            include: [{ model: Partner, as: 'Partner', where: { status: 'active' } }]
        });

        if (partnerUser?.Partner) {
            context.partner = partnerUser.Partner.get({ plain: true });
            context.partnerRole = partnerUser.role;
        }

        return context;
    }

    /**
     * Create trial subscription for new tenant
     */
    async createTrialSubscription(tenantId, partnerId = null) {
        // Find default plan (usually 'starter' or 'free')
        let plan = await Plan.findOne({
            where: { is_active: true, is_public: true },
            order: [['price_monthly', 'ASC']]
        });

        if (!plan) {
            logger.warn('No active plans found for trial subscription');
            return null;
        }

        const now = new Date();
        const trialDays = plan.trial_days || 14;
        const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

        return Subscription.create({
            tenant_id: tenantId,
            plan_id: plan.id,
            partner_id: partnerId,
            status: 'trial',
            billing_cycle: 'monthly',
            current_period_start: now,
            current_period_end: trialEnd,
            trial_ends_at: trialEnd
        });
    }

    /**
     * Log login attempt
     */
    async logLogin(userId, method, success, req, failureReason = null) {
        await LoginHistory.create({
            user_id: userId,
            login_method: method,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            success,
            failure_reason: failureReason
        });
    }

    /**
     * Change password
     */
    async changePassword(userId, oldPassword, newPassword) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        const validPassword = await user.validatePassword(oldPassword);
        if (!validPassword) {
            throw ApiError.badRequest('Current password is incorrect');
        }

        await user.update({ password_hash: newPassword });

        // Revoke all existing tokens
        await revokeAllUserTokens(userId);

        return { success: true };
    }
}

module.exports = new AuthService();
