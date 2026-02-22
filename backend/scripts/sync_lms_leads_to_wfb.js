require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { Lead } = require('../models');
const waService = require('../services/waService');
const FormData = require('form-data');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is highly required.');
    process.exit(1);
}

const syncLeads = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        console.log('Fetching leads with valid phone numbers...');
        const leads = await Lead.find({ phone: { $exists: true, $ne: null, $ne: '' } });
        console.log(`Found ${leads.length} leads with valid phone numbers.`);

        if (leads.length === 0) {
            console.log('No leads to sync. Exiting.');
            process.exit(0);
        }

        // Build CSV String
        // Required Headers by WFB App (Undocumented): name, phone, tags
        let csvContent = 'name,phone,tags\n';

        leads.forEach(lead => {
            // Clean names to avoid CSV breaking
            const safeName = lead.name ? lead.name.replace(/"/g, '""') : 'Unknown';
            const safePhone = lead.phone.replace(/[^0-9+]/g, '');
            // Merge custom tags with lead source/status for better campaign targeting
            const tagsArray = lead.tags || [];
            if (lead.source) tagsArray.push(`source_${lead.source.replace(/,/g, '')}`);
            if (lead.status) tagsArray.push(`status_${lead.status.replace(/,/g, '')}`);
            const safeTags = tagsArray.join('|'); // The external API might prefer comma or pipe delimited inside quotes.
            // Using | just in case, or "Tag1,Tag2". The API documentation says `tags`. 
            // We'll format it as a comma separated list inside quotes.
            const formattedTags = `"${tagsArray.join(', ')}"`;

            csvContent += `"${safeName}",${safePhone},${formattedTags}\n`;
        });

        console.log('CSV mapping complete. Initiating authentication with WFB External API...');

        // Verify WA Auth
        const token = await waService.getToken();
        if (!token) {
            throw new Error('Failed to acquire JWT token from external WFB API context.');
        }

        console.log('Authentication Successful! Uploading CSV data payload to /upload-contacts...');

        // Inject into FormData
        const form = new FormData();
        form.append('file', Buffer.from(csvContent, 'utf-8'), {
            filename: 'lms_migration_sync.csv',
            contentType: 'text/csv',
        });

        // Use waService to upload
        // Note: The waService.uploadContacts needs the proper formatting
        const responseData = await waService.uploadContacts(form);
        console.log('\n==== SYNC COMPLETE ====');
        console.log('WFB Summary:', JSON.stringify(responseData, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        if (error.response?.data) {
            console.error('WFB Response Error:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
};

syncLeads();
