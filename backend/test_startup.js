try {
    console.log('Testing server start-up requires and syntax...');
    require('./routes/admin/clients');
    require('./routes/admin/index');
    require('./routes/index');
    console.log('✅ All routes loaded successfully without MODULE_NOT_FOUND');
} catch (error) {
    console.error('❌ Failed to load routes:', error.message);
    if (error.stack) {
        const stack = error.stack.split('\n');
        console.error(stack.slice(0, 5).join('\n'));
    }
    process.exit(1);
}
