import api from './api';

export const getEmployees = async (params: any = {}) => {
    const response = await api.get('/employees', { params });
    return response.data;
};

export const getEmployee = async (id: string | number) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
};

export const createEmployee = async (data: any) => {
    const response = await api.post('/employees', data);
    return response.data;
};

export const updateEmployee = async (id: string | number, data: any) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
};

export const deleteEmployee = async (id: string | number, deleteAllData: boolean = false) => {
    const response = await api.delete(`/employees/${id}`, { data: { delete_all_data: deleteAllData } });
    return response.data;
};

const employeeService = {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee
};

export default employeeService;
