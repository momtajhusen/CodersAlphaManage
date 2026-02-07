import api from './api';

export interface NotificationParams {
    page?: number;
    per_page?: number;
    unread?: boolean;
    type?: string;
}

const notificationService = {
    getNotifications: async (params?: NotificationParams) => {
        const response = await api.get('/notifications', { params });
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },

    markAsRead: async (id: string | number) => {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.put('/notifications/mark-all-read');
        return response.data;
    },

    deleteNotification: async (id: string | number) => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },

    clearAll: async () => {
        const response = await api.delete('/notifications/clear-all');
        return response.data;
    },

    registerPushToken: async (token: string) => {
        // Based on routes/api.php, the endpoint is POST /expo/token
        const response = await api.post('/expo/token', { token });
        return response.data;
    }
};

export default notificationService;
