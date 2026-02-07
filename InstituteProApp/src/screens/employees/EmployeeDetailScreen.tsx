import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import employeeService from '../../services/employeeService';
import { formatCurrency } from '../../utils/formatters';
import Toast from 'react-native-toast-message';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';
import SwipeConfirmModal from '../../components/Modal';

export default function EmployeeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params;
  const { theme } = useTheme();
  
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const fetchEmployeeDetails = async () => {
    try {
      const data = await employeeService.getEmployee(id);
      setEmployee(data.data || data);
    } catch (error) {
      console.error('Failed to fetch employee details', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch employee details',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEmployeeDetails();
    }, [id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployeeDetails();
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const confirmDelete = async (deleteAllData: boolean) => {
    try {
      setDeleteLoading(true);
      await employeeService.deleteEmployee(id, deleteAllData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Employee deleted successfully',
      });
      setDeleteModalVisible(false);
      navigation.goBack();
    } catch (error: any) {
      console.error('Delete error', error);
      const message = error.response?.data?.message || 'Failed to delete employee';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
      setDeleteLoading(false);
      setDeleteModalVisible(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading && !employee) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <SwipeConfirmModal 
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
        loading={deleteLoading}
      />
    </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} tintColor={theme.accent} />
        }
      >
        {/* Header */}
        <AnimatedEntry delay={100} from="top">
        <View style={[styles.header, { backgroundColor: theme.card }]}>
           <View style={styles.headerTop}>
             <ScalePressable onPress={() => navigation.goBack()} style={styles.iconButton}>
                <Feather name="arrow-left" size={rf(3)} color={theme.text} />
             </ScalePressable>
             <View style={styles.actionButtons}>
               <ScalePressable 
                 onPress={() => navigation.navigate('EmployeeEdit', { id: employee.id })} 
                 style={[styles.iconButton, { marginRight: rw(2) }]}
               >
                  <Feather name="edit-2" size={rf(2.5)} color={theme.accent} />
               </ScalePressable>
               <ScalePressable onPress={handleDelete} style={styles.iconButton}>
                  <Feather name="trash-2" size={rf(2.5)} color="#FF4444" />
               </ScalePressable>
             </View>
           </View>
           
           <View style={styles.profileInfo}>
              {employee.profile_photo_url ? (
                <Image 
                  source={{ uri: employee.profile_photo_url }} 
                  style={[styles.avatar, { backgroundColor: theme.background }]}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.background }]}>
                   <Text style={[styles.avatarText, { color: theme.accent }]}>
                     {getInitials(employee.full_name)}
                   </Text>
                </View>
              )}
              <Text style={[styles.name, { color: theme.text }]}>{employee.full_name}</Text>
              <Text style={[styles.status, { color: theme.subtext }]}>
                {employee.role} • <Text style={{ color: employee.status === 'active' ? '#4CAF50' : '#FF4444' }}>
                  {employee.status ? (employee.status.charAt(0).toUpperCase() + employee.status.slice(1)) : 'No Status'}
                </Text>
              </Text>
           </View>
        </View>
        </AnimatedEntry>

        {/* Details Cards */}
        <View style={styles.content}>
           {/* Personal Info */}
           <AnimatedEntry delay={200} from="bottom">
           <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Personal Details</Text>
              <View style={styles.infoGroup}>
                 <View style={styles.infoRow}>
                    <Feather name="mail" size={rf(2.2)} color={theme.subtext} />
                    <Text style={[styles.infoText, { color: theme.text }]}>{employee.email}</Text>
                 </View>
                 <View style={styles.infoRow}>
                    <Feather name="phone" size={rf(2.2)} color={theme.subtext} />
                    <Text style={[styles.infoText, { color: theme.text }]}>{employee.mobile_number}</Text>
                 </View>
                 {employee.address && (
                   <View style={styles.infoRow}>
                      <Feather name="map-pin" size={rf(2.2)} color={theme.subtext} />
                      <Text style={[styles.infoText, { color: theme.text }]}>{employee.address}</Text>
                   </View>
                 )}
                 <View style={styles.infoRow}>
                    <Feather name="calendar" size={rf(2.2)} color={theme.subtext} />
                    <Text style={[styles.infoText, { color: theme.text }]}>Joined {formatDate(employee.join_date)}</Text>
                 </View>
              </View>
           </View>
           </AnimatedEntry>

           {/* Salary Info */}
           <AnimatedEntry delay={300} from="bottom">
           <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Salary & Bank</Text>
              <View style={styles.salaryRow}>
                 <Text style={[styles.label, { color: theme.subtext }]}>Type</Text>
                 <Text style={[styles.value, { color: theme.text }]}>{employee.salary_type}</Text>
              </View>
              <View style={styles.salaryRow}>
                 <Text style={[styles.label, { color: theme.subtext }]}>Monthly Salary</Text>
                 <Text style={[styles.value, { color: theme.text }]}>{formatCurrency(employee.monthly_salary)}</Text>
              </View>
              {employee.profit_share_percentage && (
                <View style={styles.salaryRow}>
                   <Text style={[styles.label, { color: theme.subtext }]}>Profit Share</Text>
                   <Text style={[styles.value, { color: theme.text }]}>{employee.profit_share_percentage}%</Text>
                </View>
              )}
              {/* Bank info placeholder - assuming it might come from API later */}
              <View style={[styles.bankInfo, { borderTopColor: theme.border }]}>
                 <Text style={[styles.bankText, { color: theme.subtext }]}>Bank details not available</Text>
              </View>
           </View>
           </AnimatedEntry>
        </View>
      </ScrollView>
      <SwipeConfirmModal 
         visible={deleteModalVisible}
         onClose={() => setDeleteModalVisible(false)}
         onConfirm={confirmDelete}
         title="Delete Employee"
         message="Are you sure you want to delete this employee? This action cannot be undone."
         loading={deleteLoading}
       />
     </SafeAreaView>
   );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: rw(6),
    paddingTop: rh(2),
    borderBottomLeftRadius: rw(8),
    borderBottomRightRadius: rw(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: rh(2),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rh(2),
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: rw(2),
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: rw(24),
    height: rw(24),
    borderRadius: rw(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rh(1.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarText: {
    fontSize: rf(3.5),
    fontWeight: 'bold',
  },
  name: {
    fontSize: rf(3),
    fontWeight: 'bold',
  },
  status: {
    fontSize: rf(1.8),
    marginTop: rh(0.5),
  },
  content: {
    padding: rw(4),
  },
  card: {
    padding: rw(4),
    borderRadius: rw(3),
    marginBottom: rh(2),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: rf(1.5),
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: rh(2),
  },
  infoGroup: {
    gap: rh(1.5),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: rw(3),
    fontSize: rf(2),
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: rh(1.5),
  },
  label: {
    fontSize: rf(1.8),
  },
  value: {
    fontSize: rf(1.8),
    fontWeight: '600',
  },
  bankInfo: {
    marginTop: rh(1),
    paddingTop: rh(1.5),
    borderTopWidth: 1,
  },
  bankText: {
    fontSize: rf(1.6),
  },
});

