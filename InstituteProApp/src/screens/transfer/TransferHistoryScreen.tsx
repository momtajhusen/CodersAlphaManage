import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { getCashTransfers, CashTransfer, deleteCashTransfer } from '../../services/transferService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Toast from 'react-native-toast-message';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';

export default function TransferHistoryScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [transfers, setTransfers] = useState<CashTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadTransfers = async (pageNum: number, isLoadMore: boolean = false) => {
    if (!isLoadMore && !refreshing) setIsLoading(true);
    if (isLoadMore) setIsLoadingMore(true);

    try {
      const response = await getCashTransfers({ page: pageNum, per_page: 20 });
      // response.data is the paginator
      const paginator = response.data;
      const newTransfers = paginator.data || [];
      
      if (isLoadMore) {
        setTransfers(prev => [...prev, ...newTransfers]);
      } else {
        setTransfers(newTransfers);
      }

      setHasMore(paginator.current_page < paginator.last_page);
    } catch (error) {
      console.error('Error loading transfers:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load transfer history'
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setHasMore(true);
      loadTransfers(1, false);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadTransfers(1, false);
  };

  const loadMore = () => {
    if (!isLoadingMore && !isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTransfers(nextPage, true);
    }
  };

  const handleEdit = (item: CashTransfer) => {
    navigation.navigate('TransferMoney', { transfer: item });
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Transfer',
      'Are you sure you want to delete this transfer? This will revert the balance changes for both parties.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCashTransfer(id);
              Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Transfer deleted successfully'
              });
              onRefresh();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: error.response?.data?.message || 'Could not delete transfer'
              });
            }
          }
        }
      ]
    );
  };

  const renderTransferItem = ({ item, index }: { item: CashTransfer, index: number }) => (
    <AnimatedEntry delay={index * 100} from="bottom">
    <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
      {/* Header: Date and Amount */}
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Feather name="calendar" size={rf(1.4)} color={theme.subtext} style={{ marginRight: 6 }} />
          <Text style={[styles.date, { color: theme.subtext }]}>
            {formatDate(item.transfer_date)}
          </Text>
        </View>
        <Text style={[styles.amount, { color: theme.text }]}>
          {formatCurrency(item.amount)}
        </Text>
      </View>

      {/* Transfer Flow - Compact Row */}
      <View style={styles.transferFlow}>
        {/* Sender */}
        <View style={styles.partyWrapper}>
          <View style={[styles.compactAvatar, { backgroundColor: '#3b82f620' }]}>
            <Text style={[styles.compactAvatarText, { color: '#3b82f6' }]}>
              {item.sender?.full_name?.charAt(0) || 'S'}
            </Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={[styles.partyName, { color: theme.text }]} numberOfLines={1}>
              {item.sender?.full_name || 'Unnamed Sender'}
            </Text>
            <Text style={[styles.partyLabel, { color: theme.subtext }]}>Sender</Text>
          </View>
        </View>

        {/* Arrow Indicator */}
        <View style={styles.arrowWrapper}>
          <Feather name="arrow-right" size={rw(5)} color={theme.subtext} />
        </View>

        {/* Receiver */}
        <View style={[styles.partyWrapper, { justifyContent: 'flex-end' }]}>
          <View style={styles.nameContainer}>
            <Text style={[styles.partyName, { color: theme.text, textAlign: 'right' }]} numberOfLines={1}>
              {item.receiver?.full_name || 'Unnamed Receiver'}
            </Text>
            <Text style={[styles.partyLabel, { color: theme.subtext, textAlign: 'right' }]}>Receiver</Text>
          </View>
          <View style={[styles.compactAvatar, { backgroundColor: '#10b98120' }]}>
            <Text style={[styles.compactAvatarText, { color: '#10b981' }]}>
              {item.receiver?.full_name?.charAt(0) || 'R'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Footer: Notes and Actions */}
      <View style={styles.footerRow}>
        <View style={[styles.noteContainer, { backgroundColor: theme.background, flex: 1, marginRight: 10 }]}>
          <Text style={[styles.notes, { color: theme.subtext }]} numberOfLines={1}>
            <Text style={{fontWeight: '600'}}>Note: </Text>{item.notes || 'No notes'}
          </Text>
        </View>

        <View style={styles.actionButtons}>
            <ScalePressable 
                style={[styles.actionBtn, { backgroundColor: '#3b82f615' }]} 
                onPress={() => handleEdit(item)}
            >
                <Feather name="edit-2" size={20} color="#3b82f6" />
            </ScalePressable>
            <ScalePressable 
                style={[styles.actionBtn, { backgroundColor: '#ef444415', marginLeft: 10 }]} 
                onPress={() => handleDelete(item.id)}
            >
                <Feather name="trash-2" size={20} color="#ef4444" />
            </ScalePressable>
        </View>
      </View>
    </View>
    </AnimatedEntry>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <AnimatedEntry delay={100} from="top">
      <View style={styles.header}>
        <ScalePressable 
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </ScalePressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transfer History</Text>
      </View>
      </AnimatedEntry>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={transfers}
          renderItem={renderTransferItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Feather name="repeat" size={48} color={theme.subtext} style={{ opacity: 0.5, marginBottom: 10 }} />
              <Text style={{ color: theme.subtext, fontSize: rf(2) }}>No transfers found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rw(5),
    paddingVertical: rh(2),
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    marginRight: rw(4),
  },
  headerTitle: {
    fontSize: rf(2.5),
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: rw(5),
    paddingBottom: rh(10),
  },
  card: {
    borderRadius: 16,
    padding: rw(4),
    marginBottom: rh(1.5),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rh(1.5),
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: rf(1.5),
    fontWeight: '500',
  },
  amount: {
    fontSize: rf(2.2),
    fontWeight: 'bold',
  },
  transferFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rh(1),
  },
  partyWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginLeft: 8,
  },
  compactAvatarText: {
    fontSize: rf(1.8),
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
  },
  partyName: {
    fontSize: rf(1.6),
    fontWeight: '600',
  },
  partyLabel: {
    fontSize: rf(1.3),
    marginTop: 2,
  },
  arrowWrapper: {
    paddingHorizontal: 10,
  },
  noteContainer: {
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  notes: {
    fontSize: rf(1.5),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rh(1),
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
