// Test script to decode and verify the JWT token from the screenshot
const jwt = require('jsonwebtoken');

// Token from the screenshot (truncated, but we can see the pattern)
const tokenFromScreenshot = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // This is just an example

console.log('JWT Token Decoder Test');
console.log('======================\n');

// Instructions for the user
console.log('INSTRUCTIONS:');
console.log('1. Copy the full access_token value from your browser localStorage');
console.log('2. Replace the token variable below with your actual token');
console.log('3. Run this script with: node test_token.js\n');

// Example token to decode (user should replace this)
const token = process.argv[2] || tokenFromScreenshot;

if (!token || token.includes('...')) {
    console.log('ERROR: Please provide a valid token as a command line argument');
    console.log('Usage: node test_token.js YOUR_TOKEN_HERE');
    process.exit(1);
}

try {
    // Decode without verification (just to see the payload)
    const decoded = jwt.decode(token);

    console.log('Decoded Token Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('\n');

    // Check expiration
    if (decoded.exp) {
        const expirationDate = new Date(decoded.exp * 1000);
        const now = new Date();
        const isExpired = expirationDate < now;

        console.log(`Token Expiration: ${expirationDate.toLocaleString()}`);
        console.log(`Current Time: ${now.toLocaleString()}`);
        console.log(`Is Expired: ${isExpired ? 'YES ❌' : 'NO ✅'}`);
        console.log('\n');
    }

    // Check if it has is_super_admin
    if (decoded.is_super_admin !== undefined) {
        console.log(`is_super_admin: ${decoded.is_super_admin ? 'YES ✅' : 'NO ❌'}`);
    } else {
        console.log('is_super_admin: NOT PRESENT ❌');
    }

} catch (error) {
    console.error('Error decoding token:', error.message);
}
