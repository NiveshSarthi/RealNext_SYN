const axios = require('axios');
const logger = require('../config/logger');

const WA_API_URL = process.env.WHATSAPP_API_URL || 'https://ckk4swcsssos844w0ccos4og.72.61.248.175.sslip.io';
// Credentials hardcoded as per frontend/utils/api.js for now, ideally in env
const WA_CREDENTIALS = {
    email: 'Syndicate@niveshsarthi.com',
    password: 'Syndicate@123'
};

class WaService {
    constructor() {
        this.token = null;
        this.tokenExpiry = null;
        this.api = axios.create({
            baseURL: WA_API_URL,
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000
        });

        // Add interceptor to inject token
        this.api.interceptors.request.use(async (config) => {
            if (config.url === '/auth/login') return config; // Skip for login

            const token = await this.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    async getToken() {
        // If token exists and is valid (buffer of 5 mins)
        if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.token;
        }

        return this.login();
    }

    async login() {
        try {
            logger.info('Authenticating with External WhatsApp API...');
            const response = await axios.post(`${WA_API_URL}/auth/login`, WA_CREDENTIALS);

            if (response.data && response.data.access_token) {
                this.token = response.data.access_token;
                // Assume 1 hour expiry if not provided
                this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
                logger.info('External WhatsApp API Login Successful');
                return this.token;
            } else {
                throw new Error('No access token in response');
            }
        } catch (error) {
            logger.error('External WhatsApp API Login Failed:', error.message);
            throw error;
        }
    }

    async createCampaign(payload) {
        try {
            logger.info('Sending campaign creation request to External API...');
            const response = await this.api.post('/api/v1/campaigns', payload);
            logger.info('External Campaign Created:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Failed to create campaign in External API:', error.message);
            if (error.response) {
                logger.error('External API Response:', JSON.stringify(error.response.data));
            }
            throw error;
        }
    }

    async createContact(payload) {
        try {
            logger.info(`Syncing contact ${payload.phone} with External API...`);
            const response = await this.api.post('/api/v1/contacts', payload);
            logger.info('External Contact Synced:', response.data);
            return response.data;
        } catch (error) {
            // Check if contact already exists (often returns 409 or has the ID in error detail)
            if (error.response?.status === 409 || error.message.includes('already exists')) {
                logger.info(`Contact ${payload.phone} already exists in External API`);
                return error.response.data; // Return existing data if available
            }
            logger.error('Failed to sync contact with External API:', error.message);
            throw error;
        }
    }

    async getCampaigns(params = {}) {
        try {
            logger.info('Fetching campaigns from External API...');
            const response = await this.api.get('/api/v1/campaigns', { params });
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch campaigns from External API:', error.message);
            throw error;
        }
    }

    async getCampaignDetail(id) {
        try {
            logger.info(`Fetching campaign detail for ${id} from External API...`);
            const response = await this.api.get(`/api/v1/campaigns/${id}`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to fetch campaign detail for ${id} from External API:`, error.message);
            throw error;
        }
    }

    // Helper to format local campaign to external payload
    formatPayload(localCampaign, contactIds) {
        return {
            template_name: localCampaign.template_name,
            language_code: localCampaign.template_data?.language_code || 'en_US',
            contact_ids: contactIds, // Must be provided as array of IDs
            variable_mapping: localCampaign.template_data?.variable_mapping || {},
            schedule_time: localCampaign.scheduled_at ? localCampaign.scheduled_at.toISOString() : null
        };
    }
}

module.exports = new WaService();
