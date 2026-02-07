import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../themes/ThemeContext';
import { rw, rh, rf } from '../constants/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ScalePressable } from '../components/ScalePressable';
import { AnimatedEntry } from '../components/AnimatedEntry';

interface BiometricLockScreenProps {
  onUnlock: () => void;
}

export default function BiometricLockScreen({ onUnlock }: BiometricLockScreenProps) {
  const { theme, scheme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={scheme === 'dark' 
          ? ['rgba(26, 35, 50, 0)', 'rgba(255, 107, 53, 0.05)'] 
          : ['rgba(255, 255, 255, 0)', 'rgba(255, 107, 53, 0.05)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.content}>
        
        <AnimatedEntry delay={100} from="top">
          <View style={[styles.logoContainer, { 
            shadowColor: theme.shadow,
            backgroundColor: theme.card
          }]}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={200} from="top">
          <Text style={[styles.appName, { color: theme.text }]}>CodersAlpha Manager</Text>
        </AnimatedEntry>
        
        <AnimatedEntry delay={300}>
          <View style={[styles.statusContainer, { 
            backgroundColor: scheme === 'dark' ? 'rgba(255, 107, 53, 0.15)' : '#fff7ed', 
            borderColor: scheme === 'dark' ? 'rgba(255, 107, 53, 0.3)' : '#ffedd5' 
          }]}>
            <Feather name="lock" size={rf(1.8)} color={theme.accent} style={{ marginRight: rw(2) }} />
            <Text style={[styles.statusText, { color: theme.accent }]}>App Secured</Text>
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={400}>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Welcome back! Please authenticate to access your workspace.
          </Text>
        </AnimatedEntry>

        <AnimatedEntry delay={500} from="bottom">
          <ScalePressable onPress={onUnlock} style={[styles.buttonWrapper, { shadowColor: theme.accent }]}>
            <LinearGradient
              colors={[theme.accent, '#e65100']} // Orange Gradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="fingerprint" size={rf(3)} color={theme.accent} />
              </View>
              <Text style={styles.buttonText}>Tap to Unlock</Text>
              <Feather name="chevron-right" size={rf(2.2)} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </ScalePressable>
        </AnimatedEntry>

      </View>
      
      <AnimatedEntry delay={600} from="bottom" style={styles.footerContainer}>
        <View style={styles.footer}>
          <MaterialCommunityIcons name="shield-check-outline" size={rf(1.6)} color={theme.subtext} style={{ marginRight: rw(1) }} />
          <Text style={[styles.footerText, { color: theme.subtext }]}>Secured by CodersAlpha</Text>
        </View>
      </AnimatedEntry>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '85%',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: rh(5),
  },
  logoContainer: {
    width: rw(32),
    height: rw(32),
    borderRadius: rw(7),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: rh(3),
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: '75%',
    height: '75%',
  },
  appName: {
    fontSize: rf(3),
    fontWeight: '800',
    marginBottom: rh(3),
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rh(0.8),
    paddingHorizontal: rw(4),
    borderRadius: rw(20),
    marginBottom: rh(2),
    borderWidth: 1,
  },
  statusText: {
    fontSize: rf(1.6),
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: rf(1.8),
    marginBottom: rh(6),
    textAlign: 'center',
    lineHeight: rh(2.6),
    opacity: 0.7,
    maxWidth: '80%',
  },
  buttonWrapper: {
    width: '100%',
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: rh(1),
    paddingHorizontal: rw(2),
    borderRadius: rw(30),
    alignItems: 'center',
    width: '100%',
    height: rh(8),
  },
  iconCircle: {
    width: rh(6),
    height: rh(6),
    borderRadius: rh(3),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rw(4),
  },
  buttonText: {
    color: '#fff',
    fontSize: rf(2.2),
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  footerContainer: {
    position: 'absolute',
    bottom: rh(5),
    width: '100%',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.7,
  },
  footerText: {
    fontSize: rf(1.4),
    fontWeight: '500',
  }
});
