const { sequelize } = require('../config/database');

async function addLeadSyncToggle() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Add is_lead_sync_enabled to facebook_page_connections
        await sequelize.query(`
            ALTER TABLE facebook_page_connections 
            ADD COLUMN IF NOT EXISTS is_lead_sync_enabled BOOLEAN DEFAULT true NOT NULL;
        `);
        console.log('✅ Added is_lead_sync_enabled to facebook_page_connections');

        // Add is_active to facebook_lead_forms
        await sequelize.query(`
            ALTER TABLE facebook_lead_forms 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;
        `);
        console.log('✅ Added is_active to facebook_lead_forms');

        console.log('\n✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addLeadSyncToggle();
