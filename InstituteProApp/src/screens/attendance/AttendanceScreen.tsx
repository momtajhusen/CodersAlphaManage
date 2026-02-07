import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Modal, FlatList, Image, RefreshControl, InteractionManager, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AttendanceStackParamList } from '../../navigation/types';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import attendanceService from '../../services/attendanceService';
import employeeService from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';
import { cacheHelper } from '../../utils/cacheHelper';

import Header from '../../components/Header';

type AttendanceScreenNavigationProp = NativeStackNavigationProp<AttendanceStackParamList, 'AttendanceHome'>;

import { Calendar, DateData } from 'react-native-calendars';



export default function AttendanceScreen() {
  const navigation = useNavigation<AttendanceScreenNavigationProp>();
  const { theme, scheme } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Employee Selection State
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
  
  const [markModalVisible, setMarkModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (markModalVisible) {
      slideAnim.setValue(300);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [markModalVisible]);

  const closeMarkModal = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setMarkModalVisible(false);
    });
  };

    // Auto-select shift based on time (5AM-7PM = Day, 7PM-5AM = Night)
  const getShiftByTime = () => {
    const currentHour = new Date().getHours();
    return (currentHour >= 5 && currentHour < 19) ? 'day' : 'night';
  };

  const [shiftType, setShiftType] = useState<'day' | 'night'>(getShiftByTime());
  
  const currentEmployee = employees.find(e => e.id === selectedEmployeeId);
  const attendanceMode = currentEmployee?.attendance_mode || 'direct_status';

  // Fetch employees list
  const fetchEmployees = async () => {
      const cacheKey = 'employees_list';
      try {
          // 1. Try Cache First
          const cached = await cacheHelper.load(cacheKey);
          if (cached && Array.isArray(cached)) {
              setEmployees(cached);
              // Setup initial user from cache if needed
              if (!selectedEmployeeId && user?.employee?.id) {
                  const currentUserEmployee = cached.find((e: any) => e.id === user.employee.id);
                  if (currentUserEmployee) {
                       setSelectedEmployeeId(user.employee.id);
                       setSelectedEmployeeName(currentUserEmployee.full_name);
                  }
              }
          }

          // 2. Fetch Fresh Data
          const response = await employeeService.getEmployees({ per_page: 100, status: 'active' });
          const allEmployees = response.data?.data || response.data || [];
          
          // Only update if different (simple check) or just update always to be safe
          setEmployees(allEmployees);
          cacheHelper.save(cacheKey, allEmployees);
          
          // Set initial selected employee to current user if not set (and wasn't set by cache)
          if (!selectedEmployeeId) {
              if (user?.employee?.id) {
                  setSelectedEmployeeId(user.employee.id);
                  const currentUserEmployee = allEmployees.find((e: any) => e.id === user.employee.id);
                  if (currentUserEmployee) {
                      setSelectedEmployeeName(currentUserEmployee.full_name);
                  } else {
                       setSelectedEmployeeName(user.employee.full_name || 'My Attendance');
                  }
              } else if (user?.email) {
                  // Fallback: Try to find by email if user.employee is missing
                  const matchingEmployee = allEmployees.find((e: any) => e.email === user.email);
                  if (matchingEmployee) {
                      setSelectedEmployeeId(matchingEmployee.id);
                      setSelectedEmployeeName(matchingEmployee.full_name);
                  }
              }
          }
      } catch (error) {
          console.error('Failed to fetch employees', error);
      }
  };

  useEffect(() => {
      fetchEmployees();
  }, []);

  // Set default selected employee based on logged-in user
  useEffect(() => {
    if (!selectedEmployeeId && user?.employee?.id) {
        setSelectedEmployeeId(user.employee.id);
    }
    
    // Update name if selected is current user
    if (user?.employee?.id && (selectedEmployeeId === user.employee.id || !selectedEmployeeId)) {
        const emp = employees.find((e: any) => e.id === user.employee.id);
        if (emp) {
            setSelectedEmployeeName(emp.full_name);
        } else if (!selectedEmployeeName) {
            setSelectedEmployeeName(user.employee.full_name || 'My Attendance');
        }
    }
  }, [user, employees, selectedEmployeeId]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Helper to get local date string YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  // State to track the currently visible month in calendar
  const [currentMonth, setCurrentMonth] = useState<string>(getLocalDateString());
  
  // Sync currentMonth when selectedDate changes (only if month changes)
  useEffect(() => {
      if (selectedDate.substring(0, 7) !== currentMonth.substring(0, 7)) {
          setCurrentMonth(selectedDate);
      }
  }, [selectedDate]);

  const [markedDates, setMarkedDates] = useState<any>({});
  const [monthlyStats, setMonthlyStats] = useState({ present: 0, absent: 0, total: 0, percentage: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Calendar' | 'History'>('Calendar');

  // Annual Report State
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [annualData, setAnnualData] = useState<any[]>([]);
  const [annualLoading, setAnnualLoading] = useState(false);

  const fetchAnnualReport = async () => {
    try {
        setAnnualLoading(true);
        const targetEmployeeId = selectedEmployeeId || user?.employee?.id;
        
        if (targetEmployeeId) {
            const response = await attendanceService.getAnnualReport({
                employee_id: targetEmployeeId,
                year: selectedYear
            });
            
            if (response.success) {
                setAnnualData(response.data.monthly_data);
            }
        }
    } catch (error) {
        console.error('Failed to fetch annual report', error);
    } finally {
        setAnnualLoading(false);
    }
  };

  useEffect(() => {
      fetchAnnualReport();
  }, [selectedEmployeeId, selectedYear]);

  const fetchMonthlyData = async (dateString: string) => {
    const [y, m] = dateString.split('-').map(Number);
    const month = m;
    const year = y;
    const targetEmployeeId = selectedEmployeeId || user?.employee?.id;

    if (!targetEmployeeId) return;

    // Helper to process data
    const processData = (data: any) => {
        if (data && data.daily_records) {
            const groupedData: any = {};
            let presentCount = 0;
            let absentCount = 0;
            
            // Group by date to handle day/night shifts
            data.daily_records.forEach((record: any) => {
                if (!groupedData[record.date]) {
                    groupedData[record.date] = {
                        day: null,
                        night: null
                    };
                }
                const shift = record.shift ? record.shift.toLowerCase() : 'day';
                const status = record.status ? record.status.toLowerCase() : '';
                
                if (shift === 'both') {
                    groupedData[record.date]['day'] = status;
                    groupedData[record.date]['night'] = status;
                } else if (shift === 'day') {
                    groupedData[record.date]['day'] = status;
                } else if (shift === 'night') {
                    groupedData[record.date]['night'] = status;
                }
                
                if (status === 'present' || status === 'late') {
                    presentCount++;
                } else if (status === 'absent') {
                    absentCount++;
                }
            });
            
            // Calculate percentage
            const uniquePresentDates = new Set();
            data.daily_records.forEach((record: any) => {
                const status = record.status ? record.status.toLowerCase() : '';
                if (status === 'present' || status === 'late' || status === 'half_day') {
                    uniquePresentDates.add(record.date);
                }
            });

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;

            let daysInDivisor = 0;
            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                daysInDivisor = new Date(year, month, 0).getDate();
            } else if (year === currentYear && month === currentMonth) {
                daysInDivisor = now.getDate();
            }

            let percentage = 0;
            if (daysInDivisor > 0) {
                percentage = (uniquePresentDates.size / daysInDivisor) * 100;
            }
            percentage = Math.min(percentage, 100);

            const total = presentCount + absentCount;
            
            setMonthlyStats({
                present: presentCount,
                absent: absentCount,
                total: total,
                percentage: parseFloat(percentage.toFixed(1))
            });

            const newMarkedDates: any = {};
            Object.keys(groupedData).forEach(dateKey => {
                newMarkedDates[dateKey] = {
                    dayStatus: groupedData[dateKey]['day'],
                    nightStatus: groupedData[dateKey]['night']
                };
            });
            
            setMarkedDates(newMarkedDates);
        }
    };

    const cacheKey = `monthly_attendance_${targetEmployeeId}_${year}_${month}`;

    try {
        // 1. Try Cache
        const cached = await cacheHelper.load(cacheKey);
        if (cached) {
            processData(cached);
        } else {
            setStatsLoading(true);
        }

        // 2. Fetch Fresh
        const response = await attendanceService.getMonthlyReport({
            employee_id: targetEmployeeId,
            month,
            year
        });

        if (response.success) {
            processData(response.data);
            cacheHelper.save(cacheKey, response.data);
        }
    } catch (error) {
        console.error('Error fetching monthly data', error);
    } finally {
        setStatsLoading(false);
    }
  };

  useEffect(() => {
      fetchMonthlyData(selectedDate);
  }, [selectedEmployeeId, selectedDate.substring(0, 7)]);

  useEffect(() => {
      if (showDatePicker) {
          fetchMonthlyData(selectedDate);
      }
  }, [showDatePicker]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    // Legacy function, replaced by Calendar onDayPress
  };

  const fetchAttendanceData = async (date = selectedDate) => {
    try {
      if (!initialLoadDone) {
        setLoading(true);
      } else {
        setDayLoading(true);
      }
      
      const targetEmployeeId = selectedEmployeeId || user?.employee?.id;

      if (targetEmployeeId) {
          // Fetch attendance for selected date
          const response = await attendanceService.getAttendance({
              employee_id: targetEmployeeId,
              from_date: date,
              to_date: date
          });
          
          if (response && response.data && response.data.data && response.data.data.length > 0) {
              const record = response.data.data.find((r: any) => r.shift_type === shiftType);
              setTodayAttendance(record || null);
          } else {
              setTodayAttendance(null);
          }

          // Fetch recent history
          const historyResponse = await attendanceService.getAttendance({
              employee_id: targetEmployeeId,
              per_page: 5,
              shift_type: shiftType
          });
          
          if (historyResponse.data && historyResponse.data.data) {
              setRecentHistory(historyResponse.data.data);
          }
      }
    } catch (error) {
      console.error('Failed to fetch attendance data', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load attendance data'
      });
    } finally {
      setLoading(false);
      setDayLoading(false);
      setInitialLoadDone(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        if (selectedEmployeeId) {
            fetchAttendanceData(selectedDate);
        } else {
            setLoading(false);
        }
      });
      return () => task.cancel();
    }, [selectedEmployeeId, shiftType, selectedDate])
  );

  const handleMarkStatus = async (status: 'present' | 'absent') => {
    if (!selectedEmployeeId) return;
    
    const prepareUpdateData = (status: 'present' | 'absent', existingRecord: any) => {
         const updateData: any = { status };
         if (status === 'present' && !existingRecord.check_in_time) {
             const now = new Date();
             updateData.check_in_time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
         } else if (status === 'absent') {
             updateData.check_in_time = null;
         }
         return updateData;
    };

    try {
        setActionLoading(true);
        
        if (todayAttendance && todayAttendance.id) {
            // Update existing attendance
            const updateData = prepareUpdateData(status, todayAttendance);

            await attendanceService.updateAttendance(todayAttendance.id, updateData);
            
            // Optimistic update
            setTodayAttendance({ ...todayAttendance, status, check_in_time: updateData.check_in_time !== undefined ? updateData.check_in_time : todayAttendance.check_in_time });
            
            Toast.show({
                type: 'success',
                text1: 'Status Updated',
                text2: `Successfully updated status to ${status}.`
            });
        } else {
            try {
                // Create new attendance
                const result = await attendanceService.checkIn({ 
                    shift_type: shiftType,
                    employee_id: selectedEmployeeId,
                    status: status,
                    date: selectedDate 
                });
                
                // Optimistic update using returned data
                if (result && result.data) {
                    setTodayAttendance(result.data);
                }

                Toast.show({
                    type: 'success',
                    text1: status === 'present' ? 'Marked Present' : 'Marked Absent',
                    text2: `Successfully marked ${status} for ${selectedEmployeeName} on ${selectedDate}.`
                });
            } catch (createError: any) {
                // Handle "Already marked" specifically (Race condition or sync issue)
                if (createError.response && createError.response.status === 422 && createError.response.data?.message?.toLowerCase().includes('already marked')) {
                    console.log('Attendance already exists, attempting recovery via update...');
                    
                    // Fetch the latest data to get the ID
                     const response = await attendanceService.getAttendance({
                          employee_id: selectedEmployeeId,
                          from_date: selectedDate,
                          to_date: selectedDate
                      });
                      
                      const existingRecord = response?.data?.data?.find((r: any) => r.shift_type === shiftType);
                      
                      if (existingRecord && existingRecord.id) {
                          setTodayAttendance(existingRecord);
                          
                          // Retry as update
                          const updateData = prepareUpdateData(status, existingRecord);
                          await attendanceService.updateAttendance(existingRecord.id, updateData);
                          
                          // Optimistic update
                          setTodayAttendance({ ...existingRecord, status, check_in_time: updateData.check_in_time !== undefined ? updateData.check_in_time : existingRecord.check_in_time });

                           Toast.show({
                                type: 'success',
                                text1: 'Status Updated',
                                text2: `Successfully updated status to ${status}.`
                            });
                      } else {
                          throw createError; // Couldn't find it even after fetch
                      }
                } else {
                    throw createError;
                }
            }
        }
        
        // Refresh data in background to ensure consistency
        fetchAttendanceData();
        fetchMonthlyData(selectedDate);
    } catch (error: any) {
        console.error('Marking failed', error);
        const message = error.response?.data?.message || 'Failed to mark attendance';
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: message
        });
    } finally {
        setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
      if (!selectedEmployeeId) return;

      try {
          setActionLoading(true);
          await attendanceService.checkOut({ 
              employee_id: selectedEmployeeId 
          });
          Toast.show({
              type: 'success',
              text1: 'Checked Out',
              text2: `Successfully checked out for ${selectedEmployeeName}.`
          });
          fetchAttendanceData();
          fetchMonthlyData(selectedDate);
      } catch (error: any) {
          console.error('Check-out failed', error);
          const message = error.response?.data?.message || 'Failed to check out';
          Toast.show({
              type: 'error',
              text1: 'Error',
              text2: message
          });
      } finally {
          setActionLoading(false);
      }
  };

  const handleUndoAttendance = () => {
      if (!todayAttendance?.id) return;

      Alert.alert(
          'Undo Attendance',
          'Are you sure you want to delete this attendance record? This action cannot be undone.',
          [
              { text: 'Cancel', style: 'cancel' },
              { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: async () => {
                      try {
                          setActionLoading(true);
                          await attendanceService.deleteAttendance(todayAttendance.id);
                          Toast.show({
                              type: 'success',
                              text1: 'Attendance Deleted',
                              text2: 'Attendance record has been removed.'
                          });
                          fetchAttendanceData();
                          fetchMonthlyData(selectedDate);
                      } catch (error: any) {
                          console.error('Delete failed', error);
                          const message = error.response?.data?.message || 'Failed to delete attendance';
                          Toast.show({
                              type: 'error',
                              text1: 'Error',
                              text2: message
                          });
                      } finally {
                          setActionLoading(false);
                      }
                  }
              }
          ]
      );
  };

  const selectEmployee = (employee: any) => {
      setSelectedEmployeeId(employee.id);
      setSelectedEmployeeName(employee.full_name);
      setEmployeeModalVisible(false);
      
      // Auto-select preferred shift if set (and not 'both')
      if (employee.preferred_shift && employee.preferred_shift !== 'both') {
          setShiftType(employee.preferred_shift);
      }
  };

  const formatTime = (timeString: string) => {
      if (!timeString) return '-';
      // Handle "HH:mm:ss"
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
      padding: rw(4),
    },
    title: {
      fontSize: rf(2.5),
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: rh(3),
    },
    statusCard: {
      backgroundColor: theme.card,
      padding: rw(4),
      borderRadius: rw(4),
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      alignItems: 'center',
      marginBottom: rh(3),
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
    },
    statusLabel: {
      color: theme.subtext,
      marginBottom: rh(1),
      fontSize: rf(1.8),
    },
    statusValue: {
      fontSize: rf(2.2),
      fontWeight: '600',
      color: theme.text,
      marginBottom: rh(3),
    },
    checkInButton: {
      backgroundColor: todayAttendance?.check_in_time && !todayAttendance?.check_out_time ? '#ef4444' : theme.accent,
      width: rw(45),
      height: rw(45),
      borderRadius: rw(22.5),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 4,
      borderColor: scheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
      opacity: todayAttendance?.check_out_time ? 0.7 : 1,
    },
    checkInText: {
      color: '#FFFFFF',
      fontSize: rf(2.5),
      fontWeight: 'bold',
    },
    timeText: {
      color: 'rgba(255,255,255,0.8)',
      marginTop: rh(0.5),
      fontSize: rf(1.6),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: rh(2),
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: rf(2),
      fontWeight: 'bold',
      color: theme.text,
    },
    viewAllText: {
      color: theme.accent,
      fontWeight: '500',
      fontSize: rf(1.8),
    },
    historyCard: {
      backgroundColor: theme.card,
      padding: rw(4),
      borderRadius: rw(4),
      marginBottom: rh(2),
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      elevation: 1,
    },
    historyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: rh(1),
    },
    historyRowBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: rh(1),
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    dateText: {
      color: theme.text,
      fontWeight: '500',
      fontSize: rf(1.8),
    },
    timeRangeText: {
      color: '#16a34a', // green-600
      fontWeight: '500',
      fontSize: rf(1.8),
    },
    absentText: {
      color: theme.error,
      fontWeight: '500',
      fontSize: rf(1.8),
    },
    reportButton: {
      backgroundColor: theme.card,
      padding: rw(4),
      borderRadius: rw(4),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      elevation: 1,
    },
    reportIconContainer: {
      backgroundColor: scheme === 'dark' ? 'rgba(124, 58, 237, 0.2)' : '#ede9fe', // purple-100 equivalent
      padding: rw(2),
      borderRadius: rw(2),
      marginRight: rw(3),
    },
    reportTextContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reportText: {
      fontSize: rf(2),
      fontWeight: '600',
      color: theme.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rh(1),
    },
    employeeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        paddingHorizontal: rw(3),
        paddingVertical: rh(1),
        borderRadius: rw(2),
        borderWidth: 1,
        borderColor: theme.border,
        maxWidth: rw(50),
    },
    employeeSelectorText: {
        color: theme.text,
        marginHorizontal: rw(2),
        fontSize: rf(1.8),
        fontWeight: '500',
        flexShrink: 1,
    },
    undoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: rh(3),
        padding: rw(2),
    },
    undoText: {
        color: theme.error,
        marginLeft: rw(2),
        fontSize: rf(1.8),
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.card,
        borderTopLeftRadius: rw(5),
        borderTopRightRadius: rw(5),
        padding: rw(5),
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rh(2),
        paddingBottom: rh(2),
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    modalTitle: {
        fontSize: rf(2.2),
        fontWeight: 'bold',
        color: theme.text,
    },
    employeeList: {
        maxHeight: rh(50),
    },
    employeeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: rh(2),
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    selectedEmployeeItem: {
        backgroundColor: scheme === 'dark' ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff',
        paddingHorizontal: rw(2),
        borderRadius: rw(2),
    },
    employeeName: {
        fontSize: rf(1.8),
        color: theme.text,
    },
    selectedEmployeeText: {
        color: theme.text,
        fontWeight: 'bold',
    },
    shiftSelectorContainer: {
        flexDirection: 'row',
        backgroundColor: theme.card,
        borderRadius: rw(3),
        padding: rw(1),
        marginBottom: rh(3),
        borderWidth: 1,
        borderColor: theme.border,
    },
    shiftOption: {
        flex: 1,
        paddingVertical: rh(1.5),
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: rw(2.5),
        gap: rw(2),
    },
    selectedShiftOption: {
        backgroundColor: theme.primary,
    },
    shiftOptionText: {
        fontSize: rf(1.8),
        fontWeight: '600',
        color: theme.subtext,
    },
    selectedShiftOptionText: {
        color: '#FFFFFF',
    },
    actionButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: rh(2),
        gap: rw(4),
    },
    actionButton: {
        paddingVertical: rh(1.5),
        paddingHorizontal: rw(4),
        borderRadius: rw(2),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.shadow,
        shadowOffset: theme.shadowOffset,
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: theme.shadowRadius,
        elevation: 2,
        minWidth: rw(30),
    },
    presentButton: {
        backgroundColor: '#059669',
    },
    absentButton: {
        backgroundColor: '#dc2626',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: rf(1.8),
        fontWeight: 'bold',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        paddingHorizontal: rw(3),
        paddingVertical: rh(1),
        borderRadius: rw(2),
        borderWidth: 1,
        borderColor: theme.border,
        marginLeft: rw(2),
    },
    datePickerText: {
        color: theme.text,
        marginLeft: rw(2),
        fontSize: rf(1.8),
        fontWeight: '500',
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
        await Promise.all([
            fetchEmployees(),
            fetchAttendanceData(),
            fetchMonthlyData(selectedDate)
        ]);
    } catch (error) {
        console.error('Refresh failed', error);
    } finally {
        setRefreshing(false);
    }
  }, [selectedDate, selectedEmployeeId, shiftType]);

  const renderCustomHeader = (date: any) => {
    const d = new Date(date);
    const monthYear = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    const profilePic = currentEmployee?.profile_photo_url;

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: rh(0.5) }}>
            <Text style={{ fontSize: rf(2), fontWeight: 'bold', color: theme.text, textAlign: 'center' }}>
                {monthYear}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: rh(0.2) }}>
                 {profilePic && (
                    <Image 
                        source={{ uri: profilePic }} 
                        style={{ width: rw(5), height: rw(5), borderRadius: rw(2.5), marginRight: rw(1.5) }} 
                    />
                 )}
                <Text style={{ fontSize: rf(1.6), color: theme.text, fontWeight: '600', textAlign: 'center' }}>
                    {selectedEmployeeName || 'Employee'}
                </Text>
            </View>
        </View>
    );
  };

  const finalMarkedDates = React.useMemo(() => {
     const marked = { ...markedDates }; // Shallow copy is enough as we replace the object key
     if (selectedDate) {
         marked[selectedDate] = {
             ...(marked[selectedDate] || {}),
             selected: true
         };
     }
     return marked;
   }, [markedDates, selectedDate]);

  const renderDay = useCallback(({date, state, marking}: any) => {
      const isSelected = marking?.selected;
      const todayString = new Date().toISOString().split('T')[0];
      const isToday = date.dateString === todayString;
      const isFuture = date.dateString > todayString;
      const isDisabled = state === 'disabled';
      
      const dayStatus = marking?.dayStatus;
      const nightStatus = marking?.nightStatus;
      
      const getColor = (status: string) => {
           if (!status) return 'transparent';
           const s = status.toLowerCase();
           if (s === 'present' || s === 'late') return 'rgba(5, 150, 105, 0.4)'; // Increased opacity for better visibility
           if (s === 'absent') return 'rgba(220, 38, 38, 0.4)'; // Increased opacity for better visibility
           return 'transparent';
      }
      
      const leftColor = getColor(dayStatus);
      const rightColor = getColor(nightStatus);
      
      return (
          <TouchableOpacity 
              onPress={() => !isFuture && setSelectedDate(date.dateString)}
              disabled={isFuture}
              style={{
                  width: 28,
                  height: 28,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: isFuture ? 0.5 : 1
              }}
          >
              <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  overflow: 'hidden',
                  flexDirection: 'row',
                  position: 'absolute',
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: theme.primary,
                  backgroundColor: isSelected && !dayStatus && !nightStatus ? theme.primary : 'transparent',
                  elevation: isSelected ? 2 : 0,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isSelected ? 0.2 : 0,
                  shadowRadius: 2,
              }}>
                  <View style={{ flex: 1, backgroundColor: leftColor }} />
                  <View style={{ flex: 1, backgroundColor: rightColor }} />
                  
                  {/* Vertical Divider for Visual Separation */}
                  {(dayStatus || nightStatus) && (
                      <View style={{
                          position: 'absolute',
                          left: '50%',
                          top: 0,
                          bottom: 0,
                          width: 1.5,
                          backgroundColor: theme.card,
                          transform: [{ translateX: -0.75 }],
                          zIndex: 1
                      }} />
                  )}
              </View>
              
              <Text style={{ 
                  color: isFuture 
                    ? theme.subtext // More visible than border color
                    : isDisabled 
                        ? theme.subtext 
                        : (isSelected && !dayStatus && !nightStatus ? '#fff' : (dayStatus || nightStatus ? theme.text : theme.text)),
                  fontWeight: (isSelected || isToday || dayStatus || nightStatus) ? 'bold' : 'normal',
                  fontSize: rf(1.4),
                  zIndex: 2,
              }}>
                  {date.day}
              </Text>
              
              {isToday && !isSelected && !dayStatus && !nightStatus && (
                  <View style={{
                      position: 'absolute',
                      bottom: 2,
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.primary
                  }} />
              )}
          </TouchableOpacity>
      );
  }, [theme]);

  if (loading && !todayAttendance && recentHistory.length === 0) {
      return (
          <SafeAreaView style={[styles.container, styles.loadingContainer]}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={{ marginTop: rh(2), color: theme.subtext }}>Loading attendance...</Text>
          </SafeAreaView>
      );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Attendance"
        rightComponent={
            <TouchableOpacity 
                style={styles.employeeSelector}
                onPress={() => setEmployeeModalVisible(true)}
            >
                {currentEmployee?.profile_photo_url ? (
                    <Image 
                        source={{ uri: currentEmployee.profile_photo_url }} 
                        style={{ width: rw(6), height: rw(6), borderRadius: rw(3) }} 
                    />
                ) : (
                    <Feather name="users" size={rf(2)} color={theme.text} />
                )}
                <Text style={styles.employeeSelectorText} numberOfLines={1}>
                    {selectedEmployeeName || 'Select Employee'}
                </Text>
                <Feather name="chevron-down" size={rf(2)} color={theme.text} />
            </TouchableOpacity>
        }
      />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[theme.primary]} 
                tintColor={theme.primary} 
            />
        }
      >
        
        {/* Compact Control Panel */}
        <AnimatedEntry delay={100} from="top">
        <View style={{ flexDirection: 'row', backgroundColor: theme.card, padding: rw(2), borderRadius: rw(3), marginBottom: rh(1), gap: rw(2) }}>
            {/* Day Shift */}
            <ScalePressable 
                style={{ 
                    flex: 0.8, 
                    backgroundColor: theme.background, 
                    borderRadius: rw(2), 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    paddingVertical: rh(1), 
                    gap: rh(0.5),
                    borderWidth: shiftType === 'day' ? 2 : 1,
                    borderColor: shiftType === 'day' ? theme.accent : theme.border
                }}
                onPress={() => setShiftType('day')}
            >
                <Feather name="sun" size={rf(2)} color={theme.text} />
                <Text style={{ color: theme.text, fontSize: rf(1.4), fontWeight: '600' }}>Day</Text>
            </ScalePressable>

            {/* Night Shift */}
            <ScalePressable 
                style={{ 
                    flex: 0.8, 
                    backgroundColor: theme.background, 
                    borderRadius: rw(2), 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    paddingVertical: rh(1), 
                    gap: rh(0.5),
                    borderWidth: shiftType === 'night' ? 2 : 1,
                    borderColor: shiftType === 'night' ? theme.accent : theme.border
                }}
                onPress={() => setShiftType('night')}
            >
                <Feather name="moon" size={rf(2)} color={theme.text} />
                <Text style={{ color: theme.text, fontSize: rf(1.4), fontWeight: '600' }}>Night</Text>
            </ScalePressable>

            {/* Date Picker (Display Only) */}
            <View 
                style={{ 
                    flex: 1.2, 
                    backgroundColor: theme.background, 
                    borderRadius: rw(2), 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    paddingVertical: rh(1), 
                    gap: rh(0.5), 
                    borderWidth: 1, 
                    borderColor: theme.border 
                }}
            >
                <Feather name="calendar" size={rf(2)} color={theme.text} />
                <Text style={{ color: theme.text, fontSize: rf(1.4), fontWeight: '600' }}>
                    {(() => {
                        const [y, m, d] = selectedDate.split('-').map(Number);
                        const monthName = new Date(y, m - 1, d).toLocaleString('default', { month: 'short' });
                        return `${d} ${monthName}`;
                    })()}
                </Text>
            </View>

            {/* Action Button */}
            {dayLoading ? (
                <View style={{
                    flex: 1.2,
                    backgroundColor: theme.card,
                    borderRadius: rw(2),
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: rh(1),
                    borderWidth: 1,
                    borderColor: theme.border
                }}>
                    <ActivityIndicator size="small" color={theme.primary} />
                </View>
            ) : !todayAttendance || (todayAttendance && attendanceMode === 'direct_status') ? (
                <ScalePressable
                    style={{
                        flex: 1.2,
                        backgroundColor: theme.primary,
                        borderRadius: rw(2),
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: rh(1),
                        gap: rh(0.5),
                        elevation: 2,
                        shadowColor: theme.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                    }}
                    onPress={() => setMarkModalVisible(true)}
                    disabled={actionLoading}
                >
                    {actionLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Feather name="check-circle" size={rf(2)} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: rf(1.4), fontWeight: 'bold' }}>
                                Mark Attendance
                            </Text>
                        </>
                    )}
                </ScalePressable>
            ) : (
            <ScalePressable 
                style={{ 
                    flex: 1.2, 
                    backgroundColor: todayAttendance.status === 'absent' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                    borderWidth: 1,
                    borderColor: todayAttendance.status === 'absent' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(5, 150, 105, 0.2)', 
                    borderRadius: rw(2), 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    paddingVertical: rh(1),
                    gap: rh(0.5),
                    opacity: todayAttendance && attendanceMode === 'direct_status' ? 0.8 : 1
                }}
                onPress={() => {
                    if (todayAttendance) {
                        if (attendanceMode === 'time_based' && !todayAttendance.check_out_time) {
                            handleCheckOut();
                        } else {
                            handleUndoAttendance();
                        }
                    } else {
                        handleMarkStatus('present');
                    }
                }}
                disabled={actionLoading}
            >
                {actionLoading ? (
                    <ActivityIndicator color={todayAttendance.status === 'absent' ? '#dc2626' : '#059669'} size="small" />
                ) : (
                    <>
                        <Feather 
                            name={attendanceMode === 'time_based' && !todayAttendance.check_out_time ? 'log-out' : 'check'} 
                            size={rf(2)} 
                            color={todayAttendance.status === 'absent' ? '#dc2626' : '#059669'} 
                        />
                        <Text style={{ color: todayAttendance.status === 'absent' ? '#dc2626' : '#059669', fontSize: rf(1.4), fontWeight: 'bold' }}>
                            {attendanceMode === 'time_based' && !todayAttendance.check_out_time ? 'Check Out' : (todayAttendance.status ? todayAttendance.status.toUpperCase() : 'DONE')}
                        </Text>
                    </>
                )}
            </ScalePressable>
            )}
        </View>
        </AnimatedEntry>

{/* Modal Removed */}


        {/* Tab Switcher */}
        <AnimatedEntry delay={200} from="left">
        <View style={{ 
            flexDirection: 'row', 
            backgroundColor: theme.card, 
            padding: rw(1), 
            borderRadius: rw(3), 
            marginBottom: rh(1),
            borderWidth: 1,
            borderColor: theme.border
        }}>
            <ScalePressable 
                style={{ 
                    flex: 1, 
                    paddingVertical: rh(0.8), 
                    borderRadius: rw(2), 
                    alignItems: 'center',
                    backgroundColor: activeTab === 'Calendar' ? theme.primary : 'transparent'
                }}
                onPress={() => setActiveTab('Calendar')}
            >
                <Text style={{ 
                    fontWeight: '600', 
                    fontSize: rf(1.8),
                    color: activeTab === 'Calendar' ? '#fff' : theme.subtext
                }}>Calendar</Text>
            </ScalePressable>
            <ScalePressable 
                style={{ 
                    flex: 1, 
                    paddingVertical: rh(0.8), 
                    borderRadius: rw(2), 
                    alignItems: 'center',
                    backgroundColor: activeTab === 'History' ? theme.primary : 'transparent'
                }}
                onPress={() => setActiveTab('History')}
            >
                <Text style={{ 
                    fontWeight: '600', 
                    fontSize: rf(1.8),
                    color: activeTab === 'History' ? '#fff' : theme.subtext
                }}>History</Text>
            </ScalePressable>
        </View>
        </AnimatedEntry>

        {/* Tab Content */}
        {activeTab === 'Calendar' ? (
            <AnimatedEntry delay={300} from="bottom">
            <View style={{ backgroundColor: theme.card, borderRadius: rw(4), padding: rw(1), borderWidth: 1, borderColor: theme.border, marginBottom: rh(1), overflow: 'hidden' }}>
                <Calendar
                    current={currentMonth}
                    maxDate={getLocalDateString()}
                    onDayPress={(day: DateData) => {
                        setSelectedDate(day.dateString);
                    }}
                    onMonthChange={(month: DateData) => {
                        setCurrentMonth(month.dateString);
                        fetchMonthlyData(month.dateString);
                    }}
                    renderHeader={renderCustomHeader}
                    renderArrow={(direction: 'left' | 'right') => (
                        <Feather 
                            name={direction === 'left' ? 'chevron-left' : 'chevron-right'} 
                            size={rf(2.5)} 
                            color={theme.text} 
                        />
                    )}
                    markingType={'custom'}
                    dayComponent={renderDay}
                    markedDates={finalMarkedDates}
                    theme={{
                        calendarBackground: theme.card,
                        textSectionTitleColor: theme.subtext,
                        dayTextColor: theme.text,
                        todayTextColor: theme.primary,
                        selectedDayTextColor: '#ffffff',
                        monthTextColor: theme.text,
                        indicatorColor: theme.primary,
                        arrowColor: theme.primary,
                        textDisabledColor: theme.border,
                        stylesheet: {
                            calendar: {
                                header: {
                                    dayHeader: {
                                        fontWeight: '600',
                                        color: theme.subtext,
                                        fontSize: rf(1.4)
                                    }
                                }
                            }
                        }
                    }}
                    style={{ borderRadius: rw(2), width: '100%' }}
                    enableSwipeMonths={true}
                />
                
                {/* Stats */}
                <View style={{ 
                    flexDirection: 'row', 
                    flexWrap: 'wrap',
                    justifyContent: 'space-between', 
                    marginTop: rh(1), 
                    paddingTop: rh(1),
                    borderTopWidth: 1,
                    borderTopColor: theme.border
                }}>
                    {statsLoading ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: rh(1) }}>
                            <ActivityIndicator size="small" color={theme.primary} />
                        </View>
                    ) : (
                        <>
                            <View style={{ alignItems: 'center', width: '25%' }}>
                                <Text style={{ fontSize: rf(1.2), color: theme.subtext }}>P</Text>
                                <Text style={{ fontSize: rf(1.6), fontWeight: 'bold', color: '#059669' }}>{Math.round(Number(monthlyStats.present))}</Text>
                            </View>
                            <View style={{ alignItems: 'center', width: '25%' }}>
                                <Text style={{ fontSize: rf(1.2), color: theme.subtext }}>A</Text>
                                <Text style={{ fontSize: rf(1.6), fontWeight: 'bold', color: '#dc2626' }}>{Math.round(Number(monthlyStats.absent))}</Text>
                            </View>
                             <View style={{ alignItems: 'center', width: '25%' }}>
                                <Text style={{ fontSize: rf(1.2), color: theme.subtext }}>T</Text>
                                <Text style={{ fontSize: rf(1.6), fontWeight: 'bold', color: theme.text }}>{Math.round(Number(monthlyStats.total))}</Text>
                            </View>
                            <View style={{ alignItems: 'center', width: '25%' }}>
                                <Text style={{ fontSize: rf(1.2), color: theme.subtext }}>%</Text>
                                <Text style={{ fontSize: rf(1.6), fontWeight: 'bold', color: theme.text }}>{monthlyStats.percentage}</Text>
                            </View>
                        </>
                    )}
                </View>
            </View>
            </AnimatedEntry>
        ) : (
            <AnimatedEntry delay={300} from="bottom">
            <View style={{ backgroundColor: theme.card, borderRadius: rw(4), padding: rw(4), borderWidth: 1, borderColor: theme.border, marginBottom: rh(1), minHeight: rh(25) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rh(1) }}>
                    <Text style={{ fontSize: rf(2), fontWeight: 'bold', color: theme.text }}>Recent History</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('AttendanceHistory', { employeeId: selectedEmployeeId })}>
                        <Text style={{ fontSize: rf(1.6), color: theme.primary }}>View All</Text>
                    </TouchableOpacity>
                </View>
                
                {recentHistory.length > 0 ? (
                    recentHistory.slice(0, 3).map((record, index) => (
                        <View key={record.id || index} style={{ 
                            marginBottom: rh(1), 
                            borderBottomWidth: 1, 
                            borderBottomColor: theme.border, 
                            paddingBottom: rh(1),
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <View>
                                <Text style={{ fontSize: rf(1.8), fontWeight: '500', color: theme.text, marginBottom: rh(0.5) }}>
                                    {formatDate(record.attendance_date)}
                                </Text>
                                <Text style={{ fontSize: rf(1.4), color: theme.subtext }}>
                                    {record.shift_type === 'night' ? 'Night Shift' : 'Day Shift'}
                                </Text>
                            </View>
                            
                            <View style={{ alignItems: 'flex-end' }}>
                                <View style={{ 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    marginBottom: rh(0.5),
                                    backgroundColor: record.status === 'absent' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                                    paddingHorizontal: rw(2),
                                    paddingVertical: rh(0.5),
                                    borderRadius: rw(1),
                                    borderWidth: 1,
                                    borderColor: record.status === 'absent' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(5, 150, 105, 0.2)'
                                }}>
                                    <View style={{ 
                                        width: 6, height: 6, borderRadius: 3, 
                                        backgroundColor: record.status === 'absent' ? '#dc2626' : '#059669',
                                        marginRight: rw(1.5)
                                    }} />
                                    <Text style={{ 
                                        fontSize: rf(1.4), 
                                        fontWeight: '600', 
                                        color: record.status === 'absent' ? '#dc2626' : '#059669'
                                    }}>
                                        {record.status === 'absent' ? 'Absent' : 'Present'}
                                    </Text>
                                </View>
                                <Text style={{ fontSize: rf(1.4), color: theme.subtext }}>
                                     {record.status !== 'absent' && record.check_in_time ? formatTime(record.check_in_time) : '-'}
                                </Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: rh(5), fontSize: rf(1.6) }}>No history available</Text>
                )}
            </View>
            </AnimatedEntry>
        )}

        {/* Annual Bar Chart */}
        <AnimatedEntry delay={400} from="bottom">
        <View style={{ 
            backgroundColor: theme.card, 
            borderRadius: rw(4), 
            padding: rw(5), 
            marginTop: rh(0), 
            marginBottom: rh(3),
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rh(3) }}>
                <View>
                    <Text style={{ fontSize: rf(2.2), fontWeight: 'bold', color: theme.text }}>Annual Overview</Text>
                    <Text style={{ fontSize: rf(1.4), color: theme.subtext, marginTop: rh(0.5) }}>Attendance performance</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: rw(2), backgroundColor: theme.background, paddingHorizontal: rw(2), paddingVertical: rh(0.5), borderRadius: rw(10), borderWidth: 1, borderColor: theme.border }}>
                    <TouchableOpacity onPress={() => setSelectedYear(prev => prev - 1)} style={{ padding: rw(1) }}>
                        <Feather name="chevron-left" size={rf(2)} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: rf(2), fontWeight: 'bold', color: theme.text, minWidth: rw(12), textAlign: 'center' }}>{selectedYear}</Text>
                    <TouchableOpacity onPress={() => setSelectedYear(prev => prev + 1)} style={{ padding: rw(1) }}>
                        <Feather name="chevron-right" size={rf(2)} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {annualLoading ? (
                <View style={{ height: rh(15), alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <View style={{ height: rh(15) }}>
                    {/* Grid Lines */}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: rh(3), justifyContent: 'space-between', zIndex: -1 }}>
                        {[100, 75, 50, 25, 0].map((val, i) => (
                            <View key={val} style={{ flexDirection: 'row', alignItems: 'center', height: 1, backgroundColor: theme.border, opacity: 0.3, width: '100%' }} />
                        ))}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: '100%', alignItems: 'flex-end' }}>
                        {annualData.length > 0 ? annualData.map((monthData, index) => {
                            // Max days reference (30 days) or dynamic based on month
                            const maxDays = 30;
                            const presentDays = monthData.present;
                            // Calculate percentage, capped at 100%
                            const heightPercentage = Math.min((presentDays / maxDays) * 100, 100);
                            const isCurrentMonth = new Date().getMonth() + 1 === monthData.month && new Date().getFullYear() === selectedYear;
                            
                            return (
                                <View key={index} style={{ alignItems: 'center', width: '7%', height: '100%', justifyContent: 'flex-end' }}>
                                    
                                    {/* Percentage Label */}
                                    <Text style={{ 
                                        fontSize: rf(1), 
                                        color: heightPercentage > 0 ? theme.subtext : 'transparent', 
                                        fontWeight: 'bold',
                                        marginBottom: rh(0.5)
                                    }}>
                                        {heightPercentage > 0 ? `${Math.round(heightPercentage)}%` : ''}
                                    </Text>

                                    {/* Bar Container */}
                                    <View style={{ width: '60%', height: '90%', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        {/* Background Track */}
                                        <View style={{
                                            width: '100%',
                                            height: '100%',
                                            position: 'absolute',
                                            backgroundColor: theme.border,
                                            borderRadius: rw(0),
                                            opacity: 0.2
                                        }} />
                                        
                                        {/* Active Bar */}
                                        <View style={{ 
                                            width: '100%', 
                                            height: `${Math.max(heightPercentage, 2)}%`, // Min height 2% for visibility
                                            backgroundColor: isCurrentMonth ? theme.accent : theme.primary, 
                                            borderRadius: rw(0),
                                            opacity: heightPercentage > 0 ? 1 : 0.5,
                                        }} />

                                    </View>

                                    {/* Month Label */}
                                    <Text style={{ 
                                        fontSize: rf(1.2), 
                                        color: isCurrentMonth ? theme.text : theme.subtext, 
                                        fontWeight: isCurrentMonth ? 'bold' : '500',
                                        marginTop: rh(1)
                                    }}>
                                        {monthData.month_name.substring(0,3)}
                                    </Text>
                                </View>
                            );
                        }) : (
                            <View style={{ flex: 1, height: rh(10), alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: theme.subtext }}>No data available</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </View>
        </AnimatedEntry>
      </ScrollView>

      {/* Employee Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={employeeModalVisible}
        onRequestClose={() => setEmployeeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Employee</Text>
                    <TouchableOpacity onPress={() => setEmployeeModalVisible(false)}>
                        <Feather name="x" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
                
                <FlatList
                    data={employees}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[
                                styles.employeeItem, 
                                selectedEmployeeId === item.id && styles.selectedEmployeeItem
                            ]}
                            onPress={() => selectEmployee(item)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                {item.profile_photo_url ? (
                                    <Image 
                                        source={{ uri: item.profile_photo_url }} 
                                        style={{ width: rw(10), height: rw(10), borderRadius: rw(5), marginRight: rw(3), backgroundColor: theme.background }} 
                                    />
                                ) : (
                                    <View style={{ 
                                        width: rw(10), 
                                        height: rw(10), 
                                        borderRadius: rw(5), 
                                        backgroundColor: theme.border, 
                                        marginRight: rw(3), 
                                        alignItems: 'center', 
                                        justifyContent: 'center' 
                                    }}>
                                        <Feather name="user" size={rf(2.5)} color={theme.subtext} />
                                    </View>
                                )}
                                <Text style={[
                                    styles.employeeName,
                                    selectedEmployeeId === item.id && styles.selectedEmployeeText
                                ]}>
                                    {item.full_name}
                                </Text>
                            </View>
                            {selectedEmployeeId === item.id && (
                                <Feather name="check" size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    )}
                    style={styles.employeeList}
                />
            </View>
        </View>
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={markModalVisible}
        onRequestClose={closeMarkModal}
      >
        <View style={{ flex: 1 }}>
            <Animated.View 
                style={{
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: 'black',
                    opacity: slideAnim.interpolate({
                        inputRange: [0, 300],
                        outputRange: [0.5, 0],
                        extrapolate: 'clamp'
                    })
                }} 
            />
            <TouchableOpacity 
                style={{
                    flex: 1,
                    justifyContent: 'flex-start',
                    alignItems: 'flex-end',
                    paddingRight: rw(0),
                    paddingTop: rh(10)
                }} 
                activeOpacity={1} 
                onPress={closeMarkModal}
            >
                <Animated.View style={{
                    backgroundColor: theme.card,
                    width: rw(45),
                    borderRadius: rw(4),
                    padding: rw(4),
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                    transform: [{ translateX: slideAnim }]
                }}>
                    <View style={[styles.modalHeader, { borderBottomWidth: 0, marginBottom: rh(1), paddingBottom: 0 }]}>
                        <Text style={[styles.modalTitle, { fontSize: rf(1.8) }]}>Mark Attendance</Text>
                        <TouchableOpacity onPress={closeMarkModal}>
                            <Feather name="x" size={rf(2.5)} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={{ flexDirection: 'column', gap: rh(1.5), marginTop: rh(1) }}>
                        <ScalePressable 
                            style={{ 
                                width: '100%', 
                                backgroundColor: '#059669', 
                                paddingVertical: rh(1.2), 
                                borderRadius: rw(2), 
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                gap: rw(2),
                                elevation: 2
                            }}
                            onPress={() => {
                                closeMarkModal();
                                handleMarkStatus('present');
                            }}
                        >
                            <Feather name="check" size={rf(2)} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: rf(1.6), fontWeight: 'bold' }}>Present</Text>
                        </ScalePressable>
                        
                        <ScalePressable 
                            style={{ 
                                width: '100%', 
                                backgroundColor: '#dc2626', 
                                paddingVertical: rh(1.2), 
                                borderRadius: rw(2), 
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                gap: rw(2),
                                elevation: 2
                            }}
                            onPress={() => {
                                closeMarkModal();
                                handleMarkStatus('absent');
                            }}
                        >
                            <Feather name="x" size={rf(2)} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: rf(1.6), fontWeight: 'bold' }}>Absent</Text>
                        </ScalePressable>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
