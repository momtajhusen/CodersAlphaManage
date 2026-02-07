import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  InteractionManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TasksStackParamList } from '../../navigation/types';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rw, rh, rf } from '../../constants/responsive';
import { getTasks, Task } from '../../services/taskService';
import { getEmployees } from '../../services/employeeService';
import { getMyWorkLogs, SelfLoggedWork } from '../../services/selfLoggedWorkService';
import Header from '../../components/Header';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';

type TasksScreenNavigationProp = NativeStackNavigationProp<TasksStackParamList, 'TasksList'>;

type UnifiedWorkLog = {
  id: string;
  originalId: number;
  title: string;
  description: string | null;
  date: string;
  type: 'self_logged' | 'assigned_task';
  status: string;
  time_spent?: number;
  verification_status?: string;
  originalData: Task | SelfLoggedWork;
};

export default function TasksScreen() {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const isFocused = useIsFocused();
  const { theme, scheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unifiedWorkLogs, setUnifiedWorkLogs] = useState<UnifiedWorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'overdue' | 'in_progress'>('all');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (isFocused) {
      const task = InteractionManager.runAfterInteractions(() => {
        fetchData();
      });
      return () => task.cancel();
    }
  }, [isFocused]);

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees({ per_page: 100 });
      if (response.success) {
        setEmployees(response.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Pending Tab Logic
      if (activeTab === 'pending') {
        const filters: any = {};
        
        // Handle Filters
        if (activeFilter === 'overdue') {
            filters.overdue = true;
        } else if (activeFilter === 'in_progress') {
            filters.status = 'in_progress';
        } else if (activeFilter !== 'all') {
            filters.priority = activeFilter;
        }
        
        if (searchQuery) filters.search = searchQuery;
        if (selectedEmployee) filters.assigned_to = selectedEmployee.id;

        const response = await getTasks(filters);
        console.log('Task API Raw Response:', JSON.stringify(response, null, 2));

        if (response?.success) {
          let fetchedTasks = response.data?.data || [];
          console.log('Fetched Tasks (Initial):', fetchedTasks);
          
          // Handle paginated response structure (Laravel Resource Collection)
          if (!Array.isArray(fetchedTasks) && fetchedTasks.data && Array.isArray(fetchedTasks.data)) {
              fetchedTasks = fetchedTasks.data;
          } else if (response.data && Array.isArray(response.data)) {
              // Sometimes data might be directly the array if pagination is off or different structure
              fetchedTasks = response.data;
          }
          
          if (!Array.isArray(fetchedTasks)) {
              console.warn('Fetched tasks is not an array:', JSON.stringify(fetchedTasks));
              // Fallback: try to find an array in response.data
              if (Array.isArray(response.data)) {
                  fetchedTasks = response.data;
              } else {
                  fetchedTasks = [];
              }
          }

          console.log('Tasks before filter:', fetchedTasks.length);

          // STRICTLY filter out completed/approved tasks for Pending tab
          fetchedTasks = fetchedTasks.filter((t: Task) => 
            t.status !== 'completed' && (t.status as string) !== 'approved'
          );

          console.log('Tasks after filter (Pending):', fetchedTasks.length);

          // Client-side Overdue Check (if API doesn't filter strictly enough or for immediate feedback)
          if (activeFilter === 'overdue') {
             const now = new Date();
             fetchedTasks = fetchedTasks.filter((t: Task) => {
                 if (!t.deadline) return false;
                 return new Date(t.deadline) < now && t.status !== 'completed';
             });
          }

          // Sort by deadline (nearest first)
          fetchedTasks.sort((a: Task, b: Task) => {
             const getTimestamp = (d: string | null) => {
                 if (!d) return 8640000000000000; // Far future
                 const t = new Date(d).getTime();
                 return isNaN(t) ? 8640000000000000 : t;
             };
             const dateA = getTimestamp(a.deadline);
             const dateB = getTimestamp(b.deadline);
             return dateA - dateB;
          });

          setTasks(fetchedTasks);
        }
      } 
      // Completed Tab Logic
      else if (activeTab === 'completed') {
        const filters: any = { status: 'completed' };
        if (searchQuery) filters.search = searchQuery;
        if (selectedEmployee) filters.assigned_to = selectedEmployee.id;
        
        // Allow priority filtering in completed tab too
        if (['high', 'medium', 'low'].includes(activeFilter)) {
            filters.priority = activeFilter;
        }

        const response = await getTasks(filters);
        console.log('Completed Tasks API Response:', JSON.stringify(response, null, 2));

        if (response?.success) {
          let fetchedTasks = response.data?.data || [];
          
          // Handle paginated response structure (Laravel Resource Collection)
           if (!Array.isArray(fetchedTasks) && fetchedTasks.data && Array.isArray(fetchedTasks.data)) {
               fetchedTasks = fetchedTasks.data;
           } else if (response.data && Array.isArray(response.data)) {
               fetchedTasks = response.data;
           }
           
           if (!Array.isArray(fetchedTasks)) {
               console.warn('Fetched completed tasks is not an array:', JSON.stringify(fetchedTasks));
               if (Array.isArray(response.data)) {
                   fetchedTasks = response.data;
               } else {
                   fetchedTasks = [];
               }
           }

          setTasks(fetchedTasks);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, activeTab, selectedEmployee]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate Summary Stats from loaded tasks
  const stats = useMemo(() => {
    return {
        total: tasks.length,
        pending: tasks.filter(t => t.status !== 'completed').length,
        completed: tasks.filter(t => t.status === 'completed').length
    };
  }, [tasks, activeTab]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Invalid';
    }
  };

  const getPriorityColor = (priority: string) => {
      switch(priority?.toLowerCase()) {
          case 'high': return '#ef4444';
          case 'medium': return '#f59e0b';
          case 'low': return '#10b981';
          default: return theme.subtext;
      }
  };

  const getStatusColor = (status: string) => {
      switch(status?.toLowerCase()) {
          case 'completed': 
          case 'approved':
              return '#10b981'; // Green
          case 'in_progress': 
              return '#3b82f6'; // Blue
          case 'pending': 
              return '#f59e0b'; // Orange
          case 'rejected':
              return '#ef4444'; // Red
          default: 
              return theme.subtext;
      }
  };

  const getStatusBgColor = (status: string) => {
      switch(status?.toLowerCase()) {
          case 'completed': 
          case 'approved':
              return 'rgba(16, 185, 129, 0.1)';
          case 'in_progress': 
              return 'rgba(59, 130, 246, 0.1)';
          case 'pending': 
              return 'rgba(245, 158, 11, 0.1)';
          case 'rejected':
              return 'rgba(239, 68, 68, 0.1)';
          default: 
              return theme.card;
      }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerContainer: {
        padding: rw(4),
        paddingBottom: rh(1),
    },
    // New styles for inline filters
    inlineFilterContainer: {
        paddingHorizontal: rw(4),
        marginBottom: rh(1.5),
    },
    inlineSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: rw(3),
        paddingHorizontal: rw(3),
        borderWidth: 1,
        borderColor: theme.border,
        height: rh(5.5),
        marginBottom: rh(1.5),
    },
    inlineSearchInput: {
        flex: 1,
        marginLeft: rw(2),
        fontSize: rf(1.8),
        color: theme.text,
    },
    priorityScroll: {
        flexGrow: 0,
        marginBottom: rh(1),
    },
    priorityChip: {
        paddingHorizontal: rw(3),
        paddingVertical: rh(0.8),
        borderRadius: rw(4),
        borderWidth: 1,
        marginRight: rw(2),
        flexDirection: 'row',
        alignItems: 'center',
    },
    priorityChipText: {
        fontSize: rf(1.6),
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    tabContainer: {
        marginBottom: rh(2),
    },
    tabButton: {
        paddingVertical: rh(1),
        paddingHorizontal: rw(4),
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
    listContent: {
        paddingHorizontal: rw(4),
        paddingBottom: rh(10),
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: rw(3),
        padding: rw(3),
        marginBottom: rh(1.5),
        borderWidth: 1,
        borderColor: theme.border,
        elevation: 1,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: rh(1),
    },
    cardTitle: {
        fontSize: rf(1.8),
        fontWeight: 'bold',
        color: theme.text,
        flex: 1,
        marginRight: rw(2),
    },
    statusBadge: {
        paddingHorizontal: rw(2),
        paddingVertical: rh(0.5),
        borderRadius: rw(1),
        borderWidth: 1,
        borderColor: 'transparent',
    },
    statusText: {
        fontSize: rf(1.3),
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardDescription: {
        fontSize: rf(1.5),
        color: theme.subtext,
        marginBottom: rh(1.5),
        lineHeight: rh(2.2),
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingTop: rh(1),
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: rf(1.4),
        color: theme.subtext,
        marginLeft: rw(1.5),
        fontWeight: '500',
    },
    priorityDot: {
        width: rw(2),
        height: rw(2),
        borderRadius: rw(1),
        marginRight: rw(2),
    },
    employeeButton: {
        width: rh(6),
        height: rh(6),
        borderRadius: rw(3),
        backgroundColor: theme.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        marginLeft: rw(2),
    },
    fab: {
        position: 'absolute',
        bottom: rh(4),
        right: rw(6),
        backgroundColor: theme.primary,
        width: rw(14),
        height: rw(14),
        borderRadius: rw(7),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
  });

  const renderTaskItem = ({ item, index }: { item: Task, index: number }) => (
    <AnimatedEntry delay={index * 100} from="bottom">
    <ScalePressable 
      style={[styles.card, { 
          borderLeftWidth: rw(1.5), 
          borderLeftColor: getPriorityColor(item.priority) // Use Priority Color for border
      }]}
      onPress={() => navigation.navigate('TaskDetail', { id: item.id.toString() })}
    >
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {/* Show Priority Label explicitly */}
            <View style={{ 
                backgroundColor: getPriorityColor(item.priority) + '20', 
                paddingHorizontal: rw(2), 
                paddingVertical: rh(0.3), 
                borderRadius: rw(1),
                marginRight: rw(2)
            }}>
                <Text style={{ 
                    color: getPriorityColor(item.priority), 
                    fontSize: rf(1.2), 
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                }}>
                    {item.priority || 'Medium'}
                </Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        </View>
        <View style={[styles.statusBadge, { 
            backgroundColor: getStatusBgColor(item.status),
            borderColor: getStatusColor(item.status)
        }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description || 'No description provided'}
      </Text>

      <View style={styles.cardFooter}>
         <View style={styles.footerItem}>
            <Feather name="calendar" size={rf(1.6)} color={theme.subtext} />
            <Text style={styles.footerText}>{formatDate(item.deadline || item.created_at)}</Text>
         </View>
         <View style={styles.footerItem}>
            {item.assignments && item.assignments.length > 0 && item.assignments[0].assignee ? (
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="user" size={rf(1.6)} color={theme.subtext} />
                    <Text style={styles.footerText}>
                        {item.assignments[0].assignee.full_name.split(' ')[0]}
                        {item.assignments.length > 1 ? ` +${item.assignments.length - 1}` : ''}
                    </Text>
                 </View>
            ) : (
                <Text style={styles.footerText}>Unassigned</Text>
            )}
         </View>
      </View>
    </ScalePressable>
    </AnimatedEntry>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Tasks" 
        rightComponent={
            <ScalePressable onPress={() => setFilterModalVisible(true)} style={{ padding: rw(2) }}>
                {/* Keep filter icon for Advanced Filters like Employee/Date if needed, or remove if user wants only inline */}
                <Feather name="sliders" size={rf(2.5)} color={theme.text} />
            </ScalePressable>
        }
      />
      
      <View style={styles.headerContainer}>
        {/* Improved Tabs UI */}
        <View style={{ 
            flexDirection: 'row', 
            marginBottom: rh(1),
            backgroundColor: theme.card,
            padding: rw(1),
            borderRadius: rw(3),
            borderWidth: 1,
            borderColor: theme.border
        }}>
            <ScalePressable 
                style={{ 
                    flex: 1, 
                    paddingVertical: rh(1.2), 
                    backgroundColor: activeTab === 'pending' ? theme.primary : 'transparent',
                    borderRadius: rw(2),
                    alignItems: 'center',
                }}
                onPress={() => setActiveTab('pending')}
            >
                <Text style={{ 
                    color: activeTab === 'pending' ? '#fff' : theme.subtext, 
                    fontWeight: 'bold',
                    fontSize: rf(1.8)
                }}>Pending</Text>
            </ScalePressable>
            
            <ScalePressable 
                style={{ 
                    flex: 1, 
                    paddingVertical: rh(1.2), 
                    backgroundColor: activeTab === 'completed' ? theme.primary : 'transparent',
                    borderRadius: rw(2),
                    alignItems: 'center',
                }}
                onPress={() => setActiveTab('completed')}
            >
                <Text style={{ 
                    color: activeTab === 'completed' ? '#fff' : theme.subtext, 
                    fontWeight: 'bold',
                    fontSize: rf(1.8)
                }}>Completed</Text>
            </ScalePressable>
        </View>
      </View>

      {/* Inline Filters (Search & Priority) - "Tab ke andar" logic */}
      <View style={styles.inlineFilterContainer}>
          {/* Selected Employee Indicator */}
          <ScalePressable 
              style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: rh(1.5),
              }}
              onPress={() => setFilterModalVisible(true)}
          >
              <Text style={{ color: theme.subtext, fontSize: rf(1.6), marginRight: rw(2) }}>
                  Showing tasks for:
              </Text>
              <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: theme.card,
                  paddingHorizontal: rw(3),
                  paddingVertical: rh(0.8),
                  borderRadius: rw(2),
                  borderWidth: 1,
                  borderColor: theme.border,
                  flex: 1,
                  justifyContent: 'space-between'
              }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather name="user" size={rf(1.8)} color={theme.primary} style={{ marginRight: rw(2) }} />
                      <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: rf(1.7) }} numberOfLines={1}>
                          {selectedEmployee ? selectedEmployee.full_name : 'All Employees'}
                      </Text>
                  </View>
                  <Feather name="chevron-down" size={rf(1.8)} color={theme.subtext} />
              </View>
          </ScalePressable>

          {/* Search Bar */}
          <View style={styles.inlineSearchContainer}>
               <Feather name="search" size={rf(2.2)} color={theme.subtext} />
               <TextInput
                   style={styles.inlineSearchInput}
                   placeholder="Search tasks..."
                   placeholderTextColor={theme.subtext}
                   value={searchQuery}
                   onChangeText={setSearchQuery}
               />
               {searchQuery.length > 0 && (
                   <ScalePressable onPress={() => setSearchQuery('')}>
                       <Feather name="x" size={rf(2)} color={theme.subtext} />
                   </ScalePressable>
               )}
          </View>

          {/* Priority Chips */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.priorityScroll}
            contentContainerStyle={{ alignItems: 'center' }}
          >
              {(activeTab === 'pending' 
                ? ['all', 'overdue', 'high', 'medium', 'low', 'in_progress'] 
                : ['all', 'high', 'medium', 'low']
              ).map((f) => {
                  const isSelected = activeFilter === f;
                  const activeColor = f === 'overdue' ? '#ef4444' : theme.primary;
                  
                  return (
                    <ScalePressable
                        key={f}
                        onPress={() => setActiveFilter(f as any)}
                        style={[styles.priorityChip, {
                            backgroundColor: isSelected ? activeColor : theme.card,
                            borderColor: isSelected ? activeColor : theme.border,
                        }]}
                    >
                        <Text style={[styles.priorityChipText, {
                            color: isSelected ? '#fff' : theme.subtext
                        }]}>
                            {f.replace('_', ' ')}
                        </Text>
                    </ScalePressable>
                  );
              })}
          </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => (item.id || Math.random()).toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          renderItem={renderTaskItem}
        />
      )}

      {/* Filter Modal (Direct Employee Selection) */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
                 <View style={{ flex: 1 }} />
            </TouchableWithoutFeedback>
            <View style={{ backgroundColor: theme.card, borderTopLeftRadius: rw(5), borderTopRightRadius: rw(5), height: rh(60) }}>
                <View style={{ padding: rw(4), borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: rf(2.2), fontWeight: 'bold', color: theme.text }}>Filter by Employee</Text>
                    <ScalePressable onPress={() => setFilterModalVisible(false)}>
                        <Feather name="x" size={rf(3)} color={theme.text} />
                    </ScalePressable>
                </View>
                <FlatList
                    data={[{ id: null, full_name: 'All Employees' }, ...employees]}
                    keyExtractor={(item) => (item.id || 'all').toString()}
                    contentContainerStyle={{ padding: rw(4), paddingBottom: rh(5) }}
                    renderItem={({ item }) => (
                    <ScalePressable 
                        style={{ 
                        paddingVertical: rh(2), 
                        borderBottomWidth: 1, 
                        borderBottomColor: theme.border,
                        flexDirection: 'row',
                        alignItems: 'center'
                        }}
                        onPress={() => {
                        setSelectedEmployee(item.id ? item : null);
                        setFilterModalVisible(false);
                        }}
                    >
                        {item.profile_photo_url ? (
                            <Image source={{ uri: item.profile_photo_url }} style={{ width: rw(10), height: rw(10), borderRadius: rw(5), marginRight: rw(3) }} />
                        ) : (
                            <View style={{ width: rw(10), height: rw(10), borderRadius: rw(5), backgroundColor: theme.border, marginRight: rw(3), alignItems: 'center', justifyContent: 'center' }}>
                            <Feather name="user" size={rf(2)} color={theme.subtext} />
                            </View>
                        )}
                        <Text style={{ fontSize: rf(1.8), color: selectedEmployee?.id === item.id ? theme.primary : theme.text, fontWeight: selectedEmployee?.id === item.id ? 'bold' : 'normal' }}>
                        {item.full_name}
                        </Text>
                        {selectedEmployee?.id === item.id && (
                        <Feather name="check" size={rf(2)} color={theme.primary} style={{ marginLeft: 'auto' }} />
                        )}
                    </ScalePressable>
                    )}
                />
            </View>
        </View>
      </Modal>

      {/* FAB */}
      <AnimatedEntry delay={500} from="right" style={{ position: 'absolute', bottom: rh(4), right: rw(6) }}>
      <ScalePressable 
        style={[styles.fab, { bottom: 0, right: 0 }]}
        onPress={() => navigation.navigate('CreateTask')}
      >
        <Feather name="plus" size={rf(3)} color="#fff" />
      </ScalePressable>
      </AnimatedEntry>
    </View>
  );
}
