/**
 * GlassCard.tsx (Minimalist Redesign)
 * BODHI
 */

import React from 'react';
import { Dimensions, StyleSheet, Text, View, Image } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARALLAX_TEXT = 0.14;
const PARALLAX_IMAGE = 0.22;

export interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  image: any; // Requires your vector PNG/SVG assets
  accentColor: string;
}

interface GlassCardProps {
  step: OnboardingStep;
  index: number;
  scrollOffset: SharedValue<number>;
}

export const GlassCard: React.FC<GlassCardProps> = ({ step, index, scrollOffset }) => {
  const inputRange: [number, number, number] = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const imageStyle = useAnimatedStyle(() => {
    const tx = interpolate(scrollOffset.value, inputRange, [-SCREEN_WIDTH * PARALLAX_IMAGE, 0, SCREEN_WIDTH * PARALLAX_IMAGE], Extrapolation.CLAMP);
    const scale = interpolate(scrollOffset.value, inputRange, [0.80, 1, 0.80], Extrapolation.CLAMP);
    return { transform: [{ translateX: tx }, { scale }] };
  });

  const textStyle = useAnimatedStyle(() => {
    const tx = interpolate(scrollOffset.value, inputRange, [-SCREEN_WIDTH * PARALLAX_TEXT, 0, SCREEN_WIDTH * PARALLAX_TEXT], Extrapolation.CLAMP);
    const opacity = interpolate(scrollOffset.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateX: tx }] };
  });

  return (
    <View style={styles.page}>
      {/* Circular Image Container */}
      <Animated.View style={[styles.imageWrapper, imageStyle]}>
        <View style={styles.circleBackdrop}>
          {/* Fallback to a blank view if no image is provided yet */}
          {step.image && <Image source={step.image} style={styles.image} resizeMode="contain" />}
        </View>
      </Animated.View>

      {/* Typography */}
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, alignItems: 'center', justifyContent: 'center', paddingBottom: 160, paddingHorizontal: 32 },
  imageWrapper: { alignItems: 'center', marginBottom: 32 },
  circleBackdrop: { width: 280, height: 280, borderRadius: 140, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }, // Light gray circle
  image: { width: 240, height: 240 },
  textBlock: { alignItems: 'center' },
  title: { color: '#111827', fontSize: 32, fontWeight: '700', letterSpacing: -0.5, lineHeight: 40, textAlign: 'center', marginBottom: 16 },
  subtitle: { color: '#4B5563', fontSize: 16, lineHeight: 24, fontWeight: '500', textAlign: 'center' },
});