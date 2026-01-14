import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export async function getProcurementReport(query) {
    const response = await api.post('/procurement', { query });
    return response.data;
}

export async function searchVendors(material, location = '') {
    const response = await api.post('/search_vendors', {
        material,
        location,
    });
    return response.data.vendors;
}

export async function checkHealth() {
    const response = await api.get('/health');
    return response.data;
}
