import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../themes/ThemeContext';
import { rw, rh, rf } from '../../constants/responsive';
import { Feather } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedEntry } from '../../components/AnimatedEntry';
import { ScalePressable } from '../../components/ScalePressable';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { theme, scheme } = useTheme();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      // Check if hardware supports it
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      // Check if we have stored credentials
      const email = await SecureStore.getItemAsync('userEmail');
      const password = await SecureStore.getItemAsync('userPassword');
      
      if (compatible && enrolled && email && password) {
        setIsBiometricAvailable(true);
        // Optional: Auto-prompt can be enabled here if desired, 
        // but user usually prefers tapping the button.
      }
    } catch (error) {
      console.log('Biometric check failed', error);
    }
  };

  const handleBiometricLogin = async () => {
    setIsAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        const email = await SecureStore.getItemAsync('userEmail');
        const password = await SecureStore.getItemAsync('userPassword');

        if (email && password) {
          await login({ email, password });
        } else {
          Alert.alert('Error', 'Credentials not found. Please login with password first.');
          setIsBiometricAvailable(false);
        }
      }
    } catch (error) {
      console.log('Biometric login failed', error);
      Alert.alert('Error', 'Biometric authentication failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const { control, handleSubmit, setError, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error: any) {
      if (error.response?.status === 422 && error.response.data.errors) {
        Object.keys(error.response.data.errors).forEach((key) => {
           if (key === 'email' || key === 'password') {
             setError(key, {
               type: 'server',
               message: error.response.data.errors[key][0],
             });
           }
        });
      } else {
        // Handle generic errors if needed
        console.error(error);
      }
    }
  };

  const isDark = scheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <AnimatedEntry delay={100} from="top">
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.card }]}>
              <Image 
                source={require('../../../assets/icon.png')} 
                style={styles.logoIcon}
                resizeMode="cover"
              />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Welcome Back!</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Sign in to access your dashboard
            </Text>
          </View>
          </AnimatedEntry>

          {/* Form Section */}
          <View style={styles.form}>
            {/* Email Input */}
            <AnimatedEntry delay={200} from="bottom">
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: theme.card,
                      borderColor: errors.email ? theme.error : theme.border 
                    }
                  ]}>
                    <Feather name="mail" size={20} color={theme.subtext} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Enter your email"
                      placeholderTextColor={theme.subtext}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {errors.email.message}
                </Text>
              )}
            </View>
            </AnimatedEntry>

            {/* Password Input */}
            <AnimatedEntry delay={300} from="bottom">
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: theme.card,
                      borderColor: errors.password ? theme.error : theme.border 
                    }
                  ]}>
                    <Feather name="lock" size={20} color={theme.subtext} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Enter your password"
                      placeholderTextColor={theme.subtext}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Feather 
                        name={showPassword ? "eye" : "eye-off"} 
                        size={20} 
                        color={theme.subtext} 
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {errors.password.message}
                </Text>
              )}
            </View>
            </AnimatedEntry>

            {/* Forgot Password Link */}
            <AnimatedEntry delay={400} from="bottom">
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.accent }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
            </AnimatedEntry>

            {/* Biometric Login Button */}
            {isBiometricAvailable && (
              <AnimatedEntry delay={450} from="bottom">
                <TouchableOpacity 
                  style={[styles.biometricButton, { borderColor: theme.border }]}
                  onPress={handleBiometricLogin}
                  disabled={isLoading || isAuthenticating}
                >
                  {isAuthenticating ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="fingerprint" size={rf(3)} color={theme.accent} />
                      <Text style={[styles.biometricText, { color: theme.text }]}>Login with Biometrics</Text>
                    </>
                  )}
                </TouchableOpacity>
              </AnimatedEntry>
            )}

            {/* Login Button */}
            <AnimatedEntry delay={500} from="bottom">
            <ScalePressable
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={styles.buttonContainer}
            >
              <LinearGradient
                colors={[theme.accent, theme.accent]} // Can add a secondary color if available, or just use accent
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Log In</Text>
                )}
              </LinearGradient>
            </ScalePressable>
            </AnimatedEntry>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: rw(6),
    justifyContent: 'center',
    paddingBottom: rh(4),
  },
  header: {
    alignItems: 'center',
    marginBottom: rh(5),
  },
  iconContainer: {
    width: rw(20),
    height: rw(20),
    borderRadius: rw(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rh(2),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  logoIcon: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: rf(3.5),
    fontWeight: 'bold',
    marginBottom: rh(1),
  },
  subtitle: {
    fontSize: rf(1.8),
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: rh(2.5),
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rh(1.5),
    borderWidth: 1,
    borderRadius: rw(3),
    marginBottom: rh(2.5),
    gap: rw(2),
  },
  biometricText: {
    fontSize: rf(1.8),
    fontWeight: '600',
  },
  label: {
    fontSize: rf(1.8),
    marginBottom: rh(1),
    fontWeight: '600',
    marginLeft: rw(1),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: rh(6.5),
    borderRadius: rw(3),
    borderWidth: 1,
    paddingHorizontal: rw(4),
  },
  inputIcon: {
    marginRight: rw(3),
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: rf(1.8),
  },
  eyeIcon: {
    padding: rw(2),
  },
  errorText: {
    fontSize: rf(1.4),
    marginTop: rh(0.5),
    marginLeft: rw(1),
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: rh(4),
  },
  forgotPasswordText: {
    fontSize: rf(1.6),
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    borderRadius: rw(3),
    overflow: 'hidden',
    marginBottom: rh(3),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  gradientButton: {
    width: '100%',
    height: rh(6.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: rf(2.2),
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: rf(1.8),
    marginRight: rw(1),
  },
  footerLink: {
    fontSize: rf(1.8),
    fontWeight: 'bold',
  },
});
