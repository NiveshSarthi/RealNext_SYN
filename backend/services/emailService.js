const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const APP_NAME = process.env.FROM_NAME || 'RealNext';
const APP_URL = process.env.FRONTEND_URL || 'https://realnext.in';

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
      if (error) logger.error('SMTP Error:', error.message);
      else logger.info('SMTP Server ready');
    });
  }

  from() {
    return `"${APP_NAME}" <${process.env.SMTP_USER}>`;
  }

  async sendTeamInvitation(data) {
    const { email, name, password, loginUrl, invitedBy } = data;
    const info = await this.transporter.sendMail({
      from: this.from(),
      to: email,
      subject: `You're invited to join ${APP_NAME}`,
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

  // ─── Base layout ─────────────────────────────────────────────────────────
  baseLayout(content, previewText = '') {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${APP_NAME}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#F4F6F9;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F6F9;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" border="0">

  <!-- Header — matches portal logo exactly -->
  <tr><td style="background:#FFFFFF;border-radius:12px 12px 0 0;padding:0;overflow:hidden;">
    <div style="background:#0E1117;padding:32px 40px;text-align:center;">

      <!-- Orange R box — exact portal style -->
      <div style="display:inline-block;background:#F97316;border-radius:12px;width:48px;height:48px;line-height:48px;text-align:center;margin-bottom:14px;vertical-align:middle;">
        <span style="font-size:26px;font-weight:800;color:#ffffff;font-family:'Inter',-apple-system,sans-serif;line-height:48px;display:inline-block;">R</span>
      </div>

      <!-- RealNext wordmark — Inter 800 matching portal sidebar logo -->
      <div style="font-size:26px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.2;margin-bottom:6px;">
        RealNext
      </div>

      <!-- Tagline — matches portal subtitle -->
      <div style="font-size:10px;font-weight:600;color:#4B5563;letter-spacing:2px;text-transform:uppercase;font-family:'Inter',-apple-system,sans-serif;">
        REAL ESTATE INTELLIGENCE PLATFORM
      </div>
    </div>
  </td></tr>

  <!-- Orange accent line -->
  <tr><td style="background:#F97316;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- Body -->
  <tr><td style="background:#FFFFFF;padding:40px 40px 32px;">
    ${content}
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#F8FAFC;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
    <p style="font-size:12px;color:#9CA3AF;margin:0 0 8px;font-family:'Inter',sans-serif;">
      Sent by <strong style="color:#6B7280;">${APP_NAME}</strong> &bull; <a href="${APP_URL}" style="color:#F97316;text-decoration:none;">${APP_URL}</a>
    </p>
    <p style="font-size:11px;color:#D1D5DB;margin:0;font-family:'Inter',sans-serif;">
      If you didn't expect this email, you can safely ignore it. &copy; ${year} RealNext. All rights reserved.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
  }

  // ─── Invitation template ──────────────────────────────────────────────────
  invitationTemplate({ name, email, password, loginUrl, invitedBy }) {
    const isExisting = !password || password.includes('existing');
    const firstName = (name || 'there').split(' ')[0];

    const credBlock = isExisting
      ? this.credRow('Email', email) + this.credRow('Password', 'Your existing password')
      : this.credRow('Email', email) + this.credRow('Password', password, true);

    const content = `
      <!-- Greeting -->
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;letter-spacing:-0.3px;">
        Hello, ${firstName}! 👋
      </h1>
      <p style="font-size:15px;color:#6B7280;line-height:1.65;margin:0 0 28px;">
        <strong style="color:#374151;">${invitedBy || 'Your administrator'}</strong> has invited you to join the <strong style="color:#374151;">RealNext Portal</strong>. Your account is active and ready to use.
      </p>

      <!-- Credentials card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:10px;overflow:hidden;margin:0 0 28px;">
        <tr>
          <td style="background:#1A1D23;padding:12px 20px;">
            <span style="font-size:11px;font-weight:700;color:#F97316;text-transform:uppercase;letter-spacing:1px;">
              🔑 &nbsp;Login Credentials
            </span>
          </td>
        </tr>
        ${credBlock}
      </table>

      <!-- CTA Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
        <tr>
          <td style="border-radius:8px;background:#F97316;box-shadow:0 4px 14px rgba(249,115,22,0.35);">
            <a href="${loginUrl}" target="_blank"
              style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;border-radius:8px;">
              Login to RealNext &rarr;
            </a>
          </td>
        </tr>
      </table>

      ${!isExisting ? `
      <!-- Security tip -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;margin:0 0 24px;">
        <tr>
          <td style="padding:14px 18px;">
            <p style="font-size:13px;color:#92400E;margin:0;line-height:1.55;">
              ⚠️ &nbsp;<strong>Security reminder:</strong> Please change your password after your first login via <em>Settings → Account</em>.
            </p>
          </td>
        </tr>
      </table>` : ''}

      <!-- Help text -->
      <p style="font-size:13px;color:#9CA3AF;margin:0;text-align:center;">
        Questions? Reply to this email or contact
        <a href="mailto:${invitedBy}" style="color:#F97316;text-decoration:none;">${invitedBy || 'your administrator'}</a>.
      </p>`;

    return this.baseLayout(content, `${firstName}, you've been invited to join RealNext`);
  }

  credRow(label, value, highlight = false) {
    return `<tr>
          <td style="padding:14px 20px;border-bottom:1px solid #E5E7EB;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="font-size:12px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;width:80px;">${label}</td>
              <td style="font-size:14px;color:${highlight ? '#DC6803' : '#111827'};font-weight:${highlight ? '700' : '500'};font-family:${highlight ? 'Courier New,monospace' : 'inherit'};text-align:right;word-break:break-all;">
                ${value}
              </td>
            </tr></table>
          </td>
        </tr>`;
  }

  // ─── Password reset template ──────────────────────────────────────────────
  passwordResetTemplate({ email, resetUrl }) {
    const content = `
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">Reset Your Password</h1>
      <p style="font-size:15px;color:#6B7280;line-height:1.65;margin:0 0 28px;">
        We received a password reset request for <strong style="color:#374151;">${email}</strong>. Click the button below to choose a new password.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
        <tr>
          <td style="border-radius:8px;background:#F97316;box-shadow:0 4px 14px rgba(249,115,22,0.35);">
            <a href="${resetUrl}" target="_blank"
              style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
              Reset Password &rarr;
            </a>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;margin:0 0 24px;">
        <tr><td style="padding:14px 18px;">
          <p style="font-size:13px;color:#991B1B;margin:0;line-height:1.55;">
            ⏱ &nbsp;<strong>This link expires in 1 hour.</strong> If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
      </table>

      <p style="font-size:12px;color:#9CA3AF;margin:0;">Or paste this link in your browser:</p>
      <p style="font-size:12px;color:#6B7280;background:#F3F4F6;border-radius:6px;padding:10px 14px;margin:8px 0 0;word-break:break-all;font-family:Courier New,monospace;">${resetUrl}</p>`;

    return this.baseLayout(content, 'Password reset request for your RealNext account');
  }

  // ─── Welcome template ─────────────────────────────────────────────────────
  welcomeTemplate({ name }) {
    const firstName = (name || 'there').split(' ')[0];
    const features = [
      ['📊', 'Analytics Dashboard', 'Track lead performance and campaign ROI'],
      ['👥', 'Lead Management', 'Add, assign and nurture leads through the pipeline'],
      ['📢', 'WA Campaigns', 'Send WhatsApp broadcasts and drip sequences'],
      ['🏠', 'Property Inventory', 'Manage your property catalog and sync to WhatsApp'],
    ];

    const featureRows = features.map(([icon, title, sub]) => `
          <tr><td style="padding:10px 20px;border-bottom:1px solid #E5E7EB;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="font-size:20px;width:36px;vertical-align:top;padding-top:2px;">${icon}</td>
              <td style="padding-left:12px;">
                <p style="font-size:14px;font-weight:600;color:#111827;margin:0;">${title}</p>
                <p style="font-size:12px;color:#6B7280;margin:2px 0 0;">${sub}</p>
              </td>
            </tr></table>
          </td></tr>`).join('');

    const content = `
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">Welcome, ${firstName}! 🎉</h1>
      <p style="font-size:15px;color:#6B7280;line-height:1.65;margin:0 0 28px;">
        Your RealNext account is ready. Here's what you can do:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:10px;overflow:hidden;margin:0 0 28px;">
        <tr><td style="background:#1A1D23;padding:12px 20px;">
          <span style="font-size:11px;font-weight:700;color:#F97316;text-transform:uppercase;letter-spacing:1px;">✨ &nbsp;Features Available</span>
        </td></tr>
        ${featureRows}
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
        <tr>
          <td style="border-radius:8px;background:#F97316;box-shadow:0 4px 14px rgba(249,115,22,0.35);">
            <a href="${APP_URL}/dashboard" target="_blank"
              style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
              Open Dashboard &rarr;
            </a>
          </td>
        </tr>
      </table>`;

    return this.baseLayout(content, `Welcome to RealNext, ${firstName}!`);
  }
}

module.exports = new EmailService();