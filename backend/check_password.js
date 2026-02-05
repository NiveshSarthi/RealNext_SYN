const { Client } = require('pg');
const bcrypt = require('bcryptjs'); // Must match what backend uses
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function checkPassword() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const res = await client.query(`
      SELECT id, email, password_hash 
      FROM users 
      WHERE email = 'tenant-user@testcompany.com';
    `);

        if (res.rows.length === 0) {
            console.log('User not found.');
            return;
        }

        const user = res.rows[0];
        const testPassword = 'Test123!';

        console.log('Checking password for:', user.email);
        console.log('Stored Hash:', user.password_hash);

        const isMatch = await bcrypt.compare(testPassword, user.password_hash);

        if (isMatch) {
            console.log('SUCCESS: Password "Test123!" matches the stored hash.');
        } else {
            console.log('FAILURE: Password "Test123!" does NOT match the stored hash.');

            // Attempt to re-hash and update if needed (simulate fix)
            const newHash = await bcrypt.hash(testPassword, 10);
            console.log('New Hash would be:', newHash);
            console.log('To fix, you might need to update the password.');
        }

    } catch (err) {
        console.error('Error checking password:', err);
    } finally {
        await client.end();
    }
}

checkPassword();
