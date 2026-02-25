const { OTP } = require('../models');
const crypto = require('crypto');
const logger = require('../config/logger');
const { ApiError } = require('../middleware/errorHandler');

class OtpService {
    /**
     * Generate a 6-digit numeric OTP and save it
     */
    async generateOTP(email, purpose = 'registration', expiryMinutes = 10) {
        const normalizedEmail = email.trim().toLowerCase();

        // Generate 6-digit code
        const code = crypto.randomInt(100000, 999999).toString();

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

        // Delete any existing OTPs for this email and purpose
        await OTP.deleteMany({ email: normalizedEmail, purpose });

        // Save new OTP
        const otpEntry = await OTP.create({
            email: normalizedEmail,
            code,
            purpose,
            expires_at: expiresAt
        });

        logger.info(`[OTP] Generated ${purpose} OTP for ${normalizedEmail}. Expires at: ${expiresAt}`);

        return code;
    }

    /**
     * Verify a provided OTP
     */
    async verifyOTP(email, code, purpose = 'registration') {
        const normalizedEmail = email.trim().toLowerCase();

        const otpEntry = await OTP.findOne({
            email: normalizedEmail,
            code: code.trim(),
            purpose,
            expires_at: { $gt: new Date() }
        });

        if (!otpEntry) {
            logger.warn(`[OTP] Failed verification attempt for ${normalizedEmail} (${purpose})`);
            return false;
        }

        // Successfully verified, delete the OTP so it can't be used again
        await OTP.deleteOne({ _id: otpEntry._id });

        logger.info(`[OTP] Successfully verified ${purpose} OTP for ${normalizedEmail}`);
        return true;
    }
}

module.exports = new OtpService();
