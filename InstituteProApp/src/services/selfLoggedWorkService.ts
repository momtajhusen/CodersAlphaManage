import api from './api';

export interface SelfLoggedWork {
  id: number;
  employee_id: number;
  work_title: string;
  description: string | null;
  time_spent_hours: number;
  work_date: string;
  attachment_path: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_by: number | null;
  verification_notes: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkLogResponse {
  success: boolean;
  data: {
    work: {
      current_page: number;
      data: SelfLoggedWork[];
      last_page: number;
      total: number;
    };
    total_approved_hours: number;
  };
}

export const getMyWorkLogs = async (params?: any) => {
  const response = await api.get('/my-work', { params });
  return response.data;
};

export const createWorkLog = async (data: any) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
    }
  });

  const response = await api.post('/self-logged-work', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
