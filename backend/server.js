require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { sequelize, testConnection } = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://test.niveshsarthi.com',
  'https://realnext.syndicate.niveshsarthi.com'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Partner-ID']
}));

// Enable pre-flight requests for all routes
app.options('*', cors());

// Compression
app.use(compression());

// Request logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
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
  if (req.accepts('html')) {
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

    // NOTE: Database sync is disabled to avoid conflicts.
    if (process.env.SYNC_DB === 'true') {
      await sequelize.sync({ force: false, alter: false });
      logger.info('Database synchronized');
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
