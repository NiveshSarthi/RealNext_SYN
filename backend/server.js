// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  // Start listening continuously
  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`CRITICAL: Server listening on PORT ${PORT}`);
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }

  // Connect to DB asynchronously
  try {
    dbStatus = 'connecting';
    await testConnection();
    dbStatus = 'connected';
    console.log(`CRITICAL: Connected to database: ${mongoose.connection.name}`);

    // Start Facebook leads auto-fetch cron job
    console.log('🔄 Starting Facebook leads auto-fetch cron job...');
    const cron = require('node-cron');

    // Lock to prevent overlapping runs
    let isRunning = false;

    // Run every 2 minutes (more reasonable for API limits)
    cron.schedule('*/2 * * * *', async () => {
      if (isRunning) {
        console.log('[CRON] Facebook leads auto-fetch already running, skipping...');
        return;
      }

      try {
        isRunning = true;
        console.log('[CRON] Running Facebook leads auto-fetch...');
        const { autoFetchFacebookLeads } = require('./scripts/auto_fetch_facebook_leads');
        await autoFetchFacebookLeads();
        console.log('[CRON] Facebook leads auto-fetch completed successfully');
      } catch (error) {
        console.error('[CRON] Facebook leads auto-fetch failed:', error.message);
      } finally {
        isRunning = false;
      }
    });

    console.log('✅ Facebook leads auto-fetch cron job started (runs every 2 minutes)');

    // NOTE: Seeding is handled if SYNC_DB is true
