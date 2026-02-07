import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AnimatedTabIconProps {
  name: any; // Using any because vector-icons types can be strict/complex
  color: string;
  size: number;
  focused: boolean;
}

export const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ name, color, size, focused }) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
    };
  });

  useEffect(() => {
    if (focused) {
      // Spring animation for "pop" effect
      scale.value = withSpring(1.2, { damping: 12, stiffness: 200 });
      translateY.value = withSpring(-4, { damping: 12, stiffness: 200 }); // Slight lift
    } else {
      // Smooth return
      scale.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
    }
  }, [focused]);

  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </Animated.View>
  );
};
