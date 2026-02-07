import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Image, Modal, FlatList, InteractionManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rw, rh, rf } from '../../constants/responsive';
import dashboardService from '../../services/dashboardService';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';
import NotificationPermissionModal from '../../components/NotificationPermissionModal';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { theme, scheme } = useTheme();
  const { user } = useAuth();
  const iconColor = theme.text;

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedFinMonth, setSelectedFinMonth] = useState(0); // Default All
  const [selectedFinYear, setSelectedFinYear] = useState(new Date().getFullYear());
  
  const [selectedAttMonth, setSelectedAttMonth] = useState(new Date().getMonth() + 1); // Default Current
  const [selectedAttYear, setSelectedAttYear] = useState(new Date().getFullYear());

  const [showFinMonthPicker, setShowFinMonthPicker] = useState(false);
  const [showFinYearPicker, setShowFinYearPicker] = useState(false);
  
  const [showAttMonthPicker, setShowAttMonthPicker] = useState(false);
  const [showAttYearPicker, setShowAttYearPicker] = useState(false);

  const months = [
      { label: 'All', value: 0 },
      { label: 'Jan', value: 1 }, { label: 'Feb', value: 2 }, { label: 'Mar', value: 3 },
      { label: 'Apr', value: 4 }, { label: 'May', value: 5 }, { label: 'Jun', value: 6 },
      { label: 'Jul', value: 7 }, { label: 'Aug', value: 8 }, { label: 'Sep', value: 9 },
      { label: 'Oct', value: 10 }, { label: 'Nov', value: 11 }, { label: 'Dec', value: 12 }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const fetchDashboardData = useCallback(async () => {
      try {
          const data = await dashboardService.getStats({ 
              financial_month: selectedFinMonth, 
              financial_year: selectedFinYear,
              attendance_month: selectedAttMonth,
              attendance_year: selectedAttYear
          });
          setDashboardData(data);
      } catch (error) {
          console.error('Failed to fetch dashboard data', error);
      } finally {
          setLoading(false);
          setRefreshing(false);
      }
  }, [selectedFinMonth, selectedFinYear, selectedAttMonth, selectedAttYear]);

  useEffect(() => {
      const task = InteractionManager.runAfterInteractions(() => {
          fetchDashboardData();
      });
      return () => task.cancel();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
      setRefreshing(true);
      fetchDashboardData();
  }, [fetchDashboardData]);

  const recentActivities = dashboardData?.recent_activities || [];
  const upcomingTasks = dashboardData?.upcoming_tasks || [];
  const officeCashHolders = dashboardData?.office_cash_holders || [];

  if (loading) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
            <ActivityIndicator size="large" color={theme.accent} />
        </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    financialCard: {
        backgroundColor: theme.card,
        padding: rw(4),
        marginHorizontal: rw(4),
        marginTop: rh(2),
        borderRadius: rw(3),
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: theme.shadow,
        shadowOffset: theme.shadowOffset,
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: theme.shadowRadius,
        elevation: 2,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rh(1.5),
    },
    welcomeText: {
        color: theme.subtext,
        fontSize: rf(1.6),
    },
    userName: {
        fontSize: rf(2.4),
        fontWeight: 'bold',
        color: theme.text,
    },
    notificationBtn: {
        backgroundColor: theme.secondary,
        padding: rw(2),
        borderRadius: 9999,
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: rw(2),
        right: rw(2),
        width: rw(2.5),
        height: rw(2.5),
        backgroundColor: theme.error,
        borderRadius: rw(1.25),
        borderWidth: 1,
        borderColor: theme.card,
    },
 
    sectionTitle: {
        fontSize: rf(1.8),
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: rh(1.5),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rh(1),
    },
    seeAllText: {
        color: theme.accent,
        fontWeight: '500',
        fontSize: rf(1.6),
    },
    listContainer: {
        backgroundColor: theme.card,
        borderRadius: rw(3),
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: rh(2),
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: rw(3),
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    listIcon: {
        width: rw(8),
        height: rw(8),
        borderRadius: rw(2),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: rw(3),
    },
    listContent: {
        flex: 1,
    },
    listTitle: {
        color: theme.text,
        fontWeight: '600',
        fontSize: rf(1.7),
        marginBottom: rh(0.3),
    },
    listSubtitle: {
        color: theme.subtext,
        fontSize: rf(1.4),
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priorityBadge: {
        paddingHorizontal: rw(1.5),
        paddingVertical: rh(0.2),
        borderRadius: rw(1),
        marginLeft: rw(2),
        backgroundColor: theme.secondary,
    },
    priorityText: {
        fontSize: rf(1.2),
        fontWeight: '600',
        color: theme.subtext,
    },
    emptyState: {
        padding: rh(3),
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: theme.subtext,
        fontSize: rf(1.6),
        marginTop: rh(1),
    }
  });

  return (
    <View style={styles.container}>
      <Header 
        title="Dashboard" 
        subtitle={`Welcome back, ${user?.name || 'User'}`}
        showNotification 
        unreadCount={dashboardData?.unread_notifications || 0}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: rh(2), flexGrow: 1 }}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
      >
        {/* Financial Overview */}
        <AnimatedEntry delay={100} from="bottom">
        <View style={styles.financialCard}>
            <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rh(1) }}>
                    <Text style={[styles.sectionTitle, { fontSize: rf(1.6), marginBottom: 0 }]}>Financial Overview</Text>
                    
                    <View style={{ flexDirection: 'row' }}>
                        <ScalePressable 
                            onPress={() => setShowFinMonthPicker(true)}
                            style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                backgroundColor: theme.background, 
                                paddingHorizontal: rw(2), 
                                paddingVertical: rh(0.5), 
                                borderRadius: rw(1),
                                marginRight: rw(2),
                                borderWidth: 1,
                                borderColor: theme.border
                            }}
                        >
                            <Text style={{ fontSize: rf(1.3), color: theme.text, marginRight: rw(1) }}>
                                {months.find(m => m.value === selectedFinMonth)?.label}
                            </Text>
                            <Feather name="chevron-down" size={rf(1.4)} color={theme.subtext} />
                        </ScalePressable>

                        <ScalePressable 
                            onPress={() => setShowFinYearPicker(true)}
                            style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                backgroundColor: theme.background, 
                                paddingHorizontal: rw(2), 
                                paddingVertical: rh(0.5), 
                                borderRadius: rw(1),
                                borderWidth: 1,
                                borderColor: theme.border
                            }}
                        >
                            <Text style={{ fontSize: rf(1.3), color: theme.text, marginRight: rw(1) }}>
                                {selectedFinYear}
                            </Text>
                            <Feather name="chevron-down" size={rf(1.4)} color={theme.subtext} />
                        </ScalePressable>
                    </View>
                </View>
                <View style={{
                    backgroundColor: theme.background,
                    borderRadius: rw(3),
                    padding: rw(2.5),
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.border,
                }}>
                     {/* Income */}
                     <View style={{ alignItems: 'center', flex: 1 }}>
                         <View style={{ marginBottom: rh(0.5), backgroundColor: scheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5', padding: rw(1.5), borderRadius: rw(1.5) }}>
                             <Feather name="arrow-down-left" size={rf(1.8)} color="#10b981" />
                         </View>
                         <Text style={{ fontSize: rf(1.3), color: theme.subtext, marginBottom: rh(0.3) }}>Income</Text>
                         <Text style={{ fontSize: rf(1.6), fontWeight: 'bold', color: theme.text }}>Rs. {Math.round(dashboardData?.stats?.month_income || 0)}</Text>
                     </View>
                     
                     <View style={{ width: 1, backgroundColor: theme.border, height: '60%' }} />

                     {/* Expense */}
                     <View style={{ alignItems: 'center', flex: 1 }}>
                         <View style={{ marginBottom: rh(0.5), backgroundColor: scheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', padding: rw(1.5), borderRadius: rw(1.5) }}>
                             <Feather name="arrow-up-right" size={rf(1.8)} color="#ef4444" />
                         </View>
                         <Text style={{ fontSize: rf(1.3), color: theme.subtext, marginBottom: rh(0.3) }}>Expense</Text>
                         <Text style={{ fontSize: rf(1.6), fontWeight: 'bold', color: theme.text }}>Rs. {Math.round(dashboardData?.stats?.month_expenses || 0)}</Text>
                     </View>

                     <View style={{ width: 1, backgroundColor: theme.border, height: '60%' }} />

                     {/* Net */}
                     <View style={{ alignItems: 'center', flex: 1 }}>
                         <View style={{ marginBottom: rh(0.5), backgroundColor: scheme === 'dark' ? 'rgba(37, 99, 235, 0.2)' : '#dbeafe', padding: rw(1.5), borderRadius: rw(1.5) }}>
                             <Feather name="pie-chart" size={rf(1.8)} color="#2563eb" />
                         </View>
                         <Text style={{ fontSize: rf(1.3), color: theme.subtext, marginBottom: rh(0.3) }}>Balance</Text>
                         <Text style={{ fontSize: rf(1.6), fontWeight: 'bold', color: ((dashboardData?.stats?.month_income || 0) - (dashboardData?.stats?.month_expenses || 0)) >= 0 ? '#10b981' : '#ef4444' }}>
                             Rs. {Math.round((dashboardData?.stats?.month_income || 0) - (dashboardData?.stats?.month_expenses || 0))}
                         </Text>
                     </View>
                </View>
            </View>
        </View>
        </AnimatedEntry>

        {/* Office Cash Holdings (Horizontal) */}
        <AnimatedEntry delay={200} from="right">
        <View style={{ marginTop: rh(2.5), marginBottom: rh(0.5) }}>
            <View style={{ paddingHorizontal: rw(5), marginBottom: rh(1), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>Office Cash Holdings</Text>
            </View>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: rw(5) }}
            >
                {officeCashHolders.length > 0 ? (
                    officeCashHolders.map((holder: any, index: number) => {
                        if (!holder) return null;
                        return (
                        <ScalePressable key={index} style={{
                            width: rw(42),
                            backgroundColor: theme.card,
                            padding: rw(3),
                            borderRadius: rw(3),
                            marginRight: rw(3),
                            borderWidth: 1,
                            borderColor: theme.border,
                            shadowColor: theme.shadow,
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: rh(1) }}>
                                {holder.profile_photo_url ? (
                                    <Image 
                                        source={{ uri: holder.profile_photo_url }} 
                                        style={{ width: rw(8), height: rw(8), borderRadius: rw(1.5) }} 
                                    />
                                ) : (
                                    <View style={{ padding: rw(1.5), backgroundColor: scheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5', borderRadius: rw(1.5) }}>
                                         <Feather name="briefcase" size={rf(1.6)} color="#10b981" />
                                    </View>
                                )}
                                <Text style={{ fontSize: rf(1.8), fontWeight: 'bold', color: theme.text }}>Rs. {Math.round(holder.balance || 0)}</Text>
                            </View>
                            <Text style={{ fontSize: rf(1.5), fontWeight: '600', color: theme.text, marginBottom: rh(0.3) }} numberOfLines={1}>{holder.name || 'Unnamed Staff'}</Text>
                            <Text style={{ fontSize: rf(1.2), color: theme.subtext }}>{holder.role || '-'}</Text>
                        </ScalePressable>
                        );
                    })
                ) : (
                    <View style={{ 
                        width: rw(90), 
                        backgroundColor: theme.card, 
                        padding: rw(4), 
                        borderRadius: rw(3), 
                        alignItems: 'center', 
                        flexDirection: 'row',
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderStyle: 'dashed'
                    }}>
                        <Feather name="briefcase" size={rf(2.5)} color={theme.subtext} style={{ marginRight: rw(3) }} />
                        <Text style={{ color: theme.subtext, fontSize: rf(1.6) }}>No staff currently holding office cash</Text>
                    </View>
                )}
            </ScrollView>
        </View>
        </AnimatedEntry>

        {/* Tasks Overview Table */}
        <AnimatedEntry delay={300} from="bottom">
        <View style={{ marginHorizontal: rw(5), marginTop: rh(2.5) }}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tasks Overview</Text>
                <ScalePressable onPress={() => navigation.navigate('Tasks')}>
                    <Text style={styles.seeAllText}>View All</Text>
                </ScalePressable>
            </View>
            
            <View style={{ backgroundColor: theme.card, borderRadius: rw(3), padding: rw(2.5), borderWidth: 1, borderColor: theme.border }}>
                {/* Table Header */}
                <View style={{ flexDirection: 'row', paddingBottom: rh(0.8), borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: rh(0.8) }}>
                    <Text style={{ flex: 2, fontSize: rf(1.5), fontWeight: 'bold', color: theme.text }}>Task</Text>
                    <Text style={{ flex: 1.5, fontSize: rf(1.5), fontWeight: 'bold', color: theme.text }}>Assigned To</Text>
                    <Text style={{ flex: 1, fontSize: rf(1.5), fontWeight: 'bold', color: theme.text, textAlign: 'center' }}>Priority</Text>
                    <Text style={{ flex: 1, fontSize: rf(1.5), fontWeight: 'bold', color: theme.text, textAlign: 'right' }}>Due</Text>
                </View>
                
                {upcomingTasks.length > 0 ? (
                    upcomingTasks.map((task: any, index: number) => {
                        if (!task) return null;
                        return (
                        <ScalePressable 
                            key={index} 
                            style={{ flexDirection: 'row', paddingVertical: rh(0.8), borderBottomWidth: index === upcomingTasks.length - 1 ? 0 : 1, borderBottomColor: theme.border, alignItems: 'center' }}
                            onPress={() => navigation.navigate('Tasks', { screen: 'TaskDetail', params: { id: task.id } })}
                        >
                            <Text style={{ flex: 2, fontSize: rf(1.4), color: theme.text, fontWeight: '500' }} numberOfLines={1}>{task.title || 'Untitled Task'}</Text>
                            <Text style={{ flex: 1.5, fontSize: rf(1.3), color: theme.subtext }} numberOfLines={1}>{task.assigned_to || 'Unassigned'}</Text>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <View style={{ 
                                    paddingHorizontal: rw(1.5), 
                                    paddingVertical: rh(0.2), 
                                    borderRadius: rw(1),
                                    backgroundColor: (task.priority === 'High' || task.priority === 'Urgent') ? (scheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2') : task.priority === 'Medium' ? (scheme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : '#fffbeb') : (scheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5')
                                }}>
                                    <Text style={{ 
                                        fontSize: rf(1.1), 
                                        fontWeight: 'bold', 
                                        color: (task.priority === 'High' || task.priority === 'Urgent') ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#10b981' 
                                    }}>
                                        {task.priority || 'NORMAL'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={{ flex: 1, fontSize: rf(1.3), color: theme.subtext, textAlign: 'right' }}>{task.due || '-'}</Text>
                        </ScalePressable>
                        );
                    })
                ) : (
                    <View style={{ padding: rh(1.5), alignItems: 'center' }}>
                        <Text style={{ color: theme.subtext, fontSize: rf(1.4) }}>No tasks available</Text>
                    </View>
                )}
            </View>
        </View>
        </AnimatedEntry>

        {/* This Month Attendance */}
        {dashboardData?.month_attendance && dashboardData.month_attendance.length > 0 && (
            <AnimatedEntry delay={400} from="bottom">
            <View style={{ marginHorizontal: rw(5), marginBottom: rh(1.5), marginTop: rh(2.5) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rh(1) }}>
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Attendance Summary</Text>
                    
                    <View style={{ flexDirection: 'row' }}>
                         <TouchableOpacity 
                             onPress={() => setShowAttMonthPicker(true)}
                             style={{ 
                                 flexDirection: 'row', 
                                 alignItems: 'center', 
                                 backgroundColor: theme.background, 
                                 paddingHorizontal: rw(2), 
                                 paddingVertical: rh(0.5), 
                                 borderRadius: rw(1),
                                 marginRight: rw(2),
                                 borderWidth: 1,
                                 borderColor: theme.border
                             }}
                         >
                             <Text style={{ fontSize: rf(1.3), color: theme.text, marginRight: rw(1) }}>
                                 {months.find(m => m.value === selectedAttMonth)?.label}
                             </Text>
                             <Feather name="chevron-down" size={rf(1.4)} color={theme.subtext} />
                         </TouchableOpacity>
 
                         <TouchableOpacity 
                             onPress={() => setShowAttYearPicker(true)}
                             style={{ 
                                 flexDirection: 'row', 
                                 alignItems: 'center', 
                                 backgroundColor: theme.background, 
                                 paddingHorizontal: rw(2), 
                                 paddingVertical: rh(0.5), 
                                 borderRadius: rw(1),
                                 borderWidth: 1,
                                 borderColor: theme.border
                             }}
                         >
                             <Text style={{ fontSize: rf(1.3), color: theme.text, marginRight: rw(1) }}>
                                 {selectedAttYear}
                             </Text>
                             <Feather name="chevron-down" size={rf(1.4)} color={theme.subtext} />
                         </TouchableOpacity>
                     </View>
                </View>
                <View style={{ backgroundColor: theme.card, borderRadius: rw(3), padding: rw(2.5), borderWidth: 1, borderColor: theme.border }}>
                    {/* Table Header */}
                    <View style={{ flexDirection: 'row', paddingBottom: rh(1), borderBottomWidth: 1, borderBottomColor: theme.border }}>
                        <Text style={{ flex: 2.5, fontSize: rf(1.3), color: theme.subtext, fontWeight: '600' }}>Employee</Text>
                        <Text style={{ flex: 1, fontSize: rf(1.3), color: theme.subtext, fontWeight: '600', textAlign: 'center' }}>Day</Text>
                        <Text style={{ flex: 1, fontSize: rf(1.3), color: theme.subtext, fontWeight: '600', textAlign: 'center' }}>Night</Text>
                        <Text style={{ flex: 1.5, fontSize: rf(1.3), color: theme.subtext, fontWeight: '600', textAlign: 'center' }}>Total</Text>
                        <Text style={{ flex: 1, fontSize: rf(1.3), color: theme.subtext, fontWeight: '600', textAlign: 'center' }}>%</Text>
                    </View>

                    {/* Table Rows */}
                    {dashboardData.month_attendance.map((item: any, index: number) => (
                        <View key={index} style={{ flexDirection: 'row', paddingVertical: rh(0.8), borderBottomWidth: index === dashboardData.month_attendance.length - 1 ? 0 : 1, borderBottomColor: theme.border, alignItems: 'center' }}>
                            <Text style={{ flex: 2.5, fontSize: rf(1.3), color: theme.text }} numberOfLines={1}>{item.name}</Text>
                            <Text style={{ flex: 1, fontSize: rf(1.3), textAlign: 'center' }}>
                                <Text style={{ color: '#10b981' }}>{item.day_present || 0}</Text>
                                <Text style={{ color: theme.text }}>/{item.total_days || 0}</Text>
                            </Text>
                            <Text style={{ flex: 1, fontSize: rf(1.3), textAlign: 'center' }}>
                                <Text style={{ color: '#3b82f6' }}>{item.night_present || 0}</Text>
                                <Text style={{ color: theme.text }}>/{item.total_days || 0}</Text>
                            </Text>
                            <Text style={{ flex: 1.5, fontSize: rf(1.3), textAlign: 'center' }}>
                                <Text style={{ color: theme.text }}>{item.present_days || 0}</Text>
                                <Text style={{ color: theme.text }}>/{item.total_days || 0}</Text>
                            </Text>
                            <Text style={{ flex: 1, fontSize: rf(1.3), color: theme.text, textAlign: 'center', fontWeight: '600' }}>{item.percentage}%</Text>
                        </View>
                    ))}
                </View>
            </View>
            </AnimatedEntry>
        )}

        <View style={{ padding: rw(5), paddingTop: rh(2) }}>
            {/* Recent Activity */}
            <AnimatedEntry delay={500} from="bottom">
            <View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Profile', { screen: 'ActivityLog' })}>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
                {recentActivities.length > 0 ? (
                    recentActivities.map((activity: any, index: number) => (
                        <ScalePressable key={index} style={[styles.listItem, index === recentActivities.length - 1 && { borderBottomWidth: 0 }]}>
                            <View style={[styles.listIcon, { backgroundColor: theme.secondary }]}>
                                <Feather name={activity.icon as any} size={rf(1.8)} color={activity.color} />
                            </View>
                            <View style={styles.listContent}>
                                <Text style={styles.listTitle} numberOfLines={1}>{activity.title}</Text>
                                <Text style={styles.listSubtitle}>{activity.time} • {activity.user}</Text>
                            </View>
                        </ScalePressable>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Feather name="activity" size={rf(3)} color={theme.subtext} />
                        <Text style={styles.emptyText}>No recent activity</Text>
                    </View>
                )}
            </View>
            </View>
            </AnimatedEntry>
        </View>
      </ScrollView>

      {/* Financial Month Picker Modal */}
      <Modal
          visible={showFinMonthPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFinMonthPicker(false)}
      >
          <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={1}
              onPress={() => setShowFinMonthPicker(false)}
          >
              <View style={{ width: rw(80), backgroundColor: theme.card, borderRadius: rw(3), padding: rw(4), maxHeight: rh(60) }}>
                  <Text style={{ fontSize: rf(1.8), fontWeight: 'bold', color: theme.text, marginBottom: rh(2), textAlign: 'center' }}>Select Month</Text>
                  <FlatList
                      data={months}
                      keyExtractor={(item) => item.value.toString()}
                      numColumns={3}
                      renderItem={({ item }) => (
                          <TouchableOpacity
                              style={{ 
                                  flex: 1, 
                                  margin: rw(1), 
                                  paddingVertical: rh(1.5), 
                                  backgroundColor: selectedFinMonth === item.value ? theme.accent : theme.background, 
                                  borderRadius: rw(2),
                                  alignItems: 'center',
                                  borderWidth: 1,
                                  borderColor: selectedFinMonth === item.value ? theme.accent : theme.border
                              }}
                              onPress={() => {
                                  setSelectedFinMonth(item.value);
                                  setShowFinMonthPicker(false);
                              }}
                          >
                              <Text style={{ 
                                  color: selectedFinMonth === item.value ? '#fff' : theme.text,
                                  fontWeight: '600',
                                  fontSize: rf(1.5)
                              }}>{item.label}</Text>
                          </TouchableOpacity>
                      )}
                  />
              </View>
          </TouchableOpacity>
      </Modal>

      {/* Financial Year Picker Modal */}
      <Modal
          visible={showFinYearPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFinYearPicker(false)}
      >
          <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={1}
              onPress={() => setShowFinYearPicker(false)}
          >
              <View style={{ width: rw(80), backgroundColor: theme.card, borderRadius: rw(3), padding: rw(4), maxHeight: rh(50) }}>
                  <Text style={{ fontSize: rf(1.8), fontWeight: 'bold', color: theme.text, marginBottom: rh(2), textAlign: 'center' }}>Select Year</Text>
                  <FlatList
                      data={years}
                      keyExtractor={(item) => item.toString()}
                      renderItem={({ item }) => (
                          <TouchableOpacity
                              style={{ 
                                  paddingVertical: rh(1.5), 
                                  backgroundColor: selectedFinYear === item ? theme.accent : theme.background, 
                                  borderRadius: rw(2),
                                  alignItems: 'center',
                                  marginBottom: rh(1),
                                  borderWidth: 1,
                                  borderColor: selectedFinYear === item ? theme.accent : theme.border
                              }}
                              onPress={() => {
                                  setSelectedFinYear(item);
                                  setShowFinYearPicker(false);
                              }}
                          >
                              <Text style={{ 
                                  color: selectedFinYear === item ? '#fff' : theme.text,
                                  fontWeight: '600',
                                  fontSize: rf(1.6)
                              }}>{item}</Text>
                          </TouchableOpacity>
                      )}
                  />
              </View>
          </TouchableOpacity>
      </Modal>

      {/* Attendance Month Picker Modal */}
      <Modal
          visible={showAttMonthPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAttMonthPicker(false)}
      >
          <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={1}
              onPress={() => setShowAttMonthPicker(false)}
          >
              <View style={{ width: rw(80), backgroundColor: theme.card, borderRadius: rw(3), padding: rw(4), maxHeight: rh(60) }}>
                  <Text style={{ fontSize: rf(1.8), fontWeight: 'bold', color: theme.text, marginBottom: rh(2), textAlign: 'center' }}>Select Month</Text>
                  <FlatList
                      data={months.filter(m => m.value !== 0)} // Remove 'All' option for Attendance
                      keyExtractor={(item) => item.value.toString()}
                      numColumns={3}
                      renderItem={({ item }) => (
                          <TouchableOpacity
                              style={{ 
                                  flex: 1, 
                                  margin: rw(1), 
                                  paddingVertical: rh(1.5), 
                                  backgroundColor: selectedAttMonth === item.value ? theme.accent : theme.background, 
                                  borderRadius: rw(2),
                                  alignItems: 'center',
                                  borderWidth: 1,
                                  borderColor: selectedAttMonth === item.value ? theme.accent : theme.border
                              }}
                              onPress={() => {
                                  setSelectedAttMonth(item.value);
                                  setShowAttMonthPicker(false);
                              }}
                          >
                              <Text style={{ 
                                  color: selectedAttMonth === item.value ? '#fff' : theme.text,
                                  fontWeight: '600',
                                  fontSize: rf(1.5)
                              }}>{item.label}</Text>
                          </TouchableOpacity>
                      )}
                  />
              </View>
          </TouchableOpacity>
      </Modal>

      {/* Attendance Year Picker Modal */}
      <Modal
          visible={showAttYearPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAttYearPicker(false)}
      >
          <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={1}
              onPress={() => setShowAttYearPicker(false)}
          >
              <View style={{ width: rw(80), backgroundColor: theme.card, borderRadius: rw(3), padding: rw(4), maxHeight: rh(50) }}>
                  <Text style={{ fontSize: rf(1.8), fontWeight: 'bold', color: theme.text, marginBottom: rh(2), textAlign: 'center' }}>Select Year</Text>
                  <FlatList
                      data={years}
                      keyExtractor={(item) => item.toString()}
                      renderItem={({ item }) => (
                          <TouchableOpacity
                              style={{ 
                                  paddingVertical: rh(1.5), 
                                  backgroundColor: selectedAttYear === item ? theme.accent : theme.background, 
                                  borderRadius: rw(2),
                                  alignItems: 'center',
                                  marginBottom: rh(1),
                                  borderWidth: 1,
                                  borderColor: selectedAttYear === item ? theme.accent : theme.border
                              }}
                              onPress={() => {
                                  setSelectedAttYear(item);
                                  setShowAttYearPicker(false);
                              }}
                          >
                              <Text style={{ 
                                  color: selectedAttYear === item ? '#fff' : theme.text,
                                  fontWeight: '600',
                                  fontSize: rf(1.6)
                              }}>{item}</Text>
                          </TouchableOpacity>
                      )}
                  />
              </View>
          </TouchableOpacity>
      </Modal>

      <NotificationPermissionModal />
    </View>
  );
}