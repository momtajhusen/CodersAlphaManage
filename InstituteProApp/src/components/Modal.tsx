import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Modal as RNModal, StyleSheet, TouchableOpacity, PanResponder, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../themes/ThemeContext';
import { rh, rw, rf } from '../constants/responsive';

interface SwipeConfirmModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (deleteAllData: boolean) => void;
    title: string;
    message: string;
    loading?: boolean;
}

export const SwipeConfirmModal: React.FC<SwipeConfirmModalProps> = ({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    loading = false
}) => {
    const { theme, scheme } = useTheme();
    const [deleteAllData, setDeleteAllData] = useState(false);
    const deleteAllDataRef = useRef(false);
    const [sliderWidth, setSliderWidth] = useState(0);
    const sliderWidthRef = useRef(0);
    
    // Animation for slider
    const pan = useRef(new Animated.ValueXY()).current;
    
    useEffect(() => {
        if (!visible) {
            setDeleteAllData(false);
            pan.setValue({ x: 0, y: 0 });
        }
    }, [visible]);

    useEffect(() => {
        deleteAllDataRef.current = deleteAllData;
    }, [deleteAllData]);

    useEffect(() => {
        sliderWidthRef.current = sliderWidth;
    }, [sliderWidth]);

    // Limit the slider movement
    const BUTTON_WIDTH = rh(7);
    const maxDrag = Math.max(0, sliderWidth - BUTTON_WIDTH);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: 0
                });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gestureState) => {
                pan.flattenOffset(); // Merge offset into value
                
                const currentWidth = sliderWidthRef.current;
                const currentMaxDrag = Math.max(0, currentWidth - BUTTON_WIDTH);

                // Use a smaller threshold, e.g., 50% instead of 70%
                if (currentWidth > 0 && gestureState.dx > currentMaxDrag * 0.5) {
                     // Success
                     Animated.spring(pan, {
                         toValue: { x: currentMaxDrag, y: 0 },
                         useNativeDriver: false
                     }).start();
                     
                     // Ensure callback is called
                     if (onConfirm) {
                        onConfirm(deleteAllDataRef.current);
                     }
                } else {
                    // Reset
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false
                    }).start();
                }
            }
        })
    ).current;

    const translateX = pan.x.interpolate({
        inputRange: [0, maxDrag > 0 ? maxDrag : 1], // Avoid singular range if maxDrag is 0
        outputRange: [0, maxDrag],
        extrapolate: 'clamp'
    });

    return (
        <RNModal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.card }]}>
                    <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                    <Text style={[styles.message, { color: theme.subtext }]}>{message}</Text>

                    {/* Checkbox */}
                    <TouchableOpacity 
                        style={styles.checkboxContainer} 
                        onPress={() => setDeleteAllData(!deleteAllData)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, { borderColor: deleteAllData ? theme.accent : theme.subtext, backgroundColor: deleteAllData ? theme.accent : 'transparent' }]}>
                            {deleteAllData && <Feather name="check" size={rf(1.8)} color="#FFF" />}
                        </View>
                        <Text style={[styles.checkboxLabel, { color: theme.text }]}>Delete all associated data</Text>
                    </TouchableOpacity>

                    {/* Slider */}
                    <View 
                        style={[styles.sliderTrack, { backgroundColor: theme.border }]}
                        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                    >
                        <Text style={[styles.sliderText, { color: theme.subtext }]}>Swipe right to confirm</Text>
                        <Animated.View 
                            style={[
                                styles.sliderButton, 
                                { 
                                    backgroundColor: '#EF4444', // Red for delete
                                    transform: [{ translateX }] 
                                }
                            ]}
                            {...panResponder.panHandlers}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Feather name="chevron-right" size={rf(3)} color="#FFF" />
                            )}
                        </Animated.View>
                    </View>

                    {!loading && (
                        <TouchableOpacity onPress={onClose} style={{ marginTop: rh(3) }}>
                            <Text style={{ color: theme.subtext, fontSize: rf(1.8) }}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </RNModal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: rw(5)
    },
    container: {
        width: '100%',
        borderRadius: rw(4),
        padding: rw(6),
        alignItems: 'center',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: rf(2.5),
        fontWeight: 'bold',
        marginBottom: rh(1),
        textAlign: 'center'
    },
    message: {
        fontSize: rf(1.8),
        textAlign: 'center',
        marginBottom: rh(3),
        lineHeight: rh(2.5)
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: rh(4),
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        padding: rw(3),
        borderRadius: rw(2)
    },
    checkbox: {
        width: rw(5),
        height: rw(5),
        borderRadius: rw(1),
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: rw(3)
    },
    checkboxLabel: {
        fontSize: rf(1.8),
        fontWeight: '500'
    },
    sliderTrack: {
        width: '100%',
        height: rh(7),
        borderRadius: rh(3.5),
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    sliderText: {
        position: 'absolute',
        zIndex: -1,
        fontSize: rf(1.8),
        fontWeight: '600',
        marginLeft: rh(3) // Offset for visibility
    },
    sliderButton: {
        position: 'absolute',
        left: 0,
        width: rh(7),
        height: rh(7),
        borderRadius: rh(3.5),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
});

export default SwipeConfirmModal;
