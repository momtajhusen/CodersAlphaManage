import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authEvents } from '../utils/authEvents';

// 1. Dynamic Base URL Configuration
const getBaseUrl = () => {
    // Production URL (Replace with actual domain when live)
    if (!__DEV__) {
        return 'https://manager.codersalpha.com/api';
    }

    if (Platform.OS === 'web') {
        return 'https://manager.codersalpha.com/api';
    }

    // Android Emulator specific
    const isAndroidEmulator = Constants.isDevice === false;
    if (isAndroidEmulator) {
        return 'https://manager.codersalpha.com/api';
    }

    // Dynamic Host Detection for Expo Go (Physical Device)
    // Uses the same IP that the Expo app loaded the JS bundle from
    try {
        const debuggerHost = Constants.expoConfig?.hostUri;
        if (debuggerHost) {
            const hostString = String(debuggerHost);
            const [host] = hostString.split(':');
            if (host && /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
                console.log('🔗 Detected Expo Host IP:', host);
                // Use port 8085 for the Node Proxy
                return `https://manager.codersalpha.com/api`;
            }
        }
    } catch (e) {
        console.log('⚠️ Error detecting host IP from Expo config:', e);
    }

    // Fallback for Physical Device - Fixed Local IP
    // Ensure your computer and phone are on the same Wi-Fi
    // Using Port 8085 (Node Proxy) because PHP Built-in server (port 8000)
    // fails to handle external requests (Empty Reply)
    return 'https://manager.codersalpha.com/api';
};

const BASE_URL = getBaseUrl();
export const API_URL = BASE_URL;
console.log('🔗 API BASE_URL Configured:', BASE_URL);

// 2. Central Axios Instance
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000, // 15 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'bypass-tunnel-reminder': 'true',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'InstituteProApp/1.0',
    },
});

// 3. Retry Strategy
axiosRetry(api, {
    retries: 2,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        // BUT skip retry for POST requests as they are not idempotent (avoids duplicate creation)
        if (error.config?.method === 'post' || error.config?.method === 'POST') {
            return false;
        }
        
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               (error.response?.status ? error.response.status >= 500 : false);
    },
    onRetry: (retryCount, error, requestConfig) => {
        console.log(`⚠️ Retry attempt #${retryCount} for ${requestConfig.url} due to ${error.message}`);
    },
});

// 4. Request Interceptor
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Check Network Connectivity
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected && netInfo.type !== 'unknown') { // Allow unknown for some emulator states
            const error = new axios.AxiosError(
                'No Internet Connection',
                'NO_INTERNET',
                config,
                undefined,
                undefined
            );
            return Promise.reject(error);
        }

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        } catch (error) {
            console.error('Error fetching token', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 5. Response Interceptor & Error Handling
api.interceptors.response.use(
    (response) => {
        console.log(`✅ Response: ${response.status} ${response.config.url}`);
        return response;
    },
    async (error: AxiosError) => {
        const errorDetails = {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            url: error.config?.url,
            timestamp: new Date().toISOString(),
        };

        console.error('❌ API Error Details:', errorDetails);

        // Customize Error Message based on Error Code
        let customMessage = 'An unexpected error occurred.';
        
        if (error.code === 'ECONNABORTED') {
            customMessage = 'Request timed out. Please try again.';
        } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
            customMessage = 'Network Error. Please check your internet connection or server status.';
        } else if (error.code === 'ECONNREFUSED') {
            customMessage = 'Unable to connect to server. Ensure the server is running.';
        }

        // Handle Auth Errors (401)
        if (error.response?.status === 401) {
            const isLoginOrLogout = error.config?.url?.includes('auth/login') || error.config?.url?.includes('auth/logout');
            if (!isLoginOrLogout) {
                authEvents.emit('unauthorized'); // Trigger auto-logout
            }
        }

        // Attach custom message to error object for UI to use
        // @ts-ignore
        error.customMessage = customMessage;

        return Promise.reject(error);
    }
);

export default api;




// Local 
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authEvents } from '../utils/authEvents';

// 1. Dynamic Base URL Configuration
const getBaseUrl = () => {
    // Production URL (Replace with actual domain when live)
    if (!__DEV__) {
        return 'https://api.yourdomain.com/api';
    }

    if (Platform.OS === 'web') {
        return 'http://localhost:8000/api';
    }

    // Android Emulator specific
    const isAndroidEmulator = Constants.isDevice === false;
    if (isAndroidEmulator) {
        return 'http://10.0.2.2:8000/api';
    }

    // Dynamic Host Detection for Expo Go (Physical Device)
    // Uses the same IP that the Expo app loaded the JS bundle from
    try {
        const debuggerHost = Constants.expoConfig?.hostUri;
        if (debuggerHost) {
            const hostString = String(debuggerHost);
            const [host] = hostString.split(':');
            if (host && /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
                console.log('🔗 Detected Expo Host IP:', host);
                // Use port 8085 for the Node Proxy
                return `http://${host}:8085/api`;
            }
        }
    } catch (e) {
        console.log('⚠️ Error detecting host IP from Expo config:', e);
    }

    // Fallback for Physical Device - Fixed Local IP
    // Ensure your computer and phone are on the same Wi-Fi
    // Using Port 8085 (Node Proxy) because PHP Built-in server (port 8000)
    // fails to handle external requests (Empty Reply)
    return 'http://192.168.1.66:8085/api';
};

const BASE_URL = getBaseUrl();
export const API_URL = BASE_URL;
console.log('🔗 API BASE_URL Configured:', BASE_URL);

// 2. Central Axios Instance
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000, // 15 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'bypass-tunnel-reminder': 'true',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'InstituteProApp/1.0',
    },
});

// 3. Retry Strategy
axiosRetry(api, {
    retries: 2,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        // BUT skip retry for POST requests as they are not idempotent (avoids duplicate creation)
        if (error.config?.method === 'post' || error.config?.method === 'POST') {
            return false;
        }
        
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               (error.response?.status ? error.response.status >= 500 : false);
    },
    onRetry: (retryCount, error, requestConfig) => {
        console.log(`⚠️ Retry attempt #${retryCount} for ${requestConfig.url} due to ${error.message}`);
    },
});

// 4. Request Interceptor
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Check Network Connectivity
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected && netInfo.type !== 'unknown') { // Allow unknown for some emulator states
            const error = new axios.AxiosError(
                'No Internet Connection',
                'NO_INTERNET',
                config,
                undefined,
                undefined
            );
            return Promise.reject(error);
        }

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        } catch (error) {
            console.error('Error fetching token', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 5. Response Interceptor & Error Handling
api.interceptors.response.use(
    (response) => {
        console.log(`✅ Response: ${response.status} ${response.config.url}`);
        return response;
    },
    async (error: AxiosError) => {
        const errorDetails = {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            url: error.config?.url,
            timestamp: new Date().toISOString(),
        };

        console.error('❌ API Error Details:', errorDetails);

        // Customize Error Message based on Error Code
        let customMessage = 'An unexpected error occurred.';
        
        if (error.code === 'ECONNABORTED') {
            customMessage = 'Request timed out. Please try again.';
        } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
            customMessage = 'Network Error. Please check your internet connection or server status.';
        } else if (error.code === 'ECONNREFUSED') {
            customMessage = 'Unable to connect to server. Ensure the server is running.';
        }

        // Handle Auth Errors (401)
        if (error.response?.status === 401) {
            const isLoginOrLogout = error.config?.url?.includes('auth/login') || error.config?.url?.includes('auth/logout');
            if (!isLoginOrLogout) {
                authEvents.emit('unauthorized'); // Trigger auto-logout
            }
        }

        // Attach custom message to error object for UI to use
        // @ts-ignore
        error.customMessage = customMessage;

        return Promise.reject(error);
    }
);

export default api;

