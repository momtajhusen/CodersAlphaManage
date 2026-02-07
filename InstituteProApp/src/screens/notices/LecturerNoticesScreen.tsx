import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { responsiveHeight as rh, responsiveWidth as rw, responsiveFontSize as rf } from 'react-native-responsive-dimensions';
import { useTheme } from '../../themes/ThemeContext';
import noticeService, { Notice } from '../../services/noticeService';

export default function LecturerNoticesScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotices = async () => {
      try {
          const response = await noticeService.getNotices({ 
              search: searchQuery,
              // audience: 'lecturers' // Optionally filter by audience if needed
          });
          if (response.success && response.data) {
              setNotices(response.data.data);
          }
      } catch (error) {
          console.error('Failed to fetch notices', error);
      } finally {
          setLoading(false);
          setRefreshing(false);
      }
  };

  useFocusEffect(
      useCallback(() => {
          fetchNotices();
      }, [searchQuery]) // Re-fetch when search query changes
  );

  const onRefresh = () => {
      setRefreshing(true);
      fetchNotices();
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
    headerTitle: {
      fontSize: rf(2.2),
      fontWeight: 'bold',
      color: theme.text,
      marginLeft: rw(4),
    },
    searchContainer: {
      padding: rw(4),
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: rw(2),
      paddingHorizontal: rw(3),
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: rh(1.2),
      marginLeft: rw(2),
      color: theme.text,
      fontSize: rf(1.8),
    },
    listContent: {
      padding: rw(4),
      paddingBottom: rh(10),
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: rw(3),
      padding: rw(4),
      marginBottom: rh(2),
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
      alignItems: 'flex-start',
      marginBottom: rh(1),
    },
    title: {
      fontSize: rf(2),
      fontWeight: 'bold',
      color: theme.text,
      flex: 1,
      marginRight: rw(2),
    },
    date: {
      fontSize: rf(1.6),
      color: theme.subtext,
    },
    content: {
      fontSize: rf(1.8),
      color: theme.text,
      lineHeight: rh(2.5),
    },
    importantTag: {
      backgroundColor: theme.error + '20', // 20% opacity
      paddingHorizontal: rw(2),
      paddingVertical: rh(0.5),
      borderRadius: rw(1),
      alignSelf: 'flex-start',
      marginBottom: rh(1),
    },
    importantText: {
      color: theme.error,
      fontSize: rf(1.4),
      fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: rh(10),
    },
    emptyText: {
        color: theme.subtext,
        fontSize: rf(2),
        marginTop: rh(2),
    }
  });

  const renderItem = ({ item }: { item: Notice }) => (
    <TouchableOpacity style={styles.card}>
      {item.is_important && (
        <View style={styles.importantTag}>
          <Text style={styles.importantText}>IMPORTANT</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{new Date(item.date || item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.content}>{item.content}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notices</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color={theme.subtext} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notices..."
            placeholderTextColor={theme.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={18} color={theme.subtext} />
              </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.primary} />
          </View>
      ) : (
          <FlatList
            data={notices}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Feather name="info" size={rw(12)} color={theme.border} />
                    <Text style={styles.emptyText}>No notices found</Text>
                </View>
            }
          />
      )}
    </SafeAreaView>
  );
}
