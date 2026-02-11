console.log('Testing route loading...');

try {
    console.log('Loading ./routes...');
    const routes = require('./routes');
    console.log('✓ Routes loaded successfully');
    console.log('Type:', typeof routes);
} catch (error) {
    console.error('✗ Failed to load routes:');
    console.error(error);
    process.exit(1);
}
