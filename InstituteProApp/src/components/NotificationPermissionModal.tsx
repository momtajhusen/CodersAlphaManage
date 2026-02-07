import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, AppState, Linking } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { responsiveHeight as rh, responsiveWidth as rw, responsiveFontSize as rf } from 'react-native-responsive-dimensions';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../utils/notificationHelper';
import notificationService from '../services/notificationService';
import * as Device from 'expo-device';

export default function NotificationPermissionModal() {
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    // If running in Expo Go, permissions behave differently and might be always granted or limited.
    // We should allow the modal to appear if the backend is missing the token, regardless of device type for testing.
    if (!user) return;

    // Check if app has permission
    const { status } = await Notifications.getPermissionsAsync();
    console.log('Notification Status:', status);
    
    // Check if backend has token
    // The user object in context is { user: User, employee: Employee }
    // We should check user.user.push_token
    const userObj = user?.user || user;
    const backendHasToken = !!(userObj?.push_token);
    
    console.log('User Object:', JSON.stringify(userObj, null, 2));
    console.log('Backend has token:', backendHasToken);
    
    // Open if not granted OR (granted but backend doesn't have token)
    if (status !== 'granted' || (status === 'granted' && !backendHasToken)) {
        console.log('Opening Permission Modal - Missing permissions or token');
        setVisible(true);
    }
  }, [user]);

  useEffect(() => {
    checkStatus();
    
    // Also check when app comes to foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkStatus]);

  const handleEnable = async () => {
    setLoading(true);
    try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
            await notificationService.registerPushToken(token);
            // Refresh user to update local state with new token
            await refreshUser(); 
            setVisible(false);
        } else {
             const { status } = await Notifications.getPermissionsAsync();
             if (status !== 'granted') {
                 Linking.openSettings();
             } else {
                 // Permission granted but failed to get token (e.g. simulator issue that wasn't caught)
                 console.warn('Permission granted but no token returned');
                 setVisible(false); // Close modal to avoid being stuck
             }
        }
    } catch (error) {
        console.error('Failed to enable notifications', error);
    } finally {
        setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
           <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Feather name="bell" size={rf(4)} color={theme.primary} />
           </View>
           
           <Text style={[styles.title, { color: theme.text }]}>Enable Notifications</Text>
           <Text style={[styles.message, { color: theme.subtext }]}>
             To ensure you receive important updates, please enable push notifications.
           </Text>
           
           <TouchableOpacity 
             style={[styles.button, { backgroundColor: theme.primary }]}
             onPress={handleEnable}
             disabled={loading}
           >
             <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Enable Notifications'}</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={styles.skipButton}
             onPress={() => setVisible(false)}
           >
             <Text style={[styles.skipText, { color: theme.subtext }]}>Skip for now</Text>
           </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: rw(5)
  },
  card: {
    width: '100%',
    borderRadius: rw(5),
    padding: rw(6),
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
  iconContainer: {
    width: rw(16),
    height: rw(16),
    borderRadius: rw(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rh(2)
  },
  title: {
    fontSize: rf(2.5),
    fontWeight: 'bold',
    marginBottom: rh(1),
    textAlign: 'center'
  },
  message: {
    fontSize: rf(1.8),
    textAlign: 'center',
    marginBottom: rh(3),
    lineHeight: rh(2.8)
  },
  button: {
    width: '100%',
    paddingVertical: rh(1.8),
    borderRadius: rw(3),
    alignItems: 'center',
    marginBottom: rh(1.5)
  },
  buttonText: {
    color: '#fff',
    fontSize: rf(2),
    fontWeight: '600'
  },
  skipButton: {
    padding: rh(1),
  },
  skipText: {
    fontSize: rf(1.8),
  }
});
