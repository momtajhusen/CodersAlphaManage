import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Toast from 'react-native-toast-message';
import { createCashTransfer, updateCashTransfer } from '../../services/transferService';
import { getEmployees } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import Header from '../../components/Header';

const transferSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  receiver_id: z.number({ required_error: 'Receiver is required' }),
  notes: z.string().optional(),
  transfer_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

type TransferFormData = z.input<typeof transferSchema>;

export default function TransferMoneyScreen({ route }: any) {
  const navigation = useNavigation();
  const { transfer } = route.params || {};
  const isEditing = !!transfer;
  
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [senderBalance, setSenderBalance] = useState<number>(0);
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transfer_date: transfer?.transfer_date || new Date().toISOString().split('T')[0],
      amount: transfer?.amount ? String(transfer.amount) : '',
      receiver_id: transfer?.receiver_id,
      notes: transfer?.notes || '',
    }
  });

  const receiverId = watch('receiver_id');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await getEmployees({ per_page: 100, status: 'active' });
      // Filter out current user from receivers
      const allEmployees = response.data.data || response.data;
      
      // Find current user balance
      const currentUser = allEmployees.find((emp: any) => emp.id === user?.employee?.id);
      if (currentUser) {
          setSenderBalance(parseFloat(currentUser.current_balance) || 0);
      }
      
      setEmployees(allEmployees.filter((emp: any) => emp.id !== user?.employee?.id));
    } catch (error) {
      console.error('Failed to load employees', error);
    }
  };

  const onSubmit = async (data: TransferFormData) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
      };
      
      if (isEditing) {
        await updateCashTransfer(transfer.id, payload);
        Toast.show({
          type: 'success',
          text1: 'Update Successful',
          text2: 'Transfer updated successfully',
        });
      } else {
        await createCashTransfer(payload);
        Toast.show({
          type: 'success',
          text1: 'Transfer Successful',
          text2: 'Money transferred successfully',
        });
      }
      
      navigation.goBack();
    } catch (error: any) {
      console.error('Transfer error:', error);
      Toast.show({
        type: 'error',
        text1: isEditing ? 'Update Failed' : 'Transfer Failed',
        text2: error.response?.data?.message || 'Could not process request',
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
          isSubmittingRef.current = false;
      }, 500); // Small delay before allowing next submission to be safe
    }
  };

  const getEmployeeName = (id: number | undefined) => {
    if (!id) return 'Select Receiver';
    // If editing and employees not loaded yet, or not found in list (maybe inactive), use transfer data
    if (isEditing && transfer?.receiver && transfer.receiver.id === id) {
        // Prefer the list if available to get consistent naming, but fallback to transfer data
        const emp = employees.find(e => e.id === id);
        return emp ? emp.full_name : transfer.receiver.full_name;
    }
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.full_name}` : 'Unknown';
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
      fontSize: rf(2.2),
      fontWeight: 'bold',
      color: theme.text,
    },
    content: {
      flex: 1,
      padding: rw(5),
    },
    inputGroup: {
      marginBottom: rh(2),
    },
    label: {
      fontSize: rf(1.8),
      color: theme.text,
      marginBottom: rh(1),
      fontWeight: '500',
    },
    input: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: rw(2),
      padding: rw(3),
      color: theme.text,
      fontSize: rf(1.8),
    },
    errorText: {
      color: '#ef4444',
      fontSize: rf(1.4),
      marginTop: rh(0.5),
    },
    dropdownButton: {
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: rw(2),
        padding: rw(3),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textArea: {
      height: rh(10),
      textAlignVertical: 'top',
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
    submitButtonText: {
      color: '#fff',
      fontSize: rf(2),
      fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: rw(5),
    },
    modalContent: {
        backgroundColor: theme.card,
        borderRadius: rw(3),
        maxHeight: '80%',
        padding: rw(2),
    },
    modalItem: {
        padding: rw(4),
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    modalItemText: {
        color: theme.text,
        fontSize: rf(1.8),
    },
    closeButton: {
        marginTop: rh(2),
        alignItems: 'center',
        padding: rw(3),
    },
    footer: {
        padding: rw(4),
        backgroundColor: theme.card,
        borderTopWidth: 1,
        borderColor: theme.border,
    }
  });

  return (
    <View style={styles.container}>
      <Header title="Transfer Money" showBack />

      <ScrollView style={styles.content}>
        
        <View style={{ backgroundColor: theme.card, padding: rw(4), borderRadius: rw(2), marginBottom: rh(2), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.text, fontSize: rf(1.8) }}>Your Balance</Text>
            <Text style={{ color: theme.primary, fontSize: rf(2.2), fontWeight: 'bold' }}>{formatCurrency(senderBalance || 0)}</Text>
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Transfer To</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowReceiverModal(true)}>
                <Text style={{ color: receiverId ? theme.text : theme.subtext }}>{getEmployeeName(receiverId)}</Text>
                <Feather name="chevron-down" size={20} color={theme.subtext} />
            </TouchableOpacity>
            {receiverId && (
                <Text style={{ color: theme.subtext, fontSize: rf(1.4), marginTop: rh(0.5) }}>
                    Receiver Balance: {formatCurrency(employees.find(e => e.id === receiverId)?.current_balance || 0)}
                </Text>
            )}
            {errors.receiver_id && <Text style={styles.errorText}>{errors.receiver_id.message}</Text>}
        </View>

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={theme.subtext}
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
              />
              {errors.amount && <Text style={styles.errorText}>{errors.amount.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="transfer_date"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.subtext}
                value={value}
                onChangeText={onChange}
              />
              {errors.transfer_date && <Text style={styles.errorText}>{errors.transfer_date.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional details..."
                placeholderTextColor={theme.subtext}
                multiline
                numberOfLines={4}
                value={value}
                onChangeText={onChange}
              />
            </View>
          )}
        />

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
            <Text style={styles.submitButtonText}>Transfer Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Receiver Modal */}
      <Modal visible={showReceiverModal} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReceiverModal(false)}>
              <View style={styles.modalContent}>
                  <Text style={{ fontSize: rf(2), fontWeight: 'bold', color: theme.text, padding: rw(4) }}>Select Receiver</Text>
                  <FlatList
                      data={employees}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => (
                          <TouchableOpacity 
                              style={styles.modalItem}
                              onPress={() => {
                                  setValue('receiver_id', item.id);
                                  setShowReceiverModal(false);
                              }}
                          >
                              <Text style={styles.modalItemText}>{item.full_name} ({item.role})</Text>
                          </TouchableOpacity>
                      )}
                  />
                  <TouchableOpacity onPress={() => setShowReceiverModal(false)} style={styles.closeButton}>
                      <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Close</Text>
                  </TouchableOpacity>
              </View>
          </TouchableOpacity>
      </Modal>

    </View>
  );
}
