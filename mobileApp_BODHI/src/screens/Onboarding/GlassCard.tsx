/**
 * GlassCard.tsx
 * BODHI – Cyber-Glass Onboarding
 */

import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
// CRITICAL FIX: Default import (no brackets) for the community bare RN library
import { BlurView } from '@react-native-community/blur';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARALLAX_TEXT = 0.14;
const PARALLAX_EMOJI = 0.22;

export interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  accentColor: string;
  tag: string;
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

  const emojiStyle = useAnimatedStyle(() => {
    const tx = interpolate(scrollOffset.value, inputRange, [-SCREEN_WIDTH * PARALLAX_EMOJI, 0, SCREEN_WIDTH * PARALLAX_EMOJI], Extrapolation.CLAMP);
    const ty = interpolate(scrollOffset.value, inputRange, [24, 0, 24], Extrapolation.CLAMP);
    const scale = interpolate(scrollOffset.value, inputRange, [0.80, 1, 0.80], Extrapolation.CLAMP);
    return { transform: [{ translateX: tx }, { translateY: ty }, { scale }] };
  });

  const textStyle = useAnimatedStyle(() => {
    const tx = interpolate(scrollOffset.value, inputRange, [-SCREEN_WIDTH * PARALLAX_TEXT, 0, SCREEN_WIDTH * PARALLAX_TEXT], Extrapolation.CLAMP);
    const opacity = interpolate(scrollOffset.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    const scale = interpolate(scrollOffset.value, inputRange, [0.88, 1, 0.88], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateX: tx }, { scale }] };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollOffset.value, inputRange, [0, 0.18, 0], Extrapolation.CLAMP);
    return { opacity };
  });

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.glowBlob, { backgroundColor: step.accentColor }, glowStyle]} />

      {/* CRITICAL FIX: Updated props for the community blur library */}
      <BlurView blurAmount={15} blurType="dark" style={styles.card}>
        <View style={[styles.glassBorder, { borderColor: `${step.accentColor}30` }]} />

        <View style={[styles.tagPill, { backgroundColor: `${step.accentColor}18`, borderColor: `${step.accentColor}55` }]}>
          <Text style={[styles.tagText, { color: step.accentColor }]}>{step.tag}</Text>
        </View>

        <Animated.View style={[styles.emojiWrapper, emojiStyle]}>
          <Text style={styles.emoji}>{step.emoji}</Text>
          <Text style={[styles.emoji, styles.emojiReflection, { color: step.accentColor }]} aria-hidden>
            {step.emoji}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.textBlock, textStyle]}>
          <Text style={styles.title}>{step.title}</Text>
          <View style={[styles.titleRule, { backgroundColor: step.accentColor }]} />
          <Text style={styles.subtitle}>{step.subtitle}</Text>
        </Animated.View>

        <View style={[styles.bottomAccent, { backgroundColor: step.accentColor }]} />
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  glowBlob: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: SCREEN_HEIGHT * 0.14 },
  card: { width: '100%', borderRadius: 28, paddingHorizontal: 28, paddingVertical: 36, overflow: 'hidden' },
  glassBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 28, borderWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.22)', borderLeftColor: 'rgba(255,255,255,0.14)' },
  tagPill: { alignSelf: 'flex-start', borderWidth: 0.5, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 24 },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' },
  emojiWrapper: { alignItems: 'center', marginBottom: 28 },
  emoji: { fontSize: 88, lineHeight: 96, textAlign: 'center' },
  emojiReflection: { fontSize: 36, lineHeight: 28, opacity: 0.15, transform: [{ scaleY: -0.4 }, { translateY: -4 }] },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', letterSpacing: -0.6, lineHeight: 38, marginBottom: 10 },
  titleRule: { width: 32, height: 2, borderRadius: 1, marginBottom: 14, opacity: 0.85 },
  subtitle: { color: 'rgba(255, 255, 255, 0.52)', fontSize: 15, lineHeight: 24, fontWeight: '400', letterSpacing: 0.1 },
  bottomAccent: { width: 44, height: 2, borderRadius: 1, marginTop: 32, opacity: 0.7 },
});