const nodemailer = require('nodemailer');
const logger = require('../config/logger');

/**
 * Email Service
 * Handles SMTP email sending for the application
 */
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Verify connection configuration
        this.transporter.verify((error, success) => {
            if (error) {
                logger.error('SMTP Configuration Error:', error);
            } else {
                logger.info('SMTP Server is ready to send emails');
            }
        });
    }

    /**
     * Send team member invitation email
     */
    async sendTeamInvitation(invitationData) {
        const { email, name, password, loginUrl, invitedBy } = invitationData;

        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'Syndicate CP Portal'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Welcome to Syndicate CP Portal - Your Account Details',
            html: this.getInvitationEmailTemplate(name, email, password, loginUrl, invitedBy)
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Team invitation email sent to ${email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send team invitation email to ${email}:`, error);
            throw error;
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, resetToken, resetUrl) {
        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'Syndicate CP Portal'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Password Reset - Syndicate CP Portal',
            html: this.getPasswordResetEmailTemplate(email, resetUrl)
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Password reset email sent to ${email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send password reset email to ${email}:`, error);
            throw error;
        }
    }

    /**
     * Send welcome email for new registrations
     */
    async sendWelcomeEmail(email, name) {
        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'Syndicate CP Portal'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Welcome to Syndicate CP Portal!',
            html: this.getWelcomeEmailTemplate(name)
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Welcome email sent to ${email}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send welcome email to ${email}:`, error);
            throw error;
        }
    }

    /**
     * HTML template for team invitation email
     */
    getInvitationEmailTemplate(name, email, password, loginUrl, invitedBy) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Syndicate CP Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Syndicate CP Portal!</h1>
        <p>You've been invited to join our team</p>
    </div>

    <div class="content">
        <h2>Hello ${name}!</h2>

        <p>You have been invited to join the Syndicate CP Portal team. Your account has been created and you can now access the platform.</p>

        <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
        </div>

        <div class="warning">
            <strong>⚠️ Security Notice:</strong> Please change your password after your first login for security purposes.
        </div>

        <p style="text-align: center;">
            <a href="${loginUrl || 'https://portal.synditech.com/login'}" class="button">Login to Your Account</a>
        </p>

        <p>If you have any questions or need assistance, please contact your administrator: ${invitedBy || 'support@synditech.com'}</p>

        <p>Best regards,<br>The Syndicate CP Portal Team</p>
    </div>

    <div class="footer">
        <p>This email was sent to ${email}. If you didn't expect this invitation, please ignore this email.</p>
        <p>&copy; 2024 Syndicate CP Portal. All rights reserved.</p>
    </div>
</body>
</html>`;
    }

    /**
     * HTML template for password reset email
     */
    getPasswordResetEmailTemplate(email, resetUrl) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Syndicate CP Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .warning { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Password Reset Request</h1>
        <p>Syndicate CP Portal</p>
    </div>

    <div class="content">
        <h2>Reset Your Password</h2>

        <p>You have requested to reset your password for your Syndicate CP Portal account.</p>

        <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
        </p>

        <div class="warning">
            <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
        </div>

        <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">${resetUrl}</p>

        <p>Best regards,<br>The Syndicate CP Portal Team</p>
    </div>

    <div class="footer">
        <p>This email was sent to ${email}. If you have any questions, please contact support.</p>
        <p>&copy; 2024 Syndicate CP Portal. All rights reserved.</p>
    </div>
</body>
</html>`;
    }

    /**
     * HTML template for welcome email
     */
    getWelcomeEmailTemplate(name) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Syndicate CP Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Syndicate CP Portal!</h1>
        <p>Your account has been created successfully</p>
    </div>

    <div class="content">
        <h2>Hello ${name}!</h2>

        <p>Welcome to Syndicate CP Portal! Your account has been successfully created and you can now start using our platform.</p>

        <p>You can now:</p>
        <ul>
            <li>Access your personalized dashboard</li>
            <li>Manage your campaigns and leads</li>
            <li>Collaborate with your team</li>
            <li>Track your performance metrics</li>
        </ul>

        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

        <p>Best regards,<br>The Syndicate CP Portal Team</p>
    </div>

    <div class="footer">
        <p>&copy; 2024 Syndicate CP Portal. All rights reserved.</p>
    </div>
</body>
</html>`;
    }
}

// Export singleton instance
module.exports = new EmailService();