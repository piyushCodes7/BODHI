/**
 * BODHI — Placeholder Screens
 * BankAccountsScreen · SecuritySettingsScreen · PaperTradeScreen
 *
 * These are production-ready shells — replace the inner content
 * with your full feature implementations.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '../theme/tokens';

// ─── Shared Placeholder Shell ─────────────────────────────────────────────────

interface PlaceholderProps {
  icon: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const PlaceholderShell: React.FC<PlaceholderProps> = ({
  icon, title, subtitle, ctaLabel, onCta,
}) => (
  <View style={placeholderStyles.root}>
    <Text style={placeholderStyles.icon}>{icon}</Text>
    <Text style={placeholderStyles.title}>{title}</Text>
    <Text style={placeholderStyles.subtitle}>{subtitle}</Text>
    {ctaLabel && onCta && (
      <TouchableOpacity style={placeholderStyles.ctaBtn} onPress={onCta}>
        <Text style={placeholderStyles.ctaText}>{ctaLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const placeholderStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  icon:     { fontSize: 56 },
  title:    { color: Colors.textPrimary,   fontSize: FontSize.xl,  fontWeight: '700', textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.md,  textAlign: 'center', lineHeight: 22 },
  ctaBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.neonLime,
    borderRadius: Radius.full,
  },
  ctaText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});

// ─── BankAccountsScreen ───────────────────────────────────────────────────────

export const BankAccountsScreen: React.FC = () => (
  <PlaceholderShell
    icon="🏦"
    title="Bank Accounts"
    subtitle="Link and manage your bank accounts for seamless fund transfers."
    ctaLabel="+ Link Account"
    onCta={() => Alert.alert('Coming Soon', 'Bank linking flow coming soon!')}
  />
);

// ─── SecuritySettingsScreen ───────────────────────────────────────────────────
// Note: See BiometricAuth.ts for the FaceID / Secure Enclave implementation.

export const SecuritySettingsScreen: React.FC = () => (
  <PlaceholderShell
    icon="🔐"
    title="Security Settings"
    subtitle="Manage FaceID authentication, PIN, and session policies."
    ctaLabel="Enable Biometrics"
    onCta={() => Alert.alert('Coming Soon', 'Biometric setup flow coming soon!')}
  />
);

// ─── PaperTradeScreen ─────────────────────────────────────────────────────────

export const PaperTradeScreen: React.FC = () => (
  <PlaceholderShell
    icon="📈"
    title="Paper Trade"
    subtitle="Simulate trades risk-free with virtual ₹1,00,000 across NSE & BSE."
    ctaLabel="Start Simulating"
    onCta={() => Alert.alert('Coming Soon', 'Paper trading engine coming soon!')}
  />
);

// Re-export as default for PaperTradeScreen (used in stack)
export default PaperTradeScreen;
