import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { responsiveHeight as rh, responsiveWidth as rw, responsiveFontSize as rf } from 'react-native-responsive-dimensions';
import { useTheme } from '../../themes/ThemeContext';
import activityLogService, { ActivityLogItem } from '../../services/activityLogService';

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString();
    }
};

const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function UserActivityScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName } = route.params as { userId?: string | number, userName?: string } || {};
  const { theme } = useTheme();
  
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLogs = async (pageNum: number = 1, shouldRefresh: boolean = false) => {
      if (!userId) {
          setLoading(false);
          return;
      }
      
      try {
          if (pageNum === 1) setLoading(true);
          
          const response = await activityLogService.getUserActivities(userId, { page: pageNum });
          
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
          console.error('Failed to fetch user activity logs', error);
      } finally {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
      }
  };

  useFocusEffect(
      useCallback(() => {
          fetchLogs(1, true);
      }, [userId])
  );

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
              <Text style={{ marginTop: rh(2), color: theme.subtext, fontSize: rf(2) }}>
                  No activity logs found for {userName || 'this user'}
              </Text>
          </View>
      );
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
    backButton: {
        marginRight: rw(4),
    },
    headerTitle: {
        fontSize: rf(2.5),
        fontWeight: 'bold',
        color: theme.text,
    },
    listContent: {
        padding: rw(4),
        paddingBottom: rh(5),
    },
    activityItem: {
        flexDirection: 'row',
        marginBottom: rh(3),
        position: 'relative',
        paddingLeft: rw(4),
    },
    timelineLine: {
        position: 'absolute',
        left: 0,
        top: rh(1),
        bottom: -rh(3),
        width: 2,
        backgroundColor: theme.border,
        marginLeft: rw(1.7),
    },
    timelineDot: {
        position: 'absolute',
        left: 0,
        top: rh(1),
        width: rw(4),
        height: rw(4),
        borderRadius: rw(2),
        backgroundColor: theme.card,
        borderWidth: 2,
        borderColor: theme.primary,
        zIndex: 10,
    },
    card: {
        flex: 1,
        marginLeft: rw(4),
        backgroundColor: theme.card,
        padding: rw(3),
        borderRadius: rw(2),
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rh(0.5),
    },
    actionText: {
        fontWeight: '600',
        color: theme.text,
        fontSize: rf(1.8),
        flex: 1,
    },
    timeText: {
        fontSize: rf(1.4),
        color: theme.subtext,
    },
    detailsText: {
        fontSize: rf(1.6),
        color: theme.subtext,
        marginTop: rh(0.5),
    },
    dateText: {
        fontSize: rf(1.4),
        color: theme.primary,
        marginTop: rh(0.5),
        fontWeight: '500',
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userName ? `${userName}'s Activity` : 'User Activity'}</Text>
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
              renderItem={({ item, index }) => (
                  <View style={styles.activityItem}>
                      {/* Show line if not last item */}
                      {index !== logs.length - 1 && <View style={styles.timelineLine} />}
                      <View style={styles.timelineDot} />
                      
                      <View style={styles.card}>
                          <View style={styles.cardHeader}>
                              <Text style={styles.actionText}>{item.description}</Text>
                              <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
                          </View>
                          <Text style={styles.detailsText}>
                              {item.properties?.attributes ? JSON.stringify(item.properties.attributes) : (item.log_name || 'Activity')}
                          </Text>
                          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                      </View>
                  </View>
              )}
          />
      )}
    </SafeAreaView>
  );
}
