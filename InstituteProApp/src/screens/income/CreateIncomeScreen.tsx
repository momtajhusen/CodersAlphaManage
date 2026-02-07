import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { createIncome } from '../../services/incomeService';
import { getEmployees } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';

// Simplified Schema matching backend requirements
const incomeSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Enter a valid amount'),
  income_date: z.string(),
  payment_method: z.string(),
  description: z.string().optional(), // We'll provide default if empty
  source_type: z.string(),
  income_type: z.string(),
  contributor_id: z.number().optional(),
  held_by_id: z.number().optional(),
  category: z.string().default('General'),
});

type IncomeFormData = z.input<typeof incomeSchema>;

export default function CreateIncomeScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, employeeId, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [receipt, setReceipt] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Modals & Pickers
  const [showContributorModal, setShowContributorModal] = useState(false);
  const [showHeldByModal, setShowHeldByModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      income_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      category: 'Course Fee',
      source_type: 'institute',
      income_type: 'course_fee',
      title: '',
      contributor_id: employeeId ? Number(employeeId) : undefined,
      held_by_id: employeeId ? Number(employeeId) : undefined,
      description: '',
    }
  });

  const sourceType = watch('source_type');
  const paymentMethod = watch('payment_method');
  const contributorId = watch('contributor_id');
  const heldById = watch('held_by_id');
  const dateValue = watch('income_date');

  const categories = sourceType === 'institute' 
    ? ['Course Fee', 'Registration', 'Product Sale', 'Other'] 
    : ['Salary', 'Project', 'Personal Work', 'Freelancing'];

  useEffect(() => {
      // Set default category when source type changes
      if (sourceType === 'institute') {
          setValue('category', 'Course Fee');
          setValue('income_type', 'course_fee');
      } else {
          setValue('category', 'Project');
          setValue('income_type', 'personal_work');
      }
  }, [sourceType]);

  const handleCategorySelect = (cat: string) => {
      setValue('category', cat);
      // Map to backend types
      let type = 'other';
      if (sourceType === 'institute') {
          if (cat === 'Course Fee') type = 'course_fee';
          else if (cat === 'Registration' || cat === 'Product Sale') type = 'course_fee'; // Map to closest or 'other'
          else type = 'other';
      } else {
          if (cat === 'Salary') type = 'salary';
          else if (cat === 'Project' || cat === 'Personal Work' || cat === 'Freelancing') type = 'personal_work';
          else type = 'other';
      }
      setValue('income_type', type);
  };


  const loadEmployees = async () => {
    try {
      const response = await getEmployees({ per_page: 100, status: 'active' });
      setEmployees(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load employees', error);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setReceipt(result.assets[0]);
    }
  };

  useEffect(() => {
    // Auto-select current user if not selected
    if (employeeId) {
        const id = Number(employeeId);
        const currentContributor = watch('contributor_id');
        const currentHeldBy = watch('held_by_id');
        
        if (!currentContributor) setValue('contributor_id', id);
        if (!currentHeldBy) setValue('held_by_id', id);
    }
  }, [employeeId]);

  const onSubmit = async (data: IncomeFormData) => {
    // Removed strict employee check to allow backend to handle auto-creation or user-based tracking
    // if (!user?.employee?.id) { ... }

    setIsLoading(true);
    try {
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        receipt: receipt,
        // Send employee_id if available, otherwise backend handles it (or uses null)
        employee_id: employeeId || user?.employee?.id || null, 
        description: data.description || 'No description provided',
        // Clean up optional fields based on type
        contributor_id: data.source_type === 'personal_project' ? data.contributor_id : null,
        held_by_id: data.payment_method === 'cash' ? data.held_by_id : null,
      };
      
      console.log('Submitting payload:', payload);

      await createIncome(payload);
      
      Toast.show({
        type: 'success',
        text1: 'Income Added',
        text2: 'Income record created successfully',
      });
      navigation.goBack();
    } catch (error: any) {
      console.error('Create income error:', error.response?.data || error);
      const errorMessage = error.response?.data?.message || 'Could not create income record';
      
      // Check for specific validation errors
      if (error.response?.data?.errors) {
          const validationErrors = Object.values(error.response.data.errors).flat().join('\n');
          Alert.alert('Validation Error', validationErrors);
      } else {
          Alert.alert('Error', errorMessage);
      }
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
    content: {
      flex: 1,
      padding: rw(4),
    },
    sectionTitle: {
      fontSize: rf(1.8),
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: rh(1.5),
      marginTop: rh(1),
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: rw(3),
      padding: rw(4),
      marginBottom: rh(2),
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    amountContainer: {
        alignItems: 'center',
        marginBottom: rh(2),
    },
    currencySymbol: {
        fontSize: rf(3),
        color: theme.primary,
        fontWeight: 'bold',
        marginRight: rw(1),
    },
    amountInput: {
        fontSize: rf(4.5),
        fontWeight: 'bold',
        color: theme.text,
        textAlign: 'center',
        minWidth: rw(30),
        padding: 0,
    },
    inputLabel: {
        fontSize: rf(1.6),
        color: theme.subtext,
        marginBottom: rh(0.8),
    },
    textInput: {
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        paddingVertical: rh(1),
        fontSize: rf(2),
        color: theme.text,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: rw(2),
    },
    chip: {
        paddingHorizontal: rw(3),
        paddingVertical: rh(1),
        borderRadius: rw(4),
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
    },
    activeChip: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    chipText: {
        fontSize: rf(1.6),
        color: theme.subtext,
    },
    activeChipText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rh(2),
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        padding: rw(2),
        borderRadius: rw(2),
        borderWidth: 1,
        borderColor: theme.border,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: theme.subtext,
        borderRadius: rw(2),
        padding: rh(2),
        marginTop: rh(1),
    },
    submitButton: {
        backgroundColor: theme.primary,
        paddingVertical: rh(1.8),
        borderRadius: rw(3),
        alignItems: 'center',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        width: '100%',
    },
    footer: {
        padding: rw(4),
        backgroundColor: theme.card,
        borderTopWidth: 1,
        borderColor: theme.border,
    },
    submitText: {
        color: '#fff',
        fontSize: rf(2.2),
        fontWeight: 'bold',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: rh(1.5),
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
  });

  return (
    <View style={styles.container}>
      <Header title="Add Income" showBack />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Main Amount Card */}
        <View style={styles.card}>
            <View style={styles.amountContainer}>
                <Text style={{color: theme.subtext, marginBottom: rh(1)}}>Enter Amount</Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Controller
                        control={control}
                        name="amount"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={styles.amountInput}
                                placeholder="0"
                                placeholderTextColor={theme.border}
                                keyboardType="numeric"
                                value={value}
                                onChangeText={onChange}
                                autoFocus
                            />
                        )}
                    />
                </View>
            </View>

            <Controller
                control={control}
                name="title"
                render={({ field: { onChange, value } }) => (
                    <View>
                        <Text style={styles.inputLabel}>Title</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="What is this income for?"
                            placeholderTextColor={theme.subtext}
                            value={value}
                            onChangeText={onChange}
                        />
                         {errors.title && <Text style={{color: 'red', fontSize: rf(1.4)}}>{errors.title.message}</Text>}
                    </View>
                )}
            />
        </View>

        {/* Details Card */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.row}>
                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                    <Feather name="calendar" size={16} color={theme.text} style={{marginRight: 8}} />
                    <Text style={{color: theme.text}}>{dateValue}</Text>
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={new Date(dateValue)}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            setValue('income_date', selectedDate.toISOString().split('T')[0]);
                        }
                    }}
                />
            )}

            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.chipContainer}>
                {['cash', 'bank_transfer', 'online'].map((method) => (
                    <TouchableOpacity
                        key={method}
                        style={[styles.chip, paymentMethod === method && styles.activeChip]}
                        onPress={() => setValue('payment_method', method)}
                    >
                        <Text style={[styles.chipText, paymentMethod === method && styles.activeChipText]}>
                            {method.replace('_', ' ').toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {paymentMethod === 'cash' && (
                <View style={{marginTop: rh(2)}}>
                    <Text style={styles.inputLabel}>Received By (Cash Holder)</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowHeldByModal(true)}>
                        <Text style={{color: theme.text, fontSize: rf(1.8)}}>{getEmployeeName(heldById)}</Text>
                        <Feather name="chevron-down" size={20} color={theme.subtext} />
                    </TouchableOpacity>
                </View>
            )}
        </View>

        {/* Source / Type (Collapsed/Simplified) */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Classification</Text>
            
            <View style={{marginBottom: rh(2)}}>
                <Text style={styles.inputLabel}>Source</Text>
                <View style={styles.chipContainer}>
                    <TouchableOpacity
                        style={[styles.chip, sourceType === 'institute' && styles.activeChip]}
                        onPress={() => setValue('source_type', 'institute')}
                    >
                        <Text style={[styles.chipText, sourceType === 'institute' && styles.activeChipText]}>Institute</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.chip, sourceType === 'personal_project' && styles.activeChip]}
                        onPress={() => setValue('source_type', 'personal_project')}
                    >
                        <Text style={[styles.chipText, sourceType === 'personal_project' && styles.activeChipText]}>Personal Project</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {sourceType === 'personal_project' && (
                <View style={{marginBottom: rh(2)}}>
                    <Text style={styles.inputLabel}>Contributor</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowContributorModal(true)}>
                        <Text style={{color: theme.text, fontSize: rf(1.8)}}>{getEmployeeName(contributorId)}</Text>
                        <Feather name="chevron-down" size={20} color={theme.subtext} />
                    </TouchableOpacity>
                </View>
            )}
            
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: rw(2)}}>
                 {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.chip, watch('category') === cat && styles.activeChip]}
                        onPress={() => handleCategorySelect(cat)}
                    >
                        <Text style={[styles.chipText, watch('category') === cat && styles.activeChipText]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                 ))}
            </ScrollView>
        </View>

        {/* Additional Info */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Optional</Text>
            <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        style={[styles.textInput, { height: rh(8), textAlignVertical: 'top' }]}
                        placeholder="Add a note..."
                        placeholderTextColor={theme.subtext}
                        multiline
                        value={value}
                        onChangeText={onChange}
                    />
                )}
            />

            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                {receipt ? (
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                         <Feather name="check-circle" size={20} color="green" style={{marginRight: 8}} />
                         <Text style={{color: theme.text}}>Receipt Selected</Text>
                         <TouchableOpacity onPress={() => setReceipt(null)} style={{marginLeft: 10}}>
                             <Feather name="x" size={18} color="red" />
                         </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <Feather name="camera" size={20} color={theme.subtext} style={{marginRight: 8}} />
                        <Text style={{color: theme.subtext}}>Attach Receipt</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, isLoading && { opacity: 0.7 }]} 
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Save Income</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Employee Modal Reuse */}
      <Modal visible={showContributorModal || showHeldByModal} transparent animationType="fade">
          <TouchableOpacity 
            style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: rw(5)}} 
            activeOpacity={1} 
            onPress={() => {
                setShowContributorModal(false);
                setShowHeldByModal(false);
            }}
          >
              <View style={{backgroundColor: theme.card, borderRadius: rw(3), maxHeight: '80%', padding: rw(2)}}>
                  <Text style={{ fontSize: rf(2), fontWeight: 'bold', color: theme.text, padding: rw(4) }}>Select Employee</Text>
                  <FlatList
                      data={employees}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => (
                          <TouchableOpacity 
                              style={{padding: rw(4), borderBottomWidth: 1, borderBottomColor: theme.border}}
                              onPress={() => {
                                  if (showContributorModal) setValue('contributor_id', item.id);
                                  if (showHeldByModal) setValue('held_by_id', item.id);
                                  setShowContributorModal(false);
                                  setShowHeldByModal(false);
                              }}
                          >
                              <Text style={{color: theme.text, fontSize: rf(1.8)}}>{item.full_name} ({item.role})</Text>
                          </TouchableOpacity>
                      )}
                  />
                  <TouchableOpacity 
                    onPress={() => {
                        setShowContributorModal(false);
                        setShowHeldByModal(false);
                    }} 
                    style={{marginTop: rh(2), alignItems: 'center', padding: rw(3)}}
                  >
                      <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Close</Text>
                  </TouchableOpacity>
              </View>
          </TouchableOpacity>
      </Modal>

    </View>
  );
}
