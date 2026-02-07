import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { theme } = useTheme();
  const { register: registerUser, isLoading } = useAuth();
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const { control, handleSubmit, setError, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
    } catch (error: any) {
       if (error.response?.status === 422 && error.response.data.errors) {
         Object.keys(error.response.data.errors).forEach((key) => {
            if (['name', 'email', 'password', 'confirmPassword'].includes(key)) {
              setError(key as any, {
                type: 'server',
                message: error.response.data.errors[key][0],
              });
            }
         });
       }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: rw(6),
      justifyContent: 'center',
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
    },
    subtitle: {
      marginTop: rh(1),
      textAlign: 'center',
      fontSize: rf(1.8),
    },
    form: {
      marginBottom: rh(2),
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
    inputError: {
        borderColor: theme.error || '#ef4444',
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
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
      fontSize: rf(2.2),
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: rh(4),
    },
    footerText: {
      fontSize: rf(1.8),
    },
    linkText: {
      fontSize: rf(1.8),
      fontWeight: 'bold',
    },
    errorText: {
        color: theme.error || '#ef4444',
        fontSize: rf(1.4),
        marginTop: rh(0.5),
        marginLeft: rw(1),
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: theme.card }]}>
              <Feather name="user-plus" size={rf(4)} color={theme.accent} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>Join InstitutePro to manage your institute efficiently</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }, errors.name && styles.inputError]}>
                <Feather name="user" size={rf(2.5)} color={theme.subtext} />
                <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Enter your full name"
                            placeholderTextColor={theme.subtext}
                            value={value}
                            onBlur={onBlur}
                            onChangeText={onChange}
                        />
                    )}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }, errors.email && styles.inputError]}>
                <Feather name="mail" size={rf(2.5)} color={theme.subtext} />
                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Enter your email"
                            placeholderTextColor={theme.subtext}
                            value={value}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    )}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }, errors.password && styles.inputError]}>
                <Feather name="lock" size={rf(2.5)} color={theme.subtext} />
                <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Create a password"
                            placeholderTextColor={theme.subtext}
                            value={value}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            secureTextEntry={secureTextEntry}
                        />
                    )}
                />
                <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
                  <Feather name={secureTextEntry ? "eye-off" : "eye"} size={rf(2.5)} color={theme.subtext} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>

             <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Confirm Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }, errors.confirmPassword && styles.inputError]}>
                <Feather name="lock" size={rf(2.5)} color={theme.subtext} />
                <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Confirm your password"
                            placeholderTextColor={theme.subtext}
                            value={value}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            secureTextEntry={secureTextEntry}
                        />
                    )}
                />
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.accent }, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.subtext }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkText, { color: theme.accent }]}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
