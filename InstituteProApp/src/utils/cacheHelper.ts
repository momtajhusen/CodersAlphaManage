import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'app_cache_';
const DEFAULT_EXPIRY_MINUTES = 60 * 24; // 24 hours default

interface CacheItem<T> {
    data: T;
    timestamp: number;
    version: number;
}

const CURRENT_VERSION = 1;

export const cacheHelper = {
    /**
     * Save data to cache
     * @param key Unique cache key
     * @param data Data to store
     */
    save: async <T>(key: string, data: T): Promise<void> => {
        try {
            const item: CacheItem<T> = {
                data,
                timestamp: Date.now(),
                version: CURRENT_VERSION
            };
            await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
        } catch (error) {
            console.error('Cache save error:', error);
        }
    },

    /**
     * Load data from cache
     * @param key Unique cache key
     * @param expiryMinutes Optional expiry time in minutes
     * @returns Cached data or null if expired/not found
     */
    load: async <T>(key: string, expiryMinutes: number = DEFAULT_EXPIRY_MINUTES): Promise<T | null> => {
        try {
            const json = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
            if (!json) return null;

            const item: CacheItem<T> = JSON.parse(json);
            
            // Check version
            if (item.version !== CURRENT_VERSION) {
                return null;
            }

            // Check expiry
            const ageMinutes = (Date.now() - item.timestamp) / (1000 * 60);
            if (ageMinutes > expiryMinutes) {
                return null;
            }

            return item.data;
        } catch (error) {
            console.error('Cache load error:', error);
            return null;
        }
    },

    /**
     * Clear specific cache key
     */
    remove: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        } catch (error) {
            console.error('Cache remove error:', error);
        }
    },

    /**
     * Clear all app cache
     */
    clearAll: async (): Promise<void> => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const appKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
            await AsyncStorage.multiRemove(appKeys);
        } catch (error) {
            console.error('Cache clear all error:', error);
        }
    }
};
