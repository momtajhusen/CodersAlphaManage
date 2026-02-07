import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { responsiveHeight as rh, responsiveWidth as rw, responsiveFontSize as rf } from 'react-native-responsive-dimensions';
import { useTheme } from '../../themes/ThemeContext';

const myTasks = [
  { id: '1', title: 'Prepare Monthly Report', due: 'Today', status: 'Pending', priority: 'High' },
  { id: '2', title: 'Client Meeting Preparation', due: 'Tomorrow', status: 'In Progress', priority: 'Medium' },
  { id: '3', title: 'Update Software', due: 'Next Week', status: 'Completed', priority: 'Low' },
];

export default function MyAssignmentsScreen() {
  const navigation = useNavigation();
  const { theme, scheme } = useTheme();

  const getPriorityColors = (priority: string) => {
    switch(priority) {
      case 'High': return { text: '#ef4444', bg: scheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2' };
      case 'Medium': return { text: '#f97316', bg: scheme === 'dark' ? 'rgba(249, 115, 22, 0.2)' : '#fff7ed' };
      case 'Low': return { text: '#22c55e', bg: scheme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : '#f0fdf4' };
      default: return { text: '#6b7280', bg: scheme === 'dark' ? 'rgba(107, 114, 128, 0.2)' : '#f9fafb' };
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
    },
    taskCard: {
      backgroundColor: theme.card,
      padding: rw(4),
      borderRadius: rw(3),
      marginBottom: rh(1.5),
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
    priorityBadge: {
      paddingHorizontal: rw(2),
      paddingVertical: rh(0.5),
      borderRadius: rw(1),
    },
    priorityText: {
      fontSize: rf(1.5),
      fontWeight: 'bold',
    },
    dueText: {
      fontSize: rf(1.5),
      color: theme.subtext,
    },
    taskTitle: {
      fontSize: rf(2.2),
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: rh(0.5),
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: rh(1),
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusText: {
      fontSize: rf(1.8),
      color: theme.subtext,
      marginLeft: rw(1),
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Assignments</Text>
      </View>

      <FlatList
        data={myTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
            const priorityColors = getPriorityColors(item.priority);
            return (
                <TouchableOpacity style={styles.taskCard}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}>
                            <Text style={[styles.priorityText, { color: priorityColors.text }]}>{item.priority}</Text>
                        </View>
                        <Text style={styles.dueText}>{item.due}</Text>
                    </View>
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    <View style={styles.cardFooter}>
                         <View style={styles.statusContainer}>
                            <Feather name={item.status === 'Completed' ? 'check-circle' : 'clock'} size={14} color={item.status === 'Completed' ? '#10b981' : '#f59e0b'} />
                            <Text style={styles.statusText}>{item.status}</Text>
                         </View>
                         <Feather name="chevron-right" size={18} color={theme.subtext} />
                    </View>
                </TouchableOpacity>
            );
        }}
      />
    </SafeAreaView>
  );
}
