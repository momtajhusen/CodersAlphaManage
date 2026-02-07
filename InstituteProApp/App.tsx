import 'react-native-reanimated';
import React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/themes/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/ToastConfig';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <RootNavigator />
          <Toast config={toastConfig} topOffset={60} />
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
