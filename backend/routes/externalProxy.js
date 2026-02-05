const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const { ApiError } = require('../middleware/errorHandler');

const TARGET_URL = process.env.WHATSAPP_API_URL;

if (!TARGET_URL) {
    logger.warn('WHATSAPP_API_URL not defined in .env');
}

/**
 * Proxy handler for External API
 * Forwards all requests to the configured External API URL
 */
const axios = require('axios');

router.all('*', async (req, res, next) => {
    try {
        if (!TARGET_URL) {
            throw ApiError.internal('External API URL not configured');
        }

        // Construct target URL
        // req.url includes the path relative to this router, including query string
        const url = `${TARGET_URL}${req.url}`;
        const method = req.method;

        logger.info(`Proxying ${method} request to: ${url}`);

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...req.headers
        };

        // Remove host and connection headers to avoid conflicts
        delete headers.host;
        delete headers['content-length'];
        delete headers.connection;

        const config = {
            method,
            url,
            headers,
            // Forward body for mutation requests
            data: ['POST', 'PUT', 'PATCH'].includes(method) ? req.body : undefined,
            validateStatus: () => true // Resolve promise for all status codes so we can forward them
        };

        const response = await axios(config);

        // Forward status code
        res.status(response.status);

        // Forward headers
        Object.keys(response.headers).forEach(key => {
            res.setHeader(key, response.headers[key]);
        });

        // Send back data
        res.json(response.data);

    } catch (error) {
        logger.error(`Proxy Error: ${error.message}`);
        if (error.response) {
            logger.error(`Upstream Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            res.status(error.response.status).json(error.response.data);
        } else {
            next(error);
        }
    }
});

module.exports = router;
