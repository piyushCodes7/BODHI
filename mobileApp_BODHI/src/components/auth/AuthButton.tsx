import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Spacing, FontSize, Shadow, Gradients } from '../../theme/tokens';
import { ChevronRight } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  showArrow?: boolean;
  variant?: 'primary' | 'signup';
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  isLoading,
  disabled,
  style,
  textStyle,
  showArrow = true,
  variant = 'primary',
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getColors = () => {
    if (disabled) return ['#333', '#222'];
    if (variant === 'signup') return ['#FF5A00', '#FFE600']; // Premium Warm Fire
    return Gradients.authCTA.colors;
  };

  return (
    <AnimatedTouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      activeOpacity={1}
      style={[
        styles.container, 
        style, 
        disabled && styles.disabled, 
        variant === 'signup' && { shadowColor: '#FF5A00' },
        animatedStyle
      ]}
    >
      <LinearGradient
        colors={getColors() as (string | number)[]}
        start={Gradients.authCTA.start}
        end={Gradients.authCTA.end}
        style={styles.gradient}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Text style={[styles.text, textStyle, disabled && styles.disabledText]}>{title}</Text>
            {showArrow && !disabled && (
              <ChevronRight size={20} color="#000" style={styles.arrow} />
            )}
          </>
        )}
      </LinearGradient>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: Radius.md,
    overflow: 'hidden',
    shadowColor: '#FFE600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  text: {
    color: '#000',
    fontSize: FontSize.md,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disabledText: {
    color: '#666',
  },
  arrow: {
    position: 'absolute',
    right: 20,
  },
});
