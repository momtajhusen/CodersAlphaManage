import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withDelay,
    Easing
} from 'react-native-reanimated';

interface AnimatedEntryProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    delay?: number;
    duration?: number;
    from?: 'bottom' | 'top' | 'left' | 'right';
    distance?: number;
}

export const AnimatedEntry: React.FC<AnimatedEntryProps> = ({ 
    children, 
    style, 
    delay = 0, 
    duration = 500,
    from = 'bottom',
    distance = 50
}) => {
    const opacity = useSharedValue(0);
    const translate = useSharedValue(distance);

    const animatedStyle = useAnimatedStyle(() => {
        const transform = [];
        
        switch (from) {
            case 'bottom':
                transform.push({ translateY: translate.value });
                break;
            case 'top':
                transform.push({ translateY: -translate.value });
                break;
            case 'left':
                transform.push({ translateX: -translate.value });
                break;
            case 'right':
                transform.push({ translateX: translate.value });
                break;
        }

        return {
            opacity: opacity.value,
            transform
        };
    });

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
        translate.value = withDelay(delay, withTiming(0, { duration, easing: Easing.out(Easing.quad) }));
    }, []);

    return (
        <Animated.View style={[style, animatedStyle]}>
            {children}
        </Animated.View>
    );
};
