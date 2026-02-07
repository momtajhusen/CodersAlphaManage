import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../themes/ThemeContext';
import { rh, rw, rf } from '../../constants/responsive';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/authService';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoAsset, setPhotoAsset] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Derive storage URL from API URL (quick hack for now, better to put in config)
  const STORAGE_URL = api.defaults.baseURL?.replace('/api', '/storage');

    useEffect(() => {
        // Fetch latest profile data when entering screen
        const loadLatestProfile = async () => {
            setIsLoading(true);
            try {
                // Force fetch from API to ensure we have latest data
                const response = await authService.getProfile();
                const data = response.data || response;
                
                // Check structure: { user: ..., employee: ... }
                const employeeData = data.employee;
                const userData = data.user;
                
                if (employeeData) {
                    setName(employeeData.full_name || userData?.name || '');
                    setPhone(employeeData.mobile_number || '');
                    setAddress(employeeData.address || '');
                    setEmail(userData?.email || employeeData.email || '');
                    
                    if (employeeData.profile_photo) {
                        if (employeeData.profile_photo.startsWith('http')) {
                            setPhotoUri(employeeData.profile_photo);
                        } else {
                            setPhotoUri(`${STORAGE_URL}/${employeeData.profile_photo}`);
                        }
                    }
                } else if (userData) {
                    setName(userData.name || '');
                    setEmail(userData.email || '');
                    // Try to find mobile/phone in user object if it exists
                    setPhone(userData.mobile_number || userData.phone || '');
                }
            } catch (error) {
                console.error('Failed to load profile:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to load profile data',
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadLatestProfile();
    }, []);

  const pickImage = async () => {
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Permission to access camera roll is required!',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      setPhotoAsset(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!name || !email || !phone) {
        Toast.show({
            type: 'error',
            text1: 'Missing Fields',
            text2: 'Name, Email and Phone are required.',
        });
        return;
    }

    setIsLoading(true);
    try {
        const updateData: any = {
            full_name: name,
            email: email,
            mobile_number: phone,
            address: address,
        };

        if (photoAsset) {
            // Extract filename from URI
            const uriParts = photoAsset.uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            updateData.profile_photo = {
                uri: photoAsset.uri,
                name: `photo.${fileType}`,
                type: `image/${fileType}`,
            };
        }

        await authService.updateProfile(updateData);
        await refreshUser();
        
        Toast.show({
            type: 'success',
            text1: 'Profile Updated',
            text2: 'Your profile has been updated successfully.',
        });
        
        navigation.goBack();
    } catch (error: any) {
        console.error('Profile update error:', error);
        const message = error.response?.data?.message || 'Failed to update profile.';
        Toast.show({
            type: 'error',
            text1: 'Update Failed',
            text2: message,
        });
    } finally {
        setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
          <Feather name="arrow-left" size={rf(3)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading ? (
              <ActivityIndicator size="small" color={theme.accent} />
          ) : (
              <Text style={[styles.saveButton, { color: theme.accent }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: theme.accent + '20', borderColor: theme.card }]}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                    ) : (
                        <Text style={[styles.avatarText, { color: theme.accent }]}>{getInitials(name)}</Text>
                    )}
                </View>
                <TouchableOpacity 
                    style={[styles.cameraButton, { backgroundColor: theme.accent, borderColor: theme.card }]}
                    onPress={pickImage}
                    disabled={isLoading}
                >
                    <Feather name="camera" size={rf(2)} color={'#FFFFFF'} />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.form}>
            <View>
                <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Personal Info</Text>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.subtext }]}>Full Name</Text>
                        <TextInput 
                            style={[styles.input, { borderBottomColor: theme.border, color: theme.text }]} 
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter full name"
                            placeholderTextColor={theme.subtext}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.subtext }]}>Email</Text>
                        <TextInput 
                            style={[styles.input, { borderBottomColor: theme.border, color: theme.text }]} 
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder="Enter email"
                            placeholderTextColor={theme.subtext}
                        />
                    </View>
                     <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.subtext }]}>Phone</Text>
                        <TextInput 
                            style={[styles.input, { borderBottomColor: theme.border, color: theme.text }]} 
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholder="Enter phone number"
                            placeholderTextColor={theme.subtext}
                        />
                    </View>
                     <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.subtext }]}>Address</Text>
                        <TextInput 
                            style={[styles.input, { color: theme.text, borderBottomWidth: 0 }]} 
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            placeholder="Enter address"
                            placeholderTextColor={theme.subtext}
                        />
                    </View>
                </View>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: rw(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: rf(2.5),
    fontWeight: 'bold',
  },
  saveButton: {
    fontSize: rf(2),
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: rw(4),
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: rh(4),
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: rw(24),
    height: rw(24),
    borderRadius: rw(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: rf(4),
    fontWeight: 'bold',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: rw(2),
    borderRadius: rw(5),
    borderWidth: 2,
  },
  form: {
    marginBottom: rh(4),
  },
  sectionTitle: {
    fontSize: rf(1.5),
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: rh(1),
    marginLeft: rw(1),
  },
  card: {
    borderRadius: rw(3),
    borderWidth: 1,
    padding: rw(4),
  },
  inputGroup: {
    marginBottom: rh(2),
  },
  label: {
    fontSize: rf(1.8),
    marginBottom: rh(0.5),
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: rh(1),
    fontSize: rf(2),
    fontWeight: '500',
  },
});