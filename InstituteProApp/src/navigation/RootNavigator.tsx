import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { useTheme } from '../themes/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import BiometricLockScreen from '../screens/BiometricLockScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function RootNavigator() {
  const { theme, scheme } = useTheme();
  const { user, isInitializing } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [isBiometricChecked, setIsBiometricChecked] = useState(false);

  const [pendingNotification, setPendingNotification] = useState<Notifications.NotificationResponse | null>(null);

  useEffect(() => {
    // Check if app was opened via notification (Cold Start)
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        setPendingNotification(response);
      }
    };
    checkInitialNotification();

    // Handle Notification Click (Foreground/Background)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
       setPendingNotification(response);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (user && pendingNotification && navigationRef.isReady()) {
       const data = pendingNotification.notification.request.content.data;
       
       if (data?.type === 'attendance') {
            navigationRef.navigate('Main', {
              screen: 'Attendance',
              params: {
                screen: 'AttendanceHome'
              }
            } as any);
       } else if (data?.type === 'task') {
            navigationRef.navigate('Main', {
                screen: 'Tasks',
                params: {
                    screen: 'TaskDetail',
                    params: { id: data.reference_id || data.task_id }
                }
            } as any);
       } else if (data?.type === 'expense') {
            navigationRef.navigate('Main', {
                screen: 'Finance',
                params: {
                    screen: 'ExpenseDetail',
                    params: { id: data.reference_id || data.expense_id }
                }
            } as any);
       } else if (data?.type === 'income') {
             navigationRef.navigate('Main', {
                 screen: 'Finance',
                 params: {
                     screen: 'IncomeDetail',
                     params: { id: data.reference_id || data.income_id }
                 }
             } as any);
       } else if (data?.type === 'transfer' || (typeof data?.type === 'string' && data.type.startsWith('cash_transfer_'))) {
            navigationRef.navigate('Main', {
                screen: 'Finance',
                params: {
                    screen: 'TransferHistory'
                }
            } as any);
       }
       
       setPendingNotification(null);
    }
  }, [user, pendingNotification]);

  useEffect(() => {
    if (isInitializing) return;
    
    // Only check once on startup
    if (!isBiometricChecked) {
      checkBiometricStatus();
    }
  }, [isInitializing, user]);

  const checkBiometricStatus = async () => {
    if (!user) {
      setIsLocked(false);
      setIsBiometricChecked(true);
      return;
    }

    try {
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      if (enabled === 'true') {
        setIsLocked(true);
        authenticate();
      } else {
        setIsLocked(false);
      }
    } catch (e) {
      console.log('Biometric check error:', e);
      setIsLocked(false);
    } finally {
      setIsBiometricChecked(true);
    }
  };

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock CodersAlpha Manage',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setIsLocked(false);
      }
    } catch (e) {
      console.log('Authentication error:', e);
    }
  };

  const navigationTheme = {
    dark: scheme === 'dark',
    colors: {
      primary: theme.accent,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.notification,
    },
  };

  // While initializing or checking biometric, keep showing native splash (handled by App.tsx preventAutoHideAsync)
  // We just return null here, and once ready, we hide the splash screen
  useEffect(() => {
    if (!isInitializing && isBiometricChecked) {
      SplashScreen.hideAsync();
    }
  }, [isInitializing, isBiometricChecked]);

  if (isInitializing || !isBiometricChecked) {
    return null;
  }

  if (user && isLocked) {
    return <BiometricLockScreen onUnlock={authenticate} />;
  }

  return (
    <NavigationContainer theme={navigationTheme} ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
