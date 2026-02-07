import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Image, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { getExpense, deleteExpense, approveExpense, rejectExpense, reimburseExpense, Expense } from '../../services/expenseService';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';

export default function ExpenseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params || { id: 0 };
  const { theme, scheme } = useTheme();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpense = async () => {
    setIsLoading(true);
    try {
        const response = await getExpense(id);
        setExpense(response.data);
    } catch (error) {
        console.error('Fetch expense error:', error);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to fetch expense details',
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
        fetchExpense();
    }
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this record?', [
        { text: 'Cancel', style: 'cancel' },
        { 
            text: 'Delete', 
            style: 'destructive', 
            onPress: async () => {
                try {
                    await deleteExpense(id);
                    Toast.show({ type: 'success', text1: 'Deleted', text2: 'Expense deleted successfully' });
                    navigation.goBack();
                } catch (error) {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete expense' });
                }
            }
        }
    ]);
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected' | 'reimbursed') => {
    try {
        if (status === 'approved') {
            await approveExpense(id);
        } else if (status === 'rejected') {
            await rejectExpense(id);
        } else if (status === 'reimbursed') {
            await reimburseExpense(id);
        }
        
        Toast.show({ type: 'success', text1: 'Updated', text2: `Expense marked as ${status}` });
        fetchExpense();
    } catch (error) {
        Toast.show({ type: 'error', text1: 'Error', text2: `Failed to update status` });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'approved': return '#16a34a'; // green
        case 'reimbursed': return '#0891b2'; // cyan
        case 'rejected': return '#dc2626'; // red
        default: return '#ca8a04'; // yellow
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: expense?.expense_type === 'institute' 
        ? (scheme === 'dark' ? '#b91c1c' : '#dc2626') // Red
        : (scheme === 'dark' ? '#ea580c' : '#f97316'), // Orange
      padding: rw(4),
      paddingTop: rh(1),
      paddingBottom: rh(4),
      borderBottomLeftRadius: rw(8),
      borderBottomRightRadius: rw(8),
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: rh(2),
      justifyContent: 'space-between',
    },
    backButton: {
      padding: rw(1),
    },
    headerTitle: {
      fontSize: rf(2.5),
      fontWeight: 'bold',
      color: '#ffffff',
      flex: 1,
      marginLeft: rw(4),
    },
    amountContainer: {
      alignItems: 'center',
      marginTop: rh(1),
    },
    amountLabel: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: rf(1.5),
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    amount: {
      fontSize: rf(4.5),
      fontWeight: 'bold',
      color: '#ffffff',
      marginVertical: rh(0.5),
    },
    statusBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: rw(3),
      paddingVertical: rh(0.5),
      borderRadius: rw(10),
      marginTop: rh(1),
    },
    statusText: {
      color: '#ffffff',
      fontSize: rf(1.5),
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    contentContainer: {
      padding: rw(4),
      marginTop: -rh(2),
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: rw(3),
      padding: rw(4),
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      elevation: 2,
    },
    row: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: rh(2),
      marginBottom: rh(2),
    },
    lastRow: {
      borderBottomWidth: 0,
      paddingBottom: 0,
      marginBottom: 0,
    },
    label: {
      color: theme.subtext,
      fontSize: rf(1.5),
      textTransform: 'uppercase',
      marginBottom: rh(0.5),
    },
    value: {
      fontSize: rf(2.2),
      fontWeight: '600',
      color: theme.text,
    },
    description: {
      fontSize: rf(2),
      color: theme.text,
      lineHeight: rh(3),
    },
    receiptImage: {
        width: '100%',
        height: rh(25),
        borderRadius: rw(2),
        marginTop: rh(1),
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: rw(8),
      height: rw(8),
      backgroundColor: theme.secondary,
      borderRadius: rw(4),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: rw(2),
    },
    avatarText: {
      fontSize: rf(1.5),
      fontWeight: 'bold',
      color: theme.subtext,
    },
    userName: {
      fontSize: rf(2),
      fontWeight: '500',
      color: theme.text,
    },
    actionButtons: {
      flexDirection: 'row',
      marginTop: rh(2),
      gap: rw(4),
    },
    approveButton: {
      flex: 1,
      backgroundColor: scheme === 'dark' ? '#15803d' : '#16a34a', // green-700 / green-600
      padding: rh(2),
      borderRadius: rw(3),
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      elevation: 2,
    },
    approveText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: rf(2),
    },
    rejectButton: {
      flex: 1,
      backgroundColor: scheme === 'dark' ? 'rgba(185, 28, 28, 0.1)' : 'rgba(220, 38, 38, 0.1)',
      padding: rh(2),
      borderRadius: rw(3),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: scheme === 'dark' ? 'rgba(185, 28, 28, 0.2)' : 'rgba(220, 38, 38, 0.2)',
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      elevation: 2,
    },
    rejectText: {
      color: scheme === 'dark' ? '#ef4444' : '#dc2626',
      fontWeight: 'bold',
      fontSize: rf(2),
    },
    reimburseButton: {
        flex: 1,
        backgroundColor: '#0891b2', // cyan-600
        padding: rh(2),
        borderRadius: rw(3),
        alignItems: 'center',
        shadowColor: theme.shadow,
        shadowOffset: theme.shadowOffset,
        shadowOpacity: theme.shadowOpacity,
        shadowRadius: theme.shadowRadius,
        elevation: 2,
    },
  });

  if (isLoading) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        </SafeAreaView>
    );
  }

  if (!expense) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Error</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: theme.text }}>Expense not found</Text>
            </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedEntry delay={100} from="top">
      <View style={styles.header}>
        <View style={styles.headerTop}>
            <ScalePressable onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color="white" />
            </ScalePressable>
            <Text style={styles.headerTitle}>Expense Details</Text>
            <ScalePressable onPress={handleDelete}>
                <Feather name="trash-2" size={24} color="white" />
            </ScalePressable>
        </View>
        <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{expense.status} • {expense.expense_type === 'institute' ? 'Office' : 'Personal'}</Text>
            </View>
        </View>
      </View>
      </AnimatedEntry>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <AnimatedEntry delay={300} from="bottom">
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.label}>Title</Text>
                <Text style={styles.value}>{expense.title}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Category</Text>
                <Text style={styles.value}>{expense.category || 'N/A'}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{expense.expense_date}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Paid From</Text>
                <Text style={styles.value}>
                    {expense.paid_from === 'institute_float' ? 'OFFICE CASH' : 
                     expense.paid_from === 'personal_money' ? 'MY MONEY' : 
                     (expense.paid_from || (expense as any).payment_method || '').replace('_', ' ').toUpperCase()}
                </Text>
            </View>

            {expense.description && (
                <View style={styles.row}>
                    <Text style={styles.label}>Description</Text>
                    <Text style={styles.description}>{expense.description}</Text>
                </View>
            )}

            <View style={[styles.row, !expense.receipt_file && styles.lastRow]}>
                <Text style={styles.label}>Added By</Text>
                <View style={styles.userRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{expense.createdBy?.full_name?.charAt(0) || 'U'}</Text>
                    </View>
                    <Text style={styles.userName}>{expense.createdBy?.full_name || 'Unknown'}</Text>
                </View>
            </View>

            {expense.receipt_file && (
                <View style={[styles.row, styles.lastRow]}>
                    <Text style={styles.label}>Receipt</Text>
                    <ScalePressable onPress={() => Linking.openURL(`${API_URL.replace('/api', '')}/storage/${expense.receipt_file}`)}>
                        <Image 
                            source={{ uri: `${API_URL.replace('/api', '')}/storage/${expense.receipt_file}` }} 
                            style={styles.receiptImage} 
                            resizeMode="cover"
                        />
                    </ScalePressable>
                </View>
            )}
        </View>
        </AnimatedEntry>

        {expense.status === 'pending' && (
            <AnimatedEntry delay={500} from="bottom">
            <View style={styles.actionButtons}>
                <ScalePressable style={styles.rejectButton} onPress={() => handleStatusUpdate('rejected')}>
                    <Text style={styles.rejectText}>Reject</Text>
                </ScalePressable>
                <ScalePressable style={styles.approveButton} onPress={() => handleStatusUpdate('approved')}>
                    <Text style={styles.approveText}>Approve</Text>
                </ScalePressable>
            </View>
            </AnimatedEntry>
        )}


      </ScrollView>
    </SafeAreaView>
  );
}