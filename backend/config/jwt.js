module.exports = {
    jwt: {
        accessSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-me',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    }
};
