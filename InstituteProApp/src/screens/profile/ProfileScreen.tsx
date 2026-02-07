import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, RefreshControl, Modal, InteractionManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rw, rh, rf } from '../../constants/responsive';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';

import { API_URL } from '../../services/api';

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { theme, scheme } = useTheme();
  const { user: authData, logout, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  
  const userData = authData?.user;
  const employeeData = authData?.employee;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
        await refreshUser();
    } catch (error) {
        console.error('Refresh failed', error);
    } finally {
        setRefreshing(false);
    }
  }, [refreshUser]);

  const profileImageUrl = React.useMemo(() => {
    if (employeeData?.profile_photo) {
        // Remove /api from the end if present
        const baseUrl = API_URL.replace(/\/api\/?$/, '');
        // Ensure we don't have double slashes if profile_photo starts with /
        const photoPath = employeeData.profile_photo.startsWith('/') 
            ? employeeData.profile_photo.substring(1) 
            : employeeData.profile_photo;
            
        return `${baseUrl}/storage/${photoPath}`;
    }
    return userData?.google_avatar || null;
  }, [employeeData, userData]);
  
  const iconColor = theme.text;

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
        refreshUser();
    });
    return () => task.cancel();
  }, []);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const menuGroups = [
    {
        title: 'Institute Management',
        items: [
            { label: 'Employees', icon: 'users', screen: 'Employees' },
            { label: 'Activity Log', icon: 'activity', screen: 'ActivityLog' },
        ]
    },
    {
        title: 'Account Settings',
        items: [
            { label: 'Edit Profile', icon: 'user', screen: 'EditProfile' },
            { label: 'Notifications', icon: 'bell', screen: 'Notifications' },
            { label: 'Settings', icon: 'settings', screen: 'Settings' },
        ]
    }
  ];

  const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    headerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: rw(5),
        paddingVertical: rh(2),
        marginBottom: rh(1),
    },
    avatarContainer: {
        width: rw(20),
        height: rw(20),
        borderRadius: rw(10),
        backgroundColor: theme.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: rw(5),
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    profileTexts: {
        flex: 1,
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: rf(3),
        fontWeight: 'bold',
        color: theme.primary,
    },
    userName: {
        fontSize: rf(2.4),
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: rh(0.2),
    },
    userRole: {
        fontSize: rf(1.6),
        color: theme.subtext,
        marginBottom: rh(0.8),
        textTransform: 'capitalize',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: rw(2.5),
        paddingVertical: rh(0.4),
        borderRadius: rw(4),
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
        alignSelf: 'flex-start',
    },
    statusDot: {
        width: rw(2),
        height: rw(2),
        borderRadius: rw(1),
        backgroundColor: '#10b981',
        marginRight: rw(1.5),
    },
    statusText: {
        fontSize: rf(1.4),
        fontWeight: '500',
        color: theme.text,
    },
    sectionContainer: {
        marginBottom: rh(2.5),
        paddingHorizontal: rw(4),
    },
    sectionTitle: {
        fontSize: rf(1.6),
        fontWeight: 'bold',
        color: theme.subtext,
        marginBottom: rh(1),
        marginLeft: rw(2),
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuCard: {
        backgroundColor: theme.card,
        borderRadius: rw(3),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: rw(3.5),
    },
    menuIconBox: {
        width: rw(9),
        height: rw(9),
        borderRadius: rw(2),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: rw(3.5),
        backgroundColor: theme.background,
    },
    menuLabel: {
        flex: 1,
        fontSize: rf(1.9),
        color: theme.text,
        fontWeight: '500',
    },
    logoutBtn: {
        marginHorizontal: rw(4),
        backgroundColor: theme.card,
        borderRadius: rw(3),
        padding: rw(3.5),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: rh(2),
        borderWidth: 1,
        borderColor: theme.error,
    },
    logoutText: {
        color: theme.error,
        fontWeight: 'bold',
        marginLeft: rw(2),
        fontSize: rf(2),
    },
    versionText: {
        textAlign: 'center',
        color: theme.subtext,
        fontSize: rf(1.5),
        marginBottom: rh(4),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: rw(5),
    },
    modalContent: {
        backgroundColor: theme.card,
        borderRadius: rw(5),
        padding: rw(6),
        width: '100%',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalIconContainer: {
        width: rw(16),
        height: rw(16),
        borderRadius: rw(8),
        backgroundColor: scheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: rh(2),
    },
    modalTitle: {
        fontSize: rf(2.5),
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: rh(1),
    },
    modalMessage: {
        fontSize: rf(1.8),
        color: theme.subtext,
        textAlign: 'center',
        marginBottom: rh(3),
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: rw(3),
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: rh(1.5),
        borderRadius: rw(3),
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    modalLogoutBtn: {
        flex: 1,
        paddingVertical: rh(1.5),
        borderRadius: rw(3),
        backgroundColor: theme.error,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: rf(1.8),
        fontWeight: '600',
        color: theme.text,
    },
    modalLogoutText: {
        fontSize: rf(1.8),
        fontWeight: '600',
        color: '#fff',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: rh(4) }}
        refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[theme.primary]} // Android
                tintColor={theme.primary} // iOS
            />
        }
      >
        <Header 
            title="Profile" 
            backgroundColor="transparent"
            rightComponent={
                <TouchableOpacity style={{ padding: rw(2) }}>
                    <Feather name="share-2" size={rf(2.5)} color={theme.text} />
                </TouchableOpacity>
            }
        />
        
        <AnimatedEntry delay={100} from="top">
        <View style={styles.headerCard}>
            <View style={styles.avatarContainer}>
                {profileImageUrl ? (
                    <Image 
                        source={{ uri: profileImageUrl }} 
                        style={{ width: '100%', height: '100%', borderRadius: 9999 }}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={{ width: '100%', height: '100%', borderRadius: 9999, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border }}>
                        <Feather name="user" size={rf(5)} color={theme.subtext} />
                    </View>
                )}
            </View>
            <View style={styles.profileTexts}>
                <Text style={styles.userName}>{employeeData?.full_name || userData?.name || 'User'}</Text>
                <Text style={styles.userRole}>{employeeData?.role || 'Member'}</Text>
                <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: employeeData?.status === 'active' ? '#10b981' : '#ef4444' }]} />
                    <Text style={styles.statusText}>{employeeData?.status ? (employeeData.status.charAt(0).toUpperCase() + employeeData.status.slice(1)) : 'Active'}</Text>
                </View>
            </View>
        </View>
        </AnimatedEntry>

        {menuGroups.map((group, groupIndex) => (
            <AnimatedEntry key={groupIndex} delay={200 + (groupIndex * 100)} from="bottom">
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{group.title}</Text>
                <View style={styles.menuCard}>
                    {group.items.map((item, index) => (
                        <ScalePressable 
                            key={index}
                            style={[
                                styles.menuItem, 
                                index !== group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
                            ]}
                            onPress={() => navigation.navigate(item.screen as any)}
                        >
                            <View style={styles.menuIconBox}>
                                <Feather name={item.icon as any} size={rf(2.2)} color={theme.text} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Feather name="chevron-right" size={rf(2)} color={theme.subtext} />
                        </ScalePressable>
                    ))}
                </View>
            </View>
            </AnimatedEntry>
        ))}

        <AnimatedEntry delay={500} from="bottom">
        <ScalePressable 
            style={styles.logoutBtn}
            onPress={handleLogout}
        >
            <Feather name="log-out" size={rf(2.2)} color={theme.error} />
            <Text style={styles.logoutText}>Log Out</Text>
        </ScalePressable>
        </AnimatedEntry>

        <Text style={styles.versionText}>Version 1.0.0 • CodersAlpha Manege</Text>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalIconContainer}>
                    <Feather name="log-out" size={rf(4)} color={theme.error} />
                </View>
                <Text style={styles.modalTitle}>Log Out</Text>
                <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
                
                <View style={styles.modalButtons}>
                    <TouchableOpacity 
                        style={styles.modalCancelBtn}
                        onPress={() => setLogoutModalVisible(false)}
                    >
                        <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.modalLogoutBtn}
                        onPress={() => {
                            setLogoutModalVisible(false);
                            logout();
                        }}
                    >
                        <Text style={styles.modalLogoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}
