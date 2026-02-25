const { User, ClientUser, Client, Subscription, Plan, PlanFeature, Feature, LoginHistory } = require('../models');
const { generateAccessToken, generateRefreshToken, buildTokenPayload, revokeAllUserTokens } = require('../utils/jwt');
const { ApiError } = require('../middleware/errorHandler');
const { logAuthEvent } = require('../middleware/auditLogger');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

/**
 * Authentication Service
 * Handles login, registration, token management
 */


class AuthService {
    /**
     * Login with email and password
     */
    async login(email, password, req) {
        const normalizedEmail = email ? email.trim().toLowerCase() : '';

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            await logAuthEvent(req, 'login_failed', false, null, 'User not found');
            throw ApiError.unauthorized('Invalid email or password');
        }

        const validPassword = await user.validatePassword(password);

        console.log(`[LOGIN] User: ${user.email}, password valid: ${validPassword}`);

        if (!validPassword) {
            await logAuthEvent(req, 'login_failed', false, user._id || user.id, 'Invalid password');
            throw ApiError.unauthorized('Invalid email or password');
        }

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
        user.last_login_at = new Date();
        await user.save();

        // Log successful login
        await this.logLogin(user.id, 'password', true, req);
        await logAuthEvent(req, 'login', true, user.id);

        return {
            user: user.toSafeJSON(),
            token: accessToken,
            refresh_token: refreshToken,
            context: {
                client: context.client,
                clientRole: context.clientRole,
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
        let user = await User.findOne({ email: userData.email });

        if (user) {
            // If user is already verified, we cannot register again
            if (user.email_verified) {
                throw ApiError.conflict('Email already registered');
            }

            // If user is unverified, update their details so they can try again
            user.password_hash = userData.password;
            user.name = userData.name;
            user.phone = userData.phone;
            user.status = 'active';
            await user.save();

            logger.info(`Updated existing unverified user: ${userData.email}`);
        } else {
            // Create new user
            user = await User.create({
                email: userData.email,
                password_hash: userData.password,
                name: userData.name,
                phone: userData.phone,
                email_verified: false,
                status: 'active'
            });
        }

        // Check if client already exists for this email to avoid duplicate client creation on 
        // resumed registrations. 
        let client = await Client.findOne({ email: userData.email });

        if (!client) {
            // Create client for the user with restricted defaults
            client = await Client.create({
                name: userData.company_name || `${userData.name}'s Organization`,
                email: userData.email,
                phone: userData.phone,
                status: 'active',
                environment: 'production',
                settings: {
                    menu_access: {
                        lms: false,
                        wa_marketing: false,
                        inventory: false
                    }
                }
            });

            // Make user the client owner
            await ClientUser.create({
                client_id: client._id,
                user_id: user._id,
                role: 'admin',
                is_owner: true,
                permissions: []
            });

            // Create trial subscription if default plan exists
            await this.createTrialSubscription(client._id);
        }

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
            client: client.toObject({ virtuals: true })
        };
    }

    /**
     * Google OAuth login/signup
     */
    async googleAuth(googleData, req) {
        let user = await User.findOne({ google_id: googleData.id });

        // Check if user exists by email but no google_id
        if (!user) {
            user = await User.findOne({ email: googleData.email });
            if (user) {
                // Link Google account
                user.google_id = googleData.id;
                user.email_verified = true;
                user.avatar_url = user.avatar_url || googleData.picture;
                await user.save();
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

            // Create client for new user with restricted defaults
            const client = await Client.create({
                name: `${googleData.name}'s Organization`,
                email: googleData.email,
                status: 'active',
                environment: 'production',
                settings: {
                    menu_access: {
                        lms: false,
                        wa_marketing: false,
                        inventory: false
                    }
                }
            });

            await ClientUser.create({
                client_id: client._id,
                user_id: user._id,
                role: 'admin',
                is_owner: true
            });

            await this.createTrialSubscription(client._id);
        }

        if (user.status !== 'active') {
            throw ApiError.unauthorized('Account is suspended');
        }

        // Get context and generate tokens
        const context = await this.getUserContext(user);
        const tokenPayload = buildTokenPayload(user, context);
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = await generateRefreshToken(user.id);

        user.last_login_at = new Date();
        await user.save();
        await this.logLogin(user._id, 'google', true, req);

        return {
            user: user.toSafeJSON(),
            token: accessToken,
            refresh_token: refreshToken,
            context: {
                client: context.client
            }
        };
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(userId, req) {
        const user = await User.findById(userId);
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

        // Get client membership (prefer owner)
        const clientUser = await ClientUser.findOne({ user_id: user._id })
            .populate({
                path: 'client_id',
                match: { status: 'active' }
            })
            .sort({ is_owner: -1 });

        if (clientUser?.client_id) {
            context.client = clientUser.client_id.toObject({ virtuals: true });
            context.clientRole = clientUser.role;

            // Get subscription
            const subscription = await Subscription.findOne({
                client_id: clientUser.client_id._id,
                status: { $in: ['trial', 'active'] }
            })
                .populate({
                    path: 'plan_id',
                    populate: {
                        path: 'planFeatures',
                        match: { is_enabled: true },
                        populate: { path: 'feature_id' }
                    }
                })
                .sort({ created_at: -1 });

            if (subscription) {
                context.subscription = subscription.toObject({ virtuals: true });
                context.planCode = subscription.plan_id?.code;

                try {
                    context.features = subscription.plan_id?.planFeatures
                        ?.filter(pf => pf.feature_id?.is_enabled)
                        .map(pf => pf.feature_id.code) || [];
                } catch (err) {
                    console.error(`[AUTH] Error processing features: ${err.message}`);
                    context.features = [];
                }
            }
        }

        return context;
    }

    /**
     * Create trial subscription for new tenant
     */
    async createTrialSubscription(clientId) {
        // Find default plan (usually 'starter' or 'free')
        let plan = await Plan.findOne({ is_active: true, is_public: true })
            .sort({ price_monthly: 1 });

        if (!plan) {
            logger.warn('No active plans found for trial subscription');
            return null;
        }

        const now = new Date();
        const trialDays = plan.trial_days || 14;
        const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

        return Subscription.create({
            client_id: clientId,
            plan_id: plan.id,
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
        const user = await User.findById(userId);
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        const validPassword = await user.validatePassword(oldPassword);
        if (!validPassword) {
            throw ApiError.badRequest('Current password is incorrect');
        }

        user.password_hash = newPassword;
        await user.save();

        // Revoke all existing tokens
        await revokeAllUserTokens(userId);

        return { success: true };
    }
}

module.exports = new AuthService();
