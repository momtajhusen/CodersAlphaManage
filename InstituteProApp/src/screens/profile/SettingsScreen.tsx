import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rw, rh, rf } from '../../constants/responsive';
import Header from '../../components/Header';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, scheme, toggle } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
    loadBiometricPreference();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricSupported(compatible && enrolled);
  };

  const loadBiometricPreference = async () => {
    try {
      const saved = await SecureStore.getItemAsync('biometric_enabled');
      if (saved === 'true') {
        setBiometric(true);
      }
    } catch (error) {
      console.log('Error loading biometric preference', error);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // User wants to enable
      if (!isBiometricSupported) {
        Alert.alert(
          'Not Available',
          'Biometric authentication is not available or no biometrics are enrolled on this device.'
        );
        return;
      }
      setModalVisible(true);
    } else {
      // User wants to disable
      setBiometric(false);
      await SecureStore.setItemAsync('biometric_enabled', 'false');
    }
  };

  const confirmEnableBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Biometric Setup',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        setBiometric(true);
        await SecureStore.setItemAsync('biometric_enabled', 'true');
        setModalVisible(false);
        Toast.show({
          type: 'success',
          text1: 'Biometric Enabled',
          text2: 'You can now use biometric login.',
        });
      }
    } catch (error) {
      console.log('Biometric error:', error);
      Alert.alert('Error', 'Failed to authenticate.');
    }
  };


  const iconColor = theme.text;
  
  // Dynamic styles based on theme
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
    sectionTitle: {
      color: theme.subtext,
      fontSize: rf(1.5),
      textTransform: 'uppercase',
      fontWeight: 'bold',
      marginBottom: rh(1),
      marginLeft: rw(1),
      marginTop: rh(1),
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: rw(3),
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      marginBottom: rh(3),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: rw(4),
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    iconContainer: {
      width: rw(8),
      height: rw(8),
      borderRadius: rw(2),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: rw(3),
    },
    rowText: {
      color: theme.text,
      fontWeight: '500',
      fontSize: rf(1.8),
    },
    flexRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.card,
      width: '85%',
      borderRadius: rw(5),
      padding: rw(6),
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalIcon: {
      width: rw(16),
      height: rw(16),
      borderRadius: rw(8),
      backgroundColor: scheme === 'dark' ? 'rgba(37, 99, 235, 0.2)' : '#dbeafe',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: rh(2),
    },
    modalTitle: {
      fontSize: rf(2.2),
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: rh(1),
      textAlign: 'center',
    },
    modalText: {
      fontSize: rf(1.8),
      color: theme.subtext,
      textAlign: 'center',
      marginBottom: rh(3),
      lineHeight: rh(2.5),
    },
    modalButtons: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
    },
    modalButton: {
      flex: 1,
      paddingVertical: rh(1.5),
      borderRadius: rw(3),
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: scheme === 'dark' ? '#374151' : '#f3f4f6',
      marginRight: rw(2),
    },
    confirmButton: {
      backgroundColor: '#2563eb',
      marginLeft: rw(2),
    },
    cancelButtonText: {
      color: theme.text,
      fontWeight: '600',
      fontSize: rf(1.8),
    },
    confirmButtonText: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: rf(1.8),
    }
  });

  return (
    <View style={styles.container}>
      <Header title="Settings" showBack />

      <ScrollView style={{ flex: 1, padding: rw(4) }}>
        
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
            <View style={[styles.row, styles.rowBorder]}>
                <View style={styles.flexRow}>
                    <View style={[styles.iconContainer, { backgroundColor: scheme === 'dark' ? 'rgba(37, 99, 235, 0.2)' : '#dbeafe' }]}>
                        <Feather name="bell" size={rf(2.2)} color="#2563eb" />
                    </View>
                    <Text style={styles.rowText}>Push Notifications</Text>
                </View>
                <Switch 
                    value={notifications} 
                    onValueChange={setNotifications} 
                    trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
                    thumbColor={notifications ? "#2563eb" : "#f3f4f6"}
                />
            </View>
            <View style={styles.row}>
                <View style={styles.flexRow}>
                    <View style={[styles.iconContainer, { backgroundColor: scheme === 'dark' ? 'rgba(124, 58, 237, 0.2)' : '#f3e8ff' }]}>
                        <Feather name="moon" size={rf(2.2)} color="#7c3aed" />
                    </View>
                    <Text style={styles.rowText}>Dark Mode</Text>
                </View>
                <Switch 
                    value={scheme === 'dark'} 
                    onValueChange={toggle} 
                    trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
                    thumbColor={scheme === 'dark' ? "#2563eb" : "#f3f4f6"}
                />
            </View>
        </View>

        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.card}>
            <TouchableOpacity 
                style={[styles.row, styles.rowBorder]}
                onPress={() => navigation.navigate('ChangePassword' as never)}
            >
                <View style={styles.flexRow}>
                    <View style={[styles.iconContainer, { backgroundColor: scheme === 'dark' ? 'rgba(5, 150, 105, 0.2)' : '#d1fae5' }]}>
                        <Feather name="lock" size={rf(2.2)} color="#059669" />
                    </View>
                    <Text style={styles.rowText}>Change Password</Text>
                </View>
                <Feather name="chevron-right" size={rf(2.5)} color={theme.subtext} />
            </TouchableOpacity>
            <View style={styles.row}>
                <View style={styles.flexRow}>
                    <View style={[styles.iconContainer, { backgroundColor: scheme === 'dark' ? 'rgba(234, 88, 12, 0.2)' : '#ffedd5' }]}>
                        <Feather name="shield" size={rf(2.2)} color="#ea580c" />
                    </View>
                    <Text style={styles.rowText}>Biometric Login</Text>
                </View>
                <Switch 
                    value={biometric} 
                    onValueChange={handleBiometricToggle} 
                    trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
                    thumbColor={biometric ? "#2563eb" : "#f3f4f6"}
                />
            </View>
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
            <TouchableOpacity 
                style={[styles.row, styles.rowBorder]}
                onPress={() => navigation.navigate('HelpCenter' as never)}
            >
                <View style={styles.flexRow}>
                    <View style={[styles.iconContainer, { backgroundColor: scheme === 'dark' ? 'rgba(79, 70, 229, 0.2)' : '#e0e7ff' }]}>
                        <Feather name="help-circle" size={rf(2.2)} color="#4f46e5" />
                    </View>
                    <Text style={styles.rowText}>Help Center</Text>
                </View>
                <Feather name="chevron-right" size={rf(2.5)} color={theme.subtext} />
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.row}
                onPress={() => navigation.navigate('AboutApp' as never)}
            >
                <View style={styles.flexRow}>
                    <View style={[styles.iconContainer, { backgroundColor: scheme === 'dark' ? 'rgba(13, 148, 136, 0.2)' : '#ccfbf1' }]}>
                        <Feather name="info" size={rf(2.2)} color="#0d9488" />
                    </View>
                    <Text style={styles.rowText}>About App</Text>
                </View>
                <Feather name="chevron-right" size={rf(2.5)} color={theme.subtext} />
            </TouchableOpacity>
        </View>
        
        <View style={{ height: rh(4) }} />
      </ScrollView>

      {/* Biometric Privacy Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Feather name="shield" size={rf(4)} color="#2563eb" />
            </View>
            <Text style={styles.modalTitle}>Enable Biometric Login</Text>
            <Text style={styles.modalText}>
              Enhance your account security by enabling biometric authentication. 
              You can use your fingerprint or face ID to log in quickly and securely.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmEnableBiometric}
              >
                <Text style={styles.confirmButtonText}>Enable</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
