export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Notifications: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Attendance: undefined;
  Tasks: undefined;
  Finance: undefined;
  Profile: undefined;
};

export type EmployeeStackParamList = {
  EmployeeList: undefined;
  EmployeeDetail: { id: string };
  EmployeeCreate: undefined;
  EmployeeEdit: { id: string };
};

export type AttendanceStackParamList = {
  AttendanceHome: undefined;
  AttendanceHistory: { employeeId?: number };
  MonthlyReport: undefined;
};

export type FinanceStackParamList = {
  FinanceHome: undefined;
  IncomeDetail: { id: string };
  CreateIncome: undefined;
  ExpenseDetail: { id: string };
  CreateExpense: undefined;
  TransferMoney: undefined;
  TransferHistory: undefined;
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { id: string };
  CreateTask: undefined;
  CreateWorkLog: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  LecturerNotices: { filterStatus?: string };
  ActivityLog: undefined;
  Employees: undefined;
  HelpCenter: undefined;
  AboutApp: undefined;
};
