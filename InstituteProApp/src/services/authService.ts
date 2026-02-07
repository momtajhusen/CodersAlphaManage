import api from './api';
import * as SecureStore from 'expo-secure-store';

export const login = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    const { data } = response.data; // Extract data from response
    
    if (data && data.token) {
        await SecureStore.setItemAsync('userToken', data.token);
        const userInfo = { user: data.user, employee: data.employee };
        await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfo));
        
        // Explicitly save employeeId for easy access
        if (data.employee && data.employee.id) {
            await SecureStore.setItemAsync('employeeId', String(data.employee.id));
        }
    }
    return data;
};

export const register = async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    const { data } = response.data; // Extract data from response

    if (data && data.token) {
        await SecureStore.setItemAsync('userToken', data.token);
        const userInfo = { user: data.user, employee: data.employee };
        await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfo));
        
        // Explicitly save employeeId for easy access
        if (data.employee && data.employee.id) {
            await SecureStore.setItemAsync('employeeId', String(data.employee.id));
        }
    }
    return data;
};

export const logout = async () => {
    try {
        await api.post('/auth/logout');
    } catch (error) {
        // Ignore logout errors from server, just clear local state
        console.log('Logout error:', error);
    } finally {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userInfo');
        await SecureStore.deleteItemAsync('employeeId');
    }
};

export const getEmployeeId = async () => {
    return await SecureStore.getItemAsync('employeeId');
};

export const getProfile = async () => {
    const response = await api.get('/auth/user');
    return response.data;
};

export const updateProfile = async (data: any) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
        if (key === 'profile_photo' && data[key]) {
             formData.append('profile_photo', {
                uri: data[key].uri,
                type: data[key].type || 'image/jpeg',
                name: data[key].name || 'profile.jpg',
             } as any);
        } else if (data[key] !== undefined && data[key] !== null) {
            formData.append(key, data[key]);
        }
    });

    const response = await api.post('/auth/update-profile', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const forgotPassword = async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (data: any) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
};

const authService = {
    login,
    register,
    logout,
    getProfile,
    updateProfile,
    forgotPassword,
    resetPassword,
    getEmployeeId,
};

export default authService;
