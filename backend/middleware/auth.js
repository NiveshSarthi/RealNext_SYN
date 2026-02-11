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
                path: 'client_id',
                match: { status: 'active' }
            });

            if (clientUser && clientUser.client_id) {
                // Attach client context to request
                req.clientUser = clientUser.toObject({ virtuals: true });
                req.client = clientUser.client_id.toObject({ virtuals: true });
                req.user.client_role = clientUser.role;

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
                        subscription.plan_id.planFeatures.forEach(pf => {
                            if (pf.is_enabled && pf.feature_id?.is_enabled) {
                                req.features[pf.feature_id.code] = true;
                                req.featureLimits[pf.feature_id.code] = pf.limits || {};
                            }
                        });
                    }
                }

                // Apply Client Feature Overrides (Client settings take precedence)
                if (req.client.settings?.features) {
                    Object.keys(req.client.settings.features).forEach(code => {
                        req.features[code] = req.client.settings.features[code];
                    });
                }
            } else {
                console.log(`[AUTH] ❌ ClientUser link not found for user ${user.id} and client ${clientId}`);
            }
        } else {
            console.log(`[AUTH] ⚠️ Token MISSING client_id`);
        }

        next();
    } catch (error) {
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

module.exports = { authenticate, optionalAuth };
