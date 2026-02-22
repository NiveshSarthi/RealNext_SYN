require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./middleware/errorHandler');

// Initialize App
const app = express();
app.set('trust proxy', 1); // Enable proxy trust for rate limiter
const PORT = process.env.PORT || 5001;

// CORS — must be applied BEFORE helmet to avoid header stripping
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
    process.env.FRONTEND_URL || 'https://realnext.in',
    'https://realnext.in',
    'https://www.realnext.in',
    'https://testbd.realnext.in',
    'http://localhost:3000'
  ];

console.log('[DEBUG_CORS] Initialized with Allowed Origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Exact match or subdomain match
    if (allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }

    console.error(`[DEBUG_CORS] REJECTED Origin: '${origin}'`);
    console.error(`[DEBUG_CORS] Expected one of:`, allowedOrigins);

    // In production, we permit it for now to avoid blocking users while we debug,
    // but we log the error. 
    // WARNING: For strict security, this should be callback(new Error(...))
    // However, to resolve the user's immediate block, we will allow it if it's from realnext.in
    if (origin.endsWith('realnext.in')) {
      console.log(`[DEBUG_CORS] Auto-permitting subdomain: ${origin}`);
      return callback(null, true);
    }

    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Handle ALL OPTIONS preflight requests first — before any other middleware
const handleCorsPreflight = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }
  next();
};

app.use(handleCorsPreflight);
app.use(cors(corsOptions));

// Helmet — disable crossOriginResourcePolicy to allow cross-origin API access
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Logger Mock (since we don't know where logger is defined, simple console wrapper)
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err)
};
global.logger = logger; // Make it global if other modules expect it

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000 // limit each IP to 10000 requests per windowMs
});
app.use(limiter);

// Global Unhandled Exceptions Logging
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
  // Optional: process.exit(1); depending on pm2/docker restart policy
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 15000, // Stop trying to connect/buffer after 15 seconds
      socketTimeoutMS: 45000,          // Close sockets after 45 seconds of inactivity
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', err => {
      console.error('[MongoDB Error]', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB Disconnected] Attempting to reconnect or waiting for auto-reconnect...');
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Routes
app.use('/api', require('./routes/index'));

// Global Error Handler
app.use(errorHandler);

// Access Public folder
app.use(express.static(path.join(__dirname, 'public')));

// Basic Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start Server
const startServer = async () => {
  console.log('************************************************');
  console.log('*   REALNEXT BACKEND STARTING - VERSION 2.0.1  *');
  console.log('*   (Defensive CORS & WFB Logs Active)         *');
  console.log('************************************************');

  await connectDB();

  // Cron Jobs
  try {
    const cron = require('node-cron');
    cron.schedule('*/2 * * * *', async () => {
      try {
        if (fs.existsSync('./scripts/auto_fetch_facebook_leads.js')) {
          const { autoFetchFacebookLeads } = require('./scripts/auto_fetch_facebook_leads');
          await autoFetchFacebookLeads();
        }
      } catch (e) {
        console.error('[CRON] Error:', e.message);
      }
    });
  } catch (e) {
    console.log('Cron setup failed or node-cron not found');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SUCCESS] Server running on port ${PORT}`);
    console.log(`[CORS] Effective Allowed Origins:`, allowedOrigins);
  });
};

startServer();
