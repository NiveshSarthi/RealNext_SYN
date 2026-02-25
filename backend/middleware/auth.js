const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/jwt');
const { User, ClientUser, Client, Subscription, Plan, PlanFeature, Feature } = require('../models');
const { ApiError } = require('./errorHandler');
const logger = require('../config/logger');

/**
 * JWT Authentication middleware
 * Validates JWT token and attaches user context to request
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('No token provided');
        }

        const token = authHeader.substring(7);
        // console.log(`[AUTH-DEBUG] Token length: ${token.length}`);

        // Verify JWT
        const decoded = jwt.verify(token, jwtConfig.accessSecret);

        // Get user from database
        const user = await User.findById(decoded.sub).select('-password_hash');

        if (!user) {
            throw ApiError.unauthorized('User not found');
        }

        if (user.status !== 'active') {
            throw ApiError.unauthorized('Account is suspended or inactive');
        }

        // Attach user to request
        req.user = user.toObject({ virtuals: true });
        req.user.is_super_admin = user.is_super_admin;

        // If token has client context, attach it
        if (decoded.client_id || decoded.tenant_id) {
            const clientId = decoded.client_id || decoded.tenant_id;
            console.log(`[AUTH] Token has client_id: ${clientId}`);
            const clientUser = await ClientUser.findOne({
                user_id: user._id,
                client_id: clientId
            }).populate({
                path: 'client_id'
            }).populate({
                path: 'role_id',
                select: 'name permissions'
            });

            if (clientUser && clientUser.client_id) {
                // Attach client context to request
                req.clientUser = clientUser.toObject({ virtuals: true });
                req.client = clientUser.client_id.toObject({ virtuals: true });
                req.user.client_role = clientUser.role;

                // Merge permissions from role and direct permissions
                const rolePermissions = clientUser.role_id?.permissions || [];
                const directPermissions = clientUser.permissions || [];
                req.clientUser.permissions = [...new Set([...rolePermissions, ...directPermissions])];

                // BLOCK INACTIVE CLIENTS (Super Admins bypass this check)
                if (req.client.status !== 'active' && !req.user.is_super_admin) {
                    throw ApiError.forbidden('Your organization account is inactive. Kindly contact the administration.');
                }

                console.log(`[AUTH] ✅ Client context loaded: ${req.client.name} (Role: ${req.clientUser.role})`);

                // Get subscription and features
                const subscription = await Subscription.findOne({
                    client_id: clientId,
                    status: { $in: ['trial', 'active'] }
                }).populate({
                    path: 'plan_id',
                    populate: {
                        path: 'planFeatures',
                        populate: { path: 'feature_id' }
                    }
                }).sort({ created_at: -1 });

                // Initialize contexts
                req.features = {};
                req.menu_access = req.client.settings?.menu_access || {}; // Load menu overrides
                req.featureLimits = {};

                if (subscription) {
                    req.subscription = subscription.toObject({ virtuals: true });
                    req.plan = subscription.plan_id ? subscription.plan_id.toObject({ virtuals: true }) : null;

                    console.log(`[AUTH] Found Subscription: ${subscription._id} (Plan: ${subscription.plan_id?.name})`);

                    // Extract enabled features
                    if (subscription.plan_id?.planFeatures) {
                        try {
                            subscription.plan_id.planFeatures.forEach(pf => {
                                if (pf.is_enabled && pf.feature_id?.is_enabled) {
                                    if (pf.feature_id.code) {
                                        const code = pf.feature_id.code;
                                        req.features[code] = true;
                                        req.featureLimits[code] = pf.limits || {};

                                        // Map macro toggles to granular backend feature flags
                                        if (code === 'inventory') {
                                            req.features['catalog'] = true;
                                        }
                                        if (code === 'lms') {
                                            req.features['leads'] = true;
                                        }
                                        if (code === 'wa_marketing') {
                                            req.features['campaigns'] = true;
                                            req.features['workflows'] = true;
                                            req.features['templates'] = true;
                                            req.features['quick_replies'] = true;
                                            req.features['meta_ads'] = true;
                                        }
                                    }
                                }
                            });
                        } catch (err) {
                            console.error(`[AUTH] Error processing features: ${err.message}`);
                            // Continue without crashing, features will be empty or partial
                        }
                    }
                }

                // Apply Client Feature Overrides (Client settings take precedence)
                if (req.client.settings?.features) {
                    Object.keys(req.client.settings.features).forEach(code => {
                        req.features[code] = req.client.settings.features[code];

                        // Map macro frontend toggles to granular backend feature flags
                        if (code === 'inventory' && req.client.settings.features[code]) {
                            req.features['catalog'] = true;
                        }
                        if (code === 'lms' && req.client.settings.features[code]) {
                            req.features['leads'] = true;
                        }
                        if (code === 'wa_marketing' && req.client.settings.features[code]) {
                            req.features['campaigns'] = true;
                            req.features['workflows'] = true;
                            req.features['templates'] = true;
                            req.features['quick_replies'] = true;
                            req.features['meta_ads'] = true;
                        }
                    });
                }

                // --- NEW: Granular Feature/Module Assignment ---
                // If it's a team member (not client owner/admin), restrict features to what's assigned
                if (req.clientUser.role !== 'admin' && !req.user.is_super_admin) {
                    const assignedFeatures = req.clientUser.assigned_features || [];
                    const assignedModules = req.clientUser.assigned_modules || [];

                    // If neither features nor modules are assigned, we take local assumption: 
                    // ONLY restrict if at least one assignment exists? 
                    // NO, the user says "Only the assigned features... should be accessible".
                    // This implies if none are assigned, NONE are accessible.

                    const allowedFeatures = new Set(assignedFeatures);

                    // Add features from assigned modules
                    assignedModules.forEach(mod => {
                        if (mod === 'inventory') allowedFeatures.add('catalog');
                        if (mod === 'lms') allowedFeatures.add('leads');
                        if (mod === 'wa_marketing') {
                            allowedFeatures.add('campaigns');
                            allowedFeatures.add('workflows');
                            allowedFeatures.add('templates');
                            allowedFeatures.add('quick_replies');
                            allowedFeatures.add('meta_ads');
                        }
                    });

                    // Filter req.features
                    Object.keys(req.features).forEach(code => {
                        if (req.features[code] && !allowedFeatures.has(code)) {
                            req.features[code] = false; // Disable feature for this user
                        }
                    });

                    console.log(`[AUTH] Restricted features for ${user.email} based on assignments.`);
                }

                console.log(`[AUTH] Final features for user ${user.email}: ${Object.keys(req.features).filter(k => req.features[k]).join(', ')}`);
            } else {
                console.log(`[AUTH] ❌ ClientUser link not found for user ${user.id} and client ${clientId}`);
            }
        } else {
            console.log(`[AUTH] ⚠️ Token MISSING client_id`);
        }

        next();
    } catch (error) {
        logger.error('[AUTH ERROR]', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(ApiError.unauthorized(error.message));
        }
        next(error);
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    return authenticate(req, res, next);
};

/**
 * Require super admin privileges — must be used after authenticate
 */
const requireSuperAdmin = (req, res, next) => {
    if (!req.user?.is_super_admin) {
        return next(ApiError.forbidden('Super admin access required'));
    }
    next();
};

module.exports = { authenticate, optionalAuth, requireSuperAdmin };
