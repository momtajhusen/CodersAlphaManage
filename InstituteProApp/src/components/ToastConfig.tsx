import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { rf, rw, rh } from '../constants/responsive';

const CustomToast = ({ type, text1, text2 }: any) => {
    const { theme, scheme } = useTheme();

    let iconBgColor = theme.card;
    let iconName: any = 'info';
    let iconColor = theme.primary;
    let borderColor = theme.border;

    if (type === 'success') {
        iconBgColor = scheme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7';
        iconName = 'check';
        iconColor = '#16a34a'; // Green-600
        borderColor = '#22c55e';
    } else if (type === 'error') {
        iconBgColor = scheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2';
        iconName = 'x';
        iconColor = '#dc2626'; // Red-600
        borderColor = theme.error;
    } else if (type === 'info') {
         iconBgColor = scheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe';
         iconName = 'info';
         iconColor = '#2563eb'; // Blue-600
         borderColor = '#3b82f6';
    }

    return (
        <View style={{
            width: rw(92),
            backgroundColor: theme.card,
            borderRadius: rw(4),
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: rh(1.5),
            paddingHorizontal: rw(4),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            borderWidth: 1,
            borderColor: theme.border,
            marginTop: rh(2),
        }}>
            {/* Icon Container */}
            <View style={{
                width: rw(10),
                height: rw(10),
                borderRadius: rw(5),
                backgroundColor: iconBgColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: rw(3.5)
            }}>
                <Feather name={iconName} size={rf(2.2)} color={iconColor} />
            </View>
            
            {/* Text Container */}
            <View style={{ flex: 1, paddingVertical: rh(0.5) }}>
                <Text style={{ 
                    fontSize: rf(1.9), 
                    fontWeight: 'bold', 
                    color: theme.text,
                    marginBottom: text2 ? rh(0.3) : 0,
                    letterSpacing: 0.3
                }}>
                    {text1}
                </Text>
                {text2 ? (
                    <Text style={{ 
                        fontSize: rf(1.5), 
                        color: theme.subtext,
                        lineHeight: rf(2.2)
                    }} numberOfLines={2}>
                        {text2}
                    </Text>
                ) : null}
            </View>
        </View>
    );
};

export const toastConfig = {
    success: (props: any) => <CustomToast {...props} type="success" />,
    error: (props: any) => <CustomToast {...props} type="error" />,
    info: (props: any) => <CustomToast {...props} type="info" />,
};
