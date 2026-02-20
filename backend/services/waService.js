const axios = require('axios');
const logger = require('../config/logger');

const WA_API_URL = process.env.WHATSAPP_API_URL || 'https://wfb.backend.niveshsarthi.com';
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

    // --- FLOWS ---
    async getFlows() {
        try {
            logger.info('Fetching flows from External API...');
            const response = await this.api.get('/flows');
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch flows from External API:', error.message);
            throw error;
        }
    }

    async createFlow(flowData) {
        try {
            logger.info('Creating flow in External API...');
            const response = await this.api.post('/flows', flowData);
            return response.data;
        } catch (error) {
            logger.error('Failed to create flow in External API:', error.message);
            throw error;
        }
    }

    async getFlow(id) {
        try {
            logger.info(`Fetching flow ${id} from External API...`);
            const response = await this.api.get(`/flows/${id}`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to fetch flow ${id} from External API:`, error.message);
            throw error;
        }
    }

    async updateFlow(id, flowData) {
        try {
            logger.info(`Updating flow ${id} in External API...`);
            const response = await this.api.put(`/flows/${id}`, flowData);
            return response.data;
        } catch (error) {
            logger.error(`Failed to update flow ${id} in External API:`, error.message);
            throw error;
        }
    }

    async deleteFlow(id) {
        try {
            logger.info(`Deleting flow ${id} in External API...`);
            const response = await this.api.delete(`/flows/${id}`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to delete flow ${id} in External API:`, error.message);
            throw error;
        }
    }

    // --- TEMPLATES ---
    async createTemplate(templateData) {
        try {
            logger.info('Sending template creation request to External API...');
            // Using /templates per doc for "Create a new template on Meta"
            const response = await this.api.post('/templates', templateData);
            logger.info('External Template Created:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Failed to create template in External API:', error.message);
            throw error;
        }
    }

    async getTemplates(params = {}) {
        try {
            logger.info('Fetching templates from External API...');
            // Using /templates to Sync & List templates from Meta
            const response = await this.api.get('/templates', { params, timeout: 5000 });
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch templates from External API:', error.message);
            // Don't throw, return empty array to allow local fallback
            return [];
        }
    }

    // --- CAMPAIGNS ---
    async createCampaign(campaignData) {
        try {
            const { template_name, contact_ids, template_data } = campaignData;
            logger.info('Sending campaign creation request to External API...');
            // Using /campaigns/send per doc for "Create & start/schedule a campaign"
            const response = await this.api.post('/campaigns/send', campaignData);
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

    async getCampaigns(params = {}) {
        try {
            logger.info('Fetching campaigns from External API...');
            const response = await this.api.get('/campaigns', { params, timeout: 5000 });
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch campaigns from External API:', error.message);
            throw error;
        }
    }

    async getCampaignDetail(id) {
        try {
            // Note: The doc lists /campaigns/{campaign_id}/logs but not a detail endpoint in section 6. 
            // Section 7 has /api/v1/campaigns, assuming we might need logs or standard GET if exists.
            // Using /campaigns/{id}/logs for now if detail is needed, or just GET /campaigns
            logger.info(`Fetching campaign detail for ${id} from External API...`);
            // Attempting simple GET, if 404 might need logs endpoint for stats
            const response = await this.api.get(`/campaigns/${id}/logs`, { timeout: 5000 });
            return response.data;
        } catch (error) {
            logger.error(`Failed to fetch campaign detail for ${id} from External API:`, error.message);
            throw error;
        }
    }

    // --- CONTACTS ---
    async createContact(payload) {
        const contactIdentifier = payload.number || payload.phone;
        try {
            logger.info(`Syncing contact ${contactIdentifier} with External API...`);
            const response = await this.api.post('/contacts', payload);
            logger.info('External Contact Synced:', response.data);
            return response.data;
        } catch (error) {
            const errorDetail = error.response?.data?.detail || error.message;

            // Check if contact already exists
            if (error.response?.status === 409 ||
                errorDetail.includes('already exists') ||
                error.message.includes('already exists')) {

                logger.info(`Contact ${contactIdentifier} already exists. Fetching details...`);

                try {
                    // Try to fetch the existing contact to get its ID
                    const existingContacts = await this.getContacts({ search: contactIdentifier });

                    // Handle response structure differences
                    const contacts = Array.isArray(existingContacts) ? existingContacts : (existingContacts?.contacts || []);

                    if (contacts.length > 0) {
                        const found = contacts.find(c => c.number === contactIdentifier || c.phone === contactIdentifier);

                        if (found) {
                            logger.info(`Found existing contact ID for ${contactIdentifier}: ${found._id || found.id}`);
                            return found;
                        } else {
                            logger.info(`Using first search result for ${contactIdentifier}`);
                            return contacts[0];
                        }
                    }
                } catch (fetchError) {
                    logger.warn(`Failed to fetch existing contact details for ${contactIdentifier}:`, fetchError.message);
                }

                // If fetch failed or no ID found, return error data if it has ID
                if (error.response?.data?.id || error.response?.data?._id) {
                    return error.response.data;
                }
            }

            logger.error('Failed to sync contact with External API:', error.message);
            throw error;
        }
    }

    async getContacts(params = {}) {
        try {
            logger.info(`Fetching contacts from External API with params: ${JSON.stringify(params)}`);
            const response = await this.api.get('/contacts', { params });
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch contacts from External API:', error.message);
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
