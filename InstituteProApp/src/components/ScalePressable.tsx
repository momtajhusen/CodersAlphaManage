import React from 'react';
import { Pressable, StyleProp, ViewStyle, PressableProps } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming,
    Easing
} from 'react-native-reanimated';

interface ScalePressableProps extends PressableProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    scaleTo?: number;
    disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ScalePressable: React.FC<ScalePressableProps> = ({ 
    children, 
    style, 
    scaleTo = 0.96, 
    disabled = false,
    ...props 
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const onPressIn = () => {
        if (!disabled) {
            scale.value = withSpring(scaleTo, {
                damping: 10,
                stiffness: 300,
            });
        }
    };

    const onPressOut = () => {
        if (!disabled) {
            scale.value = withSpring(1, {
                damping: 10,
                stiffness: 300,
            });
        }
    };

    return (
        <AnimatedPressable
            {...props}
            disabled={disabled}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={[style, animatedStyle]}
        >
            {children}
        </AnimatedPressable>
    );
};
