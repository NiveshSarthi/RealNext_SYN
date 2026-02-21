const axios = require('axios');
const https = require('https');
const logger = require('../config/logger');

// Allow legacy SSL connections - required for the external WFB API
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const WA_API_URL = process.env.WHATSAPP_API_URL || 'https://wfb.backend.niveshsarthi.com';
// API base includes /api/v1 prefix as per API documentation
const WA_API_BASE = `${WA_API_URL}/api/v1`;
// Credentials read from environment variables
const WA_CREDENTIALS = {
    email: process.env.WA_EMAIL || 'testorg@gmail.com',
    password: process.env.WA_PASSWORD || '123'
};

class WaService {
    constructor() {
        this.token = null;
        this.tokenExpiry = null;
        this.api = axios.create({
            baseURL: WA_API_URL, // Root URL: https://wfb.backend.niveshsarthi.com
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000,
            httpsAgent // Use custom agent for all requests
        });

        // Add interceptor to inject auth token to every non-login request
        this.api.interceptors.request.use(async (config) => {
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
            // Ensure we use the latest credentials from process.env
            const credentials = {
                email: process.env.WA_EMAIL || 'testorg@gmail.com',
                password: process.env.WA_PASSWORD || '123'
            };

            console.log(`[DEBUG_AUTH] Attempting login for: ${credentials.email}`);

            // Login is at root level
            const response = await axios.post(`${WA_API_URL}/auth/login`, credentials, { httpsAgent });

            console.log(`[DEBUG_AUTH] Login Response Status: ${response.status}`);
            console.log(`[DEBUG_AUTH] Login Response Keys:`, Object.keys(response.data));

            // Wide-strategy for token extraction
            const token = response.data.access_token || response.data.token || response.data.data?.token || response.data.data?.access_token;

            if (token) {
                this.token = token;
                // Assume 1 hour expiry if not provided
                this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
                logger.info('External WhatsApp API Login Successful');
                console.log(`[DEBUG_AUTH] Token acquired (starts with: ${token.substring(0, 10)}...)`);
                return this.token;
            } else {
                console.error(`[DEBUG_AUTH] FAILED: No token found in response body:`, JSON.stringify(response.data));
                throw new Error('No access token in response');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message;
            logger.error(`External WhatsApp API Login Failed: ${errorMsg}`);
            if (error.response?.data) {
                console.error(`[DEBUG_AUTH] Error Response Body:`, JSON.stringify(error.response.data));
            }
            throw error;
        }
    }

    // --- FLOWS (Root Path) ---
    async getFlows() {
        try {
            logger.info('Fetching flows from External API...');
            const response = await this.api.get('/flows');
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch flows from External API:', error.message);
            // Return empty array to prevent 500 errors on the route level
            return [];
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

    // --- TEMPLATES (/api/v1 Path) ---
    async createTemplate(templateData) {
        try {
            logger.info('Sending template creation request to External API...');
            const response = await this.api.post('/api/v1/templates', templateData);
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
            const response = await this.api.get('/api/v1/templates', { params, timeout: 10000 });
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            logger.error(`Failed to fetch templates from External API: ${msg}`);
            if (error.response?.data) {
                logger.error('External API Detail:', JSON.stringify(error.response.data));
            }
            // Don't throw, return empty array to allow local fallback
            return [];
        }
    }

    // --- CAMPAIGNS (/api/v1 Path) ---
    async createCampaign(campaignData) {
        try {
            logger.info('Sending campaign creation request to External API...');
            const response = await this.api.post('/api/v1/campaigns', campaignData);
            logger.info('External Campaign Created:', response.data);
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            logger.error(`Failed to create campaign in External API: ${msg}`);
            if (error.response?.data) {
                logger.error('External API Response:', JSON.stringify(error.response.data));
            }
            throw error;
        }
    }

    async getCampaigns(params = {}) {
        try {
            logger.info('Fetching campaigns from External API...');
            const response = await this.api.get('/api/v1/campaigns', { params, timeout: 10000 });
            console.log(`[DEBUG_WFB_RAW] Campaigns Raw Keys:`, Object.keys(response.data));
            // Log structure of first item if available
            if (Array.isArray(response.data) && response.data.length > 0) {
                console.log(`[DEBUG_WFB_RAW] First item structure:`, Object.keys(response.data[0]));
            } else if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                console.log(`[DEBUG_WFB_RAW] First item structure from .data:`, Object.keys(response.data.data[0]));
            }
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            logger.error(`Failed to fetch campaigns from External API: ${msg}`);
            if (error.response?.data) {
                logger.error('External API Response:', JSON.stringify(error.response.data));
            }
            throw error;
        }
    }

    async getCampaignDetail(id) {
        try {
            logger.info(`Fetching campaign detail for ${id} from External API...`);
            // Attempting direct detail endpoint
            const response = await this.api.get(`/api/v1/campaigns/${id}`, { timeout: 5000 });
            return response.data;
        } catch (error) {
            logger.warn(`Failed to fetch direct detail for campaign ${id}: ${error.message}. Attempting list fallback...`);

            // Fallback: Fetch list and find the item (inefficient but safe if detail endpoint missing)
            try {
                const list = await this.getCampaigns({ limit: 100 });
                const campaigns = Array.isArray(list) ? list : (list.data || list.result || []);
                const found = campaigns.find(c => (c._id === id || c.id === id));
                if (found) return found;
            } catch (listErr) {
                logger.error(`List fallback also failed: ${listErr.message}`);
            }

            throw error;
        }
    }

    async getCampaignLogs(id) {
        try {
            logger.info(`Fetching campaign logs for ${id} from External API...`);
            const response = await this.api.get(`/api/v1/campaigns/${id}/logs`, { timeout: 5000 });
            return response.data;
        } catch (error) {
            logger.error(`Failed to fetch campaign logs for ${id} from External API:`, error.message);
            return []; // Return empty logs instead of throwing
        }
    }
    // --- FLOWS (/api/v1/workflows Path) ---
    async getFlows(params = {}) {
        try {
            logger.info('Fetching flows (workflows) from External API...');
            const response = await this.api.get('/api/v1/workflows', { params, timeout: 10000 });
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            logger.error(`Failed to fetch flows from External API: ${msg}`);
            // Don't throw, return empty array to allow frontend to render empty state
            return [];
        }
    }

    async getFlow(id) {
        try {
            logger.info(`Fetching flow ${id} from External API...`);
            const response = await this.api.get(`/api/v1/workflows/${id}`, { timeout: 10000 });
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            logger.error(`Failed to fetch flow ${id} from External API: ${msg}`);
            // Return empty flow allowing frontend to render
            return {
                id,
                name: "Untitled Flow",
                description: "",
                Message_Blocks: [],
                Message_Routes: []
            };
        }
    }

    async createFlow(flowData) {
        try {
            logger.info('Sending flow creation request to External API...');
            const response = await this.api.post('/api/v1/workflows', flowData);
            logger.info('External Flow Created:', response.data);
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            logger.error(`Failed to create flow in External API: ${msg}`);
            throw error;
        }
    }

    async updateFlow(id, flowData) {
        try {
            logger.info(`Sending flow update request for ${id} to External API...`);
            const response = await this.api.put(`/api/v1/workflows/${id}`, flowData);
            logger.info('External Flow Updated:', response.data);
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            logger.error(`Failed to update flow ${id} in External API: ${msg}`);
            throw error;
        }
    }

    async deleteFlow(id) {
        try {
            logger.info(`Sending flow deletion request for ${id} to External API...`);
            const response = await this.api.delete(`/api/v1/workflows/${id}`);
            logger.info('External Flow Deleted');
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            logger.error(`Failed to delete flow ${id} in External API: ${msg}`);
            throw error;
        }
    }

    // --- CONTACTS (/api/v1 Path) ---
    async createContact(payload) {
        const contactIdentifier = payload.number || payload.phone;
        try {
            logger.info(`Syncing contact ${contactIdentifier} with External API...`);
            const response = await this.api.post('/api/v1/contacts', payload);
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
            const response = await this.api.get('/api/v1/contacts', { params });
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
