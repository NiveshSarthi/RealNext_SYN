const waService = require('./services/waService');
require('dotenv').config();

async function verify() {
    try {
        console.log('--- Inspecting External API Campaign Structure ---');
        const campaigns = await waService.getCampaigns({ limit: 10 });

        if (campaigns && campaigns.length > 0) {
            console.log(`Found ${campaigns.length} campaigns.`);
            const first = campaigns[0];
            console.log('\nSample Campaign Keys:', Object.keys(first));
            console.log('\nSample Campaign Data:', JSON.stringify(first, null, 2));

            if (first.stats) {
                console.log('\nStats Structure:', Object.keys(first.stats));
            }
        } else {
            console.log('No campaigns found in external API.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

verify();
