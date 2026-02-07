import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../themes/ThemeContext';
import { rw, rh, rf } from '../constants/responsive';

// ============================================
// BUTTON COMPONENT
// ============================================

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return theme.primary;
      case 'secondary': return theme.card;
      case 'danger': return theme.error || '#ef4444';
      case 'success': return theme.success || '#22c55e';
      default: return theme.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return theme.text;
      case 'danger': return '#FFFFFF';
      case 'success': return '#FFFFFF';
      default: return '#FFFFFF';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: rh(1), paddingHorizontal: rw(3) };
      case 'medium': return { paddingVertical: rh(1.5), paddingHorizontal: rw(4) };
      case 'large': return { paddingVertical: rh(2), paddingHorizontal: rw(6) };
      default: return { paddingVertical: rh(1.5), paddingHorizontal: rw(4) };
    }
  };

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: rw(3),
      ...getPadding(),
      backgroundColor: getBackgroundColor(),
      width: fullWidth ? '100%' : undefined,
      opacity: loading || disabled ? 0.6 : 1,
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    text: {
      color: getTextColor(),
      fontWeight: '600',
      fontSize: size === 'small' ? rf(1.6) : size === 'large' ? rf(2.2) : rf(1.8),
      marginLeft: icon ? rw(2) : 0,
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[styles.button, style]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text style={styles.text}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ============================================
// INPUT COMPONENT
// ============================================

export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  error?: string;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  icon,
  rightIcon,
  onRightIconPress,
  error,
  disabled,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: rh(2),
    },
    label: {
      fontSize: rf(1.8),
      fontWeight: '500',
      color: theme.text,
      marginBottom: rh(0.8),
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: error ? theme.error || '#ef4444' : theme.border,
      borderRadius: rw(3),
      backgroundColor: theme.card,
      paddingHorizontal: rw(3),
    },
    input: {
      flex: 1,
      paddingVertical: rh(1.5),
      color: theme.text,
      fontSize: rf(1.8),
      minHeight: multiline ? rh(12) : rh(6),
      textAlignVertical: multiline ? 'top' : 'center',
    },
    icon: {
      marginRight: rw(2),
    },
    rightIcon: {
      marginLeft: rw(2),
    },
    errorText: {
      color: theme.error || '#ef4444',
      fontSize: rf(1.4),
      marginTop: rh(0.5),
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.subtext}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
