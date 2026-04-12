// src/theme/index.ts
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SCREEN = { WIDTH: SCREEN_WIDTH, HEIGHT: SCREEN_HEIGHT };

export const Colors = {
  // Backgrounds
  bg: '#F0EFF5',
  bgCard: '#FFFFFF',
  bgDark: '#0A0A14',

  // Brand
  purple: '#7B2FBE',
  purpleLight: '#9B59D0',
  purpleDark: '#5A1F8C',
  purpleGradientStart: '#8B3FD9',
  purpleGradientEnd: '#E0508C',

  // Accent
  lime: '#C8F000',
  limeActive: '#AEDD00',
  pink: '#E0508C',
  violet: '#A855F7',

  // Text
  textPrimary: '#0A0A14',
  textSecondary: '#6B6B8A',
  textMuted: '#9999BB',
  textWhite: '#FFFFFF',
  textLime: '#C8F000',

  // Status
  green: '#22C55E',
  red: '#EF4444',
  orange: '#F97316',

  // UI
  border: '#E5E5F0',
  borderLight: '#F0EFF5',
  shadow: 'rgba(123, 47, 190, 0.12)',
  overlay: 'rgba(10, 10, 20, 0.6)',

  // Nav
  navBg: '#FFFFFF',
  navActive: '#7B2FBE',
  navInactive: '#9999BB',
};

export const Typography = {
  // Font families — using system fonts as RN base
  display: 'System',
  body: 'System',

  // Sizes
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,

  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: 'rgba(123, 47, 190, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
};
