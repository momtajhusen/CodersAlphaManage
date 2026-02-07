import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TextInput, Modal, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FinanceStackParamList } from '../../navigation/types';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { getHistory, HistoryItem, HistoryFilters } from '../../services/historyService';
import { getEmployees } from '../../services/employeeService';
import { formatCurrency } from '../../utils/formatters';
import Toast from 'react-native-toast-message';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';

type FinanceScreenNavigationProp = NativeStackNavigationProp<FinanceStackParamList, 'FinanceHome'>;

export default function ExpensesScreen() {
  const navigation = useNavigation<FinanceScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('Overview'); // Overview | Income | Expense | Transfer
  const { theme } = useTheme();
  
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totals, setTotals] = useState({ income: 0, expense: 0, transfer: 0, balance: 0 });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filter State
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'office' | 'personal'>('all');
  const [filterUser, setFilterUser] = useState<number | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  // Temporary Filter State for Modal
  const [modalFilterType, setModalFilterType] = useState<'all' | 'office' | 'personal'>('all');
  const [modalFilterUser, setModalFilterUser] = useState<number | null>(null);

  const openFilterModal = () => {
      setModalFilterType(filterType);
      setModalFilterUser(filterUser);
      setFilterModalVisible(true);
  };

  const applyFilters = () => {
      setFilterType(modalFilterType);
      setFilterUser(modalFilterUser);
      setFilterModalVisible(false);
  };

  const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleYearChange = (increment: number) => {
    setSelectedYear(prev => prev + increment);
  };

  const toggleYearView = () => {
    // If we want to toggle between monthly and yearly view, we can set selectedMonth to null
    // But the user requested specifically to have the year in the same row.
    // We will keep this function if we need to clear month selection.
    if (selectedMonth === null) {
        setSelectedMonth(new Date().getMonth());
    } else {
        setSelectedMonth(null);
    }
  };

  // Debounce Search
  useEffect(() => {
      const handler = setTimeout(() => {
          setDebouncedSearch(searchQuery);
      }, 500);
      return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Employees for Filter
  useEffect(() => {
    getEmployees({ per_page: 100 }).then(res => {
        let data = [];
        if (res.data && Array.isArray(res.data)) {
            data = res.data;
        } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
            data = res.data.data;
        } else if (Array.isArray(res)) {
            data = res;
        }
        setEmployees(data);
    }).catch(err => console.error('Failed to fetch employees for filter', err));
  }, []);

  const loadedRef = useRef(false);

  // Reset loaded state when filters change
  useEffect(() => {
      loadedRef.current = false;
      setPage(1);
      setHasMore(true);
      setHistoryData([]); // Clear data on filter change
      fetchData(1, false);
  }, [filterType, filterUser, selectedMonth, selectedYear, activeTab, debouncedSearch]);

  const fetchData = async (pageNum: number, isLoadMore: boolean = false) => {
    if (!isLoadMore && !refreshing) {
        setIsLoading(true);
    }
    if (isLoadMore) {
        setIsLoadingMore(true);
    }

    try {
        const filters: HistoryFilters = {
            page: pageNum,
            per_page: 20,
        };

        // Apply Type Filter
        if (filterType !== 'all') {
            filters.type = filterType;
        }

        // Apply User Filter
        if (filterUser) {
            filters.employee_id = filterUser;
        }

        // Apply Tab Filter
        if (activeTab === 'Income') filters.record_type = 'income';
        if (activeTab === 'Expense') filters.record_type = 'expense';
        if (activeTab === 'Transfer') filters.record_type = 'transfer';

        // Apply Date Filter
        if (selectedMonth !== null) {
            const startDate = new Date(selectedYear, selectedMonth, 1);
            const endDate = new Date(selectedYear, selectedMonth + 1, 0);
            filters.from_date = startDate.toISOString().split('T')[0];
            filters.to_date = endDate.toISOString().split('T')[0];
        } else {
            const startDate = new Date(selectedYear, 0, 1);
            const endDate = new Date(selectedYear, 11, 31);
            filters.from_date = startDate.toISOString().split('T')[0];
            filters.to_date = endDate.toISOString().split('T')[0];
        }

        // Apply Search
        if (debouncedSearch) {
            filters.search = debouncedSearch;
        }

        const response = await getHistory(filters);
        
        if (response.success) {
            const newData = response.data;
            if (isLoadMore) {
                setHistoryData(prev => [...prev, ...newData]);
            } else {
                setHistoryData(newData);
            }

            setHasMore(response.meta.current_page < response.meta.last_page);
            if (response.totals) {
                setTotals(response.totals);
            }
        }
        
        loadedRef.current = true;
    } catch (error) {
        console.error('Error fetching finance data:', error);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to fetch finance data',
        });
    } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchData(1, false);
  }, []);

  const loadMore = () => {
      if (!isLoadingMore && !isLoading && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchData(nextPage, true);
      }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return 'Invalid Date';
    }
  };

  // Get view totals based on active tab or overall totals
  const viewTotals = useMemo(() => {
    let filterLabel = 'All Users';
    if (filterUser) {
        const user = employees.find(e => e.id == filterUser);
        filterLabel = user ? (user.full_name || 'Selected User') : 'Selected User';
    } else if (filterType !== 'all') {
        filterLabel = filterType === 'office' ? 'Office' : 'Personal';
    }

    return {
        ...totals,
        filterName: filterLabel
    };
  }, [totals, filterUser, filterType, employees]);

  const renderItem = ({ item, index }: { item: HistoryItem, index: number }) => {
      // Determine Icon and Color based on type
      let iconName: any = 'dollar-sign';
      let iconColor = theme.text;
      let bgColor = theme.card;
      let amountPrefix = '';
      let amountColor = theme.text;

      if (item.type === 'income') {
          iconName = 'arrow-down-left';
          iconColor = '#10b981'; // Green
          bgColor = '#10b98115';
          amountPrefix = '+ ';
          amountColor = '#10b981';
      } else if (item.type === 'expense') {
          iconName = 'arrow-up-right';
          iconColor = '#ef4444'; // Red
          bgColor = '#ef444415';
          amountPrefix = '- ';
          amountColor = '#ef4444';
      } else if (item.type === 'transfer') {
          iconName = 'repeat';
          iconColor = '#3b82f6'; // Blue
          bgColor = '#3b82f615';
          amountPrefix = '';
          amountColor = '#3b82f6';
      }

      return (
        <AnimatedEntry delay={index % 10 * 50} from="bottom">
            <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                        <Feather name={iconName} size={rf(2.2)} color={iconColor} />
                    </View>
                    <View style={{ flex: 1, marginRight: rw(2) }}>
                        <Text style={styles.categoryText} numberOfLines={1}>
                            {item.title || item.category || item.description || 'Untitled'}
                        </Text>
                        <Text style={styles.metaText}>
                            {formatDate(item.sortDate)} • {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </Text>
                        {(item.employee || item.sender) && (
                            <Text style={[styles.metaText, { fontSize: rf(1.2), marginTop: 2 }]}>
                                {item.type === 'transfer' 
                                    ? `${item.sender?.full_name?.split(' ')[0]} → ${item.receiver?.full_name?.split(' ')[0]}`
                                    : (item.employee?.full_name || item.contributor?.full_name)
                                }
                            </Text>
                        )}
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.amountText, { color: amountColor }]}>
                        {amountPrefix}{formatCurrency(item.amount)}
                    </Text>
                    <Text style={[styles.metaText, { fontSize: rf(1.2) }]}>
                        {item.status || 'completed'}
                    </Text>
                </View>
            </View>
        </AnimatedEntry>
      );
  };

  const renderEmpty = () => {
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: rh(5) }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }
    return (
        <View style={{ alignItems: 'center', marginTop: rh(5) }}>
            <Feather name="inbox" size={48} color={theme.subtext} style={{ opacity: 0.5, marginBottom: 10 }} />
            <Text style={{ color: theme.subtext, fontSize: rf(2) }}>No records found</Text>
        </View>
    );
  };

  // Determine FAB config
  const getFabConfig = () => {
      switch (activeTab) {
          case 'Overview':
          case 'Expense':
              return { icon: 'plus', route: 'CreateExpense' as keyof FinanceStackParamList, color: '#ef4444' };
          case 'Income':
              return { icon: 'plus', route: 'CreateIncome' as keyof FinanceStackParamList, color: '#10b981' };
          case 'Transfer':
              return { icon: 'repeat', route: 'TransferMoney' as keyof FinanceStackParamList, color: '#3b82f6' };
          default:
              return null;
      }
  };

  const fabConfig = getFabConfig();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerFixedContainer: {
        backgroundColor: theme.background,
        zIndex: 1,
    },
    headerContainer: {
        padding: rw(4),
        paddingBottom: rh(1),
    },
    title: {
      fontSize: rf(3),
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: rh(2),
    },
    tabContainer: {
      flexDirection: 'row',
      marginHorizontal: rw(4),
      marginBottom: rh(1.5),
    },
    tabButton: {
      paddingVertical: rh(0.8),
      paddingHorizontal: rw(3.5),
      borderRadius: rw(6),
      marginRight: rw(2),
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
    },
    activeTab: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    tabText: {
      fontWeight: '600',
      fontSize: rf(1.6),
      color: theme.subtext,
    },
    activeTabText: {
      color: '#fff',
    },
    viewTotalContainer: {
        marginHorizontal: rw(4),
        marginBottom: rh(1),
        padding: rw(2.5),
        backgroundColor: theme.card,
        borderRadius: rw(2.5),
        borderWidth: 1,
        borderColor: theme.border,
        flexDirection: 'column',
    },
    viewTotalText: {
        fontSize: rf(1.7),
        fontWeight: 'bold',
        color: theme.text,
    },
    viewTotalLabel: {
        fontSize: rf(1.5),
        color: theme.subtext,
        marginRight: rw(1.5),
    },
    listContent: {
        paddingBottom: rh(10),
    },
    card: {
      backgroundColor: theme.card,
      padding: rw(3),
      borderRadius: rw(3),
      marginBottom: rh(1),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      marginHorizontal: rw(4),
    },
    iconBox: {
        width: rw(8),
        height: rw(8),
        borderRadius: rw(2.5),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: rw(2.5),
    },
    categoryText: {
      fontSize: rf(1.8),
      fontWeight: '600',
      color: theme.text,
      marginBottom: rh(0.3),
    },
    metaText: {
      color: theme.subtext,
      fontSize: rf(1.4),
    },
    amountText: {
      fontSize: rf(2),
      fontWeight: 'bold',
    },
    fab: {
      position: 'absolute',
      bottom: rh(3),
      right: rw(5),
      width: rw(14),
      height: rw(14),
      borderRadius: rw(7),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
      zIndex: 100,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: rw(3),
        paddingHorizontal: rw(3),
        marginBottom: rh(1.5),
        borderWidth: 1,
        borderColor: theme.border,
        height: rh(5.5),
    },
    searchInput: {
        flex: 1,
        marginLeft: rw(2),
        color: theme.text,
        fontSize: rf(1.8),
    },
    monthChip: {
        paddingVertical: rh(0.6),
        paddingHorizontal: rw(2.5),
        borderRadius: rw(2),
        marginRight: rw(1.5),
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
    },
    activeMonthChip: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    monthText: {
        fontSize: rf(1.6),
        color: theme.subtext,
    },
    activeMonthText: {
        color: '#fff',
        fontWeight: '600',
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
        maxHeight: rh(80),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rh(3),
    },
    modalTitle: {
        fontSize: rf(2.2),
        fontWeight: 'bold',
        color: theme.text,
    },
    filterSectionTitle: {
        fontSize: rf(1.8),
        fontWeight: '600',
        color: theme.text,
        marginBottom: rh(1.5),
        marginTop: rh(1),
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: rh(2),
    },
    filterChip: {
        paddingVertical: rh(1),
        paddingHorizontal: rw(4),
        borderRadius: rw(6),
        borderWidth: 1,
        borderColor: theme.border,
        marginRight: rw(2),
        marginBottom: rh(1),
    },
    activeFilterChip: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    filterChipText: {
        fontSize: rf(1.6),
        color: theme.text,
    },
    activeFilterChipText: {
        color: '#fff',
        fontWeight: '600',
    },
    applyButton: {
        backgroundColor: theme.primary,
        paddingVertical: rh(1.5),
        borderRadius: rw(3),
        alignItems: 'center',
        marginTop: rh(2),
    },
    applyButtonText: {
        color: '#fff',
        fontSize: rf(2),
        fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.headerFixedContainer}>
            <View style={styles.headerContainer}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={styles.title}>Finance</Text>
                    <ScalePressable onPress={openFilterModal}>
                        <Feather name="filter" size={24} color={theme.text} />
                    </ScalePressable>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Feather name="search" size={20} color={theme.subtext} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        placeholderTextColor={theme.subtext}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <ScalePressable onPress={() => setSearchQuery('')}>
                            <Feather name="x" size={18} color={theme.subtext} />
                        </ScalePressable>
                    )}
                </View>

                {/* Month/Year Filter */}
                <View style={{ marginBottom: rh(1.5) }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                         {/* Year Selector as the first item */}
                         <View style={[styles.monthChip, styles.activeMonthChip, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rw(2) }]}>
                            <ScalePressable onPress={() => handleYearChange(-1)}>
                                 <Feather name="chevron-left" size={16} color="#fff" />
                            </ScalePressable>
                            <Text style={[styles.activeMonthText, { marginHorizontal: rw(2) }]}>{selectedYear}</Text>
                            <ScalePressable onPress={() => handleYearChange(1)}>
                                 <Feather name="chevron-right" size={16} color="#fff" />
                            </ScalePressable>
                        </View>
                        
                        <ScalePressable
                            style={[
                                styles.monthChip,
                                selectedMonth === null && styles.activeMonthChip
                            ]}
                            onPress={() => setSelectedMonth(null)}
                        >
                            <Text style={[
                                styles.monthText,
                                selectedMonth === null && styles.activeMonthText
                            ]}>
                                All Months
                            </Text>
                        </ScalePressable>

                        {months.map((month, index) => (
                            <ScalePressable
                                key={index}
                                style={[
                                    styles.monthChip,
                                    selectedMonth === index && styles.activeMonthChip
                                ]}
                                onPress={() => setSelectedMonth(index)}
                            >
                                <Text style={[
                                    styles.monthText,
                                    selectedMonth === index && styles.activeMonthText
                                ]}>
                                    {month}
                                </Text>
                            </ScalePressable>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {['Overview', 'Income', 'Expense', 'Transfer'].map((tab) => (
                    <ScalePressable
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab}
                        </Text>
                    </ScalePressable>
                ))}
            </View>

            {/* View Totals */}
            <View style={styles.viewTotalContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={styles.viewTotalLabel}>{viewTotals.filterName} Summary</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                        <Text style={styles.viewTotalLabel}>Income</Text>
                        <Text style={[styles.viewTotalText, { color: '#10b981' }]}>
                            {formatCurrency(viewTotals.income)}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.viewTotalLabel}>Expense</Text>
                        <Text style={[styles.viewTotalText, { color: '#ef4444' }]}>
                            {formatCurrency(viewTotals.expense)}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.viewTotalLabel}>Balance</Text>
                        <Text style={[styles.viewTotalText, { color: theme.text }]}>
                            {formatCurrency(viewTotals.balance)}
                        </Text>
                    </View>
                </View>
            </View>
        </View>

        <FlatList
            style={{ flex: 1 }}
            data={historyData}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
                isLoadingMore ? (
                    <View style={{ paddingVertical: 20 }}>
                        <ActivityIndicator size="small" color={theme.primary} />
                    </View>
                ) : null
            }
        />
        
        {/* Dynamic FAB */}
        {fabConfig && (
            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: fabConfig.color }]} 
                onPress={() => navigation.navigate(fabConfig.route as any)}
            >
                <Feather name={fabConfig.icon as any} size={24} color="#fff" />
            </TouchableOpacity>
        )}

        {/* Filter Modal */}
        <Modal
            visible={filterModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setFilterModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filter Options</Text>
                        <ScalePressable onPress={() => setFilterModalVisible(false)}>
                            <Feather name="x" size={24} color={theme.text} />
                        </ScalePressable>
                    </View>

                    <Text style={styles.filterSectionTitle}>View Type</Text>
                    <View style={styles.filterOptions}>
                        {['all', 'office', 'personal'].map((type) => (
                            <ScalePressable
                                key={type}
                                style={[
                                    styles.filterChip,
                                    modalFilterType === type && styles.activeFilterChip
                                ]}
                                onPress={() => setModalFilterType(type as any)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    modalFilterType === type && styles.activeFilterChipText
                                ]}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </ScalePressable>
                        ))}
                    </View>

                    <Text style={styles.filterSectionTitle}>User</Text>
                    <View style={styles.filterOptions}>
                        <ScalePressable
                            style={[
                                styles.filterChip,
                                modalFilterUser === null && styles.activeFilterChip
                            ]}
                            onPress={() => setModalFilterUser(null)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                modalFilterUser === null && styles.activeFilterChipText
                            ]}
                            >
                                All Users
                            </Text>
                        </ScalePressable>
                        {employees.map(emp => (
                            <ScalePressable
                                key={emp.id}
                                style={[
                                    styles.filterChip,
                                    modalFilterUser === emp.id && styles.activeFilterChip
                                ]}
                                onPress={() => setModalFilterUser(emp.id)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    modalFilterUser === emp.id && styles.activeFilterChipText
                                ]}>
                                    {emp.full_name}
                                </Text>
                            </ScalePressable>
                        ))}
                    </View>

                    <ScalePressable style={styles.applyButton} onPress={applyFilters}>
                        <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </ScalePressable>
                </View>
            </View>
        </Modal>
    </SafeAreaView>
  );
}
