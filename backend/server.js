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

// Initialize App
const app = express();
app.set('trust proxy', 1); // Enable proxy trust for rate limiter
const PORT = process.env.PORT || 5001;

// CORS — must be applied BEFORE helmet to avoid header stripping
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Handle ALL OPTIONS preflight requests first — before any other middleware
app.options('*', cors(corsOptions));
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

// Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Routes
app.use('/api', require('./routes/index'));

// Access Public folder
app.use(express.static(path.join(__dirname, 'public')));

// Basic Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start Server
const startServer = async () => {
  await connectDB();

  // Cron Jobs (restored from previous file view)
  try {
    const cron = require('node-cron');
    cron.schedule('*/2 * * * *', async () => {
      // console.log('[CRON] Running Facebook leads auto-fetch...');
      try {
        // Check if script exists before requiring
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
    console.log(`Server running on port ${PORT}`);
    // Write debug file
    try { fs.writeFileSync('debug_startup.txt', `Started at ${new Date().toISOString()} on port ${PORT}\n`); } catch (e) { }
  });
};

startServer();
