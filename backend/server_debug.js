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
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Partner-ID']
}));
app.use(compression());
app.use(morgan('combined', {
    stream: { write: (message) => console.log('HTTP:', message.trim()) } // Log to console directly
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// app.use('/api/', rateLimiter); // Disable rate limit for debug

app.get('/health', (req, res) => {
    res.json({ status: 'ok-debug' });
});

app.use('/api', require('./routes'));

app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint not found', path: req.path });
});
app.use(errorHandler);

const PORT = 5001; // DEBUG PORT

const startServer = async () => {
    try {
        console.log(`\n\n=== DEBUG SERVER STARTED ON PORT ${PORT} ===`);
        await testConnection();
        console.log('Database connected.');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
