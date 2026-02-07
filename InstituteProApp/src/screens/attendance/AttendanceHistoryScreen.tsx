import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import attendanceService from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';

export default function AttendanceHistoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { employeeId } = route.params as { employeeId?: number } || {};
  
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const targetId = employeeId || user?.employee?.id;
      if (targetId) {
        const response = await attendanceService.getAttendance({
            employee_id: targetId,
            per_page: 31 // Get roughly a month of history
        });
        if (response && response.data && response.data.data) {
            setHistory(response.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch attendance history', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
        fetchHistory();
    }, [user?.employee?.id, employeeId])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.primary,
      padding: rw(4),
      paddingTop: rh(2),
      paddingBottom: rh(3),
      borderBottomLeftRadius: rw(8),
      borderBottomRightRadius: rw(8),
      marginBottom: rh(2),
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: rw(4),
    },
    headerTitle: {
      fontSize: rf(2.5),
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    listContent: {
      padding: rw(4),
      paddingBottom: rh(10),
    },
    card: {
      backgroundColor: theme.card,
      padding: rw(4),
      borderRadius: rw(3),
      marginBottom: rh(1.5),
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: rh(1),
      alignItems: 'center',
    },
    dateContainer: {
        flexDirection: 'column',
    },
    dateText: {
      fontWeight: 'bold',
      color: theme.text,
      fontSize: rf(2),
    },
    dayText: {
      color: theme.subtext,
      fontSize: rf(1.6),
    },
    statusBadge: {
        paddingHorizontal: rw(3),
        paddingVertical: rh(0.5),
        borderRadius: rw(4),
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: rf(1.6),
        fontWeight: 'bold',
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: rh(1),
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: rh(1),
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeLabel: {
        color: theme.subtext,
        fontSize: rf(1.6),
        marginRight: rw(1),
    },
    timeText: {
      color: theme.text,
      fontSize: rf(1.8),
      fontWeight: '500',
    },
    lateText: {
      color: theme.error,
      fontWeight: 'bold',
      fontSize: rf(1.4),
      marginLeft: rw(2),
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: rh(10),
    },
    emptyText: {
        color: theme.subtext,
        fontSize: rf(2),
    }
  });

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
        case 'present': return '#16a34a';
        case 'absent': return theme.error;
        case 'late': return '#eab308';
        case 'leave': return '#3b82f6';
        default: return '#f97316';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '--:--';
    // Assuming timeString is in HH:mm:ss format
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const isLate = item.is_late === 1 || item.status === 'late';

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>{formatDate(item.attendance_date)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.dayText}>{formatDay(item.attendance_date)}</Text>
                        <View style={{ 
                            backgroundColor: theme.secondary, 
                            paddingHorizontal: rw(1.5), 
                            paddingVertical: rh(0.2), 
                            borderRadius: rw(1),
                            marginLeft: rw(2)
                        }}>
                            <Text style={{ fontSize: rf(1.2), color: theme.subtext, textTransform: 'uppercase' }}>
                                {item.shift_type || 'DAY'}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status?.toUpperCase() || 'UNKNOWN'}</Text>
                </View>
            </View>
            
            <View style={styles.cardFooter}>
                <View style={styles.timeContainer}>
                    <Feather name="log-in" size={rf(1.8)} color="#16a34a" style={{ marginRight: rw(1) }} />
                    <Text style={styles.timeLabel}>In:</Text>
                    <Text style={styles.timeText}>
                        {formatTime(item.check_in_time)}
                    </Text>
                </View>
                <View style={styles.timeContainer}>
                    <Feather name="log-out" size={rf(1.8)} color={theme.error} style={{ marginRight: rw(1) }} />
                    <Text style={styles.timeLabel}>Out:</Text>
                    <Text style={styles.timeText}>
                        {formatTime(item.check_out_time)}
                    </Text>
                </View>
            </View>
            {isLate && (
                <View style={{ marginTop: rh(1), flexDirection: 'row', alignItems: 'center' }}>
                     <Feather name="alert-circle" size={rf(1.6)} color={theme.error} />
                     <Text style={styles.lateText}>Late Arrival</Text>
                </View>
            )}
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Attendance History</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: rh(5) }} />
      ) : (
        <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No attendance records found</Text>
                </View>
            }
        />
      )}
    </SafeAreaView>
  );
}
