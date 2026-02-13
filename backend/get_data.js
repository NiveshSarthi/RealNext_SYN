const waService = require('./services/waService');
const fs = require('fs');
require('dotenv').config();

async function run() {
    try {
        const campaigns = await waService.getCampaigns({ limit: 5 });
        fs.writeFileSync('raw_campaigns.json', JSON.stringify(campaigns, null, 2));
        console.log('DONE');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
