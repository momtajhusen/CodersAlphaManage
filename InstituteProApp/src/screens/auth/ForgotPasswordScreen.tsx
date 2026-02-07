import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import authService from '../../services/authService';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendResetLink = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        Alert.alert(
          'Success', 
          'Reset link (OTP) has been sent to your email.',
          [
            { 
              text: 'Enter OTP', 
              onPress: () => navigation.navigate('ResetPassword', { email }) 
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to send reset link');
      }
    } catch (error: any) {
      console.log('Forgot Password Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong. Please try again.');
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
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.card }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={rf(3)} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: theme.card }]}>
              <Feather name="key" size={rf(4)} color={theme.accent} />
            </View>
          <Text style={[styles.title, { color: theme.text }]}>Forgot Password?</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Feather name="mail" size={rf(2.5)} color={theme.subtext} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.subtext}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.accent, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSendResetLink}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>
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