const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: (msg) => logger.debug(msg),
        pool: {
            max: 20,
            min: 5,
            acquire: 60000,
            idle: 10000
        },
        dialectOptions: {
            ssl: false, // Set to true if using SSL
            connectTimeout: 60000
        },
        define: {
            timestamps: true,
            underscored: true, // Use snake_case for columns
            paranoid: true, // Soft deletes (deleted_at)
            freezeTableName: true
        }
    }
);

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection established successfully.');
        return true;
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        throw error;
    }
};

module.exports = { sequelize, testConnection };
