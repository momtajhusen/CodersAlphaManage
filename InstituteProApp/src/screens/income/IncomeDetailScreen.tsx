import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { getIncome, confirmIncome, rejectIncome, deleteIncome, Income } from '../../services/incomeService';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';

export default function IncomeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id } = route.params;
  const { theme, scheme } = useTheme();
  
  const [income, setIncome] = useState<Income | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIncome = async () => {
    try {
        const response = await getIncome(id);
        setIncome(response.data);
    } catch (error) {
        console.error('Fetch income error:', error);
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to fetch income details',
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncome();
  }, [id]);

  const handleConfirm = async () => {
    try {
        await confirmIncome(id);
        Toast.show({ type: 'success', text1: 'Confirmed', text2: 'Income confirmed successfully' });
        fetchIncome();
    } catch (error) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to confirm income' });
    }
  };

  const handleReject = async () => {
    try {
        await rejectIncome(id);
        Toast.show({ type: 'success', text1: 'Rejected', text2: 'Income rejected' });
        fetchIncome();
    } catch (error) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to reject income' });
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Income', 'Are you sure you want to delete this record?', [
        { text: 'Cancel', style: 'cancel' },
        { 
            text: 'Delete', 
            style: 'destructive', 
            onPress: async () => {
                try {
                    await deleteIncome(id);
                    Toast.show({ type: 'success', text1: 'Deleted', text2: 'Income deleted successfully' });
                    navigation.goBack();
                } catch (error) {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete income' });
                }
            }
        }
    ]);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: income?.source_type === 'institute' 
        ? (scheme === 'dark' ? '#15803d' : '#16a34a') // Green
        : (scheme === 'dark' ? '#7c3aed' : '#8b5cf6'), // Purple
      padding: rw(4),
      paddingTop: rh(1),
      paddingBottom: rh(4),
      borderBottomLeftRadius: rw(8),
      borderBottomRightRadius: rw(8),
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: rh(2),
    },
    backButton: {
      padding: rw(1),
    },
    deleteButton: {
      padding: rw(1),
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: rw(2),
    },
    headerTitle: {
      fontSize: rf(2.5),
      fontWeight: 'bold',
      color: '#ffffff',
    },
    amountContainer: {
      alignItems: 'center',
      marginTop: rh(1),
    },
    amountLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: rf(1.8),
    },
    amount: {
      fontSize: rf(4.5),
      fontWeight: 'bold',
      color: '#ffffff',
      marginVertical: rh(0.5),
    },
    statusBadge: {
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
      paddingBottom: rh(1),
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
    attachmentCard: {
      marginTop: rh(2),
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
    attachmentRow: {
      padding: rw(3),
      backgroundColor: theme.secondary,
      borderRadius: rw(2),
      borderWidth: 1,
      borderColor: theme.border,
    },
    attachmentImage: {
        width: '100%',
        height: rh(25),
        borderRadius: rw(2),
    },
    actionsContainer: {
        flexDirection: 'row',
        marginTop: rh(3),
        gap: rw(3),
    },
    actionButton: {
        flex: 1,
        padding: rh(1.5),
        borderRadius: rw(2),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    confirmButton: {
        backgroundColor: '#16a34a',
    },
    rejectButton: {
        backgroundColor: '#dc2626',
    },
    actionText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: rf(2),
        marginLeft: rw(2),
    }
  });

  if (isLoading) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={theme.accent} />
          </View>
      );
  }

  if (!income) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: theme.text }}>Income record not found.</Text>
          </View>
      );
  }

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'confirmed': return '#16a34a';
          case 'rejected': return '#dc2626';
          default: return '#ca8a04';
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedEntry delay={100} from="top">
      <View style={styles.header}>
        <View style={styles.headerTop}>
            <ScalePressable onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color="white" />
            </ScalePressable>
            <Text style={styles.headerTitle}>Income Details</Text>
            <ScalePressable onPress={handleDelete} style={styles.deleteButton}>
                <Feather name="trash-2" size={20} color="white" />
            </ScalePressable>
        </View>
        <View style={styles.amountContainer}>
             <Text style={styles.amountLabel}>Total Amount</Text>
             <Text style={styles.amount}>{formatCurrency(income.amount)}</Text>
             <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.statusText}>{income.status} • {income.source_type === 'institute' ? 'Office' : 'My Work'}</Text>
             </View>
          </View>
      </View>
      </AnimatedEntry>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <AnimatedEntry delay={300} from="bottom">
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.label}>Title</Text>
                <Text style={styles.value}>{income.title}</Text>
            </View>
            
            <View style={styles.row}>
                <Text style={styles.label}>Category</Text>
                <Text style={styles.value}>{income.category || 'N/A'}</Text>
            </View>
            
            <View style={styles.row}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{new Date(income.income_date).toDateString()}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Payment Method</Text>
                <Text style={styles.value}>{income.payment_method}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.description}>{income.description || 'No description'}</Text>
            </View>

            <View style={styles.lastRow}>
                <Text style={styles.label}>Added By</Text>
                <View style={styles.userRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{income.createdBy?.full_name?.charAt(0) || 'U'}</Text>
                    </View>
                    <Text style={styles.userName}>{income.createdBy?.full_name || 'Unknown'}</Text>
                </View>
            </View>
        </View>
        </AnimatedEntry>

        {income.receipt_file && (
            <AnimatedEntry delay={400} from="bottom">
            <View style={styles.attachmentCard}>
                <Text style={[styles.label, { marginBottom: rh(1.5) }]}>Receipt</Text>
                <View style={styles.attachmentRow}>
                    <Image 
                        source={{ uri: `${API_URL.replace('/api', '')}/storage/${income.receipt_file}` }} 
                        style={styles.attachmentImage} 
                        resizeMode="contain"
                    />
                </View>
            </View>
            </AnimatedEntry>
        )}

        {income.status === 'pending' && (
            <AnimatedEntry delay={500} from="bottom">
            <View style={styles.actionsContainer}>
                <ScalePressable style={[styles.actionButton, styles.rejectButton]} onPress={handleReject}>
                    <Feather name="x-circle" size={20} color="white" />
                    <Text style={styles.actionText}>Reject</Text>
                </ScalePressable>
                <ScalePressable style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirm}>
                    <Feather name="check-circle" size={20} color="white" />
                    <Text style={styles.actionText}>Confirm</Text>
                </ScalePressable>
            </View>
            </AnimatedEntry>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
