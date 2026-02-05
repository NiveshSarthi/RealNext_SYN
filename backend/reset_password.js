const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function resetPassword() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // Hash new password
        const newPassword = 'Test123!';
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        // Update user
        const res = await client.query(`
      UPDATE users 
      SET password_hash = $1 
      WHERE email = 'tenant-user@testcompany.com';
    `, [newHash]);

        console.log(`Updated password for tenant-user@testcompany.com. Result: ${res.rowCount} row(s) updated.`);

    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        await client.end();
    }
}

resetPassword();
