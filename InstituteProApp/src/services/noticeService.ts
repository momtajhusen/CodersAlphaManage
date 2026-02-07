import api from './api';

export interface Notice {
    id: number;
    title: string;
    content: string;
    type: string;
    is_important: boolean;
    audience: string;
    date: string;
    created_by: number;
    created_at: string;
    updated_at: string;
}

export interface NoticeParams {
    audience?: string;
    is_important?: boolean;
    search?: string;
    page?: number;
    per_page?: number;
}

const noticeService = {
    getNotices: async (params?: NoticeParams) => {
        const response = await api.get('/notices', { params });
        return response.data;
    },

    getNotice: async (id: number) => {
        const response = await api.get(`/notices/${id}`);
        return response.data;
    },

    createNotice: async (data: Partial<Notice>) => {
        const response = await api.post('/notices', data);
        return response.data;
    },

    updateNotice: async (id: number, data: Partial<Notice>) => {
        const response = await api.put(`/notices/${id}`, data);
        return response.data;
    },

    deleteNotice: async (id: number) => {
        const response = await api.delete(`/notices/${id}`);
        return response.data;
    }
};

export default noticeService;
