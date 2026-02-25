import axios from 'axios';

// Create a configured axios instance if not utilizing global one
// However, typically you'd reuse the existing axios instance which handles auth headers.
// Check if there is an existing API utility. 
// Based on check frontend pages, there is `utils/api`.

import api from '../../../../utils/api'; // Adjust path to root utils/api

export const flowApi = {
    getFlows: async () => {
        const response = await api.get('/api/flows');
        // Backend returns { success: true, data: [], count: n }
        return response.data?.data || [];
    },

    createFlow: async (flowData) => {
        const response = await api.post('/api/flows', flowData);
        // Backend returns { status: 'success', flow_id: '...', data: result }
        return response.data;
    },

    getFlow: async (flowId) => {
        const response = await api.get(`/api/flows/${flowId}`);
        // Backend returns { status: 'success', data: { b, r }, meta: { ... } }
        return response.data;
    },

    updateFlow: async (flowId, flowData) => {
        const response = await api.put(`/api/flows/${flowId}`, flowData);
        return response.data;
    },

    deleteFlow: async (flowId) => {
        const response = await api.delete(`/api/flows/${flowId}`);
        return response.data;
    }
};
