import api from './api';

export interface Expense {
  id: number;
  title: string;
  amount: number;
  expense_date: string;
  description?: string;
  category?: string;
  expense_type: 'institute' | 'personal';
  paid_from: string;
  reference_number?: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
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

export interface ExpenseFilters {
  status?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  expense_type?: string;
  employee_id?: number;
}

export const getExpenses = async (filters: ExpenseFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.start_date) params.append('from_date', filters.start_date);
  if (filters.end_date) params.append('to_date', filters.end_date);
  if (filters.min_amount) params.append('min_amount', filters.min_amount.toString());
  if (filters.max_amount) params.append('max_amount', filters.max_amount.toString());
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.expense_type) params.append('expense_type', filters.expense_type);
  if (filters.employee_id) params.append('employee_id', filters.employee_id.toString());

  const response = await api.get(`/expenses?${params.toString()}`);
  return response.data;
};

export const getExpense = async (id: number) => {
  const response = await api.get(`/expenses/${id}`);
  return response.data;
};

export const getExpenseCategories = async () => {
  const response = await api.get('/expenses/categories');
  return response.data;
};

export const createExpense = async (data: any) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
      if (key === 'bill_photo' && data[key]) {
           // Handle Expo ImagePicker asset structure
           const file = data[key];
           formData.append('bill_photo', {
              uri: file.uri,
              type: file.mimeType || 'image/jpeg',
              name: file.fileName || file.name || 'receipt.jpg',
           } as any);
      } else if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
      }
  });

  const response = await api.post('/expenses', formData, {
      headers: {
          'Content-Type': 'multipart/form-data',
      },
  });
  return response.data;
};

export const updateExpense = async (id: number, data: any) => {
  const formData = new FormData();
  
  // Method spoofing for PUT request with FormData
  formData.append('_method', 'PUT');

  Object.keys(data).forEach(key => {
      if (key === 'bill_photo' && data[key]) {
           // Handle Expo ImagePicker asset structure
           const file = data[key];
           formData.append('bill_photo', {
              uri: file.uri,
              type: file.mimeType || 'image/jpeg',
              name: file.fileName || file.name || 'receipt.jpg',
           } as any);
      } else if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
      }
  });

  const response = await api.post(`/expenses/${id}`, formData, {
      headers: {
          'Content-Type': 'multipart/form-data',
      },
  });
  return response.data;
};

export const deleteExpense = async (id: number) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};

export const approveExpense = async (id: number) => {
  const response = await api.put(`/expenses/${id}/approve`);
  return response.data;
};

export const rejectExpense = async (id: number, reason?: string) => {
  const response = await api.put(`/expenses/${id}/reject`, { reason });
  return response.data;
};

export const reimburseExpense = async (id: number) => {
    const response = await api.put(`/expenses/${id}/reimburse`);
    return response.data;
};

export const getPendingReimbursements = async () => {
    const response = await api.get('/expenses/pending-reimbursement');
    return response.data;
};

export const getExpenseReport = async (filters: any = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/expenses/report?${params}`);
  return response.data;
};

export default {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  reimburseExpense,
  getPendingReimbursements,
  getExpenseReport,
};
