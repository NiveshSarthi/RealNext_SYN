const axios = require('axios');
const https = require('https');
const logger = require('../config/logger');

// Allow legacy SSL connections - required for the external WFB API
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const WA_API_URL = process.env.WHATSAPP_API_URL || 'https://wfbbackend.niveshsarthi.com';
// Credentials read from environment variables on demand in methods

class WaService {
    constructor() {
        // Multi-layered authentication tokens
        this.token = null; // Standard user / Org token
        this.tokenExpiry = null;
        this.superAdminToken = null; // Master / Platform token
        this.superAdminTokenExpiry = null;

        // Base URL from env
        this.WA_API_URL = process.env.WHATSAPP_API_URL || 'https://wfbbackend.niveshsarthi.com';

        this.api = axios.create({
            baseURL: this.WA_API_URL,
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000,
            httpsAgent
        });

        // Add interceptor to inject auth token to every request (except auth ones)
        this.api.interceptors.request.use(async (config) => {
            // Support passing useSuperAdminToken flag in the request config
            const token = config.useSuperAdminToken
                ? await this.getSuperAdminToken()
                : await this.getToken();

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
        // Buffer for master organization
        this.masterOrgId = null;
    }

    async getMasterOrgId() {
        if (this.masterOrgId) return this.masterOrgId;
        try {
            // Some endpoints might require it, but based on test_wfb_connect.js, 
            // the master account can fetch global data without it.
            // We'll still identify it for logging or specific requirements.
            logger.info('Identifying Master Organization from WFB...');
            const orgs = await this.getWfbOrganizations();
            if (orgs && orgs.length > 0) {
                const master = orgs.find(o => /master|admin|realnext/i.test(o.name)) || orgs[0];
                this.masterOrgId = master._id || master.id;
                logger.info(`Master Organization identified: ${this.masterOrgId} (${master.name})`);
                return this.masterOrgId;
            }
        } catch (error) {
            logger.warn('Could not identify Master Organization (might not be required for global view):', error.message);
        }
        return null;
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

    // --- SUPER ADMIN (/super-admin) ---
    async getSuperAdminToken() {
        if (this.superAdminToken && this.superAdminTokenExpiry && new Date() < this.superAdminTokenExpiry) {
            return this.superAdminToken;
        }
        return this.superAdminLogin();
    }

    async superAdminLogin() {
        try {
            // Per user request, use WA_EMAIL/PASSWORD from env as the master credentials
            const credentials = {
                email: process.env.WA_EMAIL,
                password: process.env.WA_PASSWORD
            };

            if (!credentials.email || !credentials.password) {
                logger.warn('Master WhatsApp credentials missing in .env');
                return null;
            }

            logger.info('Authenticating Master WhatsApp Account for Super Admin...');
            console.log(`[DEBUG_AUTH] Using /auth/login for master credentials: ${credentials.email}`);

            const response = await axios.post(`${this.WA_API_URL}/auth/login`, credentials, {
                timeout: 10000,
                httpsAgent
            });

            const token = response.data.access_token || response.data.token || response.data.data?.token;

            if (token) {
                this.superAdminToken = token;
                console.log(`[DEBUG_AUTH] Master Login Success. Token snippet: ${this.superAdminToken?.substring(0, 15)}...`);
                // Token expiry - allow 30 mins buffer
                this.superAdminTokenExpiry = new Date(Date.now() + 25 * 60 * 1000);
                return this.superAdminToken;
            } else {
                throw new Error('No token found in response body');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message;
            logger.error('External WhatsApp API Master Account Login Failed:', errorMsg);
            if (error.response?.data) {
                console.log('[DEBUG_AUTH] Error Response:', JSON.stringify(error.response.data));
            }
            throw new Error(`WFB Master Auth Failed: ${errorMsg}`);
        }
    }


    async getWfbOrganizations() {
        try {
            // Let the interceptor handle token injection via the flag
            const response = await this.api.get('/super-admin/organizations', {
                useSuperAdminToken: true
            });
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch WFB organizations:', error.message);
            throw error;
        }
    }

    async createWfbOrganization(orgData) {
        try {
            const token = await this.getSuperAdminToken();
            const response = await this.api.post('/super-admin/organizations', orgData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.data?.detail || error.message;
            logger.error(`Failed to create WFB organization: ${msg}`);
            throw new Error(`WFB API Error: ${JSON.stringify(error.response?.data) || msg}`);
        }
    }

    async updateWfbOrganizationStatus(orgId, status) {
        try {
            const token = await this.getSuperAdminToken();
            const response = await this.api.put(`/super-admin/organizations/${orgId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            logger.error(`Failed to update WFB org status:`, error.message);
            throw error;
        }
    }

    async deleteWfbOrganization(orgId) {
        try {
            const token = await this.getSuperAdminToken();
            const response = await this.api.delete(`/super-admin/organizations/${orgId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            logger.error(`Failed to delete WFB org:`, error.message);
            throw error;
        }
    }

    // --- SETTINGS & PHONE NUMBERS (/settings & /phone-numbers) ---
    async getWaSettings() {
        try {
            const response = await this.api.get('/settings/whatsapp');
            return response.data;
        } catch (error) {
            logger.error('Failed to get WA Settings:', error.message);
            throw error;
        }
    }

    async saveWaSettings(data) {
        try {
            const response = await this.api.post('/settings/whatsapp', data);
            return response.data;
        } catch (error) {
            logger.error('Failed to save WA Settings:', error.message);
            throw error;
        }
    }

    async getOpenAiSettings() {
        try {
            const response = await this.api.get('/settings/openai');
            return response.data;
        } catch (error) {
            logger.error('Failed to get OpenAI Settings:', error.message);
            throw error;
        }
    }

    async saveOpenAiSettings(data) {
        try {
            const response = await this.api.post('/settings/openai', data);
            return response.data;
        } catch (error) {
            logger.error('Failed to save OpenAI Settings:', error.message);
            throw error;
        }
    }

    async getPhoneNumbers() {
        try {
            const response = await this.api.get('/phone-numbers');
            return response.data;
        } catch (error) {
            logger.error('Failed to get Phone Numbers:', error.message);
            throw error;
        }
    }

    async createPhoneNumber(data) {
        try {
            const response = await this.api.post('/phone-numbers', data);
            return response.data;
        } catch (error) {
            logger.error('Failed to create Phone Number:', error.message);
            throw error;
        }
    }

    async updatePhoneNumber(id, data) {
        try {
            const response = await this.api.put(`/phone-numbers/${id}`, data);
            return response.data;
        } catch (error) {
            logger.error('Failed to update Phone Number:', error.message);
            throw error;
        }
    }

    // --- FLOWS (Root Path) ---
    async getFlows(clientId = null) {
        try {
            let effectiveClientId = clientId;
            if (!effectiveClientId) {
                effectiveClientId = await this.getMasterOrgId();
            }

            const headers = effectiveClientId ? { 'x-client-id': effectiveClientId } : {};
            logger.info(`Fetching flows from External API... ${effectiveClientId ? `(Client: ${effectiveClientId})` : 'GLOBAL'}`);

            const response = await this.api.get('/flows', { headers, useSuperAdminToken: !clientId });
            const data = response.data;

            // Normalize to array
            const flows = Array.isArray(data) ? data : (data?.data || data?.result || []);
            return flows;
        } catch (error) {
            logger.error('Failed to fetch flows from External API:', error.message);
            return [];
        }
    }

    async createFlow(flowData, clientId = null) {
        try {
            let effectiveClientId = clientId;
            if (!effectiveClientId) {
                effectiveClientId = await this.getMasterOrgId();
            }
            logger.info(`Creating flow in External API... ${effectiveClientId ? `(Client: ${effectiveClientId})` : 'GLOBAL'}`);
            const headers = effectiveClientId ? { 'x-client-id': effectiveClientId } : {};
            const response = await this.api.post('/flows', flowData, { headers, useSuperAdminToken: !clientId });
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            logger.error(`Failed to create flow in External API: ${msg}`);
            if (error.response?.data) {
                console.error('[WFB_API_CREATE_FLOW_ERROR] Data:', JSON.stringify(error.response.data, null, 2));
            }
            throw new Error(`WFB API Error: ${JSON.stringify(error.response?.data) || msg}`);
        }
    }

    async getFlow(id, clientId = null) {
        try {
            const headers = clientId ? { 'x-client-id': clientId } : {};
            logger.info(`Fetching flow ${id} from External API... ${clientId ? `(Client: ${clientId})` : 'MASTER/GLOBAL'}`);

            const response = await this.api.get(`/flows/${id}`, { headers, useSuperAdminToken: !clientId });
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            logger.error(`Failed to fetch flow ${id} from External API: ${msg}`);
            // Return empty flow allowing frontend to render the blank canvas
            return {
                id,
                name: "Untitled Flow",
                description: "",
                Message_Blocks: [],
                Message_Routes: []
            };
        }
    }

    async updateFlow(id, flowData, clientId = null) {
        try {
            let effectiveClientId = clientId;
            if (!effectiveClientId) {
                effectiveClientId = await this.getMasterOrgId();
            }
            logger.info(`Updating flow ${id} in External API... ${effectiveClientId ? `(Client: ${effectiveClientId})` : 'GLOBAL'}`);
            const headers = effectiveClientId ? { 'x-client-id': effectiveClientId } : {};
            const response = await this.api.put(`/flows/${id}`, flowData, { headers, useSuperAdminToken: !clientId });
            return response.data;
        } catch (error) {
            logger.error(`Failed to update flow ${id} in External API:`, error.message);
            throw error;
        }
    }

    async deleteFlow(id, clientId = null) {
        try {
            let effectiveClientId = clientId;
            if (!effectiveClientId) {
                effectiveClientId = await this.getMasterOrgId();
            }
            logger.info(`Deleting flow ${id} in External API... ${effectiveClientId ? `(Client: ${effectiveClientId})` : 'GLOBAL'}`);
            const headers = effectiveClientId ? { 'x-client-id': effectiveClientId } : {};
            const response = await this.api.delete(`/flows/${id}`, { headers, useSuperAdminToken: !clientId });
            return response.data;
        } catch (error) {
            logger.error(`Failed to delete flow ${id} in External API:`, error.message);
            throw error;
        }
    }

    // --- TEMPLATES (/api/v1 Path) ---
    async createTemplate(templateData, clientId = null) {
        try {
            let effectiveClientId = clientId;
            if (!effectiveClientId) {
                effectiveClientId = await this.getMasterOrgId();
            }
            logger.info(`Sending template creation request to External API... ${effectiveClientId ? `(Client: ${effectiveClientId})` : 'GLOBAL'}`);
            const headers = effectiveClientId ? { 'x-client-id': effectiveClientId } : {};
            const response = await this.api.post('/api/v1/templates', templateData, { headers, useSuperAdminToken: !clientId });
            logger.info('External Template Created:', response.data);
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.data?.detail || error.message;
            logger.error(`Failed to create template in External API: ${msg}`);
            if (error.response?.data) {
                logger.error(`[WFB_API_CREATE_TEMPLATE_ERROR] Data: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            throw error;
        }
    }

    async getTemplates(params = {}, clientId = null) {
        try {
            let effectiveClientId = clientId;
            if (!effectiveClientId) {
                effectiveClientId = await this.getMasterOrgId();
            }
            const headers = effectiveClientId ? { 'x-client-id': effectiveClientId } : {};
            logger.info(`Fetching templates from External API... ${effectiveClientId ? `(Client: ${effectiveClientId})` : 'GLOBAL'}`);

            const response = await this.api.get('/api/v1/templates', { params, headers, timeout: 10000, useSuperAdminToken: !clientId });
            const data = response.data;

            // Normalize to array
            const templates = Array.isArray(data) ? data : (data?.data || data?.result || []);
            return templates;
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
    async createCampaign(campaignData, clientId = null) {
        try {
            let effectiveClientId = clientId;
            if (!effectiveClientId) {
                effectiveClientId = await this.getMasterOrgId();
            }
            logger.info(`Sending campaign creation request to External API... ${effectiveClientId ? `(Client: ${effectiveClientId})` : 'GLOBAL'}`);
            const headers = effectiveClientId ? { 'x-client-id': effectiveClientId } : {};
            const response = await this.api.post('/api/v1/campaigns', campaignData, { headers, useSuperAdminToken: !clientId });
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

    async getCampaigns(params = {}, clientId = null) {
        try {
            let effectiveClientId = clientId;
            if (!effectiveClientId) {
                effectiveClientId = await this.getMasterOrgId();
            }
            const headers = effectiveClientId ? { 'x-client-id': effectiveClientId } : {};
            logger.info(`Fetching campaigns from External API... ${effectiveClientId ? `(Client: ${effectiveClientId})` : 'GLOBAL'}`);

            const response = await this.api.get('/api/v1/campaigns', { params, headers, timeout: 10000, useSuperAdminToken: !clientId });
            const innerData = response.data;
            console.log(`[DEBUG_WFB_RAW] Campaigns Raw Keys:`, innerData ? Object.keys(innerData) : 'null');

            // Normalize list extraction
            const list = Array.isArray(innerData) ? innerData : (innerData?.data || innerData?.result || []);
            return list;
        } catch (error) {
            logger.error('Failed to fetch campaigns from External API:', error.message);
            return [];
        }
    }

    async getCampaignDetail(id, clientId = null) {
        try {
            let effectiveClientId = clientId;
            if (!effectiveClientId) {
                effectiveClientId = await this.getMasterOrgId();
            }
            logger.info(`Fetching campaign detail for ${id} from External API... ${effectiveClientId ? `(Client: ${effectiveClientId})` : 'GLOBAL'}`);
            // Attempting direct detail endpoint
            const headers = effectiveClientId ? { 'x-client-id': effectiveClientId } : {};
            const response = await this.api.get(`/api/v1/campaigns/${id}`, { headers, timeout: 5000, useSuperAdminToken: !clientId });
            return response.data;
        } catch (error) {
            logger.warn(`Failed to fetch direct detail for campaign ${id}: ${error.message}. Attempting list fallback...`);

            // Fallback: Fetch list and find the item (inefficient but safe if detail endpoint missing)
            try {
                const list = await this.getCampaigns({ limit: 100 }, clientId);
                const campaigns = Array.isArray(list) ? list : (list.data || list.result || []);
                const found = campaigns.find(c => (c._id === id || c.id === id));
                if (found) return found;
            } catch (listErr) {
                logger.error(`List fallback also failed: ${listErr.message}`);
            }

            throw error;
        }
    }

    async getCampaignLogs(id, clientId = null) {
        try {
            let effectiveClientId = clientId;
            if (!effectiveClientId) {
                effectiveClientId = await this.getMasterOrgId();
            }
            logger.info(`Fetching campaign logs for ${id} from External API... ${effectiveClientId ? `(Client: ${effectiveClientId})` : 'GLOBAL'}`);
            const headers = effectiveClientId ? { 'x-client-id': effectiveClientId } : {};
            const response = await this.api.get(`/api/v1/campaigns/${id}/logs`, { headers, timeout: 5000, useSuperAdminToken: !clientId });
            return response.data;
        } catch (error) {
            logger.error(`Failed to fetch campaign logs for ${id} from External API:`, error.message);
            return []; // Return empty logs instead of throwing
        }
    }


    // --- CONTACTS (/api/v1 Path) ---
    async createContact(payload, clientId = null) {
        const contactIdentifier = payload.number || payload.phone;
        try {
            logger.info(`Syncing contact ${contactIdentifier} with External API... ${clientId ? `(Client: ${clientId})` : ''}`);
            const headers = clientId ? { 'x-client-id': clientId } : {};
            const response = await this.api.post('/api/v1/contacts', payload, { headers });
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
                    const existingContacts = await this.getContacts({ search: contactIdentifier }, clientId);

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

    async getContacts(params = {}, clientId = null) {
        try {
            logger.info(`Fetching contacts from External API with params: ${JSON.stringify(params)} ${clientId ? `(Client: ${clientId})` : ''}`);
            const headers = clientId ? { 'x-client-id': clientId } : {};
            const response = await this.api.get('/api/v1/contacts', { params, headers });
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch contacts from External API:', error.message);
            throw error;
        }
    }

    async uploadContacts(formData, clientId = null) {
        try {
            // Note: Make sure the formData boundary is correctly serialized when passing to Axios
            logger.info(`Uploading contacts CSV to External API... ${clientId ? `(Client: ${clientId})` : ''}`);
            const headers = {
                'Content-Type': 'multipart/form-data',
                ...(clientId ? { 'x-client-id': clientId } : {})
            };
            const response = await this.api.post('/api/v1/contacts/upload', formData, { headers });
            return response.data;
        } catch (error) {
            logger.error('Failed to upload contacts CSV:', error.message);
            throw error;
        }
    }

    async deleteContact(id, clientId = null) {
        try {
            logger.info(`Deleting contact ${id} from External API... ${clientId ? `(Client: ${clientId})` : ''}`);
            const headers = clientId ? { 'x-client-id': clientId } : {};
            const response = await this.api.delete(`/api/v1/contacts/${id}`, { headers });
            return response.data;
        } catch (error) {
            // Sometimes it's /contacts/:id and sometimes it's just not supported, fallback parsing handled here
            logger.error(`Failed to delete contact ${id}:`, error.message);
            throw error;
        }
    }

    // --- CONVERSATIONS (/conversations) ---
    async getConversations(params = {}) {
        try {
            logger.info('Fetching conversations from External API...');
            const response = await this.api.get('/conversations', { params });
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch conversations:', error.message);
            throw error;
        }
    }

    async getConversationMessages(number) {
        try {
            logger.info(`Fetching messages for ${number}...`);
            const response = await this.api.get(`/conversations/${number}/messages`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to fetch messages for ${number}:`, error.message);
            throw error;
        }
    }

    async sendLiveMessage(payload) {
        try {
            logger.info(`Sending live message to ${payload.to}...`);
            const response = await this.api.post('/conversations/send', payload);
            return response.data;
        } catch (error) {
            logger.error('Failed to send live message:', error.message);
            throw error;
        }
    }

    // Helper to format local campaign to external payload
    formatPayload(localCampaign, contactIds) {
        return {
            name: localCampaign.name,
            template_name: localCampaign.template_name,
            language: localCampaign.template_data?.language_code || localCampaign.language || 'en_US',
            contact_ids: contactIds, // Array of IDs
            filters: localCampaign.filters || {},
            variable_mapping: localCampaign.template_data?.variable_mapping || {},
            scheduled_at: localCampaign.scheduled_at ? localCampaign.scheduled_at.toISOString() : null
        };
    }
}

module.exports = new WaService();
