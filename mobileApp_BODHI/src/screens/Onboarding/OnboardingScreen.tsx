/**
 * OnboardingScreen.tsx
 * BODHI – Cyber-Glass Onboarding
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { GlassCard, OnboardingStep } from './GlassCard';
import { MomentumArc } from './MomentumArc';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STEPS: OnboardingStep[] = [
  {
    id: 0,
    title: 'Money that moves\nwith you',
    subtitle: 'Track spending, savings, and goals — all in one cosmic dashboard built for how you actually live.',
    emoji: '🌌',
    accentColor: '#22C55E',
    tag: 'WELCOME TO BODHI',
  },
  {
    id: 1,
    title: 'Micro-Investment\nClubs',
    subtitle: 'Pool funds with your friends to invest together. Vote on trades, split the profits, and grow as a squad.',
    emoji: '🤝',
    accentColor: '#06B6D4',
    tag: 'MULTIPLAYER FINANCE',
  },
  {
    id: 2,
    title: 'Your Financial\nImmune System',
    subtitle: 'Powered by Saheli. It runs invisibly in the background, only surfacing when it detects something worth your attention.',
    emoji: '🛡️',
    accentColor: '#7C3AED',
    tag: 'INVISIBLE AI',
  },
  {
    id: 3,
    title: 'Execute with\nPrecision',
    subtitle: 'Lightning-fast execution directly to the exchange. No delays, no hidden fees. Just pure momentum.',
    emoji: '⚡',
    accentColor: '#F59E0B',
    tag: 'LIVE MARKETS',
  },
];

const BackgroundCanvas = () => (
  <View style={StyleSheet.absoluteFillObject}>
    <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
      <Defs>
        <RadialGradient id="bgGlow" cx="50%" cy="0%" r="80%">
          <Stop offset="0%" stopColor="#1E1B4B" stopOpacity="1" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#bgGlow)" />
    </Svg>
  </View>
);

const StepIndicator = ({ index, scrollOffset }: { index: number; scrollOffset: SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
    const width = interpolate(scrollOffset.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);
    const opacity = interpolate(scrollOffset.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
    return { width, opacity };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export const OnboardingScreen = ({ onFinish }: { onFinish: () => void }) => {
  const scrollOffset = useSharedValue(0);
  const flatListRef = useRef<Animated.FlatList<OnboardingStep>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / SCREEN_WIDTH);
      if (currentIndex !== index) {
        runOnJS(setCurrentIndex)(index);
      }
    },
  });

  const handleNext = useCallback(() => {
  if (currentIndex < STEPS.length - 1) {
    flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  } else {
    // This triggers the transition to the main app!
    onFinish();
  }
}, [currentIndex, onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <BackgroundCanvas />

      <Animated.FlatList
        ref={flatListRef}
        data={STEPS}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <GlassCard step={item} index={index} scrollOffset={scrollOffset} />
        )}
      />

      <View style={styles.bottomHUD}>
        <View style={styles.pagination}>
          {STEPS.map((_, index) => (
            <StepIndicator key={index} index={index} scrollOffset={scrollOffset} />
          ))}
        </View>

        <View style={styles.arcContainer}>
          <MomentumArc scrollOffset={scrollOffset} totalSteps={STEPS.length} />
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={handleNext}>
            <Text style={styles.actionText}>{currentIndex === STEPS.length - 1 ? 'START' : 'NEXT'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  bottomHUD: { position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 20, width: '100%', alignItems: 'center', justifyContent: 'flex-end', pointerEvents: 'box-none' },
  pagination: { flexDirection: 'row', marginBottom: 32, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4, backgroundColor: '#FFFFFF', marginHorizontal: 4 },
  arcContainer: { alignItems: 'center', justifyContent: 'center', width: 240, height: 240 },
  actionButton: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
});