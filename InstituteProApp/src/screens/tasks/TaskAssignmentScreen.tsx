import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';

export default function TaskAssignmentScreen() {
  const navigation = useNavigation();
  const [employee, setEmployee] = useState('');
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const { theme } = useTheme();

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
      borderColor: theme.border,
    },
    backButton: {
      marginRight: rw(4),
    },
    headerTitle: {
      fontSize: rf(2.5),
      fontWeight: 'bold',
      color: theme.text,
    },
    content: {
      flex: 1,
      padding: rw(4),
    },
    formGroup: {
      marginBottom: rh(2),
    },
    label: {
      color: theme.text,
      fontWeight: '500',
      marginBottom: rh(1),
      fontSize: rf(2),
    },
    inputContainer: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: rw(3),
      paddingHorizontal: rw(4),
      paddingVertical: rh(1.5),
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      marginLeft: rw(3),
      color: theme.text,
      fontSize: rf(2),
    },
    priorityContainer: {
      flexDirection: 'row',
      gap: rw(3),
    },
    priorityButton: {
      paddingHorizontal: rw(4),
      paddingVertical: rh(1),
      borderRadius: rw(2),
      borderWidth: 1,
    },
    priorityButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    priorityButtonInactive: {
      backgroundColor: theme.card,
      borderColor: theme.border,
    },
    priorityTextActive: {
      color: '#ffffff',
      fontWeight: '500',
      fontSize: rf(1.8),
    },
    priorityTextInactive: {
      color: theme.subtext,
      fontWeight: '500',
      fontSize: rf(1.8),
    },
    footer: {
      padding: rw(4),
      borderTopWidth: 1,
      borderColor: theme.border,
    },
    submitButton: {
      backgroundColor: theme.primary,
      height: rh(7),
      borderRadius: rw(3),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.shadow,
      shadowOffset: theme.shadowOffset,
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: theme.shadowRadius,
      elevation: 2,
    },
    submitButtonText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: rf(2.2),
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Task</Text>
      </View>

      <ScrollView style={styles.content}>
        <View>
             <View style={styles.formGroup}>
                <Text style={styles.label}>Assign To (Employee Name)</Text>
                <View style={styles.inputContainer}>
                    <Feather name="user" size={20} color={theme.subtext} />
                    <TextInput 
                        style={styles.input}
                        placeholder="Select Employee"
                        placeholderTextColor={theme.subtext}
                        value={employee}
                        onChangeText={setEmployee}
                    />
                </View>
             </View>

             <View style={styles.formGroup}>
                <Text style={styles.label}>Task Title</Text>
                <View style={styles.inputContainer}>
                    <Feather name="type" size={20} color={theme.subtext} />
                    <TextInput 
                        style={styles.input}
                        placeholder="Enter task title"
                        placeholderTextColor={theme.subtext}
                        value={task}
                        onChangeText={setTask}
                    />
                </View>
             </View>

             <View style={styles.formGroup}>
                <Text style={styles.label}>Due Date</Text>
                <View style={styles.inputContainer}>
                    <Feather name="calendar" size={20} color={theme.subtext} />
                    <TextInput 
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.subtext}
                        value={dueDate}
                        onChangeText={setDueDate}
                    />
                </View>
             </View>

             <View style={styles.formGroup}>
                <Text style={[styles.label, { marginBottom: rh(1) }]}>Priority</Text>
                <View style={styles.priorityContainer}>
                    {['High', 'Medium', 'Low'].map((p) => (
                        <TouchableOpacity 
                            key={p}
                            style={[
                                styles.priorityButton,
                                priority === p ? styles.priorityButtonActive : styles.priorityButtonInactive
                            ]}
                            onPress={() => setPriority(p)}
                        >
                            <Text style={priority === p ? styles.priorityTextActive : styles.priorityTextInactive}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
             </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
            style={styles.submitButton}
            onPress={() => navigation.goBack()}
        >
            <Text style={styles.submitButtonText}>Assign Task</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
