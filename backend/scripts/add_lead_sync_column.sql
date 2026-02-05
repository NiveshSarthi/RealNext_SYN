-- Add is_lead_sync_enabled column to facebook_page_connections
ALTER TABLE facebook_page_connections 
ADD COLUMN IF NOT EXISTS is_lead_sync_enabled BOOLEAN DEFAULT true NOT NULL;

-- Add is_active column to facebook_lead_forms (optional, for future use)
ALTER TABLE facebook_lead_forms 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'facebook_page_connections' 
AND column_name = 'is_lead_sync_enabled';
