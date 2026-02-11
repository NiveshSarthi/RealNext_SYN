const files = [
    './config/database',
    './config/logger',
    './middleware/errorHandler',
    './models/index',
    './services/authService',
    './routes/index',
    './server'
];

console.log('--- STARTING LOAD TEST ---');
files.forEach(file => {
    try {
        console.log(`Testing: ${file}`);
        require(file);
        console.log(`✅ Success: ${file}`);
    } catch (error) {
        console.error(`❌ FAILED: ${file}`);
        console.error(error.stack);
        process.exit(1);
    }
});
console.log('--- ALL FILES LOADED SUCCESSFULLY ---');
