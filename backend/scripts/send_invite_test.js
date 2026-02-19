require('dotenv').config();
const emailService = require('../services/emailService');

async function sendInvite() {
    try {
        const result = await emailService.sendTeamInvitation({
            email: 'Ratnakerkumar56@gmail.com',
            name: 'Ratnakerkumar',
            password: '(your existing password — please use Forgot Password if needed)',
            loginUrl: process.env.FRONTEND_URL + '/auth/login' || 'https://realnext.in/auth/login',
            invitedBy: 'Administrator'
        });
        console.log('SUCCESS:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('FAILED:', err.message);
        console.error('Full error:', err);
    }
}

sendInvite();
