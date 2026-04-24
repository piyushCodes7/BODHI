import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Colors, Radius, Spacing, FontSize } from '../../theme/tokens';
import { Eye, EyeOff } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface AuthInputProps extends TextInputProps {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  secureTextEntry?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  icon,
  error,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(
      error ? Colors.errorRed : isFocused ? '#FF5A00' : 'rgba(255,255,255,0.08)'
    ),
    backgroundColor: withTiming(
      isFocused ? 'rgba(168, 85, 247, 0.05)' : 'rgba(255,255,255,0.03)'
    ),
    opacity: withTiming(props.editable === false ? 0.6 : 1),
  }));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Animated.View style={[
        styles.inputWrapper,
        animatedContainerStyle
      ]}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="rgba(255,255,255,0.3)"
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            {showPassword ? (
              <EyeOff size={18} color={isFocused ? '#FF5A00' : "rgba(255,255,255,0.4)"} />
            ) : (
              <Eye size={18} color={isFocused ? '#FF5A00' : "rgba(255,255,255,0.4)"} />
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 56,
    paddingHorizontal: Spacing.lg,
  },
  inputWrapperFocused: {
    borderColor: Colors.neonLime,
    backgroundColor: 'rgba(209, 252, 0, 0.04)',
  },
  inputWrapperError: {
    borderColor: Colors.errorRed,
  },
  iconWrapper: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: '600',
    height: '100%',
  },
  eyeIcon: {
    padding: Spacing.sm,
  },
  errorText: {
    color: Colors.errorRed,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
