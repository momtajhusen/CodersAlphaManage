import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  TextInput,
  Platform
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';

const SliderComponent = Slider as any;
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { getTask, completeTask, deleteTask, updateTaskProgress, Task } from '../../services/taskService';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';

export default function TaskDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params;
  const { theme, scheme } = useTheme();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [newProgress, setNewProgress] = useState('');
  const [progressNote, setProgressNote] = useState('');

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      console.log('Fetching task details for ID:', id);
      const response = await getTask(parseInt(id));
      
      if (response && response.success && response.data) {
        setTask(response.data);
        
        // Find current user's assignment to set initial progress input
        const currentEmployeeId = user?.employee?.id;
        if (response.data.assignments) {
            const myAssignment = response.data.assignments.find((a: any) => a.assigned_to === currentEmployeeId);
            if (myAssignment) {
            setNewProgress(myAssignment.progress_percentage.toString());
            }
        }
      } else {
        console.error('Invalid task response:', response);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Invalid task data received'
        });
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not load task details'
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      await completeTask(parseInt(id));
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Task marked as complete'
      });
      fetchTaskDetails();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Could not complete task'
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(parseInt(id));
              Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Task deleted successfully'
              });
              navigation.goBack();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Could not delete task'
              });
            }
          }
        }
      ]
    );
  };

  const handleUpdateProgress = async () => {
    const progress = parseInt(newProgress);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Progress must be between 0 and 100'
      });
      return;
    }

    setUpdatingProgress(true);
    try {
      await updateTaskProgress(parseInt(id), progress, progressNote);
      Toast.show({
        type: 'success',
        text1: 'Updated',
        text2: 'Progress updated successfully'
      });
      fetchTaskDetails();
      setProgressNote('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Could not update progress'
      });
    } finally {
      setUpdatingProgress(false);
    }
  };

  const getPriorityStyle = (priority: string | undefined | null) => {
    const safePriority = priority ? priority.toLowerCase() : 'medium';
    switch (safePriority) {
      case 'high':
      case 'urgent':
        return {
          bg: scheme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
          text: scheme === 'dark' ? '#f87171' : '#dc2626',
        };
      case 'medium':
        return {
          bg: scheme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
          text: scheme === 'dark' ? '#fbbf24' : '#d97706',
        };
      case 'low':
        return {
          bg: scheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
          text: scheme === 'dark' ? '#34d399' : '#059669',
        };
      default:
        return {
          bg: theme.card,
          text: theme.subtext,
        };
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    headerActions: {
      flexDirection: 'row',
    },
    actionButton: {
      marginLeft: rw(4),
      padding: rw(1),
    },
    content: {
      padding: rw(5),
      paddingBottom: rh(10),
    },
    headerCard: {
      backgroundColor: theme.card,
      borderRadius: rw(4),
      padding: rw(5),
      marginBottom: rh(3),
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: rh(2),
    },
    title: {
      fontSize: rf(2.8),
      fontWeight: '800',
      color: theme.text,
      flex: 1,
      marginRight: rw(3),
      lineHeight: rf(3.6),
    },
    priorityBadge: {
      paddingHorizontal: rw(3),
      paddingVertical: rh(0.6),
      borderRadius: rw(2),
      alignSelf: 'flex-start',
    },
    priorityText: {
      fontSize: rf(1.4),
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: rh(1),
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: rw(3),
      marginBottom: rh(1),
      backgroundColor: theme.background,
      paddingHorizontal: rw(3),
      paddingVertical: rh(1),
      borderRadius: rw(6),
    },
    metaText: {
      marginLeft: rw(2),
      color: theme.subtext,
      fontSize: rf(1.6),
      fontWeight: '600',
    },
    section: {
      marginBottom: rh(3),
    },
    sectionTitle: {
      fontSize: rf(2.2),
      fontWeight: '700',
      color: theme.text,
      marginBottom: rh(1.5),
      marginLeft: rw(1),
    },
    descriptionText: {
      fontSize: rf(1.8),
      color: theme.subtext,
      lineHeight: rh(2.8),
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: rw(3),
      padding: rw(5),
    },
    assignmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: rh(2),
      paddingBottom: rh(2),
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    avatar: {
      width: rw(12),
      height: rw(12),
      borderRadius: rw(6),
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: rw(4),
    },
    avatarText: {
      fontSize: rf(2),
      fontWeight: '700',
      color: theme.primary,
    },
    assigneeInfo: {
      flex: 1,
    },
    assigneeName: {
      fontSize: rf(2),
      fontWeight: '600',
      color: theme.text,
      marginBottom: rh(0.5),
    },
    progressText: {
      fontSize: rf(1.6),
      color: theme.subtext,
      marginTop: rh(0.5),
      fontWeight: '500',
    },
    progressBarContainer: {
      height: rh(1),
      backgroundColor: theme.border,
      borderRadius: rh(0.5),
      marginTop: rh(0.5),
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: rh(0.5),
    },
    updateProgressContainer: {
      marginTop: rh(1),
      padding: rw(4),
      backgroundColor: theme.background,
      borderRadius: rw(3),
    },
    inputLabel: {
      fontSize: rf(1.8),
      color: theme.text,
      marginBottom: rh(1.5),
      fontWeight: '600',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: rh(2),
    },
    percentInput: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: rw(2),
      paddingHorizontal: rw(4),
      paddingVertical: rh(1),
      fontSize: rf(2.5),
      fontWeight: '700',
      color: theme.text,
      width: rw(20),
      textAlign: 'center',
      marginRight: rw(2),
    },
    noteInput: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: rw(2),
      padding: rw(3),
      color: theme.text,
      fontSize: rf(1.8),
      minHeight: rh(10),
      textAlignVertical: 'top',
      marginBottom: rh(2),
    },
    updateBtn: {
      backgroundColor: theme.primary,
      paddingVertical: rh(1.5),
      borderRadius: rw(3),
      alignItems: 'center',
    },
    updateBtnText: {
      color: '#fff',
      fontSize: rf(1.8),
      fontWeight: '700',
    },
    completeBtn: {
      backgroundColor: '#10b981',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: rh(2),
      borderRadius: rw(4),
      marginTop: rh(2),
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    completeBtnText: {
      color: '#fff',
      fontSize: rf(2.2),
      fontWeight: '700',
      marginLeft: rw(2),
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!task) return null;

  const priorityStyle = getPriorityStyle(task.priority);
  const currentEmployeeId = user?.employee?.id;
  const isAssignedToMe = task.assignments?.some((a: any) => a.assigned_to === currentEmployeeId);
  const myAssignment = task.assignments?.find((a: any) => a.assigned_to === currentEmployeeId);

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

  return (
    <View style={styles.container}>
      <Header 
        title="Task Details" 
        showBack 
        rightComponent={
          task.created_by === currentEmployeeId ? (
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Feather name="trash-2" size={rf(2.5)} color={scheme === 'dark' ? '#ef4444' : '#dc2626'} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedEntry delay={100} from="top">
        <View style={styles.headerCard}>
            <View style={styles.titleRow}>
                <Text style={styles.title}>{task.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                    <Text style={[styles.priorityText, { color: priorityStyle.text }]}>{task.priority}</Text>
                </View>
            </View>
            
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Feather name="calendar" size={rf(2)} color={theme.subtext} />
                    <Text style={styles.metaText}>
                        Due: {new Date(task.deadline || '').toLocaleDateString()}
                    </Text>
                </View>
                <View style={[styles.metaItem, { backgroundColor: getStatusBgColor(task.status) }]}>
                    <Feather 
                        name={task.status === 'completed' ? 'check-circle' : 'activity'} 
                        size={rf(2)} 
                        color={getStatusColor(task.status)} 
                    />
                    <Text style={[styles.metaText, { color: getStatusColor(task.status) }]}>
                        {task.status.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            </View>
        </View>
        </AnimatedEntry>

        <AnimatedEntry delay={200} from="bottom">
        <View style={styles.section}>
             <Text style={styles.sectionTitle}>Description</Text>
             <View style={styles.card}>
                 <Text style={styles.descriptionText}>
                     {task.description || 'No description provided.'}
                 </Text>
                 
                 {task.materials_needed && (
                    <View style={{ marginTop: rh(2) }}>
                        <Text style={[styles.inputLabel, { color: theme.subtext, fontSize: rf(1.6) }]}>Materials Needed</Text>
                        <Text style={styles.descriptionText}>{task.materials_needed}</Text>
                    </View>
                 )}
             </View>
        </View>
        </AnimatedEntry>

        {task.assignments && task.assignments.length > 0 && (
            <AnimatedEntry delay={300} from="bottom">
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Team & Progress</Text>
                <View style={styles.card}>
                    {task.assignments.map((assignment: any) => (
                        <View key={assignment.id} style={styles.assignmentItem}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {assignment.assignee?.full_name ? 
                                        assignment.assignee.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 
                                        'U'}
                                </Text>
                            </View>
                            <View style={styles.assigneeInfo}>
                                <Text style={styles.assigneeName}>
                                    {assignment.assignee?.full_name || 'Unnamed User'}
                                </Text>
                                <View style={styles.progressBarContainer}>
                                    <View style={[styles.progressBar, { width: `${assignment.progress_percentage}%` }]} />
                                </View>
                                <Text style={styles.progressText}>{assignment.progress_percentage}% Completed</Text>
                            </View>
                        </View>
                    ))}

                    {/* My Progress Update Section */}
                    {isAssignedToMe && task.status !== 'completed' && (
                        <View style={styles.updateProgressContainer}>
                            <Text style={styles.inputLabel}>Update Your Progress</Text>
                            <View style={{ marginBottom: rh(2) }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: rh(1) }}>
                                    <Text style={{ color: theme.text, fontSize: rf(2), fontWeight: 'bold' }}>
                                        {Math.round(parseFloat(newProgress) || 0)}%
                                    </Text>
                                </View>
                                <SliderComponent
                                     style={{ width: '100%', height: 40 }}
                                    minimumValue={0}
                                    maximumValue={100}
                                    step={5}
                                    value={parseFloat(newProgress) || 0}
                                    onValueChange={(val: number) => setNewProgress(Math.round(val).toString())}
                                    minimumTrackTintColor={theme.primary}
                                    maximumTrackTintColor={theme.border}
                                    thumbTintColor={theme.primary}
                                />
                            </View>
                            <TextInput
                                style={styles.noteInput}
                                placeholder="Add a note (optional)"
                                placeholderTextColor={theme.subtext}
                                value={progressNote}
                                onChangeText={setProgressNote}
                                multiline
                            />
                            <ScalePressable 
                                style={styles.updateBtn}
                                onPress={handleUpdateProgress}
                                disabled={updatingProgress}
                            >
                                {updatingProgress ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.updateBtnText}>Update Progress</Text>
                                )}
                            </ScalePressable>
                        </View>
                    )}
                </View>
            </View>
            </AnimatedEntry>
        )}

        {task.status !== 'completed' && (task.created_by === currentEmployeeId || isAssignedToMe) && (
            <AnimatedEntry delay={400} from="bottom">
            <ScalePressable style={styles.completeBtn} onPress={handleComplete}>
                <Feather name="check-circle" size={rf(3)} color="white" />
                <Text style={styles.completeBtnText}>Mark as Complete</Text>
            </ScalePressable>
            </AnimatedEntry>
        )}
      </ScrollView>
    </View>
  );
}