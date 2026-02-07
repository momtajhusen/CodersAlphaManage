import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Light = {
  primary: '#FFFFFF',
  secondary: '#F7F9FC',
  tertiary: '#E8ECF2',
  accent: '#FF6B35',
  warning: '#FFC107',
  error: '#D32F2F',
  background: '#FFFFFF',
  card: '#F5F7FA',
  text: '#2C3E50',
  subtext: '#7F8C9A',
  border: '#DFE4EA',
  notification: '#FF6B35',
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  shadowOpacity: 0.1,
};

export const Dark = {
  primary: '#1A2332',
  secondary: '#212D3F',
  tertiary: '#2E3A4D',
  accent: '#FF6B35',
  warning: '#FFC107',
  error: '#FF5252',
  background: '#1A2332',
  card: '#242F40',
  text: '#E8ECF2',
  subtext: '#A0A8B5',
  border: '#2E3A4D',
  notification: '#FF6B35',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowOffset: { width: 0, height: 3 },
  shadowRadius: 8,
  shadowOpacity: 0.4,
};

type ThemeObject = typeof Light;

type ThemeContextValue = {
  theme: ThemeObject;
  scheme: ColorSchemeName;
  toggle: () => void;
  setScheme: (s: ColorSchemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: Dark,
  scheme: 'dark',
  toggle: () => {},
  setScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<ColorSchemeName>('dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedScheme = await AsyncStorage.getItem('app_theme');
        if (savedScheme === 'dark' || savedScheme === 'light') {
            setSchemeState(savedScheme);
        }
      } catch (e) {
        console.log('Failed to load theme', e);
      }
    };
    loadTheme();
  }, []);

  const setScheme = async (s: ColorSchemeName) => {
      setSchemeState(s);
      try {
          await AsyncStorage.setItem('app_theme', s as string);
      } catch (e) {
          console.log('Failed to save theme', e);
      }
  };

  const theme = useMemo(() => (scheme === 'dark' ? Dark : Light), [scheme]);

  const value = useMemo(
    () => ({
      theme,
      scheme,
      toggle: () => setScheme(scheme === 'dark' ? 'light' : 'dark'),
      setScheme,
    }),
    [theme, scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
