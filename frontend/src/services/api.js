import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const procurementService = {
    analyzeProcurement: async (query) => {
        const response = await api.post('/procurement', { query });
        return response.data;
    },
    searchVendors: async (material, location) => {
        const response = await api.post('/search_vendors', { material, location });
        return response.data;
    }
};

export default api;
