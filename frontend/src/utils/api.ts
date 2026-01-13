import axios from 'axios';
import type { ProcurementReport, Vendor } from '../types';

const API_BASE_URL = 'http://localhost:5001';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export async function getProcurementReport(query: string): Promise<ProcurementReport> {
    const response = await api.post<ProcurementReport>('/procurement', { query });
    return response.data;
}

export async function searchVendors(material: string, location: string = ''): Promise<Vendor[]> {
    const response = await api.post<{ vendors: Vendor[] }>('/search_vendors', {
        material,
        location,
    });
    return response.data.vendors;
}

export async function checkHealth(): Promise<{ status: string; documents_loaded: number }> {
    const response = await api.get('/health');
    return response.data;
}
