console.log('--- SERVER STARTING ---');
require('dotenv').config();

const express = require('express');

const cors = require('cors');

const helmet = require('helmet');

const morgan = require('morgan');

const compression = require('compression');


const { testConnection, mongoose } = require('./config/database');

const logger = require('./config/logger');

const errorHandler = require('./middleware/errorHandler');

const rateLimiter = require('./middleware/rateLimiter');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware

// CORS configuration - Moved to the TOP before helmet
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  'https://test.niveshsarthi.com',
  'https://testbd.niveshsarthi.com',
  'https://realnext.syndicate.niveshsarthi.com',
  'https://realnext.in',
  /\.realnext\.in$/,
  /^(https?:\/\/)?(www\.)?niveshsarthi\.com$/,
  /^(https?:\/\/)?(www\.)?realnext\.in$/,
  /\.niveshsarthi\.com$/,
  /\.realnext\.in$/
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Regexp check
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      // Direct match
      if (allowedOrigin === origin) return true;
      // Handle potential trailing slash in allowedOrigin
      if (typeof allowedOrigin === 'string' && allowedOrigin.replace(/\/$/, '') === origin) return true;
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`Blocked by CORS: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Client-ID',
    'X-Tenant-ID',
    'Accept',
    'X-Requested-With'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
// Handle pre-flight for all routes
app.options('*', cors(corsOptions));

// Security middleware - After CORS
app.use(helmet({
  crossOriginResourcePolicy: false, // Disable to prevent conflicts with CORS
}));

// Compression

app.use(compression());

// Request logging

app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// API Version for Deployment Verification
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.1',
    timestamp: new Date().toISOString(),
    deployed_at: '2026-02-13T14:20:00Z', // Update this manually on deploy
    message: 'Includes fix for contact sync payload (number vs phone) and specific error reporting.'
  });
});
}));

// Body parsing

app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting

app.use('/api/', rateLimiter);

// Health check endpoint
let dbStatus = 'unknown';
let dbError = null;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      status: dbStatus,
      error: dbError ? dbError.message : null
    }
  });
});

const path = require('path');

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'public')));

// API Routes - using the centralized routes index


app.use('/api', require('./routes'));

// 404 handler
app.use((req, res, next) => {
  // If the request accepts html, it's likely a navigation request
  // so we serve index.html for the SPA
  // BUT NOT for /api routes
  if (req.accepts('html') && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    return;
  }

  // Otherwise, if it's an API request or asset that wasn't found
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use(errorHandler);

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

    // NOTE: Seeding is handled if SYNC_DB is true
    if (process.env.SYNC_DB === 'true') {
      logger.info('Performing database seeding check...');

      // Seed Super Admin if defined
      // Seed Super Admin if defined
      if (process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD) {
        const { User, Client, ClientUser } = require('./models');
        const adminEmail = process.env.SUPER_ADMIN_EMAIL;
        const adminPass = process.env.SUPER_ADMIN_PASSWORD;

        // 1. Super Admin
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
          logger.info('Seeding Super Admin...');
          const user = await User.create({
            email: adminEmail,
            password_hash: adminPass,
            name: 'Super Admin',
            status: 'active',
            is_super_admin: true,
            email_verified: true
          });

          const client = await Client.create({
            name: 'RealNext Admin',
            email: adminEmail,
            status: 'active',
            environment: 'production'
          });

          await ClientUser.create({
            client_id: client._id,
            user_id: user._id,
            role: 'admin',
            is_owner: true
          });
          logger.info('Super Admin seeded successfully');
        }

        // 2. Default Test Client Admin
        const clientEmail = 'client-admin@testcompany.com';
        const clientPass = 'Test123!';
        const existingClientAdmin = await User.findOne({ email: clientEmail });
        if (!existingClientAdmin) {
          logger.info('Seeding Test Client Admin...');
          const cUser = await User.create({
            email: clientEmail,
            password_hash: clientPass,
            name: 'Client Admin',
            status: 'active',
            email_verified: true
          });

          // Calculate trial end (14 days)
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 14);

          const testClient = await Client.create({
            name: 'Test Company Ltd',
            email: clientEmail,
            status: 'active',
            plan_type: 'trial',
            trial_ends_at: trialEnd
          });

          await ClientUser.create({
            client_id: testClient._id,
            user_id: cUser._id,
            role: 'admin',
            is_owner: true
          });
          logger.info('Test Client Admin seeded');

          // 3. Regular Client User
          const regUserEmail = 'client-user@testcompany.com';
          const existingRegUser = await User.findOne({ email: regUserEmail });
          if (!existingRegUser) {
            logger.info('Seeding Regular Client User...');
            const rUser = await User.create({
              email: regUserEmail,
              password_hash: 'Test123!',
              name: 'Regular User',
              status: 'active',
              email_verified: true
            });

            await ClientUser.create({
              client_id: testClient._id,
              user_id: rUser._id,
              role: 'user',
              is_owner: false
            });
            logger.info('Regular Client User seeded');
          }
        }
      }
    } else {
      logger.info('Database sync skipped. Use migrations or set SYNC_DB=true');
    }

  } catch (error) {
    logger.error('Failed to connect to database:', error);
    dbStatus = 'failed';
    dbError = error;
  }
};

startServer();

module.exports = app;
