import api from './api';

export interface Income {
  id: number;
  title: string;
  amount: number;
  income_date: string;
  description?: string;
  category?: string;
  payment_method: string;
  source_type: 'institute' | 'personal_project' | 'freelancing' | 'other';
  income_type: string;
  reference_number?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_by: number;
  createdBy?: {
    id: number;
    full_name: string;
    profile_photo?: string;
  };
  created_at: string;
  updated_at: string;
  receipt_file?: string;
}

export interface IncomeFilters {
  status?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  source_type?: string;
  contributor_id?: number;
}

export const getIncomes = async (filters: IncomeFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.start_date) params.append('from_date', filters.start_date);
  if (filters.end_date) params.append('to_date', filters.end_date);
  if (filters.min_amount) params.append('min_amount', filters.min_amount.toString());
  if (filters.max_amount) params.append('max_amount', filters.max_amount.toString());
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.source_type) params.append('source_type', filters.source_type);
  if (filters.contributor_id) params.append('contributor_id', filters.contributor_id.toString());

  const response = await api.get(`/income?${params.toString()}`);
  return response.data;
};

export const getIncome = async (id: number) => {
  const response = await api.get(`/income/${id}`);
  return response.data;
};

export const createIncome = async (data: any) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
      if (key === 'receipt' && data[key]) {
           // Handle Expo ImagePicker asset structure
           const file = data[key];
           formData.append('receipt', {
              uri: file.uri,
              type: file.mimeType || 'image/jpeg', // Use mimeType if available, fallback to image/jpeg
              name: file.fileName || file.name || 'receipt.jpg',
           } as any);
      } else if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
      }
  });

  const response = await api.post('/income', formData, {
      headers: {
          'Content-Type': 'multipart/form-data',
      },
  });
  return response.data;
};

export const updateIncome = async (id: number, data: any) => {
  const formData = new FormData();
  
  // Method spoofing for PUT request with FormData
  formData.append('_method', 'PUT');

  Object.keys(data).forEach(key => {
      if (key === 'receipt' && data[key]) {
           // Handle Expo ImagePicker asset structure
           const file = data[key];
           formData.append('receipt', {
              uri: file.uri,
              type: file.mimeType || 'image/jpeg', // Use mimeType if available, fallback to image/jpeg
              name: file.fileName || file.name || 'receipt.jpg',
           } as any);
      } else if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
      }
  });

  const response = await api.post(`/income/${id}`, formData, {
      headers: {
          'Content-Type': 'multipart/form-data',
      },
  });
  return response.data;
};

export const deleteIncome = async (id: number) => {
  const response = await api.delete(`/income/${id}`);
  return response.data;
};

export const confirmIncome = async (id: number) => {
  const response = await api.put(`/income/${id}/confirm`);
  return response.data;
};

export const rejectIncome = async (id: number, reason?: string) => {
  const response = await api.put(`/income/${id}/reject`, { reason });
  return response.data;
};

export const getIncomeReport = async (filters: any = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/income/report?${params}`);
  return response.data;
};

export default {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  confirmIncome,
  rejectIncome,
  getIncomeReport,
};
