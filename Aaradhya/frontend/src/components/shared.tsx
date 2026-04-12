// src/components/shared.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

// ─── GradientCard ─────────────────────────────────────────────────────────────
// Since LinearGradient requires native module, we simulate with layered Views
export const GradientCard: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
  startColor?: string;
  endColor?: string;
}> = ({ children, style, startColor = Colors.purpleGradientStart, endColor = Colors.purpleGradientEnd }) => (
  <View style={[styles.gradientCard, { backgroundColor: startColor }, style, Shadow.md]}>
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: endColor, opacity: 0.5, borderRadius: Radius.xl }]} />
    {children}
  </View>
);

// ─── BodhiHeader ─────────────────────────────────────────────────────────────
export const BodhiHeader: React.FC<{
  onInsurancePress?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  rightExtra?: React.ReactNode;
}> = ({ onInsurancePress, showBack, onBack, rightExtra }) => (
  <View style={styles.header}>
    {showBack ? (
      <TouchableOpacity onPress={onBack} style={styles.headerAvatar}>
        <Text style={{ fontSize: 20 }}>←</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.headerLeft}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>J</Text>
        </View>
        <Text style={styles.logoText}>BODHI</Text>
      </View>
    )}
    <View style={styles.headerRight}>
      {rightExtra}
      <TouchableOpacity onPress={onInsurancePress} style={styles.shieldBtn}>
        <Text style={styles.shieldIcon}>🛡</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── BottomNav ────────────────────────────────────────────────────────────────
export type NavTab = 'VAULT' | 'SOCIAL' | 'AI' | 'MARKET' | 'ME';

const NAV_ITEMS: { key: NavTab; label: string; icon: string }[] = [
  { key: 'VAULT', label: 'VAULT', icon: '▣' },
  { key: 'SOCIAL', label: 'SOCIAL', icon: '👥' },
  { key: 'AI', label: 'AI', icon: '🎤' },
  { key: 'MARKET', label: 'MARKET', icon: '📈' },
  { key: 'ME', label: 'ME', icon: '👤' },
];

export const BottomNav: React.FC<{ active: NavTab; onPress: (tab: NavTab) => void }> = ({
  active,
  onPress,
}) => (
  <View style={styles.bottomNav}>
    {NAV_ITEMS.map(({ key, label, icon }) => {
      const isActive = key === active;
      return (
        <TouchableOpacity key={key} style={styles.navItem} onPress={() => onPress(key)}>
          {key === 'AI' ? (
            <View style={[styles.aiNavBtn, isActive && styles.aiNavBtnActive]}>
              <Text style={{ fontSize: 18 }}>{icon}</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.navIcon, isActive && styles.navIconActive]}>{icon}</Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
            </>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Pill / Badge ─────────────────────────────────────────────────────────────
export const Pill: React.FC<{ label: string; color?: string; textColor?: string }> = ({
  label,
  color = Colors.bg,
  textColor = Colors.textSecondary,
}) => (
  <View style={[styles.pill, { backgroundColor: color }]}>
    <Text style={[styles.pillText, { color: textColor }]}>{label}</Text>
  </View>
);

// ─── LoadingOverlay ───────────────────────────────────────────────────────────
export const LoadingOverlay: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color={Colors.lime} />
    </View>
  );
};

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
export const ErrorBanner: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
};

// ─── ProgressBar ─────────────────────────────────────────────────────────────
export const ProgressBar: React.FC<{ progress: number; color?: string; height?: number }> = ({
  progress,
  color = Colors.lime,
  height = 6,
}) => (
  <View style={[styles.progressTrack, { height }]}>
    <View
      style={[
        styles.progressFill,
        { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: color, height },
      ]}
    />
  </View>
);

// ─── SectionHeader ────────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{
  title: string;
  action?: string;
  onAction?: () => void;
}> = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerAvatar: { padding: Spacing.sm },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  logoText: { fontSize: Typography.md, fontWeight: Typography.extrabold, color: Colors.purple, letterSpacing: 1 },
  shieldBtn: { padding: Spacing.xs },
  shieldIcon: { fontSize: 22 },

  // Gradient card
  gradientCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
  },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.navBg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 16,
    paddingTop: Spacing.sm,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  navIcon: { fontSize: 18, color: Colors.navInactive },
  navIconActive: { color: Colors.navActive },
  navLabel: { fontSize: Typography.xs, color: Colors.navInactive, marginTop: 2, letterSpacing: 0.5 },
  navLabelActive: { color: Colors.navActive, fontWeight: Typography.semibold },
  aiNavBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  aiNavBtnActive: { backgroundColor: Colors.lime },

  // Pill
  pill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillText: { fontSize: Typography.xs, fontWeight: Typography.semibold, letterSpacing: 0.5 },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240, 239, 245, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },

  // Error
  errorBanner: {
    margin: Spacing.base,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 3,
    borderLeftColor: Colors.red,
  },
  errorText: { fontSize: Typography.sm, color: Colors.red },

  // Progress
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: { borderRadius: Radius.full },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  sectionAction: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.purple,
    letterSpacing: 0.5,
  },
});
