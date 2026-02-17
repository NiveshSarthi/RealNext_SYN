const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { auditAction } = require('../middleware/auditLogger');
const { login, register, validate, validators } = require('../utils/validators');
const { body } = require('express-validator');
const { verifyAndRotateRefreshToken } = require('../utils/jwt');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @route POST /api/auth/login
 * @desc Login with email and password
 * @access Public
 */
router.post('/login', authLimiter, async (req, res, next) => {
    const start = Date.now();
    try {
        console.log(`[AUTH-DEBUG] Login request received for email: ${req.body.email}`);
        logger.info(`[AUTH-DEBUG] Login request received for email: ${req.body.email}`);

        const { email, password } = req.body;
        const result = await authService.login(email, password, req);

        const duration = Date.now() - start;
        console.log(`[AUTH-DEBUG] Login successful for ${email} in ${duration}ms`);
        logger.info(`[AUTH-DEBUG] Login successful for ${email} in ${duration}ms`);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        const duration = Date.now() - start;
        console.error(`[AUTH-DEBUG] Login failed for ${req.body.email} in ${duration}ms: ${error.message}`);
        logger.error(`[AUTH-DEBUG] Login failed for ${req.body.email} in ${duration}ms: ${error.message}`);
        next(error);
    }
});

/**
 * @route POST /api/auth/register
 * @desc Register new user
 * @access Public
 */
router.post('/register', authLimiter, register, async (req, res, next) => {
    try {
        const { name, email, password, phone, company_name, partner_code } = req.body;

        const result = await authService.register(
            { name, email, password, phone, company_name },
            req,
            partner_code
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/google
 * @desc Google OAuth login/signup
 * @access Public
 */
router.post('/google', async (req, res, next) => {
    try {
        const { id, email, name, picture } = req.body;

        if (!id || !email) {
            throw ApiError.badRequest('Google ID and email are required');
        }

        const result = await authService.googleAuth(
            { id, email, name, picture },
            req
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public (with refresh token)
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            throw ApiError.badRequest('Refresh token is required');
        }

        const result = await verifyAndRotateRefreshToken(
            refresh_token,
            req.get('User-Agent'),
            req.ip
        );

        if (!result) {
            throw ApiError.unauthorized('Invalid or expired refresh token');
        }

        const tokenResult = await authService.refreshAccessToken(result.userId, req);

        res.json({
            success: true,
            data: {
                access_token: tokenResult.token,
                refresh_token: result.newToken
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout and revoke tokens
 * @access Private
 */
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        await authService.logout(req.user.id);

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const context = await authService.getUserContext({ id: req.user.id });

        res.json({
            success: true,
            data: {
                user: req.user,
                client: context.client,
                subscription: context.subscription ? {
                    plan_code: context.planCode,
                    status: context.subscription.status,
                    features: context.features
                } : null
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile',
    authenticate,
    [
        validators.optionalString('name', 100),
        validators.phone(),
        validators.url('avatar_url'),
        validate
    ],
    auditAction('update', 'profile'),
    async (req, res, next) => {
        try {
            const { User } = require('../models');
            const { name, phone, avatar_url } = req.body;

            const user = await User.findById(req.user.id);

            user.name = name || user.name;
            user.phone = phone || user.phone;
            user.avatar_url = avatar_url || user.avatar_url;
            await user.save();

            res.json({
                success: true,
                data: user.toSafeJSON()
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /api/auth/change-password
 * @desc Change password
 * @access Private
 */
router.put('/change-password',
    authenticate,
    [
        body('current_password').notEmpty().withMessage('Current password is required'),
        validators.password('new_password'),
        validate
    ],
    auditAction('update', 'password'),
    async (req, res, next) => {
        try {
            const { current_password, new_password } = req.body;

            await authService.changePassword(req.user.id, current_password, new_password);

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password',
    passwordResetLimiter,
    [validators.email(), validate],
    async (req, res, next) => {
        try {
            // TODO: Implement password reset email
            // For now, just return success (don't reveal if email exists)

            res.json({
                success: true,
                message: 'If the email exists, a reset link has been sent'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password',
    [
        body('token').notEmpty().withMessage('Reset token is required'),
        validators.password('new_password'),
        validate
    ],
    async (req, res, next) => {
        try {
            // TODO: Implement token verification and password reset

            res.json({
                success: true,
                message: 'Password reset successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
