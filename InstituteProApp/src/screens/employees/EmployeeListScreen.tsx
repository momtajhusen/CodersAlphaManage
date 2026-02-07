import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployeeStackParamList } from '../../navigation/types';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import employeeService from '../../services/employeeService';
import Header from '../../components/Header';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';

type EmployeeScreenNavigationProp = NativeStackNavigationProp<EmployeeStackParamList, 'EmployeeList'>;

export default function EmployeeListScreen() {
  const navigation = useNavigation<EmployeeScreenNavigationProp>();
  const { theme, scheme } = useTheme();

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmployees = async () => {
      try {
          const response = await employeeService.getEmployees();
          // Handle paginated response: response.data (pagination object) -> response.data.data (array)
          const employeeList = response.data?.data || response.data || [];
          setEmployees(Array.isArray(employeeList) ? employeeList : []);
      } catch (error) {
          console.error('Failed to fetch employees', error);
      } finally {
          setLoading(false);
          setRefreshing(false);
      }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [])
  );

  const onRefresh = useCallback(() => {
      setRefreshing(true);
      fetchEmployees();
  }, []);

  if (loading && !refreshing) {
      return (
          <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={theme.accent} />
          </View>
      );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Employees" showBack />
      <View style={styles.content}>
        
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
          }
          renderItem={({ item, index }) => (
            <AnimatedEntry delay={index * 100} from="bottom">
            <ScalePressable 
                onPress={() => navigation.navigate('EmployeeDetail', { id: item.id })}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={styles.userInfo}>
                {item.profile_photo_url ? (
                  <Image 
                    source={{ uri: item.profile_photo_url }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.border }]}>
                    <Feather name="user" size={rf(2.5)} color={theme.subtext} />
                  </View>
                )}
                <View style={styles.textContainer}>
                  <Text style={[styles.name, { color: theme.text }]}>{item.full_name || item.name}</Text>
                  <Text style={[styles.role, { color: theme.subtext }]}>{item.role}</Text>
                </View>
              </View>
              
              <View style={[
                styles.statusBadge, 
                { 
                  backgroundColor: (item.status === 'Active' || item.status === 'active')
                    ? (scheme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7') 
                    : (scheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2') 
                }
              ]}>
                <Text style={[
                  styles.statusText,
                  { 
                    color: (item.status === 'Active' || item.status === 'active')
                      ? (scheme === 'dark' ? '#4ade80' : '#15803d') 
                      : (scheme === 'dark' ? '#f87171' : '#b91c1c')
                  }
                ]}>
                  {item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'No Status'}
                </Text>
              </View>
            </ScalePressable>
            </AnimatedEntry>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: rh(10) }}>
                <Text style={{ color: theme.subtext }}>No employees found.</Text>
            </View>
          }
        />
      </View>

      {/* FAB to Add Employee */}
      <AnimatedEntry delay={500} from="right" style={{ position: 'absolute', bottom: rh(3), right: rw(5) }}>
      <ScalePressable 
        style={[styles.fab, { backgroundColor: theme.accent, shadowColor: theme.shadow }]}
        onPress={() => navigation.navigate('EmployeeCreate')}
      >
        <Feather name="plus" size={rf(3)} color="#FFFFFF" />
      </ScalePressable>
      </AnimatedEntry>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: rw(4),
  },
  headerTitle: {
    fontSize: rf(3),
    fontWeight: 'bold',
    marginBottom: rh(2),
  },
  listContent: {
    paddingBottom: rh(10),
  },
  card: {
    padding: rw(4),
    borderRadius: rw(3),
    marginBottom: rh(1.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: rw(12),
    height: rw(12),
    borderRadius: rw(6),
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: rw(3),
    flex: 1,
  },
  name: {
    fontSize: rf(2.2),
    fontWeight: '600',
  },
  role: {
    fontSize: rf(1.8),
    marginTop: rh(0.5),
  },
  statusBadge: {
    paddingHorizontal: rw(3),
    paddingVertical: rh(0.5),
    borderRadius: rw(4),
  },
  statusText: {
    fontSize: rf(1.5),
    fontWeight: '600',
  },
  fab: {
    width: rw(14),
    height: rw(14),
    borderRadius: rw(7),
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
