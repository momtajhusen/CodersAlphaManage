import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import { useTheme } from '../themes/ThemeContext';
import { Platform } from 'react-native';
import { AnimatedTabIcon } from '../components/AnimatedTabIcon';

import { EmployeeNavigator, AttendanceNavigator, FinanceNavigator, TasksNavigator, ProfileNavigator } from './StackNavigators';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.subtext,
        tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 25 : 15,
            paddingTop: 10,
            height: Platform.OS === 'ios' ? 95 : 80,
            elevation: 0,
            shadowOpacity: 0,
        },
        tabBarLabelStyle: {
            fontSize: 12,
            marginBottom: 5,
            fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Attendance') {
            iconName = focused ? 'calendar-clock' : 'calendar-clock-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'clipboard-check' : 'clipboard-check-outline';
          } else if (route.name === 'Finance') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <AnimatedTabIcon name={iconName} size={26} color={color} focused={focused} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Attendance" component={AttendanceNavigator} />
      <Tab.Screen name="Finance" component={FinanceNavigator} />
      <Tab.Screen name="Tasks" component={TasksNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
