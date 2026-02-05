require('dotenv').config();
const { sequelize } = require('../config/database');

async function addMissingColumn() {
    try {
        console.log('🔌 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected');

        console.log('\n📝 Adding is_lead_sync_enabled column...');

        // Use raw query to add column if not exists
        await sequelize.query(`
            ALTER TABLE facebook_page_connections 
            ADD COLUMN IF NOT EXISTS is_lead_sync_enabled BOOLEAN DEFAULT true NOT NULL;
        `);

        console.log('✅ Column is_lead_sync_enabled added successfully');

        console.log('\n📝 Adding is_active column to facebook_lead_forms...');
        await sequelize.query(`
            ALTER TABLE facebook_lead_forms 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;
        `);

        console.log('✅ Column is_active added successfully');

        // Verify the columns exist
        console.log('\n🔍 Verifying columns...');
        const [results] = await sequelize.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'facebook_page_connections' 
            AND column_name = 'is_lead_sync_enabled';
        `);

        if (results.length > 0) {
            console.log('✅ Verification successful:', results[0]);
        } else {
            console.log('⚠️ Column not found in verification');
        }

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

addMissingColumn();
