const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        console.log(`DEBUG: Connecting to MongoDB with URI: ${mongoURI.substring(0, 20)}...`);

        await mongoose.connect(mongoURI);
        logger.info('MongoDB connection established successfully.');
        return true;
    } catch (error) {
        logger.error('Unable to connect to the MongoDB database:', error);
        throw error;
    }
};

// Export mongoose instance and connection function
module.exports = { mongoose, connectDB, testConnection: connectDB };

