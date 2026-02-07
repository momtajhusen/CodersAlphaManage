import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Toast from 'react-native-toast-message';
import { createTask } from '../../services/taskService';
import { getEmployees } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';

const taskSchema = z.object({
  title: z.string().min(3, 'Title is required (min 3 chars)'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  category: z.string().min(1, 'Category is required'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  budget_required: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount').optional().or(z.literal('')),
  materials_needed: z.string().optional(),
  assigned_to: z.number().optional(), // Single assignee for now in UI
});

type TaskFormData = z.input<typeof taskSchema>;

export default function CreateTaskScreen() {
  const navigation = useNavigation();
  const { theme, scheme } = useTheme();
  const { user, employeeId, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium',
      category: 'General',
      deadline: new Date().toISOString().split('T')[0],
      budget_required: '',
      materials_needed: '',
      assigned_to: employeeId ? Number(employeeId) : undefined,
    }
  });

  const priority = watch('priority');
  const assignedTo = watch('assigned_to');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    // Auto-select current user as assignee if not set
    if (employeeId) {
        const id = Number(employeeId);
        if (!watch('assigned_to')) {
            setValue('assigned_to', id);
        }
    } else if (user?.employee?.id && !watch('assigned_to')) {
        setValue('assigned_to', user.employee.id);
    }
  }, [employeeId, user?.employee?.id]);

  const loadEmployees = async () => {
    try {
      const response = await getEmployees({ per_page: 100, status: 'active' });
      setEmployees(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load employees', error);
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    setIsLoading(true);
    try {
      const priorityMapping: Record<string, string> = {
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high',
        'Urgent': 'high'
      };

      const payload: any = {
        ...data,
        priority: priorityMapping[data.priority] || 'medium', 
        budget_required: data.budget_required ? parseFloat(data.budget_required) : undefined,
        assigned_to: data.assigned_to ? [data.assigned_to] : undefined, // Convert single to array
      };
      
      await createTask(payload);
      
      Toast.show({
        type: 'success',
        text1: 'Task Created',
        text2: 'Task has been successfully created',
      });
      
      // Delay navigation slightly to allow Toast to appear and user to register success
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error: any) {
      console.error('Create task error:', error.response?.data || error);
      const validationErrors = error.response?.data?.errors;
      const errorMessage = validationErrors 
        ? Object.values(validationErrors).flat().join('\n')
        : error.response?.data?.message || 'Could not create task';

      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeName = (id: number | undefined) => {
    if (!id) return 'Select Employee';
    const emp = employees.find(e => e.id === id);
    return emp ? emp.full_name : 'Unknown';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.card,
      padding: rw(4),
      borderBottomWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backBtn: {
      marginRight: rw(4),
    },
    title: {
      fontSize: rf(2.5),
      fontWeight: '700',
      color: theme.text,
    },
    content: {
      padding: rw(4),
    },
    card: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: rw(4),
      padding: rw(4),
      marginBottom: rh(2),
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      elevation: 2,
    },
    label: {
      color: theme.subtext,
      fontSize: rf(1.8),
      marginBottom: rh(1),
      fontWeight: '500',
    },
    input: {
      backgroundColor: theme.background,
      padding: rw(3),
      borderRadius: rw(3),
      borderWidth: 1,
      borderColor: theme.border,
      fontSize: rf(2),
      color: theme.text,
    },
    inputMultiline: {
      height: rh(15),
      textAlignVertical: 'top',
    },
    errorText: {
      color: '#ef4444',
      fontSize: rf(1.4),
      marginTop: rh(0.5),
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    chip: {
      paddingHorizontal: rw(4),
      paddingVertical: rh(1),
      borderRadius: rw(3),
      borderWidth: 1,
      marginRight: rw(2),
      marginBottom: rh(1),
    },
    chipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    chipInactive: {
      backgroundColor: theme.card,
      borderColor: theme.border,
    },
    chipTextActive: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: rf(1.8),
    },
    chipTextInactive: {
      color: theme.subtext,
      fontWeight: '600',
      fontSize: rf(1.8),
    },
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footer: {
      padding: rw(4),
      backgroundColor: theme.card,
      borderTopWidth: 1,
      borderColor: theme.border,
    },
    primaryBtn: {
      backgroundColor: theme.primary,
      padding: rh(2),
      borderRadius: rw(4),
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      elevation: 2,
    },
    primaryBtnText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: rf(2.2),
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
      maxHeight: rh(70),
      padding: rw(4),
    },
    modalTitle: {
      fontSize: rf(2.2),
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: rh(2),
    },
    modalItem: {
      paddingVertical: rh(1.5),
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalItemText: {
      fontSize: rf(2),
      color: theme.text,
    },
    employeeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: rw(4),
        borderBottomWidth: 1,
    },
    avatar: {
        width: rw(10),
        height: rw(10),
        borderRadius: rw(5),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: rw(3),
    },
    avatarText: {
        fontSize: rf(2),
        fontWeight: 'bold',
    },
    employeeName: {
        fontSize: rf(1.8),
        fontWeight: '600',
    },
    employeeRole: {
        fontSize: rf(1.6),
        marginTop: rh(0.5),
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>New Task</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
            <View style={{ marginBottom: rh(2) }}>
                <Text style={styles.label}>Task Title *</Text>
                <Controller
                  control={control}
                  name="title"
                  render={({ field: { onChange, value } }) => (
                    <TextInput 
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        placeholder="What needs to be done?" 
                        placeholderTextColor={theme.subtext}
                    />
                  )}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
            </View>

            <View style={{ marginBottom: rh(2) }}>
                <Text style={styles.label}>Description</Text>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, value } }) => (
                    <TextInput 
                        style={[styles.input, styles.inputMultiline]}
                        value={value}
                        onChangeText={onChange}
                        multiline 
                        placeholder="Add details..." 
                        placeholderTextColor={theme.subtext}
                        textAlignVertical="top"
                    />
                  )}
                />
            </View>

            <View>
                <Text style={[styles.label, { marginBottom: rh(1) }]}>Priority</Text>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.chipRow}>
                        {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                            <TouchableOpacity 
                                key={p}
                                onPress={() => onChange(p)}
                                style={[
                                  styles.chip,
                                  value === p ? styles.chipActive : styles.chipInactive,
                                ]}
                            >
                                <Text style={value === p ? styles.chipTextActive : styles.chipTextInactive}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                  )}
                />
            </View>
        </View>

        <View style={styles.card}>
            <View style={{ marginBottom: rh(2) }}>
                <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
                <Controller
                  control={control}
                  name="deadline"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity style={[styles.input, styles.fieldRow]}>
                        <TextInput
                            style={{ flex: 1, color: theme.text, fontSize: rf(2) }}
                            value={value}
                            onChangeText={onChange}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={theme.subtext}
                        />
                        <Feather name="calendar" size={20} color={theme.subtext} />
                    </TouchableOpacity>
                  )}
                />
                {errors.deadline && <Text style={styles.errorText}>{errors.deadline.message}</Text>}
            </View>

            <View style={{ marginBottom: rh(2) }}>
                <Text style={styles.label}>Assign To</Text>
                <TouchableOpacity 
                  style={[styles.input, styles.fieldRow]}
                  onPress={() => setShowEmployeeModal(true)}
                >
                    <Text style={{ color: assignedTo ? theme.text : theme.subtext, fontSize: rf(2) }}>
                      {getEmployeeName(assignedTo)}
                    </Text>
                    <Feather name="chevron-down" size={20} color={theme.subtext} />
                </TouchableOpacity>
            </View>

            <View style={{ marginBottom: rh(2) }}>
                <Text style={styles.label}>Budget Required</Text>
                <Controller
                  control={control}
                  name="budget_required"
                  render={({ field: { onChange, value } }) => (
                    <TextInput 
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        placeholder="0.00" 
                        placeholderTextColor={theme.subtext}
                        keyboardType="numeric"
                    />
                  )}
                />
                {errors.budget_required && <Text style={styles.errorText}>{errors.budget_required.message}</Text>}
            </View>
            
            <View>
                <Text style={styles.label}>Materials Needed</Text>
                <Controller
                  control={control}
                  name="materials_needed"
                  render={({ field: { onChange, value } }) => (
                    <TextInput 
                        style={[styles.input, { height: rh(8) }]}
                        value={value}
                        onChangeText={onChange}
                        multiline
                        placeholder="List items..." 
                        placeholderTextColor={theme.subtext}
                    />
                  )}
                />
            </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Task</Text>
            )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showEmployeeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEmployeeModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Employee</Text>
            <FlatList
              data={employees}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.employeeItem,
                    { borderBottomColor: theme.border }
                  ]}
                  onPress={() => {
                    setValue('assigned_to', item.id);
                    setShowEmployeeModal(false);
                  }}
                >
                  <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {item.full_name?.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.employeeName, { color: theme.text }]}>
                      {item.full_name}
                    </Text>
                    <Text style={[styles.employeeRole, { color: theme.subtext }]}>
                      {item.role}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
