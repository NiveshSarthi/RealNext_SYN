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
router.all('*', async (req, res, next) => {
    try {
        if (!TARGET_URL) {
            throw ApiError.internal('External API URL not configured');
        }

        const url = `${TARGET_URL}${req.url}`;
        const method = req.method;

        logger.info(`Proxying ${method} request to: ${url}`);

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...req.headers
        };

        // Remove host header to avoid conflicts
        delete headers.host;
        delete headers['content-length'];

        const options = {
            method,
            headers,
        };

        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            // If body-parser has already parsed the body, stringify it
            if (req.body && Object.keys(req.body).length > 0) {
                options.body = JSON.stringify(req.body);
            }
        }

        const response = await fetch(url, options);

        // Forward status code
        res.status(response.status);

        // Forward headers (optional, but good for CORS or content-type)
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        // Parse response
        // We assume JSON response for this API
        const data = await response.json();

        res.json(data);

    } catch (error) {
        logger.error(`Proxy Error: ${error.message}`);
        // If response.json() fails it might be non-json response
        // But for now let's handle generic errors
        next(error);
    }
});

module.exports = router;
