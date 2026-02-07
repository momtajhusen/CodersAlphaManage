import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import authService from '../services/authService';
import Toast from 'react-native-toast-message';
import { authEvents } from '../utils/authEvents';

interface AuthContextType {
    user: any | null;
    employeeId: string | number | null; // Direct access to employee ID
    isLoading: boolean;
    isInitializing?: boolean; // Added optional property
    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [employeeId, setEmployeeId] = useState<string | number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // For initial loading
    const [isOperationLoading, setIsOperationLoading] = useState<boolean>(false); // For login/register operations

    const loadUser = async () => {
        try {
            const userInfo = await SecureStore.getItemAsync('userInfo');
            const token = await SecureStore.getItemAsync('userToken');
            const storedEmployeeId = await authService.getEmployeeId();

            if (userInfo && token) {
                const parsedUser = JSON.parse(userInfo);
                setUser(parsedUser);
                
                // Prioritize stored ID, then fallback to user object
                if (storedEmployeeId) {
                    setEmployeeId(storedEmployeeId);
                } else if (parsedUser.employee?.id) {
                    setEmployeeId(parsedUser.employee.id);
                }
            }
        } catch (error) {
            console.error('Failed to load user info', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUser();

        // Listen for unauthorized events (401)
        const handleUnauthorized = () => {
            logout();
        };
        authEvents.on('unauthorized', handleUnauthorized);

        return () => {
            authEvents.off('unauthorized', handleUnauthorized);
        };
    }, []);

    const refreshUser = async () => {
        try {
            const userData = await authService.getProfile();
            // Handle different response structures
            const user = userData.data || userData;
            setUser(user);
            
            // Update employeeId
            if (user.employee?.id) {
                setEmployeeId(user.employee.id);
                // Also update stored ID if it was missing
                await SecureStore.setItemAsync('employeeId', String(user.employee.id));
            }
            
            await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
        } catch (error) {
            console.error('Failed to refresh user', error);
        }
    };

    const login = async (credentials: any) => {
        setIsOperationLoading(true);
        try {
            const data = await authService.login(credentials);
            const userInfo = { user: data.user, employee: data.employee };
            setUser(userInfo);
            
            if (data.employee?.id) {
                setEmployeeId(data.employee.id);
            }
            
            // Store user info securely so it persists across restarts
            await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfo));
            
            // Store credentials securely for biometric login
            if (credentials.email && credentials.password) {
                await SecureStore.setItemAsync('userEmail', credentials.email);
                await SecureStore.setItemAsync('userPassword', credentials.password);
            }
            
            Toast.show({
                type: 'success',
                text1: 'Login Successful',
                text2: `Welcome back, ${data.user.name || 'User'}!`,
            });
        } catch (error: any) {
            console.error('Login error', error);
            const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: message,
            });
            throw error;
        } finally {
            setIsOperationLoading(false);
        }
    };

    const register = async (userData: any) => {
        setIsOperationLoading(true);
        try {
            const data = await authService.register(userData);
            setUser({ user: data.user, employee: data.employee });
            
            if (data.employee?.id) {
                setEmployeeId(data.employee.id);
            }
            
            Toast.show({
                type: 'success',
                text1: 'Registration Successful',
                text2: 'Your account has been created.',
            });
        } catch (error: any) {
            console.error('Registration error', error);
            const message = error.response?.data?.message || 'Registration failed. Please try again.';
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: message,
            });
            throw error;
        } finally {
            setIsOperationLoading(false);
        }
    };

    const logout = async () => {
        setIsOperationLoading(true);
        try {
            await authService.logout();
            setUser(null);
            setEmployeeId(null);
            
            // Clear credentials on logout to disable biometric auto-login
            await SecureStore.deleteItemAsync('userEmail');
            await SecureStore.deleteItemAsync('userPassword');
            await SecureStore.deleteItemAsync('biometric_enabled'); // Also disable biometric preference
            
            Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been successfully logged out.',
            });
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            setIsOperationLoading(false);
        }
    };

    // We export isOperationLoading as 'isLoading' for backward compatibility in components that use it for spinners
    // But we also export 'isInitializing' for the root navigator
    
    return (
        <AuthContext.Provider value={{ user, employeeId, isLoading: isOperationLoading, login, register, logout, refreshUser, isInitializing: isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
