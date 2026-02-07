import api from './api';

const dashboardService = {
    getStats: async (params?: { 
        financial_month?: number; 
        financial_year?: number;
        attendance_month?: number;
        attendance_year?: number;
    }) => {
        const response = await api.get('/dashboard', { params });
        return response.data;
    }
};

export default dashboardService;
