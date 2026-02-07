import api from './api';

export interface ActivityLogParams {
    entity_type?: string;
    action_type?: string;
    actor_id?: number | string;
    from_date?: string;
    to_date?: string;
    page?: number;
    per_page?: number;
    search?: string;
}

export interface ActivityLogItem {
    id: number;
    actor_id: number;
    action_type: string;
    entity_type: string;
    entity_id: number;
    entity_code?: string;
    description: string | null;
    old_values: string | null;
    new_values: string | null;
    ip_address?: string;
    created_at: string;
    updated_at: string;
    actor?: {
        id: number;
        full_name: string;
        email: string;
        profile_photo_url?: string;
    };
}

export interface ActivityLogResponse {
    success: boolean;
    data: {
        data: ActivityLogItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

const activityLogService = {
    /**
     * Get activity logs with optional filters
     */
    getLogs: async (params?: ActivityLogParams) => {
        const response = await api.get<ActivityLogResponse>('/activity-log', { params });
        return response.data;
    },

    /**
     * Get activity history for a specific entity
     */
    getEntityHistory: async (entityType: string, entityId: number | string) => {
        const response = await api.get(`/activity-log/entity/${entityType}/${entityId}`);
        return response.data;
    },

    /**
     * Get activities for a specific user
     */
    getUserActivities: async (userId: number | string, params?: any) => {
        const response = await api.get(`/activity-log/user/${userId}`, { params });
        return response.data;
    },
    
    /**
     * Get activity summary
     */
    getSummary: async () => {
        const response = await api.get('/activity-log/summary');
        return response.data;
    }
};

export default activityLogService;
