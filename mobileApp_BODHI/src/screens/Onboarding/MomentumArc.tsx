/**
 * MomentumArc.tsx
 * BODHI – Cyber-Glass Onboarding
 */

import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
  Ellipse,
} from 'react-native-svg';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedProps,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RADIUS = 108;
const STROKE_WIDTH = 3;
const TRACK_STROKE_WIDTH = 1;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SVG_SIZE = (RADIUS + STROKE_WIDTH) * 2 + 16;
const CENTER = SVG_SIZE / 2;

interface MomentumArcProps {
  scrollOffset: SharedValue<number>;
  totalSteps: number;
}

export const MomentumArc: React.FC<MomentumArcProps> = ({
  scrollOffset,
  totalSteps,
}) => {
  const arcProps = useAnimatedProps(() => {
    const progress = interpolate(
      scrollOffset.value,
      [0, SCREEN_WIDTH * (totalSteps - 1)],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - progress),
    };
  });

  const glowProps = useAnimatedProps(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [0, SCREEN_WIDTH * (totalSteps - 1)],
      [0.08, 0.28],
      Extrapolation.CLAMP
    );
    return { fillOpacity: opacity };
  });

  return (
    <View style={styles.wrapper}>
      <Svg width={SVG_SIZE} height={SVG_SIZE} style={styles.svg}>
        <Defs>
          <LinearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7C3AED" stopOpacity="1" />
            <Stop offset="45%" stopColor="#06B6D4" stopOpacity="1" />
            <Stop offset="100%" stopColor="#22C55E" stopOpacity="1" />
          </LinearGradient>
          <RadialGradient id="arcGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#22C55E" stopOpacity="1" />
            <Stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <AnimatedCircle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#arcGlow)" stroke="none" animatedProps={glowProps} />
        
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth={TRACK_STROKE_WIDTH} />

        {[0, 90, 180, 270].map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          const x1 = CENTER + (RADIUS - 6) * Math.cos(rad);
          const y1 = CENTER + (RADIUS - 6) * Math.sin(rad);
          const x2 = CENTER + (RADIUS + 6) * Math.cos(rad);
          const y2 = CENTER + (RADIUS + 6) * Math.sin(rad);
          return (
            <Ellipse
              key={deg}
              cx={(x1 + x2) / 2}
              cy={(y1 + y2) / 2}
              rx={1}
              ry={3}
              fill="rgba(255,255,255,0.12)"
              transform={`rotate(${deg}, ${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}
            />
          );
        })}

        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="url(#arcGradient)"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCUMFERENCE}
          strokeLinecap="round"
          animatedProps={arcProps}
          transform={`rotate(-90, ${CENTER}, ${CENTER})`}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  svg: { pointerEvents: 'none' },
});