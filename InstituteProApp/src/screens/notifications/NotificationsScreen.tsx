import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { responsiveHeight as rh, responsiveWidth as rw, responsiveFontSize as rf } from 'react-native-responsive-dimensions';
import { useTheme } from '../../themes/ThemeContext';
import notificationService from '../../services/notificationService';
import Header from '../../components/Header';
import Toast from 'react-native-toast-message';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { theme, scheme } = useTheme();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = async (pageNum: number = 1, shouldRefresh: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      const response = await notificationService.getNotifications({ page: pageNum });
      if (response.success && response.data?.data) {
        if (shouldRefresh || pageNum === 1) {
            setNotifications(response.data.data);
        } else {
            setNotifications(prev => [...prev, ...response.data.data]);
        }
        setHasMore(response.data.current_page < response.data.last_page);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1, true);
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(1, true);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
        setLoadingMore(true);
        fetchNotifications(page + 1);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
        <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator size="small" color={theme.primary} />
        </View>
    );
  };

  const handleMarkAsRead = async (id: string, read: boolean) => {
    if (read) return;
    try {
        await notificationService.markAsRead(id);
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
    } catch (error) {
        console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
        setActionLoading(true);
        await notificationService.markAllAsRead();
        fetchNotifications();
        Toast.show({ type: 'success', text1: 'Success', text2: 'All marked as read' });
    } catch (error) {
        console.error('Failed to mark all read', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to mark all as read' });
    } finally {
        setActionLoading(false);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
        'Clear All',
        'Are you sure you want to delete all notifications?',
        [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Clear', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        setActionLoading(true);
                        await notificationService.clearAll();
                        setNotifications([]);
                        Toast.show({ type: 'success', text1: 'Success', text2: 'Notifications cleared' });
                    } catch (error) {
                        console.error('Failed to clear notifications', error);
                        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to clear notifications' });
                    } finally {
                        setActionLoading(false);
                    }
                }
            }
        ]
    );
  };

  const handleNotificationPress = async (item: any) => {
    // Mark as read if not already read
    if (!item.is_read) {
        handleMarkAsRead(item.id, true);
    }

    // Navigate based on type and reference_id
    if (!item.reference_id && item.type !== 'attendance') return;

    switch (item.type) {
        case 'task':
            (navigation as any).navigate('Tasks', { screen: 'TaskDetail', params: { id: item.reference_id } });
            break;
        case 'expense':
            (navigation as any).navigate('Finance', { screen: 'ExpenseDetail', params: { id: item.reference_id } });
            break;
        case 'income':
            (navigation as any).navigate('Finance', { screen: 'IncomeDetail', params: { id: item.reference_id } });
            break;
        case 'attendance':
            (navigation as any).navigate('Attendance', { screen: 'AttendanceHome' });
            break;
        case 'work':
             (navigation as any).navigate('Tasks', { screen: 'TasksList' });
             break;
        case 'transfer':
             (navigation as any).navigate('Finance', { screen: 'TransferHistory' });
             break;
    }
  };

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: any[] } = {
        'Today': [],
        'Yesterday': [],
        'Earlier': []
    };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(item => {
        const date = new Date(item.created_at);
        if (date.toDateString() === today.toDateString()) {
            groups['Today'].push(item);
        } else if (date.toDateString() === yesterday.toDateString()) {
            groups['Yesterday'].push(item);
        } else {
            groups['Earlier'].push(item);
        }
    });

    return Object.entries(groups)
        .filter(([_, data]) => data.length > 0)
        .map(([title, data]) => ({ title, data }));
  }, [notifications]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    sectionHeader: {
        paddingHorizontal: rw(4),
        paddingVertical: rh(1),
        backgroundColor: theme.background,
    },
    sectionTitle: {
        fontSize: rf(1.8),
        fontWeight: 'bold',
        color: theme.text,
        opacity: 0.8
    },
    listContent: { paddingBottom: rh(5) },
    item: {
        backgroundColor: theme.card,
        marginHorizontal: rw(4),
        marginBottom: rh(1.5),
        borderRadius: rw(3),
        padding: rw(4),
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderLeftWidth: 4,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: rw(10),
        height: rw(10),
        borderRadius: rw(5),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: rw(3),
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rh(0.5),
    },
    title: {
        fontSize: rf(1.8),
        fontWeight: 'bold',
        color: theme.text,
        flex: 1,
        marginRight: rw(2),
    },
    time: {
        fontSize: rf(1.4),
        color: theme.subtext,
    },
    message: {
        fontSize: rf(1.6),
        color: theme.subtext,
        lineHeight: rh(2.2),
    },
    unreadDot: {
        width: rw(2),
        height: rw(2),
        borderRadius: rw(1),
        backgroundColor: theme.accent,
        marginTop: rh(0.8),
        marginLeft: rw(2),
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: rh(20)
    },
    emptyText: {
        color: theme.subtext,
        fontSize: rf(2),
        marginTop: rh(2)
    }
  });

  const getIcon = (type: string) => {
    switch(type) {
        case 'task': return { name: 'clipboard', color: '#3b82f6', bg: '#eff6ff' };
        case 'expense': return { name: 'credit-card', color: '#ef4444', bg: '#fef2f2' };
        case 'income': return { name: 'trending-up', color: '#10b981', bg: '#ecfdf5' };
        case 'attendance': return { name: 'calendar', color: '#8b5cf6', bg: '#f5f3ff' };
        case 'work': return { name: 'briefcase', color: '#6366f1', bg: '#eef2ff' };
        case 'system': return { name: 'alert-circle', color: '#f59e0b', bg: '#fffbeb' };
        default: return { name: 'bell', color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Notifications" 
        showBack 
        rightComponent={
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={handleMarkAllRead} style={{ marginLeft: rw(4) }} disabled={actionLoading}>
                <Feather name="check-square" size={20} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearAll} style={{ marginLeft: rw(4) }} disabled={actionLoading}>
                <Feather name="trash-2" size={20} color={theme.error} />
            </TouchableOpacity>
          </View>
        }
      />

      {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: rh(5) }} />
      ) : (
          <SectionList
            sections={groupedNotifications}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
            }
            renderSectionHeader={({ section: { title } }) => (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                </View>
            )}
            renderItem={({ item, index }) => {
                const icon = getIcon(item.type || 'info');
                const unread = !item.is_read;
                return (
                    <AnimatedEntry delay={index * 50} from="bottom">
                    <ScalePressable 
                        style={[
                            styles.item, 
                            { 
                                borderLeftColor: icon.color,
                                backgroundColor: unread ? (scheme === 'dark' ? '#1e293b' : '#fff') : theme.card 
                            }
                        ]}
                        onPress={() => handleNotificationPress(item)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
                            <Feather name={icon.name as any} size={20} color={icon.color} />
                        </View>
                        <View style={styles.contentContainer}>
                            <View style={styles.headerRow}>
                                <Text style={[styles.title, unread && { color: theme.text }]}>
                                    {item.title || 'Notification'}
                                </Text>
                                <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                            </View>
                            <Text style={styles.message} numberOfLines={2}>{item.message || ''}</Text>
                        </View>
                        {unread && <View style={styles.unreadDot} />}
                    </ScalePressable>
                    </AnimatedEntry>
                );
            }}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Feather name="bell-off" size={rf(5)} color={theme.subtext} />
                    <Text style={styles.emptyText}>No notifications</Text>
                </View>
            }
            stickySectionHeadersEnabled={false}
          />
      )}
    </View>
  );
}
