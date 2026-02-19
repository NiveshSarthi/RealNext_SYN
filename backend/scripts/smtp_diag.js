/**
 * Production SMTP Diagnostic
 * Tests with exact production SMTP credentials
 */
const nodemailer = require('nodemailer');

// Exact production .env values
const config = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'techniveshsarthi@gmail.com',
        pass: 'tsvy nyfg cicd qpha'
    }
};

const transporter = nodemailer.createTransport(config);

async function run() {
    console.log('--- SMTP Diagnostic ---');
    console.log('Host:', config.host);
    console.log('Port:', config.port);
    console.log('User:', config.auth.user);
    console.log('Pass length:', config.auth.pass.length);
    console.log('');

    // Step 1: Verify connection
    console.log('[1] Verifying SMTP connection...');
    try {
        await transporter.verify();
        console.log('    ✓ SMTP connection OK');
    } catch (e) {
        console.error('    ✗ SMTP connection FAILED:', e.message);
        console.error('    Code:', e.code, '| Response:', e.response);
        process.exit(1);
    }

    // Step 2: Send test email
    console.log('[2] Sending test email to Ratnakerkumar56@gmail.com...');
    try {
        const info = await transporter.sendMail({
            from: '"RealNext Team" <techniveshsarthi@gmail.com>',
            to: 'Ratnakerkumar56@gmail.com',
            subject: 'Test - RealNext Invite Email Diagnostic',
            html: '<p>This is a diagnostic test from the production email system.</p>'
        });
        console.log('    ✓ Email sent! MessageId:', info.messageId);
        console.log('    Accepted:', info.accepted);
        console.log('    Rejected:', info.rejected);
    } catch (e) {
        console.error('    ✗ Send FAILED:', e.message);
        console.error('    Code:', e.code);
        console.error('    Response:', e.response);
    }
}

run();
