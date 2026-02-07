import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../themes/ThemeContext';
import { rf, rh, rw } from '../constants/responsive';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  unreadCount?: number;
  subtitle?: string;
  backgroundColor?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack = false, 
  onBack, 
  rightComponent,
  showNotification = false,
  onNotificationPress,
  unreadCount = 0,
  subtitle,
  backgroundColor
}) => {
  const navigation = useNavigation();
  const { theme, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const bgColor = backgroundColor || theme.card;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: bgColor, 
      paddingTop: insets.top,
      borderBottomColor: theme.border,
      shadowColor: theme.shadow,
    }]}>
      <StatusBar 
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={bgColor} 
        translucent={true}
      />
      
      <View style={styles.content}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>
          )}
          <View>
            {title && <Text style={[styles.title, { color: theme.text }]}>{title}</Text>}
            {subtitle && <Text style={[styles.subtitle, { color: theme.subtext }]}>{subtitle}</Text>}
          </View>
        </View>

        <View style={styles.rightContainer}>
          {rightComponent}
          
          {showNotification && (
            <TouchableOpacity 
              onPress={onNotificationPress} 
              style={[styles.iconButton, { backgroundColor: theme.secondary }]}
            >
              <Feather name="bell" size={20} color={theme.text} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { borderColor: bgColor }]}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 100,
  },
  content: {
    height: 56, // Standard app bar height
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rw(4),
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(3),
  },
  backButton: {
    marginRight: rw(3),
    padding: rw(1),
  },
  title: {
    fontSize: rf(2.2),
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: rf(1.4),
    marginTop: 2,
  },
  iconButton: {
    padding: rw(2),
    borderRadius: 9999,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Header;
