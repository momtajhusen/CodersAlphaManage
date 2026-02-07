import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { createExpense, getExpenseCategories } from '../../services/expenseService';

import { useAuth } from '../../context/AuthContext';

const expenseSchema = z.object({
  title: z.string().min(3, 'Title is required (min 3 chars)'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  payment_method: z.string().default('cash'),
  reference_number: z.string().optional(),
  source: z.enum(['personal', 'float', 'business']).default('personal'),
});

type ExpenseFormData = z.input<typeof expenseSchema>;

export default function CreateExpenseScreen() {
  const navigation = useNavigation();
  const { user, employeeId, refreshUser } = useAuth();
  const { theme, scheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [receipt, setReceipt] = useState<ImagePicker.ImagePickerAsset | null>(null);
  
  // Category State
  const [categories, setCategories] = useState<string[]>(['Salary', 'Rent', 'Electricity Bill', 'Water Bill', 'Maintenance', 'Stationery', 'Miscellaneous', 'Food', 'Travel', 'Repairs']);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Fetch categories on mount
  React.useEffect(() => {
    const fetchCategories = async () => {
        try {
            const res = await getExpenseCategories();
            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                // Merge with defaults, removing duplicates, keeping server order (most used first)
                const defaults = ['Salary', 'Rent', 'Electricity Bill', 'Water Bill', 'Maintenance', 'Stationery', 'Miscellaneous', 'Food', 'Travel', 'Repairs'];
                const merged = [...new Set([...res.data, ...defaults])];
                setCategories(merged);
                
                // Auto-select the first (most used) category if none selected or default
                if (merged.length > 0) {
                    setValue('category', merged[0]);
                }
            }
        } catch (error) {
            console.log('Failed to fetch categories:', error);
        }
    };
    fetchCategories();
  }, []);

  const handleAddCategory = () => {
      if (newCategory.trim()) {
          const cat = newCategory.trim();
          setCategories(prev => [cat, ...prev]); // Add to top temporarily
          setValue('category', cat);
          setNewCategory('');
          setShowAddCategory(false);
      }
  };

  const isSubmitting = useRef(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      category: 'Salary', // Will be updated by useEffect
      source: 'personal',
    }
  });

  const currentSource = watch('source');

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

  const onSubmit = async (data: ExpenseFormData) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    // Check if user has employee record
    // AuthContext structure: { user: User, employee: Employee }
    // We allow user.id as fallback because backend will handle auto-creation
    if (!user) {
         Toast.show({
            type: 'error',
            text1: 'Authentication Error',
            text2: 'User session invalid. Please login again.'
        });
        isSubmitting.current = false;
        return;
    }

    const finalEmployeeId = employeeId || user.employee?.id || user.id || null;

    // if (!employeeId) { ... } // Removed strict check

    setIsLoading(true);
    try {
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        bill_photo: receipt,
        paid_from: data.source === 'personal' ? 'personal_money' : 'institute_float',
        expense_type: data.source === 'personal' ? 'personal' : 'institute',
        expense_date: data.date,
        employee_id: finalEmployeeId,
        description: data.description || data.title, // Fallback description if empty
      };
      
      await createExpense(payload);
      
      Toast.show({
        type: 'success',
        text1: 'Expense Added',
        text2: 'Expense record created successfully',
      });
      navigation.goBack();
    } catch (error: any) {
      console.error('Create expense error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: error.response?.data?.message || 'Could not create expense record',
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
          isSubmitting.current = false;
      }, 1000);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: rw(4),
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      marginRight: rw(3),
    },
    headerTitle: {
      fontSize: rf(2.5),
      fontWeight: 'bold',
      color: theme.text,
    },
    content: {
      padding: rw(4),
    },
    card: {
      backgroundColor: theme.card,
      padding: rw(4),
      borderRadius: rw(3),
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      elevation: 2,
    },
    section: {
        marginBottom: rh(2),
    },
    label: {
      color: theme.subtext,
      marginBottom: rh(1),
      fontWeight: '500',
      fontSize: rf(1.8),
    },
    errorText: {
        color: '#ef4444',
        fontSize: rf(1.6),
        marginTop: rh(0.5),
    },
    sourceContainer: {
        flexDirection: 'row',
        backgroundColor: theme.secondary,
        padding: rw(1),
        borderRadius: rw(2),
    },
    sourceButton: {
        flex: 1,
        paddingVertical: rh(1),
        borderRadius: rw(1.5),
        alignItems: 'center',
    },
    activeSource: {
        backgroundColor: theme.card,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1.5,
        borderColor: theme.accent,
    },
    sourceText: {
        fontWeight: '500',
        fontSize: rf(1.8),
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: rw(4),
    },
    categoryChip: {
        backgroundColor: theme.secondary,
        paddingHorizontal: rw(3),
        paddingVertical: rh(0),
        borderRadius: 100, // Pill shape
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom:2,
    },
    activeCategoryChip: {
        backgroundColor: theme.card,
        borderColor: theme.accent,
        borderWidth: 1.5,
    },
    categoryText: {
        color: theme.subtext,
        fontSize: rf(1.6),
        fontWeight: '500',
    },
    activeCategoryText: {
        color: theme.accent,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: theme.secondary,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: rw(2),
        padding: rw(3),
        fontSize: rf(2),
        color: theme.text,
    },
    textArea: {
        height: rh(15),
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: scheme === 'dark' ? '#b91c1c' : '#dc2626', // red-700 / red-600
        paddingVertical: rh(1.8),
        borderRadius: rw(3),
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        width: '100%',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: rf(2.2),
    },
    receiptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.secondary,
        padding: rw(3),
        borderRadius: rw(2),
        borderWidth: 1,
        borderColor: theme.border,
        borderStyle: 'dashed',
    },
    receiptPreview: {
        width: '100%',
        height: rh(20),
        borderRadius: rw(2),
        marginTop: rh(1),
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={rf(3)} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
            
            <View style={styles.section}>
                <Text style={styles.label}>Paid From</Text>
                <Controller
                    control={control}
                    name="source"
                    render={({ field: { onChange, value } }) => (
                        <View style={styles.sourceContainer}>
                            <TouchableOpacity 
                                style={[styles.sourceButton, value === 'personal' && styles.activeSource]}
                                onPress={() => onChange('personal')}
                            >
                                <Text style={[
                                    styles.sourceText, 
                                    { color: value === 'personal' ? theme.text : theme.subtext }
                                ]}>My Money</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.sourceButton, value === 'float' && styles.activeSource]}
                                onPress={() => onChange('float')}
                            >
                                <Text style={[
                                    styles.sourceText, 
                                    { color: value === 'float' ? theme.text : theme.subtext }
                                ]}>Office Cash</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Title</Text>
                <Controller
                    control={control}
                    name="title"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Lunch"
                            placeholderTextColor={theme.subtext}
                            value={value}
                            onChangeText={onChange}
                        />
                    )}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
            </View>

            <View style={styles.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rh(1) }}>
                    <Text style={[styles.label, { marginBottom: 0 }]}>Category</Text>
                    <TouchableOpacity onPress={() => setShowAddCategory(!showAddCategory)}>
                         <Text style={{ color: theme.accent, fontSize: rf(1.6), fontWeight: '500'}}>
                            {showAddCategory ? 'Cancel' : '+ Add New'}
                         </Text>
                    </TouchableOpacity>
                </View>

                {showAddCategory && (
                    <View style={{ flexDirection: 'row', marginBottom: rh(1.5), gap: rw(2) }}>
                        <TextInput 
                            style={[styles.input, { flex: 1, paddingVertical: rh(1) }]}
                            placeholder="New Category Name"
                            placeholderTextColor={theme.subtext}
                            value={newCategory}
                            onChangeText={setNewCategory}
                            autoFocus
                        />
                        <TouchableOpacity 
                            style={{ 
                                backgroundColor: theme.primary, 
                                justifyContent: 'center', 
                                paddingHorizontal: rw(4), 
                                borderRadius: rw(2) 
                            }}
                            onPress={handleAddCategory}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Add</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Controller
                    control={control}
                    name="category"
                    render={({ field: { onChange, value } }) => (
                        <View style={{ marginBottom: rh(2) }}>
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingRight: rw(4) }}
                            >
                                <View style={{ 
                                    flexDirection: 'column', 
                                    flexWrap: 'wrap', 
                                    height: rh(10), 
                                    justifyContent: 'center',
                                    gap: rh(1) 
                                }}>
                                    {categories.map((cat) => (
                                        <TouchableOpacity 
                                            key={cat} 
                                            style={[
                                                styles.categoryChip,
                                                value === cat && styles.activeCategoryChip,
                                                { marginRight: rw(2) }
                                            ]}
                                            onPress={() => onChange(cat)}
                                        >
                                            <Text style={[
                                                styles.categoryText,
                                                value === cat && styles.activeCategoryText
                                            ]}>{cat}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    )}
                />
                {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Amount</Text>
                <Controller
                    control={control}
                    name="amount"
                    render={({ field: { onChange, value } }) => (
                        <TextInput 
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor={theme.subtext}
                            keyboardType="numeric"
                            value={value}
                            onChangeText={onChange}
                        />
                    )}
                />
                {errors.amount && <Text style={styles.errorText}>{errors.amount.message}</Text>}
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                <Controller
                    control={control}
                    name="date"
                    render={({ field: { onChange, value } }) => (
                        <TextInput 
                            style={styles.input}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={theme.subtext}
                            value={value}
                            onChangeText={onChange}
                        />
                    )}
                />
                {errors.date && <Text style={styles.errorText}>{errors.date.message}</Text>}
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Description</Text>
                <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, value } }) => (
                        <TextInput 
                            style={[styles.input, styles.textArea]}
                            placeholder="What was this for?"
                            placeholderTextColor={theme.subtext}
                            multiline
                            value={value}
                            onChangeText={onChange}
                        />
                    )}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Receipt (Optional)</Text>
                <TouchableOpacity style={styles.receiptButton} onPress={pickImage}>
                    <Feather name="camera" size={rf(2.5)} color={theme.text} style={{ marginRight: rw(2) }} />
                    <Text style={{ color: theme.text }}>{receipt ? 'Change Receipt' : 'Upload Receipt'}</Text>
                </TouchableOpacity>
                {receipt && (
                    <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} resizeMode="cover" />
                )}
            </View>

            <TouchableOpacity 
                style={[styles.saveButton, { marginTop: rh(2) }, isLoading && { opacity: 0.7 }]} 
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <Text style={styles.saveButtonText}>Save Expense</Text>
                )}
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}