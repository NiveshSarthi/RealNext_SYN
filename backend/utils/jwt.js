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
    return jwt.sign(payload, jwtConfig.accessSecret, {
        expiresIn: jwtConfig.accessExpiry,
        issuer: 'multitenant-saas'
    });
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

    const storedToken = await RefreshToken.findOne({
        where: { token_hash: tokenHash }
    });

    if (!storedToken || !storedToken.isValid()) {
        return null;
    }

    // Revoke old token
    await storedToken.update({ revoked_at: new Date() });

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
    await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: userId, revoked_at: null } }
    );
};

/**
 * Revoke a specific refresh token
 */
const revokeRefreshToken = async (token) => {
    const tokenHash = RefreshToken.hashToken(token);
    await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { token_hash: tokenHash } }
    );
};

/**
 * Clean up expired tokens (should be run periodically)
 */
const cleanupExpiredTokens = async () => {
    const { Op } = require('sequelize');
    const result = await RefreshToken.destroy({
        where: {
            [Op.or]: [
                { expires_at: { [Op.lt]: new Date() } },
                { revoked_at: { [Op.not]: null } }
            ],
            created_at: { [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
    });
    logger.info(`Cleaned up ${result} expired/revoked refresh tokens`);
    return result;
};

/**
 * Build JWT payload for user
 */
const buildTokenPayload = (user, context = {}) => {
    const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        is_super_admin: user.is_super_admin || false
    };

    // Add tenant context if available
    if (context.tenant) {
        payload.tenant_id = context.tenant.id;
        payload.tenant_slug = context.tenant.slug;
        payload.tenant_role = context.tenantRole;
    }

    // Add partner context if available
    if (context.partner) {
        payload.partner_id = context.partner.id;
        payload.partner_slug = context.partner.slug;
        payload.partner_role = context.partnerRole;
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
