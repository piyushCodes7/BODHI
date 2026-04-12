// src/theme/index.ts

export const Colors = {
  bg: '#0A0A14', 
  bgCard: '#1A1A24', 
  textPrimary: '#FFFFFF', 
  textSecondary: '#A0A0B0', 
  textMuted: '#606070', 
  textWhite: '#FFFFFF', 
  purple: '#7B2FBE', 
  lime: '#D4FF00', 
  pink: '#FF2A5F', 
  border: '#2A2A34', 
  green: '#10B981', 
  orange: '#F59E0B', 
  red: '#EF4444'
};

export const Typography = { 
  xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, 
  medium: '500' as const, semibold: '600' as const, bold: '700' as const, extrabold: '800' as const 
};

export const Spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, '2xl': 48 };

export const Radius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 };

export const Shadow = { 
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 }, 
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 } 
};