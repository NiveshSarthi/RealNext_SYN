const waService = require('./services/waService');
require('dotenv').config();

async function run() {
    try {
        const campaigns = await waService.getCampaigns({ limit: 5 });
        if (campaigns && campaigns.length > 0) {
            campaigns.forEach(c => {
                console.log(`Campaign: ${c.name || c.id}`);
                console.log(`Status: ${c.status}`);
                console.log(`Stats Keys: ${c.stats ? Object.keys(c.stats).join(', ') : 'No Stats'}`);
                if (c.stats) console.log(`Stats Sent: ${c.stats.sent}`);
                console.log('---');
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
