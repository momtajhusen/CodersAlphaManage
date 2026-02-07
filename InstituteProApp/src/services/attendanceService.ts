import api from './api';

const attendanceService = {
    getAttendance: async (params?: any) => {
        const response = await api.get('/attendance', { params });
        return response.data;
    },

    checkIn: async (data: { 
        shift_type: 'day' | 'night' | 'both'; 
        employee_id?: number;
        status?: 'present' | 'absent' | 'late';
        date?: string;
    }) => {
        try {
            const response = await api.post('/attendance/check-in', data);
            return response.data;
        } catch (error: any) {
            // If attendance already marked (422), treat as success if data exists
            if (error.response?.status === 422 && error.response?.data?.data) {
                return {
                    success: true,
                    message: error.response.data.message,
                    data: error.response.data.data,
                    isExisting: true
                };
            }
            throw error;
        }
    },

    checkOut: async (data?: { employee_id?: number }) => {
        const response = await api.post('/attendance/check-out', data);
        return response.data;
    },

    getMonthlyReport: async (params: { employee_id?: number; month?: number; year?: number }) => {
        const response = await api.get('/attendance/monthly-report', { params });
        return response.data;
    },

    getAnnualReport: async (params: { employee_id?: number; year?: number }) => {
        const response = await api.get('/attendance/annual-report', { params });
        return response.data;
    },

    getMasterReport: async (params: { month?: number; year?: number }) => {
        const response = await api.get('/attendance/master-report', { params });
        return response.data;
    },

    getAttendanceDetails: async (id: string | number) => {
        const response = await api.get(`/attendance/${id}`);
        return response.data;
    },

    updateAttendance: async (id: string | number, data: any) => {
        const response = await api.put(`/attendance/${id}`, data);
        return response.data;
    },

    deleteAttendance: async (id: string | number) => {
        const response = await api.delete(`/attendance/${id}`);
        return response.data;
    }
};

export default attendanceService;
