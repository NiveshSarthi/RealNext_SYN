// Quick test to verify the token from localStorage works
// Copy your access_token from localStorage and paste it below

const token = "PASTE_YOUR_TOKEN_HERE";

console.log('Testing token from localStorage...\n');

// Test 1: Decode the token
const jwt = require('jsonwebtoken');
const decoded = jwt.decode(token);

console.log('1. Token Payload:');
console.log(JSON.stringify(decoded, null, 2));
console.log('\n');

// Test 2: Check expiration
if (decoded.exp) {
    const expirationDate = new Date(decoded.exp * 1000);
    const now = new Date();
    const isExpired = expirationDate < now;

    console.log(`2. Token Expiration Check:`);
    console.log(`   Expires: ${expirationDate.toLocaleString()}`);
    console.log(`   Now: ${now.toLocaleString()}`);
    console.log(`   Is Expired: ${isExpired ? 'YES ❌' : 'NO ✅'}`);
    console.log('\n');
}

// Test 3: Check super admin
console.log(`3. Super Admin Check:`);
console.log(`   is_super_admin: ${decoded.is_super_admin ? 'YES ✅' : 'NO ❌'}`);
console.log(`   email: ${decoded.email}`);
console.log('\n');

// Test 4: Make actual API request
const axios = require('axios');

console.log('4. Testing actual API request...');
axios.get('http://localhost:5006/api/admin/features', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
    .then(response => {
        console.log('   ✅ SUCCESS! Features API returned:', response.data.success);
        console.log(`   Total features: ${response.data.data.length}`);
    })
    .catch(error => {
        console.log('   ❌ FAILED!');
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
    });
