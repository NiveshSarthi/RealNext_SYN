const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTc0N2ViODc3ZjRjZjllY2U3ZWUxNDMiLCJyb2xlIjoiYWRtaW4iLCJvcmdfaWQiOiI2OTc0N2ViODc3ZjRjZjllY2U3ZWUxNDIiLCJleHAiOjE3NzA5NzMyODV9.NsaqcVQ9Ly43CR9PQhrhqA6P10TJxByO5kadyjfoXG8';

console.log('🔄 TRIGGERING FORM SYNC...\n');

const options = {
    hostname: 'localhost',
    port: 5059,
    path: '/api/meta-ads/sync-forms',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': 0
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Status: ${res.statusCode}\n`);
        try {
            const result = JSON.parse(data);
            console.log('📊 SYNC RESULTS:');
            console.log('=====================================');
            
            if (result.summary) {
                console.log(`✅ Total Forms Found: ${result.summary.totalFormsFound || 0}`);
                console.log(`✨ New Forms Created: ${result.summary.newFormsCount || 0}`);
                console.log(`🔄 Forms Updated: ${result.summary.updatedFormsCount || 0}`);
                console.log(`⏭️  Skipped: ${result.summary.skippedForms || 0}`);
            } else {
                console.log(JSON.stringify(result, null, 2));
            }
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
    console.error('\n⚠️  Make sure:');
    console.error('  1. Backend server is running on port 5000');
    console.error('  2. Your token is valid and not expired');
});

req.end();
