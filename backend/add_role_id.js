const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function addRoleIdColumn() {
    try {
        await client.connect();
        console.log('Connected to database.');

        // Check if roles table exists first to avoid FK error
        const rolesCheck = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'roles'`);

        if (rolesCheck.rows.length === 0) {
            console.log('Roles table does NOT exist. Creating it simple...');
            await client.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id UUID PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                permissions JSONB DEFAULT '[]',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
         `);
            console.log('Roles table created.');
        }

        await client.query(`
      ALTER TABLE tenant_users 
      ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);
    `);

        console.log('Column role_id added successfully.');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await client.end();
    }
}

addRoleIdColumn();
