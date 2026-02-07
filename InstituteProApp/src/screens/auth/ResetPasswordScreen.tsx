import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import authService from '../../services/authService';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const { theme } = useTheme();
  
  const [email, setEmail] = useState(route.params?.email || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    if (!email || !otp || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({
        email,
        otp,
        password,
        password_confirmation: confirmPassword,
      });

      if (response.success) {
        Alert.alert('Success', 'Password reset successfully', [
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.card }]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={rf(3)} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: theme.card }]}>
              <Feather name="lock" size={rf(4)} color={theme.accent} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Enter the OTP sent to {email} and your new password.
            </Text>
          </View>

          <View style={styles.form}>
            {/* OTP Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>OTP Code</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Feather name="hash" size={rf(2.5)} color={theme.subtext} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={theme.subtext}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </View>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Feather name="lock" size={rf(2.5)} color={theme.subtext} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={theme.subtext}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? "eye" : "eye-off"} size={rf(2.5)} color={theme.subtext} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Confirm Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Feather name="lock" size={rf(2.5)} color={theme.subtext} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Re-enter password"
                  placeholderTextColor={theme.subtext}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={rf(2.5)} color={theme.subtext} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.accent, opacity: loading ? 0.7 : 1 }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: rw(6),
  },
  backButton: {
    width: rw(10),
    height: rw(10),
    borderRadius: rw(5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rh(4),
  },
  header: {
    alignItems: 'center',
    marginBottom: rh(4),
  },
  logoContainer: {
    width: rw(16),
    height: rw(16),
    borderRadius: rw(4),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rh(2),
  },
  title: {
    fontSize: rf(3.5),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: rh(1),
    textAlign: 'center',
    fontSize: rf(1.8),
    paddingHorizontal: rw(4),
  },
  form: {
    //
  },
  inputContainer: {
    marginBottom: rh(2),
  },
  label: {
    fontSize: rf(1.8),
    fontWeight: '500',
    marginBottom: rh(0.5),
    marginLeft: rw(1),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: rw(3),
    paddingHorizontal: rw(4),
    height: rh(6),
  },
  input: {
    flex: 1,
    marginLeft: rw(3),
    fontSize: rf(1.8),
  },
  button: {
    width: '100%',
    paddingVertical: rh(1.8),
    borderRadius: rw(3),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rh(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: rf(2.2),
    fontWeight: '600',
  },
});