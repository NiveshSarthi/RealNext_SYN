const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwt: jwtConfig } = require('../config/jwt');
const { RefreshToken } = require('../models');
const logger = require('../config/logger');

/**
 * JWT utility functions
 */

/**
 * Generate access token
 */
const generateAccessToken = (payload) => {
    console.log("TRACE JWT: specific sign start");
    try {
        const token = jwt.sign(payload, jwtConfig.accessSecret, {
            expiresIn: jwtConfig.accessExpiry,
            issuer: 'multitenant-saas'
        });
        console.log("TRACE JWT: specific sign success");
        return token;
    } catch (err) {
        console.error("TRACE JWT: sign ERROR", err);
        throw err;
    }
};

/**
 * Generate refresh token and store in database
 */
const generateRefreshToken = async (userId, deviceInfo = null, ipAddress = null) => {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = RefreshToken.hashToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshToken.create({
        user_id: userId,
        token_hash: tokenHash,
        device_info: deviceInfo,
        ip_address: ipAddress,
        expires_at: expiresAt
    });

    return token;
};

/**
 * Verify and rotate refresh token
 */
const verifyAndRotateRefreshToken = async (token, deviceInfo = null, ipAddress = null) => {
    const tokenHash = RefreshToken.hashToken(token);

    const storedToken = await RefreshToken.findOne({ token_hash: tokenHash });

    if (!storedToken || !storedToken.isValid()) {
        return null;
    }

    // Revoke old token
    storedToken.revoked_at = new Date();
    await storedToken.save();

    // Generate new refresh token
    const newToken = await generateRefreshToken(
        storedToken.user_id,
        deviceInfo,
        ipAddress
    );

    return {
        userId: storedToken.user_id,
        newToken
    };
};

/**
 * Revoke all refresh tokens for a user
 */
const revokeAllUserTokens = async (userId) => {
    await RefreshToken.updateMany(
        { user_id: userId, revoked_at: null },
        { revoked_at: new Date() }
    );
};

/**
 * Revoke a specific refresh token
 */
const revokeRefreshToken = async (token) => {
    const tokenHash = RefreshToken.hashToken(token);
    await RefreshToken.updateOne(
        { token_hash: tokenHash },
        { revoked_at: new Date() }
    );
};

/**
 * Clean up expired tokens (should be run periodically)
 */
const cleanupExpiredTokens = async () => {
    const result = await RefreshToken.deleteMany({
        $or: [
            { expires_at: { $lt: new Date() } },
            { revoked_at: { $ne: null } }
        ],
        created_at: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const count = result.deletedCount || 0;
    logger.info(`Cleaned up ${count} expired/revoked refresh tokens`);
    return count;
};

/**
 * Build JWT payload for user
 */
const buildTokenPayload = (user, context = {}) => {
    const payload = {
        sub: user._id || user.id,
        email: user.email,
        name: user.name,
        is_super_admin: user.is_super_admin || false
    };

    // Add client context if available
    if (context.client) {
        payload.client_id = context.client._id || context.client.id;
        payload.client_slug = context.client.slug;
        payload.client_role = context.clientRole;
    }

    // Add plan and features if subscription exists
    if (context.subscription) {
        payload.plan_id = context.subscription.plan_id;
        payload.plan_code = context.planCode;
        payload.features = context.features || [];
    }

    return payload;
};

/**
 * Decode token without verification (for debugging)
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAndRotateRefreshToken,
    revokeAllUserTokens,
    revokeRefreshToken,
    cleanupExpiredTokens,
    buildTokenPayload,
    decodeToken
};
