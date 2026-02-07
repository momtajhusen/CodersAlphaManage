import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EmployeeStackParamList, AttendanceStackParamList, FinanceStackParamList, TasksStackParamList, ProfileStackParamList } from './types';

// Employees Screens
import EmployeeListScreen from '../screens/employees/EmployeeListScreen';
import EmployeeDetailScreen from '../screens/employees/EmployeeDetailScreen';
import EmployeeCreateScreen from '../screens/employees/EmployeeCreateScreen';
import EmployeeEditScreen from '../screens/employees/EmployeeEditScreen';

// Attendance Screens
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import AttendanceHistoryScreen from '../screens/attendance/AttendanceHistoryScreen';
import MonthlyReportScreen from '../screens/attendance/MonthlyReportScreen';

// Finance Screens
import ExpensesScreen from '../screens/expenses/ExpensesScreen';
import CreateIncomeScreen from '../screens/income/CreateIncomeScreen';
import IncomeDetailScreen from '../screens/income/IncomeDetailScreen';
import CreateExpenseScreen from '../screens/expenses/CreateExpenseScreen';
import ExpenseDetailScreen from '../screens/expenses/ExpenseDetailScreen';
// Transfer Screens
import TransferMoneyScreen from '../screens/transfer/TransferMoneyScreen';
import TransferHistoryScreen from '../screens/transfer/TransferHistoryScreen';

// Tasks Screens
import TasksScreen from '../screens/tasks/TasksScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import CreateTaskScreen from '../screens/tasks/CreateTaskScreen';
import CreateWorkLogScreen from '../screens/tasks/CreateWorkLogScreen';

// Profile Screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ActivityLogScreen from '../screens/activity/ActivityLogScreen';
import LecturerNoticesScreen from '../screens/notices/LecturerNoticesScreen';
import HelpCenterScreen from '../screens/profile/HelpCenterScreen';
import AboutAppScreen from '../screens/profile/AboutAppScreen';

const EmployeeStack = createNativeStackNavigator<EmployeeStackParamList>();
const AttendanceStack = createNativeStackNavigator<AttendanceStackParamList>();
const FinanceStack = createNativeStackNavigator<FinanceStackParamList>();
const TasksStack = createNativeStackNavigator<TasksStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

export function EmployeeNavigator() {
  return (
    <EmployeeStack.Navigator screenOptions={{ headerShown: false }}>
      <EmployeeStack.Screen name="EmployeeList" component={EmployeeListScreen} />
      <EmployeeStack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
      <EmployeeStack.Screen name="EmployeeCreate" component={EmployeeCreateScreen} />
      <EmployeeStack.Screen name="EmployeeEdit" component={EmployeeEditScreen} />
    </EmployeeStack.Navigator>
  );
}

export function AttendanceNavigator() {
  return (
    <AttendanceStack.Navigator screenOptions={{ headerShown: false }}>
      <AttendanceStack.Screen name="AttendanceHome" component={AttendanceScreen} />
      <AttendanceStack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
      <AttendanceStack.Screen name="MonthlyReport" component={MonthlyReportScreen} />
    </AttendanceStack.Navigator>
  );
}

export function FinanceNavigator() {
  return (
    <FinanceStack.Navigator screenOptions={{ headerShown: false }}>
      <FinanceStack.Screen name="FinanceHome" component={ExpensesScreen} />
      <FinanceStack.Screen name="CreateIncome" component={CreateIncomeScreen} />
      <FinanceStack.Screen name="IncomeDetail" component={IncomeDetailScreen} />
      <FinanceStack.Screen name="CreateExpense" component={CreateExpenseScreen} />
      <FinanceStack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <FinanceStack.Screen name="TransferMoney" component={TransferMoneyScreen} />
      <FinanceStack.Screen name="TransferHistory" component={TransferHistoryScreen} />
    </FinanceStack.Navigator>
  );
}

export function TasksNavigator() {
  return (
    <TasksStack.Navigator screenOptions={{ headerShown: false }}>
      <TasksStack.Screen name="TasksList" component={TasksScreen} />
      <TasksStack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <TasksStack.Screen name="CreateTask" component={CreateTaskScreen} />
      <TasksStack.Screen name="CreateWorkLog" component={CreateWorkLogScreen} />
    </TasksStack.Navigator>
  );
}

export function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="LecturerNotices" component={LecturerNoticesScreen} />
      <ProfileStack.Screen name="ActivityLog" component={ActivityLogScreen} />
      <ProfileStack.Screen name="Employees" component={EmployeeNavigator} />
      <ProfileStack.Screen name="HelpCenter" component={HelpCenterScreen} />
      <ProfileStack.Screen name="AboutApp" component={AboutAppScreen} />
    </ProfileStack.Navigator>
  );
}
