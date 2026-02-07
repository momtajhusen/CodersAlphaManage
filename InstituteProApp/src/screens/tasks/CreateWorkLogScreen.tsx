import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator,
  Alert
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
import { createWorkLog } from '../../services/selfLoggedWorkService';

const workLogSchema = z.object({
  work_title: z.string().min(3, 'Title is required (min 3 chars)'),
  description: z.string().min(10, 'Description is required (min 10 chars)'),
  time_spent_hours: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid hours (e.g. 1.5)'),
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

type WorkLogFormData = z.input<typeof workLogSchema>;

const TIME_OPTIONS = [
  { label: '15m', value: '0.25' },
  { label: '30m', value: '0.5' },
  { label: '45m', value: '0.75' },
  { label: '1h', value: '1' },
  { label: '1.5h', value: '1.5' },
  { label: '2h', value: '2' },
  { label: '3h', value: '3' },
  { label: '4h', value: '4' },
  { label: '5h', value: '5' },
  { label: '8h', value: '8' },
];

export default function CreateWorkLogScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<WorkLogFormData>({
    resolver: zodResolver(workLogSchema),
    defaultValues: {
      work_title: '',
      description: '',
      time_spent_hours: '',
      work_date: new Date().toISOString().split('T')[0],
    }
  });

  const onSubmit = async (data: WorkLogFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        time_spent_hours: parseFloat(data.time_spent_hours),
      };
      
      await createWorkLog(payload);
      
      Toast.show({
        type: 'success',
        text1: 'Work Submitted',
        text2: 'Your work has been submitted for verification.',
      });
      navigation.goBack();
    } catch (error: any) {
      console.error('Create work log error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: error.response?.data?.message || 'Could not log work',
      });
    } finally {
      setIsLoading(false);
    }
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
    timeChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: rh(1),
      gap: rw(2),
    },
    timeChip: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: rw(3),
      paddingVertical: rh(0.8),
      borderRadius: rw(4),
      marginBottom: rh(1),
    },
    activeTimeChip: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    timeChipText: {
      color: theme.text,
      fontSize: rf(1.6),
      fontWeight: '500',
    },
    activeTimeChipText: {
      color: '#ffffff',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Log Work</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
            <View style={{ marginBottom: rh(2) }}>
                <Text style={styles.label}>Work Title *</Text>
                <Controller
                  control={control}
                  name="work_title"
                  render={({ field: { onChange, value } }) => (
                    <TextInput 
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        placeholder="What did you work on?" 
                        placeholderTextColor={theme.subtext}
                    />
                  )}
                />
                {errors.work_title && <Text style={styles.errorText}>{errors.work_title.message}</Text>}
            </View>

            <View style={{ marginBottom: rh(2) }}>
                <Text style={styles.label}>Description *</Text>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, value } }) => (
                    <TextInput 
                        style={[styles.input, styles.inputMultiline]}
                        value={value}
                        onChangeText={onChange}
                        multiline 
                        placeholder="Details of work done..." 
                        placeholderTextColor={theme.subtext}
                        textAlignVertical="top"
                    />
                  )}
                />
                {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
            </View>

            <View style={{ marginBottom: rh(2) }}>
                <Text style={styles.label}>Time Spent (Hours) *</Text>
                <Controller
                  control={control}
                  name="time_spent_hours"
                  render={({ field: { onChange, value } }) => (
                    <View>
                        <TextInput 
                            style={styles.input}
                            value={value}
                            onChangeText={onChange}
                            placeholder="e.g. 2.5" 
                            placeholderTextColor={theme.subtext}
                            keyboardType="numeric"
                        />
                        <View style={styles.timeChipsContainer}>
                          {TIME_OPTIONS.map((option) => (
                            <TouchableOpacity
                              key={option.value}
                              style={[
                                styles.timeChip,
                                value === option.value && styles.activeTimeChip
                              ]}
                              onPress={() => setValue('time_spent_hours', option.value, { shouldValidate: true })}
                            >
                              <Text style={[
                                styles.timeChipText,
                                value === option.value && styles.activeTimeChipText
                              ]}>
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                    </View>
                  )}
                />
                {errors.time_spent_hours && <Text style={styles.errorText}>{errors.time_spent_hours.message}</Text>}
            </View>

            <View style={{ marginBottom: rh(2) }}>
                <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
                <Controller
                  control={control}
                  name="work_date"
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
                {errors.work_date && <Text style={styles.errorText}>{errors.work_date.message}</Text>}
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
              <Text style={styles.primaryBtnText}>Submit Work Log</Text>
            )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
