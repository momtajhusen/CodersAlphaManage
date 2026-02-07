import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import employeeService from '../../services/employeeService';
import Header from '../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';

const employeeSchema = z.object({
  full_name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  mobile_number: z.string().min(10, 'Mobile number must be at least 10 digits'),
  role: z.string(),
  salary_type: z.enum(['Fixed', 'Share Profit']),
  monthly_salary: z.string().min(1, 'Salary is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid salary amount'),
  profit_share_percentage: z.string().optional(),
  address: z.string().optional(),
  join_date: z.string(),
  status: z.enum(['active', 'inactive', 'suspended']),
  attendance_mode: z.enum(['direct_status', 'time_based']),
  preferred_shift: z.enum(['day', 'night', 'both']),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeEditScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params;
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: 'Teacher',
      salary_type: 'Fixed',
      status: 'active',
      attendance_mode: 'direct_status',
      preferred_shift: 'day',
    }
  });

  const selectedRole = watch('role');
  const selectedSalaryType = watch('salary_type');
  const selectedStatus = watch('status');
  const selectedAttendanceMode = watch('attendance_mode');
  const selectedPreferredShift = watch('preferred_shift');

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await employeeService.getEmployee(id);
        const employee = response.data || response;
        
        reset({
          full_name: employee.full_name || '',
          email: employee.email || '',
          mobile_number: String(employee.mobile_number || ''),
          role: employee.role || 'Teacher',
          salary_type: employee.salary_type || 'Fixed',
          monthly_salary: String(employee.monthly_salary || ''),
          profit_share_percentage: employee.profit_share_percentage ? String(employee.profit_share_percentage) : undefined,
          address: String(employee.address || ''),
          join_date: employee.join_date ? employee.join_date.split('T')[0] : new Date().toISOString().split('T')[0],
          status: employee.status || 'active',
          attendance_mode: employee.attendance_mode || 'direct_status',
          preferred_shift: employee.preferred_shift || 'day',
        });
      } catch (error) {
        console.error('Failed to fetch employee details', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch employee details',
        });
        navigation.goBack();
      } finally {
        setFetching(false);
      }
    };

    fetchEmployee();
  }, [id, reset, navigation]);

  const onSubmit = async (data: EmployeeFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        profit_share_percentage: data.profit_share_percentage || null,
      };
      await employeeService.updateEmployee(id, payload);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Employee updated successfully',
      });
      navigation.goBack();
    } catch (error: any) {
        console.error(error);
        const message = error.response?.data?.message || 'Failed to update employee';
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: message,
        });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Edit Employee" showBack />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Details</Text>
            
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Full Name</Text>
                <Controller
                    control={control}
                    name="full_name"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput 
                          style={[styles.input, { backgroundColor: theme.secondary, borderColor: errors.full_name ? theme.error : theme.border, color: theme.text }]} 
                          placeholder="e.g. Raj Kumar" 
                          placeholderTextColor={theme.subtext}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                    )}
                />
                {errors.full_name && <Text style={[styles.errorText, { color: theme.error }]}>{errors.full_name.message}</Text>}
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Email</Text>
                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput 
                          style={[styles.input, { backgroundColor: theme.secondary, borderColor: errors.email ? theme.error : theme.border, color: theme.text }]} 
                          placeholder="e.g. raj@gmail.com" 
                          placeholderTextColor={theme.subtext}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                    )}
                />
                {errors.email && <Text style={[styles.errorText, { color: theme.error }]}>{errors.email.message}</Text>}
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Mobile Number</Text>
                <Controller
                    control={control}
                    name="mobile_number"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput 
                          style={[styles.input, { backgroundColor: theme.secondary, borderColor: errors.mobile_number ? theme.error : theme.border, color: theme.text }]} 
                          placeholder="e.g. 9876543210" 
                          placeholderTextColor={theme.subtext}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          keyboardType="phone-pad"
                        />
                    )}
                />
                {errors.mobile_number && <Text style={[styles.errorText, { color: theme.error }]}>{errors.mobile_number.message}</Text>}
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Join Date</Text>
                <Controller
                    control={control}
                    name="join_date"
                    render={({ field: { onChange, value } }) => (
                        <View>
                            <TouchableOpacity 
                                onPress={() => setShowDatePicker(true)}
                                style={[styles.input, { 
                                    backgroundColor: theme.secondary, 
                                    borderColor: errors.join_date ? theme.error : theme.border,
                                    justifyContent: 'center'
                                }]}
                            >
                                <Text style={{ color: value ? theme.text : theme.subtext }}>
                                    {value ? value : 'Select Date'}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={value ? new Date(value) : new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            const formattedDate = selectedDate.toISOString().split('T')[0];
                                            onChange(formattedDate);
                                        }
                                    }}
                                />
                            )}
                        </View>
                    )}
                />
                {errors.join_date && <Text style={[styles.errorText, { color: theme.error }]}>{errors.join_date.message}</Text>}
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Address</Text>
                <Controller
                    control={control}
                    name="address"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput 
                          style={[styles.input, { backgroundColor: theme.secondary, borderColor: errors.address ? theme.error : theme.border, color: theme.text }]} 
                          placeholder="e.g. 123 Main St, City" 
                          placeholderTextColor={theme.subtext}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          multiline
                        />
                    )}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Role</Text>
                <View style={styles.chipContainer}>
                    {['Teacher', 'Staff', 'Admin', 'Driver', 'Partner'].map((r) => (
                        <TouchableOpacity 
                            key={r}
                            onPress={() => setValue('role', r)}
                            style={[
                                styles.chip, 
                                { 
                                    backgroundColor: selectedRole === r ? theme.accent : theme.secondary,
                                }
                            ]}
                        >
                            <Text style={[
                                styles.chipText, 
                                { color: selectedRole === r ? '#FFFFFF' : theme.subtext }
                            ]}>{r}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
             <Text style={[styles.sectionTitle, { color: theme.text }]}>Salary Details</Text>
             
             <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Salary Type</Text>
                <View style={styles.chipContainer}>
                    {['Fixed', 'Share Profit'].map((t) => (
                        <TouchableOpacity 
                            key={t}
                            onPress={() => setValue('salary_type', t as any)}
                            style={[
                                styles.chip, 
                                { 
                                    backgroundColor: selectedSalaryType === t ? theme.accent : theme.secondary,
                                }
                            ]}
                        >
                            <Text style={[
                                styles.chipText, 
                                { color: selectedSalaryType === t ? '#FFFFFF' : theme.subtext }
                            ]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Monthly Salary</Text>
                <Controller
                    control={control}
                    name="monthly_salary"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput 
                          style={[styles.input, { backgroundColor: theme.secondary, borderColor: errors.monthly_salary ? theme.error : theme.border, color: theme.text }]} 
                          placeholder="e.g. 15000" 
                          placeholderTextColor={theme.subtext}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          keyboardType="numeric"
                        />
                    )}
                />
                {errors.monthly_salary && <Text style={[styles.errorText, { color: theme.error }]}>{errors.monthly_salary.message}</Text>}
            </View>

            {selectedSalaryType === 'Share Profit' && (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.subtext }]}>Profit Share Percentage</Text>
                    <Controller
                        control={control}
                        name="profit_share_percentage"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput 
                              style={[styles.input, { backgroundColor: theme.secondary, borderColor: errors.profit_share_percentage ? theme.error : theme.border, color: theme.text }]} 
                              placeholder="e.g. 5" 
                              placeholderTextColor={theme.subtext}
                              onBlur={onBlur}
                              onChangeText={onChange}
                              value={value}
                              keyboardType="numeric"
                            />
                        )}
                    />
                    {errors.profit_share_percentage && <Text style={[styles.errorText, { color: theme.error }]}>{errors.profit_share_percentage.message}</Text>}
                </View>
            )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
             <Text style={[styles.sectionTitle, { color: theme.text }]}>Attendance Settings</Text>
             
             {/* Attendance Mode */}
             <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Marking Mode</Text>
                <View style={styles.chipContainer}>
                    {[
                        { label: 'Direct Status (P/A)', value: 'direct_status' },
                        { label: 'Time Based', value: 'time_based' }
                    ].map((mode) => (
                        <TouchableOpacity 
                            key={mode.value}
                            onPress={() => setValue('attendance_mode', mode.value as any)}
                            style={[
                                styles.chip, 
                                { 
                                    backgroundColor: selectedAttendanceMode === mode.value ? theme.accent : theme.secondary,
                                }
                            ]}
                        >
                            <Text style={[
                                styles.chipText, 
                                { color: selectedAttendanceMode === mode.value ? '#FFFFFF' : theme.subtext }
                            ]}>{mode.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Preferred Shift */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Preferred Shift</Text>
                <View style={styles.chipContainer}>
                    {['day', 'night', 'both'].map((shift) => (
                        <TouchableOpacity 
                            key={shift}
                            onPress={() => setValue('preferred_shift', shift as any)}
                            style={[
                                styles.chip, 
                                { 
                                    backgroundColor: selectedPreferredShift === shift ? theme.accent : theme.secondary,
                                }
                            ]}
                        >
                            <Text style={[
                                styles.chipText, 
                                { color: selectedPreferredShift === shift ? '#FFFFFF' : theme.subtext, textTransform: 'capitalize' }
                            ]}>{shift}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: rh(2) }]}>
             <Text style={[styles.sectionTitle, { color: theme.text }]}>Status</Text>
             <View style={styles.chipContainer}>
                {['active', 'inactive', 'suspended'].map((s) => (
                    <TouchableOpacity 
                        key={s}
                        onPress={() => setValue('status', s as any)}
                        style={[
                            styles.chip, 
                            { 
                                backgroundColor: selectedStatus === s ? theme.accent : theme.secondary,
                            }
                        ]}
                    >
                        <Text style={[
                            styles.chipText, 
                            { color: selectedStatus === s ? '#FFFFFF' : theme.subtext, textTransform: 'capitalize' }
                        ]}>{s}</Text>
                    </TouchableOpacity>
                ))}
             </View>
        </View>

        <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: theme.accent, opacity: loading ? 0.7 : 1, marginBottom: rh(4) }]} 
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={[styles.createButtonText, { color: '#FFFFFF' }]}>Update Employee</Text>
            )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: rw(4),
    paddingBottom: rh(2),
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: rw(4),
  },
  headerTitle: {
    fontSize: rf(2.5),
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: rw(4),
  },
  card: {
    borderRadius: rw(3),
    padding: rw(4),
    marginBottom: rh(2),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: rf(2),
    fontWeight: 'bold',
    marginBottom: rh(2),
  },
  inputGroup: {
    marginBottom: rh(2),
  },
  label: {
    fontSize: rf(1.6),
    marginBottom: rh(0.5),
  },
  input: {
    padding: rw(3),
    borderRadius: rw(2),
    borderWidth: 1,
    fontSize: rf(1.8),
  },
  errorText: {
    fontSize: rf(1.4),
    marginTop: rh(0.5),
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rw(2),
  },
  chip: {
    paddingHorizontal: rw(4),
    paddingVertical: rh(1),
    borderRadius: rw(2),
  },
  chipText: {
    fontWeight: '500',
    fontSize: rf(1.8),
  },
  createButton: {
    padding: rh(2),
    borderRadius: rw(3),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  createButtonText: {
    fontSize: rf(2.2),
    fontWeight: 'bold',
  },
});

