import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../themes/ThemeContext';
import { rw, rh, rf } from '../../constants/responsive';
import Header from '../../components/Header';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

// Assuming API_URL is available in a config file or similar, 
// otherwise I'll need to find where it's defined. 
// For now, I'll rely on the axios instance if it's set up globally, 
// or import it from services/api if it exists.
// Checking previous file context, usually services/api is used.
import api from '../../services/api'; 

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    // Reset errors
    setErrors({});
    let hasError = false;
    const newErrors: { current?: string; new?: string; confirm?: string } = {};

    // Validation
    if (!currentPassword) {
      newErrors.current = 'Current password is required';
      hasError = true;
    }

    if (!newPassword) {
      newErrors.new = 'New password is required';
      hasError = true;
    } else if (newPassword.length < 8) {
      newErrors.new = 'New password must be at least 8 characters long';
      hasError = true;
    }

    if (!confirmPassword) {
      newErrors.confirm = 'Please confirm your new password';
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = 'New passwords do not match';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password changed successfully',
      });
      
      navigation.goBack();
      
    } catch (error: any) {
      console.error('Change password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      
      // Handle backend validation errors if structured
      if (error.response?.data?.errors) {
         const backendErrors = error.response.data.errors;
         const updatedErrors: any = {};
         if (backendErrors.current_password) updatedErrors.current = backendErrors.current_password[0];
         if (backendErrors.new_password) updatedErrors.new = backendErrors.new_password[0];
         if (backendErrors.new_password_confirmation) updatedErrors.confirm = backendErrors.new_password_confirmation[0];
         
         if (Object.keys(updatedErrors).length > 0) {
            setErrors(updatedErrors);
            // Also show toast for visibility
            Toast.show({
              type: 'error',
              text1: 'Validation Error',
              text2: 'Please check the highlighted fields',
            });
            return; 
         }
      }

      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: rw(4),
    },
    inputContainer: {
      marginBottom: rh(2),
    },
    label: {
      color: theme.text,
      fontSize: rf(1.8),
      marginBottom: rh(1),
      fontWeight: '500',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: rw(2),
      paddingHorizontal: rw(3),
      height: rh(6),
    },
    input: {
      flex: 1,
      color: theme.text,
      fontSize: rf(1.8),
      height: '100%',
    },
    eyeIcon: {
      padding: rw(2),
    },
    buttonContainer: {
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
      borderRadius: rw(3),
      paddingVertical: rh(1.8),
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    buttonText: {
      color: '#fff',
      fontSize: rf(2),
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    helperText: {
      color: theme.subtext,
      fontSize: rf(1.5),
      marginTop: rh(0.5),
    },
    errorText: {
      color: '#ef4444',
      fontSize: rf(1.4),
      marginTop: rh(0.5),
      marginLeft: rw(1),
    },
    footer: {
      padding: rw(4),
      backgroundColor: theme.card,
      borderTopWidth: 1,
      borderColor: theme.border,
    }
  });

  return (
    <View style={styles.container}>
      <Header title="Change Password" showBack />
      
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={theme.subtext}
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeIcon}
            >
              <Feather name={showCurrentPassword ? "eye" : "eye-off"} size={20} color={theme.subtext} />
            </TouchableOpacity>
          </View>
          {errors.current && <Text style={styles.errorText}>{errors.current}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={(text) => { setNewPassword(text); if(errors.new) setErrors({...errors, new: undefined}); }}
              placeholder="Enter new password"
              placeholderTextColor={theme.subtext}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}
            >
              <Feather name={showNewPassword ? "eye" : "eye-off"} size={20} color={theme.subtext} />
            </TouchableOpacity>
          </View>
          {errors.new ? (
            <Text style={styles.errorText}>{errors.new}</Text>
          ) : (
            <Text style={styles.helperText}>Must be at least 8 characters long</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); if(errors.confirm) setErrors({...errors, confirm: undefined}); }}
              placeholder="Confirm new password"
              placeholderTextColor={theme.subtext}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color={theme.subtext} />
            </TouchableOpacity>
          </View>
          {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.buttonContainer, { backgroundColor: theme.primary }]}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.buttonText}>Update Password</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
