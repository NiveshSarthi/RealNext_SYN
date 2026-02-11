const routes = [
    './routes/auth',
    './routes/subscription',
    './routes/admin',
    './routes/client',
    './routes/team',
    './routes/roles',
    './modules/lms/leads',
    './modules/wa-marketing/routes/campaigns',
    './modules/wa-marketing/routes/templates',
    './modules/wa-marketing/routes/workflows',
    './routes/analytics',
    './routes/network',
    './modules/wa-marketing/routes/quickReplies',
    './modules/inventory/routes',
    './modules/lms/routes',
    './modules/wa-marketing/routes/metaAds',
    './routes/payments',
    './routes/externalProxy'
];

console.log('--- STARTING ALL ROUTES LOAD TEST ---');
routes.forEach(route => {
    try {
        console.log(`Testing: ${route}`);
        require(route);
        console.log(`✅ Success: ${route}`);
    } catch (error) {
        console.error(`❌ FAILED: ${route}`);
        console.error(error.stack);
        // Don't exit yet, check others
    }
});
console.log('--- LOAD TEST FINISHED ---');
