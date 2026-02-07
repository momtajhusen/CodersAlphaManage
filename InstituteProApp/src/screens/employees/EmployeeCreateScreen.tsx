import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import employeeService from '../../services/employeeService';
import Header from '../../components/Header';

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
  attendance_mode: z.enum(['direct_status', 'time_based']),
  preferred_shift: z.enum(['day', 'night', 'both']),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeCreateScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: 'Teacher',
      salary_type: 'Fixed',
      monthly_salary: '0',
      profit_share_percentage: '0',
      join_date: new Date().toISOString().split('T')[0],
      attendance_mode: 'direct_status',
      preferred_shift: 'day',
    }
  });

  const selectedRole = watch('role');
  const selectedSalaryType = watch('salary_type');
  const selectedAttendanceMode = watch('attendance_mode');
  const selectedPreferredShift = watch('preferred_shift');

  const onSubmit = async (data: EmployeeFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        profit_share_percentage: (data.salary_type === 'Share Profit' && data.profit_share_percentage) 
          ? data.profit_share_percentage 
          : null,
      };
      await employeeService.createEmployee(payload);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Employee created successfully',
      });
      navigation.goBack();
    } catch (error: any) {
        console.error(error);
        const message = error.response?.data?.message || 'Failed to create employee';
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: message,
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Add New Employee" showBack />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Details</Text>
            
            {/* Full Name */}
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
                {errors.full_name && <Text style={{ color: theme.error, fontSize: rf(1.5), marginTop: rh(0.5) }}>{errors.full_name.message}</Text>}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Email</Text>
                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput 
                            style={[styles.input, { backgroundColor: theme.secondary, borderColor: errors.email ? theme.error : theme.border, color: theme.text }]} 
                            placeholder="e.g. raj@gmail.com" 
                            keyboardType="email-address" 
                            placeholderTextColor={theme.subtext}
                            autoCapitalize="none"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
                {errors.email && <Text style={{ color: theme.error, fontSize: rf(1.5), marginTop: rh(0.5) }}>{errors.email.message}</Text>}
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Mobile Number</Text>
                <Controller
                    control={control}
                    name="mobile_number"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput 
                            style={[styles.input, { backgroundColor: theme.secondary, borderColor: errors.mobile_number ? theme.error : theme.border, color: theme.text }]} 
                            placeholder="+977 98765 43210" 
                            keyboardType="phone-pad" 
                            placeholderTextColor={theme.subtext}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
                {errors.mobile_number && <Text style={{ color: theme.error, fontSize: rf(1.5), marginTop: rh(0.5) }}>{errors.mobile_number.message}</Text>}
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Address</Text>
                <Controller
                    control={control}
                    name="address"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput 
                            style={[styles.input, { backgroundColor: theme.secondary, borderColor: theme.border, color: theme.text }]} 
                            placeholder="e.g. 123 Main St, City" 
                            placeholderTextColor={theme.subtext}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
            </View>

            {/* Join Date */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Join Date</Text>
                <Controller
                    control={control}
                    name="join_date"
                    render={({ field: { onChange, value } }) => (
                        <View>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                <View pointerEvents="none">
                                    <TextInput 
                                        style={[styles.input, { backgroundColor: theme.secondary, borderColor: errors.join_date ? theme.error : theme.border, color: theme.text }]} 
                                        placeholder="YYYY-MM-DD" 
                                        placeholderTextColor={theme.subtext}
                                        value={value}
                                        editable={false}
                                    />
                                </View>
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
                {errors.join_date && <Text style={{ color: theme.error, fontSize: rf(1.5), marginTop: rh(0.5) }}>{errors.join_date.message}</Text>}
            </View>

            {/* Role */}
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
                                    backgroundColor: selectedRole === r ? theme.accent : theme.card,
                                    borderColor: theme.border,
                                    borderWidth: selectedRole === r ? 0 : 1
                                }
                            ]}
                        >
                            <Text style={[
                                styles.chipText, 
                                { color: selectedRole === r ? '#FFFFFF' : theme.text }
                            ]}>{r}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Salary & Finance</Text>

            {/* Salary Type */}
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
                                    backgroundColor: selectedSalaryType === t ? theme.accent : theme.card,
                                    borderColor: theme.border,
                                    borderWidth: selectedSalaryType === t ? 0 : 1
                                }
                            ]}
                        >
                            <Text style={[
                                styles.chipText, 
                                { color: selectedSalaryType === t ? '#FFFFFF' : theme.text }
                            ]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Monthly Salary */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.subtext }]}>Monthly Salary</Text>
                <Controller
                    control={control}
                    name="monthly_salary"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput 
                            style={[styles.input, { backgroundColor: theme.secondary, borderColor: errors.monthly_salary ? theme.error : theme.border, color: theme.text }]} 
                            placeholder="e.g. 50000" 
                            keyboardType="numeric" 
                            placeholderTextColor={theme.subtext}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
                {errors.monthly_salary && <Text style={{ color: theme.error, fontSize: rf(1.5), marginTop: rh(0.5) }}>{errors.monthly_salary.message}</Text>}
            </View>

            {/* Profit Share Percentage (Conditional) */}
            {selectedSalaryType === 'Share Profit' && (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.subtext }]}>Profit Share (%)</Text>
                    <Controller
                        control={control}
                        name="profit_share_percentage"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput 
                                style={[styles.input, { backgroundColor: theme.secondary, borderColor: theme.border, color: theme.text }]} 
                                placeholder="e.g. 10" 
                                keyboardType="numeric" 
                                placeholderTextColor={theme.subtext}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                    />
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
                                    backgroundColor: selectedAttendanceMode === mode.value ? theme.accent : theme.card,
                                    borderColor: theme.border,
                                    borderWidth: selectedAttendanceMode === mode.value ? 0 : 1
                                }
                            ]}
                        >
                            <Text style={[
                                styles.chipText, 
                                { color: selectedAttendanceMode === mode.value ? '#FFFFFF' : theme.text }
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
                                    backgroundColor: selectedPreferredShift === shift ? theme.accent : theme.card,
                                    borderColor: theme.border,
                                    borderWidth: selectedPreferredShift === shift ? 0 : 1
                                }
                            ]}
                        >
                            <Text style={[
                                styles.chipText, 
                                { color: selectedPreferredShift === shift ? '#FFFFFF' : theme.text, textTransform: 'capitalize' }
                            ]}>{shift}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.accent, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={styles.submitButtonText}>Create Employee</Text>
            )}
        </TouchableOpacity>
        
        <View style={{ height: rh(5) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: rw(4),
    paddingVertical: rh(2),
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
    padding: rw(4),
    borderRadius: rw(3),
    marginBottom: rh(2),
    borderWidth: 1,
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
    marginBottom: rh(1),
  },
  input: {
    padding: rw(3),
    borderRadius: rw(2),
    fontSize: rf(1.8),
    borderWidth: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rw(2),
  },
  chip: {
    paddingHorizontal: rw(4),
    paddingVertical: rh(1),
    borderRadius: 9999,
  },
  chipText: {
    fontSize: rf(1.6),
    fontWeight: '500',
  },
  submitButton: {
    padding: rh(2),
    borderRadius: rw(3),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rh(2),
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: rf(2),
    fontWeight: 'bold',
  },
});
