import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { responsiveHeight as rh, responsiveWidth as rw, responsiveFontSize as rf } from 'react-native-responsive-dimensions';
import { useTheme } from '../../themes/ThemeContext';
import activityLogService, { ActivityLogItem } from '../../services/activityLogService';
import Header from '../../components/Header';

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const datePart = date.toLocaleDateString('en-US', options);

    if (date.toDateString() === today.toDateString()) {
        return `Today, ${datePart}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${datePart}`;
    } else {
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
};

const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ActivityLogScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const filterActions = [
      { label: 'All', value: null },
      { label: 'Created', value: 'create' },
      { label: 'Updated', value: 'update' },
      { label: 'Deleted', value: 'delete' },
      { label: 'Login', value: 'login' },
      { label: 'Logout', value: 'logout' },
  ];

  const fetchLogs = async (pageNum: number = 1, shouldRefresh: boolean = false) => {
      try {
          if (pageNum === 1) setLoading(true);
          
          const params: any = { 
              page: pageNum,
              search: searchQuery,
              action_type: selectedAction 
          };

          const response = await activityLogService.getLogs(params);
          
          if (response.success && response.data) {
              if (shouldRefresh || pageNum === 1) {
                  setLogs(response.data.data);
              } else {
                  setLogs(prev => [...prev, ...response.data.data]);
              }
              setHasMore(response.data.current_page < response.data.last_page);
              setPage(pageNum);
          }
      } catch (error) {
          console.error('Failed to fetch activity logs', error);
      } finally {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
      }
  };

  // Debounce search
  useEffect(() => {
      const timer = setTimeout(() => {
          fetchLogs(1, true);
      }, 500);
      return () => clearTimeout(timer);
  }, [searchQuery, selectedAction]);

  const onRefresh = () => {
      setRefreshing(true);
      fetchLogs(1, true);
  };

  const loadMore = () => {
      if (!loadingMore && hasMore && !loading) {
          setLoadingMore(true);
          fetchLogs(page + 1);
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

  const renderEmpty = () => {
      if (loading) return null;
      return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: rh(10) }}>
              <Feather name="activity" size={rw(15)} color={theme.border} />
              <Text style={{ marginTop: rh(2), color: theme.subtext, fontSize: rf(2) }}>No activity logs found</Text>
          </View>
      );
  };

    const getActionConfig = (action: string) => {
        switch (action) {
            case 'create': return { icon: 'plus-circle', color: '#10b981', label: 'Created' };
            case 'update': return { icon: 'edit-2', color: '#f59e0b', label: 'Updated' };
            case 'delete': return { icon: 'trash-2', color: '#ef4444', label: 'Deleted' };
            case 'approve': return { icon: 'check-circle', color: '#10b981', label: 'Approved' };
            case 'reject': return { icon: 'x-circle', color: '#ef4444', label: 'Rejected' };
            case 'login': return { icon: 'log-in', color: '#3b82f6', label: 'Logged In' };
            case 'logout': return { icon: 'log-out', color: '#64748b', label: 'Logged Out' };
            default: return { icon: 'activity', color: theme.primary, label: action };
        }
    };

    const getFormattedTitle = (item: ActivityLogItem) => {
        if (item.description) return item.description;
        const config = getActionConfig(item.action_type);
        const entity = item.entity_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return `${config.label} ${entity}`;
    };

    const getChangeDetails = (item: ActivityLogItem) => {
        try {
            if (item.action_type === 'create' && item.new_values) {
                const vals = JSON.parse(item.new_values);
                const keys = Object.keys(vals).filter(k => !['id', 'created_at', 'updated_at', 'uuid', 'code'].includes(k));
                if (keys.length > 0) {
                    const fieldList = keys.slice(0, 3).map(k => k.replace(/_/g, ' ')).join(', ');
                    return `Created: ${fieldList}${keys.length > 3 ? '...' : ''}`;
                }
                return 'New entry created';
            }
            
            if (item.action_type === 'update' && item.new_values && item.old_values) {
                const newVals = JSON.parse(item.new_values);
                const oldVals = JSON.parse(item.old_values);
                const changes = Object.keys(newVals).filter(k => 
                    newVals[k] !== oldVals[k] && 
                    !['updated_at', 'id'].includes(k)
                );
                
                if (changes.length === 0) return 'Updated record';
                
                const changeList = changes.slice(0, 3).map(key => {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return `${label}`;
                }).join(', ');
                
                return `Updated: ${changeList}${changes.length > 3 ? ` +${changes.length - 3} more` : ''}`;
            }

            if (['login', 'logout'].includes(item.action_type) && item.ip_address) {
                return `IP: ${item.ip_address}`;
            }

            return item.entity_code || '';
        } catch (e) {
            return '';
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
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    searchContainer: {
        paddingHorizontal: rw(4),
        paddingVertical: rh(1.5),
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        borderRadius: rw(2),
        paddingHorizontal: rw(3),
        height: rh(5.5),
        borderWidth: 1,
        borderColor: theme.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: rw(2),
        color: theme.text,
        fontSize: rf(1.8),
    },
    filterContainer: {
        paddingHorizontal: rw(4),
        paddingBottom: rh(1.5),
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    filterChip: {
        paddingHorizontal: rw(4),
        paddingVertical: rh(0.8),
        borderRadius: rw(4),
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
        marginRight: rw(2),
    },
    activeFilterChip: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    filterText: {
        fontSize: rf(1.6),
        color: theme.subtext,
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#fff',
    },
    listContent: {
        padding: rw(4),
        paddingBottom: rh(4),
    },
    activityItem: {
        flexDirection: 'row',
        marginBottom: rh(1.5),
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: rw(4),
        top: rh(2),
        bottom: -rh(1.5),
        width: 2,
        backgroundColor: theme.border,
        zIndex: 0,
    },
    timelineDotContainer: {
        width: rw(8),
        alignItems: 'center',
        marginRight: rw(3),
        zIndex: 10,
    },
    timelineDot: {
        width: rw(8),
        height: rw(8),
        borderRadius: rw(4),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        backgroundColor: theme.card,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    card: {
        flex: 1,
        backgroundColor: theme.card,
        padding: rw(3.5),
        borderRadius: rw(3),
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: rh(0.5),
    },
    actionText: {
        fontWeight: '700',
        color: theme.text,
        fontSize: rf(1.8),
        flex: 1,
        marginRight: rw(2),
        lineHeight: rf(2.4),
    },
    timeText: {
        fontSize: rf(1.3),
        color: theme.subtext,
        fontWeight: '500',
    },
    detailsText: {
        fontSize: rf(1.5),
        color: theme.text,
        opacity: 0.9,
        marginTop: rh(0.5),
        lineHeight: rf(2.2),
        fontWeight: '400',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: rh(1.2),
        paddingTop: rh(1.2),
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    dateText: {
        fontSize: rf(1.4),
        color: theme.text,
        opacity: 0.7,
        fontWeight: '600',
    },
    actorText: {
        fontSize: rf(1.4),
        color: theme.subtext,
        fontWeight: '500',
    }
  });

  return (
    <View style={styles.container}>
        <Header title="Activity Log" showBack />
        
        <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
                <Feather name="search" size={rw(5)} color={theme.subtext} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search activities..."
                    placeholderTextColor={theme.subtext}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Feather name="x" size={rw(4)} color={theme.subtext} />
                    </TouchableOpacity>
                )}
            </View>
        </View>

        <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filterActions.map((action) => (
                    <TouchableOpacity
                        key={action.label}
                        style={[
                            styles.filterChip,
                            selectedAction === action.value && styles.activeFilterChip
                        ]}
                        onPress={() => setSelectedAction(action.value)}
                    >
                        <Text style={[
                            styles.filterText,
                            selectedAction === action.value && styles.activeFilterText
                        ]}>
                            {action.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {loading && !refreshing && logs.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        ) : (
            <FlatList
                data={logs}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                renderItem={({ item, index }) => {
                    const config = getActionConfig(item.action_type);
                    const title = getFormattedTitle(item);
                    const details = getChangeDetails(item);

                    return (
                        <View style={styles.activityItem}>
                            {/* Show line if not last item */}
                            {index !== logs.length - 1 && <View style={styles.timelineLine} />}
                            
                            <View style={styles.timelineDotContainer}>
                                <View style={[styles.timelineDot, { borderColor: config.color }]}>
                                    <Feather name={config.icon as any} size={rf(2)} color={config.color} />
                                </View>
                            </View>
                            
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.actionText}>{title}</Text>
                                    <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
                                </View>
                                
                                {details ? (
                                    <Text style={styles.detailsText} numberOfLines={2}>
                                        {details}
                                    </Text>
                                ) : null}
                                
                                <View style={styles.footerRow}>
                                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                                    {item.actor && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Feather name="user" size={rf(1.4)} color={theme.subtext} style={{ marginRight: 4 }} />
                                            <Text style={styles.actorText}>{item.actor.full_name}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                }}
            />
        )}
    </View>
  );
}
