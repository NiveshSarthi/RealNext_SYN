const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const otpService = require('../services/otpService');
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
 * @route POST /api/auth/send-otp
 * @desc Send verification OTP to email
 * @access Public
 */
router.post('/send-otp',
    [validators.email(), validate],
    async (req, res, next) => {
        try {
            const { email } = req.body;
            const { User } = require('../models');

            // Check if user already exists
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser && existingUser.email_verified) {
                throw ApiError.conflict('Email already registered and verified');
            }

            // Generate and send OTP
            const otp = await otpService.generateOTP(email, 'registration');
            await emailService.sendRegistrationOTP(email, otp);

            res.json({
                success: true,
                message: 'Verification code sent to email'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route POST /api/auth/register
 * @desc Register new user (requires OTP)
 * @access Public
 */
router.post('/register',
    authLimiter,
    [
        ...register, // Original validators
        body('otp_code').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP is required'),
        validate
    ],
    async (req, res, next) => {
        try {
            const { name, email, password, phone, company_name, partner_code, otp_code } = req.body;

            // 1. Verify OTP first
            const isOtpValid = await otpService.verifyOTP(email, otp_code, 'registration');
            if (!isOtpValid) {
                throw ApiError.badRequest('Invalid or expired verification code');
            }

            // 2. Proceed with registration
            const result = await authService.register(
                { name, email: email.toLowerCase(), password, phone, company_name },
                req,
                partner_code
            );

            // 3. Mark user as verified immediately (since OTP was valid)
            const { User } = require('../models');
            await User.findByIdAndUpdate(result.user.id, { email_verified: true });
            result.user.email_verified = true;

            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
);

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
            const { email } = req.body;
            const { User } = require('../models');

            // Check if user exists (don't reveal this in response)
            const user = await User.findOne({ email: email.toLowerCase() });

            if (user) {
                // Generate reset token (simple approach - in production use JWT or crypto.randomBytes)
                const resetToken = require('crypto').randomBytes(32).toString('hex');
                const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

                // Store reset token in user record (in production, use Redis or separate table)
                user.resetPasswordToken = resetToken;
                user.resetPasswordExpires = resetTokenExpiry;
                await user.save();

                // Send reset email
                const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

                await emailService.sendPasswordResetEmail(email, resetToken, resetUrl);
            }

            // Always return success (don't reveal if email exists)
            res.json({
                success: true,
                message: 'If the email exists, a reset link has been sent'
            });
        } catch (error) {
            logger.error('Password reset request error:', error);
            // Still return success to prevent email enumeration
            res.json({
                success: true,
                message: 'If the email exists, a reset link has been sent'
            });
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
            const { token, new_password } = req.body;
            const { User } = require('../models');

            // Find user with valid reset token
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: new Date() }
            });

            if (!user) {
                throw ApiError.badRequest('Invalid or expired reset token');
            }

            // Update password
            user.password_hash = new_password; // Will be hashed by pre-save hook
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            logger.info(`Password reset successful for user: ${user.email}`);

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
