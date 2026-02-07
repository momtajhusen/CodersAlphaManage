import api from './api';

export interface Task {
  id: number;
  task_code: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string | null;
  deadline: string | null;
  budget_required: number | null;
  materials_needed: string | null;
  documents_needed: string | null;
  status: 'new' | 'assigned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  created_by: number;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
  assignments?: {
    id: number;
    assigned_to: number;
    assigned_by: number;
    assignment_status: string;
    progress_percentage: number;
    assignee?: {
      id: number;
      full_name: string;
      profile_photo: string | null;
      profile_photo_url: string | null;
      role?: string;
    };
  }[];
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  category?: string;
  from_date?: string;
  to_date?: string;
  overdue?: boolean;
  page?: number;
  per_page?: number;
  search?: string;
  assigned_to?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: string;
  category?: string;
  deadline?: string;
  budget_required?: number;
  materials_needed?: string;
  documents_needed?: string;
  assigned_to?: number[]; // For immediate assignment
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: string;
  category?: string;
  deadline?: string;
  budget_required?: number;
  materials_needed?: string;
  documents_needed?: string;
  status?: string;
}

export const getTasks = async (filters: TaskFilters = {}) => {
  const response = await api.get('/tasks', { params: filters });
  return response.data;
};

export const getTask = async (id: number) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data: CreateTaskData) => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const updateTask = async (id: number, data: UpdateTaskData) => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: number) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const assignTask = async (id: number, employeeIds: number[], estimatedHours?: number) => {
  const response = await api.post(`/tasks/${id}/assign`, {
    assigned_to: employeeIds,
    estimated_hours: estimatedHours,
  });
  return response.data;
};

export const updateTaskProgress = async (id: number, progress: number, notes?: string) => {
  const response = await api.put(`/tasks/${id}/progress`, {
    progress_percentage: progress,
    notes: notes,
  });
  return response.data;
};

export const completeTask = async (id: number) => {
  const response = await api.put(`/tasks/${id}/complete`);
  return response.data;
};
