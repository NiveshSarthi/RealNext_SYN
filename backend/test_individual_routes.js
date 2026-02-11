console.log('Testing individual route loading...');

const routesToTest = [
    './modules/lms/leads',
    './modules/lms/routes',
    './modules/wa-marketing/routes/campaigns',
    './modules/wa-marketing/routes/templates',
    './modules/wa-marketing/routes/workflows',
    './modules/wa-marketing/routes/quickReplies',
    './modules/wa-marketing/routes/metaAds',
    './modules/inventory/routes'
];

for (const route of routesToTest) {
    try {
        console.log(`Loading ${route}...`);
        require(route);
        console.log(`✓ ${route} loaded successfully`);
    } catch (error) {
        console.error(`✗ Failed to load ${route}:`);
        console.error(error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

console.log('All routes loaded successfully!');
