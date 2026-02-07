import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import attendanceService from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';

export default function MonthlyReportScreen() {
  const navigation = useNavigation();
  const { theme, scheme } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchReport = async () => {
    try {
        setLoading(true);
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        
        const response = await attendanceService.getMasterReport({
            month,
            year
        });
        
        if (response && response.data) {
            setReport(response.data);
        } else {
             console.error('Invalid report data received', response);
        }
    } catch (error) {
      console.error('Failed to fetch monthly report', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
        fetchReport();
    }, [user?.employee?.id, currentDate])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReport();
  }, []);

  const changeMonth = (direction: 'prev' | 'next') => {
      const newDate = new Date(currentDate);
      if (direction === 'prev') {
          newDate.setMonth(newDate.getMonth() - 1);
      } else {
          newDate.setMonth(newDate.getMonth() + 1);
      }
      setCurrentDate(newDate);
      setLoading(true);
  };

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
    content: {
      padding: rw(4),
    },
    statsCard: {
      backgroundColor: theme.card,
      padding: rw(6),
      borderRadius: rw(4),
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      elevation: 2,
      alignItems: 'center',
      marginBottom: rh(3),
      borderWidth: 1,
      borderColor: theme.border,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: rh(2),
        width: '100%',
        justifyContent: 'space-between',
        paddingHorizontal: rw(2),
    },
    monthText: {
      color: theme.text,
      fontSize: rf(2.2),
      fontWeight: 'bold',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: rh(2),
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: rf(3),
      fontWeight: 'bold',
      color: theme.text,
    },
    statLabel: {
      color: theme.subtext,
      fontSize: rf(1.5),
      marginTop: rh(0.5),
      textAlign: 'center',
    },
    breakdownTitle: {
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: rh(1.5),
      fontSize: rf(2.2),
    },
    summaryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    summaryCard: {
        backgroundColor: theme.card,
        width: '48%',
        padding: rw(4),
        borderRadius: rw(3),
        marginBottom: rh(2),
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: rf(2.5),
        fontWeight: 'bold',
        marginTop: rh(1),
    },
    summaryLabel: {
        color: theme.subtext,
        fontSize: rf(1.6),
    },
    tableContainer: {
        backgroundColor: theme.card,
        borderRadius: rw(3),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: rh(4),
    },
    gridContainer: {
        backgroundColor: theme.card,
        borderRadius: rw(2),
        borderWidth: 1,
        borderColor: theme.border,
        marginTop: rh(2),
    },
    gridHeaderRow: {
        flexDirection: 'row',
        backgroundColor: theme.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    gridHeaderCell: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: rf(1.4),
        textAlign: 'center',
        paddingVertical: rh(1.5),
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.2)',
    },
    gridRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: theme.card,
    },
    gridCell: {
        textAlign: 'center',
        fontSize: rf(1.4),
        color: theme.text,
        paddingVertical: rh(1.5),
        borderRightWidth: 1,
        borderRightColor: theme.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellP: {
        color: '#22c55e',
        fontWeight: 'bold',
    },
    cellA: {
        color: theme.error,
        fontWeight: 'bold',
    },
    cellL: {
        color: theme.warning,
        fontWeight: 'bold',
    },
  });

  const getMonthName = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const renderGrid = () => {
      if (!report || !report.employees || !report.dates) return null;

      const dateColumnWidth = rw(25);
      const dayColumnWidth = rw(15);
      const shiftColumnWidth = rw(12);
      
      return (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                  {/* Header Row 1: Employee Names */}
                  <View style={[styles.gridHeaderRow, { height: rh(5) }]}>
                      <View style={{ width: dateColumnWidth, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={[styles.gridHeaderCell, { borderRightWidth: 0 }]}>Date</Text>
                      </View>
                      <View style={{ width: dayColumnWidth, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={[styles.gridHeaderCell, { borderRightWidth: 0 }]}>Day</Text>
                      </View>
                      {report.employees.map((emp: any) => (
                          <View key={emp.id} style={{ width: shiftColumnWidth * 2, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={[styles.gridHeaderCell, { borderRightWidth: 0 }]}>{emp.name}</Text>
                          </View>
                      ))}
                  </View>

                  {/* Header Row 2: Shifts (Day/Night) */}
                  <View style={[styles.gridHeaderRow, { height: rh(4), backgroundColor: theme.primary + 'CC' }]}>
                      <View style={{ width: dateColumnWidth, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' }} />
                      <View style={{ width: dayColumnWidth, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' }} />
                      {report.employees.map((emp: any) => (
                          <React.Fragment key={emp.id}>
                              <View style={{ width: shiftColumnWidth, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                                  <Text style={[styles.gridHeaderCell, { borderRightWidth: 0, fontSize: rf(1.2) }]}>Day</Text>
                              </View>
                              <View style={{ width: shiftColumnWidth, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                                  <Text style={[styles.gridHeaderCell, { borderRightWidth: 0, fontSize: rf(1.2) }]}>Night</Text>
                              </View>
                          </React.Fragment>
                      ))}
                  </View>

                  {/* Data Rows */}
                  <View>
                      {report.dates.map((dateInfo: any, index: number) => (
                          <View key={index} style={[styles.gridRow, { backgroundColor: index % 2 === 1 ? theme.background : theme.card }]}>
                              <View style={{ width: dateColumnWidth, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: theme.border, paddingVertical: rh(1) }}>
                                  <Text style={{ color: theme.text, fontSize: rf(1.4) }}>{dateInfo.date}</Text>
                              </View>
                              <View style={{ width: dayColumnWidth, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: theme.border, paddingVertical: rh(1) }}>
                                  <Text style={{ color: theme.subtext, fontSize: rf(1.4) }}>{dateInfo.day}</Text>
                              </View>
                              {report.employees.map((emp: any) => {
                                  const record = emp.records[dateInfo.date];
                                  const dayStatus = record ? record.day : '-';
                                  const nightStatus = record ? record.night : '-';
                                  
                                  return (
                                      <React.Fragment key={emp.id}>
                                          <View style={{ width: shiftColumnWidth, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: theme.border, paddingVertical: rh(1) }}>
                                              <Text style={[
                                                  styles.gridCell, 
                                                  { borderRightWidth: 0 },
                                                  dayStatus === 'P' ? styles.cellP : (dayStatus === 'A' ? styles.cellA : (dayStatus === 'L' ? styles.cellL : {}))
                                              ]}>{dayStatus}</Text>
                                          </View>
                                          <View style={{ width: shiftColumnWidth, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: theme.border, paddingVertical: rh(1) }}>
                                              <Text style={[
                                                  styles.gridCell, 
                                                  { borderRightWidth: 0 },
                                                  nightStatus === 'P' ? styles.cellP : (nightStatus === 'A' ? styles.cellA : (nightStatus === 'L' ? styles.cellL : {}))
                                              ]}>{nightStatus}</Text>
                                          </View>
                                      </React.Fragment>
                                  );
                              })}
                          </View>
                      ))}
                  </View>
              </View>
          </ScrollView>
      );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Monthly Report</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: rh(5) }}>
        <View style={styles.statsCard}>
            <View style={styles.monthSelector}>
                <TouchableOpacity onPress={() => changeMonth('prev')}>
                    <Feather name="chevron-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.monthText}>{getMonthName(currentDate)}</Text>
                <TouchableOpacity onPress={() => changeMonth('next')}>
                    <Feather name="chevron-right" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>
        </View>

        <Text style={styles.breakdownTitle}>Attendance Sheet</Text>
        
        {loading ? (
             <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: rh(5) }} />
        ) : (
            <View style={styles.gridContainer}>
                {renderGrid()}
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
