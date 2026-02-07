import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rw, rh, rf } from '../../constants/responsive';
import Header from '../../components/Header';

export default function HelpCenterScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "Go to Settings > Security > Change Password. If you've forgotten your password, use the 'Forgot Password' link on the login screen."
    },
    {
      question: "How do I update my profile?",
      answer: "Navigate to the Profile tab and tap on 'Edit Profile' to update your personal information."
    },
    {
      question: "Can I use biometric login?",
      answer: "Yes, you can enable Biometric Login in Settings > Security. Make sure your device supports fingerprint or face recognition."
    },
    {
      question: "How do I contact support?",
      answer: "You can email us at momtajlife@gmail.com or call our helpline directly from this screen."
    }
  ];

  const handleEmailSupport = () => {
    Linking.openURL('mailto:momtajlife@gmail.com');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+9779815759505');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: rw(4),
    },
    sectionTitle: {
      fontSize: rf(2.2),
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: rh(2),
      marginTop: rh(1),
    },
    faqItem: {
      backgroundColor: theme.card,
      padding: rw(4),
      borderRadius: rw(3),
      marginBottom: rh(2),
      borderWidth: 1,
      borderColor: theme.border,
    },
    question: {
      fontSize: rf(1.8),
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: rh(1),
    },
    answer: {
      fontSize: rf(1.6),
      color: theme.subtext,
      lineHeight: rh(2.4),
    },
    contactCard: {
      backgroundColor: theme.primary,
      borderRadius: rw(3),
      padding: rw(5),
      alignItems: 'center',
      marginTop: rh(2),
      marginBottom: rh(4),
    },
    contactTitle: {
      color: '#fff',
      fontSize: rf(2.2),
      fontWeight: 'bold',
      marginBottom: rh(1),
    },
    contactText: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: rf(1.6),
      textAlign: 'center',
      marginBottom: rh(3),
    },
    contactButtons: {
      flexDirection: 'row',
      gap: rw(4),
    },
    contactButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingVertical: rh(1.2),
      paddingHorizontal: rw(4),
      borderRadius: rw(2),
    },
    contactButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      marginLeft: rw(2),
    },
  });

  return (
    <View style={styles.container}>
      <Header title="Help Center" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need more help?</Text>
          <Text style={styles.contactText}>
            Our support team is available 24/7 to assist you with any issues or questions.
          </Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
              <Feather name="mail" size={rf(2)} color="#fff" />
              <Text style={styles.contactButtonText}>Email Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleCallSupport}>
              <Feather name="phone" size={rf(2)} color="#fff" />
              <Text style={styles.contactButtonText}>Call Us</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <Text style={styles.question}>{faq.question}</Text>
            <Text style={styles.answer}>{faq.answer}</Text>
          </View>
        ))}

      </ScrollView>
    </View>
  );
}
