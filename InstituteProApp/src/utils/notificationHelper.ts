import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      // Permission not granted
      return null;
    }
    
    // Get the token that uniquely identifies this device
    try {
        // Check if running in Expo Go to avoid error log
        // 'storeClient' is the execution environment for Expo Go
        const isExpoGo = Constants.executionEnvironment === 'storeClient';
        
        // Removed the early return for Expo Go so we can try to get a real token if possible (e.g. in development build)
        // or let it fail gracefully. The logic below already handles failures.
        
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || undefined;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e: any) {
        const errorMessage = e?.message || e?.toString();
        if (errorMessage.includes('Expo Go') || errorMessage.includes('expo-notifications')) {
            console.log('⚠️ Push Notifications are limited in Expo Go. Using dummy token.');
            return 'ExponentPushToken[ExpoGoDebugToken]';
        }
        console.error('Error getting push token', e);
        return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  return token;
}

export async function checkNotificationPermissions() {
    if (!Device.isDevice) return 'emulator';
    const { status } = await Notifications.getPermissionsAsync();
    return status;
}
