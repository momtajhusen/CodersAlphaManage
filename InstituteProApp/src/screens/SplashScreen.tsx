import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useTheme } from '../themes/ThemeContext';

interface Props {
  onAnimationFinish: () => void;
}

export default function AnimatedSplashScreen({ onAnimationFinish }: Props) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start fully opaque
  const [isAppReady, setAppReady] = useState(false);

  useEffect(() => {
    // Determine when to hide the native splash and start our animation
    const prepare = async () => {
      try {
        // Here we can perform any additional asset loading if needed
        // For now, we assume we are ready once the component mounts
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    };

    prepare();
  }, []);

  useEffect(() => {
    if (isAppReady) {
      const hideNativeAndAnimate = async () => {
        // 1. Hide the native splash screen immediately. 
        // Since this view matches the native splash pixel-for-pixel, the user won't notice the swap.
        await SplashScreen.hideAsync();

        // 2. Animate our JS splash screen (Fade Out)
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800, // Smooth fade
          useNativeDriver: true,
        }).start(() => {
          // 3. Notify RootNavigator that animation is done
          onAnimationFinish();
        });
      };

      hideNativeAndAnimate();
    }
  }, [isAppReady, fadeAnim, onAnimationFinish]);

  return (
    <View style={[styles.container, { backgroundColor: '#1A2332' }]}>
      <Animated.View 
        style={[
          styles.imageContainer, 
          { 
            opacity: fadeAnim,
          }
        ]}
      >
        <Image
          source={require('../../assets/splash.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Must match app.json backgroundColor exactly
    backgroundColor: '#1A2332', 
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    // ResizeMode 'contain' matches app.json default
  },
});
