const files = [
    './routes/auth',
    './routes/subscription',
    './routes/admin/index',
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

console.log('--- EXPORT TEST ---');
files.forEach(file => {
    try {
        const mod = require(file);
        const type = typeof mod;
        const isRouter = type === 'function' && mod.name === 'router';
        console.log(`${file}: ${type} (isRouter: ${isRouter})`);
        if (!mod || (type !== 'function')) {
            console.error(`❌ INVALID EXPORT in ${file}: ${type}`);
        }
    } catch (error) {
        console.error(`❌ LOAD ERROR in ${file}: ${error.message}`);
    }
});
