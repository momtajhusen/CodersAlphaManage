import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../themes/ThemeContext';
import { rw, rh, rf } from '../../constants/responsive';
import Header from '../../components/Header';
import { Feather } from '@expo/vector-icons';

export default function AboutAppScreen() {
  const { theme, scheme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: rw(4),
      alignItems: 'center',
    },
    logoContainer: {
      width: rw(25),
      height: rw(25),
      backgroundColor: theme.card,
      borderRadius: rw(5),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: rh(2),
      marginTop: rh(4),
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      overflow: 'hidden',
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    appName: {
      fontSize: rf(3),
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: rh(0.5),
    },
    version: {
      fontSize: rf(1.6),
      color: theme.subtext,
      marginBottom: rh(4),
    },
    section: {
      width: '100%',
      backgroundColor: theme.card,
      borderRadius: rw(3),
      padding: rw(4),
      marginBottom: rh(2),
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionTitle: {
      fontSize: rf(1.8),
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: rh(1.5),
    },
    text: {
      fontSize: rf(1.6),
      color: theme.subtext,
      lineHeight: rh(2.4),
      marginBottom: rh(1),
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: rh(1.5),
    },
    featureIcon: {
      width: rw(8),
      height: rw(8),
      borderRadius: rw(4),
      backgroundColor: scheme === 'dark' ? 'rgba(37, 99, 235, 0.2)' : '#dbeafe',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: rw(3),
    },
    featureText: {
      fontSize: rf(1.6),
      color: theme.text,
      fontWeight: '500',
    },
    footer: {
      marginTop: rh(4),
      marginBottom: rh(4),
      alignItems: 'center',
    },
    copyright: {
      fontSize: rf(1.4),
      color: theme.subtext,
    }
  });

  return (
    <View style={styles.container}>
      <Header title="About App" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="cover"
          />
        </View>
        
        <Text style={styles.appName}>CoderaAlpha Manager</Text>
        <Text style={styles.version}>Version 1.0.0</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Us</Text>
          <Text style={styles.text}>
            CoderaAlpha Manager is a comprehensive institute management solution designed to streamline administrative tasks, enhance communication, and improve overall efficiency for educational institutions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name="users" size={rf(1.8)} color="#2563eb" />
            </View>
            <Text style={styles.featureText}>Employee Management</Text>
          </View>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name="clock" size={rf(1.8)} color="#2563eb" />
            </View>
            <Text style={styles.featureText}>Attendance Tracking</Text>
          </View>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name="dollar-sign" size={rf(1.8)} color="#2563eb" />
            </View>
            <Text style={styles.featureText}>Financial Management</Text>
          </View>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name="check-square" size={rf(1.8)} color="#2563eb" />
            </View>
            <Text style={styles.featureText}>Task Management</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2024 CodersAlpha. All rights reserved.</Text>
        </View>

      </ScrollView>
    </View>
  );
}
