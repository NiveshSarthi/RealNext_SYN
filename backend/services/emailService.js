const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const APP_NAME = process.env.FROM_NAME || 'RealNext';
const APP_URL = process.env.FRONTEND_URL || 'https://realnext.in';

/**
 * Email Service — Handles all SMTP email sending
 */
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        this.transporter.verify((error) => {
            if (error) {
                logger.error('SMTP Configuration Error:', error.message);
            } else {
                logger.info('SMTP Server ready to send emails');
            }
        });
    }

    from() {
        return `"${APP_NAME}" <${process.env.SMTP_USER}>`;
    }

    // ─── Send methods ──────────────────────────────────────────────────────

    async sendTeamInvitation(data) {
        const { email, name, password, loginUrl, invitedBy } = data;
        const info = await this.transporter.sendMail({
            from: this.from(),
            to: email,
            subject: `You've been invited to join ${APP_NAME}`,
            html: this.invitationTemplate({ name, email, password, loginUrl: loginUrl || `${APP_URL}/auth/login`, invitedBy })
        });
        logger.info(`Invitation email sent to ${email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    }

    async sendPasswordResetEmail(email, resetToken, resetUrl) {
        const info = await this.transporter.sendMail({
            from: this.from(),
            to: email,
            subject: `Reset your ${APP_NAME} password`,
            html: this.passwordResetTemplate({ email, resetUrl })
        });
        logger.info(`Password reset email sent to ${email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    }

    async sendWelcomeEmail(email, name) {
        const info = await this.transporter.sendMail({
            from: this.from(),
            to: email,
            subject: `Welcome to ${APP_NAME}!`,
            html: this.welcomeTemplate({ name })
        });
        logger.info(`Welcome email sent to ${email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    }

    // ─── Templates ─────────────────────────────────────────────────────────

    baseLayout(content, title = APP_NAME) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0D1117; color:#E6EDF3; }
  .email-wrapper { max-width:600px; margin:0 auto; background:#0D1117; }
  .header { background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); padding:40px 32px; text-align:center; }
  .header-logo { font-size:28px; font-weight:800; color:#fff; letter-spacing:-0.5px; }
  .header-sub { font-size:14px; color:rgba(255,255,255,0.85); margin-top:8px; }
  .body { background:#161B22; padding:40px 32px; border:1px solid #30363D; }
  .greeting { font-size:22px; font-weight:700; color:#E6EDF3; margin-bottom:16px; }
  .text { font-size:15px; color:#8B949E; line-height:1.7; margin-bottom:20px; }
  .card { background:#0D1117; border:1px solid #30363D; border-radius:10px; padding:24px; margin:24px 0; }
  .card-title { font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:#F97316; margin-bottom:16px; }
  .field { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #21262D; }
  .field:last-child { border-bottom:none; }
  .field-label { font-size:13px; color:#8B949E; }
  .field-value { font-size:14px; color:#E6EDF3; font-weight:600; font-family:monospace; word-break:break-all; max-width:300px; text-align:right; }
  .btn { display:inline-block; background:#F97316; color:#fff !important; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:15px; font-weight:700; margin:24px 0; transition:opacity 0.2s; }
  .notice { background:#1C2128; border-left:3px solid #F97316; border-radius:6px; padding:14px 18px; margin:20px 0; }
  .notice p { font-size:13px; color:#8B949E; line-height:1.6; }
  .footer { background:#0D1117; padding:24px 32px; text-align:center; border:1px solid #30363D; border-top:none; }
  .footer p { font-size:12px; color:#484F58; line-height:1.6; }
  .footer a { color:#F97316; text-decoration:none; }
</style>
</head>
<body>
<div class="email-wrapper">
  <div class="header">
    <div class="header-logo">RealNext</div>
    <div class="header-sub">${title}</div>
  </div>
  <div class="body">
    ${content}
  </div>
  <div class="footer">
    <p>This email was sent by ${APP_NAME} · <a href="${APP_URL}">${APP_URL}</a></p>
    <p style="margin-top:8px">If you didn't expect this email, you can safely ignore it.</p>
    <p style="margin-top:8px">© ${new Date().getFullYear()} RealNext. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;
    }

    invitationTemplate({ name, email, password, loginUrl, invitedBy }) {
        const isExisting = !password || password.includes('existing password');
        const credRows = isExisting
            ? `<div class="field"><span class="field-label">Email</span><span class="field-value">${email}</span></div>
               <div class="field"><span class="field-label">Password</span><span class="field-value">Your existing password</span></div>`
            : `<div class="field"><span class="field-label">Email</span><span class="field-value">${email}</span></div>
               <div class="field"><span class="field-label">Password</span><span class="field-value">${password}</span></div>`;

        const content = `
<h1 class="greeting">Hello ${name}! 👋</h1>
<p class="text">
  You've been invited by <strong style="color:#E6EDF3">${invitedBy}</strong> to join the <strong style="color:#E6EDF3">RealNext Portal</strong>. 
  Your account is ready — use the credentials below to sign in.
</p>

<div class="card">
  <div class="card-title">🔑 Your Login Credentials</div>
  ${credRows}
</div>

<p style="text-align:center">
  <a href="${loginUrl}" class="btn">Login to RealNext →</a>
</p>

${!isExisting ? `<div class="notice">
  <p>⚠️ <strong style="color:#E6EDF3">Security tip:</strong> Please change your password after your first login via <strong>Settings → Account → Change Password</strong>.</p>
</div>` : ''}

<p class="text">If you have any questions, contact your administrator: <a href="mailto:${invitedBy}" style="color:#F97316">${invitedBy}</a></p>`;

        return this.baseLayout(content, "You've been invited to join the team");
    }

    passwordResetTemplate({ email, resetUrl }) {
        const content = `
<h1 class="greeting">Reset your password</h1>
<p class="text">We received a request to reset the password for your RealNext account associated with <strong style="color:#E6EDF3">${email}</strong>.</p>

<p style="text-align:center">
  <a href="${resetUrl}" class="btn">Reset Password →</a>
</p>

<div class="notice">
  <p>⏱ <strong style="color:#E6EDF3">This link expires in 1 hour.</strong> If you didn't request a password reset, please ignore this email — your account is safe.</p>
</div>

<p class="text" style="font-size:13px">Or copy this link into your browser:</p>
<p style="background:#0D1117;border:1px solid #30363D;padding:12px 16px;border-radius:6px;font-size:12px;color:#8B949E;word-break:break-all;font-family:monospace">${resetUrl}</p>`;

        return this.baseLayout(content, 'Password Reset Request');
    }

    welcomeTemplate({ name }) {
        const content = `
<h1 class="greeting">Welcome to RealNext, ${name}! 🎉</h1>
<p class="text">Your account has been created. Here's what you can do now:</p>

<div class="card">
  <div class="card-title">✨ Get Started</div>
  <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
    ${[
                ['📊', 'View your analytics dashboard', 'Track leads and campaign performance'],
                ['📋', 'Manage your leads', 'Add, assign and follow up on leads'],
                ['📢', 'Create campaigns', 'Send WhatsApp messages to your audience'],
                ['🏠', 'Browse inventory', 'Access your property catalog'],
            ].map(([icon, title, sub]) => `
    <div style="display:flex;align-items:flex-start;gap:12px">
      <span style="font-size:20px">${icon}</span>
      <div>
        <p style="font-size:14px;font-weight:600;color:#E6EDF3">${title}</p>
        <p style="font-size:13px;color:#8B949E">${sub}</p>
      </div>
    </div>`).join('')}
  </div>
</div>

<p style="text-align:center">
  <a href="${APP_URL}/dashboard" class="btn">Open Dashboard →</a>
</p>`;

        return this.baseLayout(content, 'Welcome to RealNext!');
    }
}

module.exports = new EmailService();