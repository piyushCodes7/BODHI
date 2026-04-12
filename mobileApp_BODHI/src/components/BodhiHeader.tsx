// ─────────────────────────────────────────────────────────────
//  BodhiHeader.tsx — Top navigation bar
//  Uses useSafeAreaInsets() — works on Dynamic Island iPhones
// ─────────────────────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import { Colors, Fonts, Spacing } from '../theme/tokens';

interface BodhiHeaderProps {
  dark?: boolean;
  showClose?: boolean;
  showSearch?: boolean;
  showMore?: boolean;
  onClose?: () => void;
  onInsurancePress?: () => void; // 1. Added the prop definition here
  avatarInitial?: string;
  avatarUri?: string;
}

export function BodhiHeader({
  dark = false,
  showClose = false,
  showSearch = false,
  showMore = false,
  onClose,
  onInsurancePress, // 2. Destructured the prop here
  avatarInitial = 'J',
}: BodhiHeaderProps) {
  const insets = useSafeAreaInsets();
  const tintColor = dark ? '#9ca3af' : Colors.tabInactive;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      {/* Blur backdrop */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={dark ? 'dark' : 'light'}
        blurAmount={20}
        reducedTransparencyFallbackColor={dark ? '#0c0e12' : '#fff'}
      />
      {/* Tinted overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: dark ? 'rgba(12,14,18,0.65)' : 'rgba(255,255,255,0.65)' },
        ]}
      />

      <View style={styles.inner}>
        {/* Left: Avatar + wordmark */}
        <View style={styles.left}>
          <View style={styles.avatarRing}>
            <View style={[styles.avatar, { backgroundColor: dark ? '#1e1040' : '#2d1060' }]}>
              <Text style={styles.avatarInitials}>{avatarInitial}</Text>
            </View>
            <View style={[styles.onlineDot, { borderColor: dark ? '#0c0e12' : '#fff' }]} />
          </View>
          <Text style={[styles.wordmark, { color: dark ? '#a78bfa' : '#7c3aed' }]}>BODHI</Text>
        </View>

        {/* Right: icons */}
        <View style={styles.right}>
          {showSearch && (
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Text style={[styles.iconText, { color: tintColor }]}>🔍</Text>
            </TouchableOpacity>
          )}
          
          {/* 3. Wired the onPress event to the Shield Icon */}
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onInsurancePress}>
            <Text style={styles.iconText}>🛡</Text>
          </TouchableOpacity>
          
          {showMore && (
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Text style={[styles.iconText, { color: tintColor }]}>⋯</Text>
            </TouchableOpacity>
          )}
          {showClose && (
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={onClose}>
              <Text style={[styles.iconText, { color: tintColor }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ── exported helper so screens know how tall the header is ──
export function useHeaderHeight() {
  const insets = useSafeAreaInsets();
  // top inset + inner row (16 padding top + ~42px row + 16 padding bottom)
  return insets.top + 74;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    zIndex:   50,
    overflow: 'hidden',
  },
  inner: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingVertical:   Spacing.lg,
  },
  left:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  avatarRing: {
    width:        42,
    height:       42,
    borderRadius: 21,
    borderWidth:  2,
    borderColor:  Colors.neonLime,
    padding:      2,
  },
  avatar: {
    width:          '100%',
    height:         '100%',
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily:  Fonts.headline,
    fontSize:    15,
    fontWeight:  '700',
    color:       Colors.neonLime,
  },
  onlineDot: {
    position:         'absolute',
    bottom:           0,
    right:            0,
    width:            12,
    height:           12,
    borderRadius:     6,
    backgroundColor:  Colors.neonLime,
    borderWidth:      2,
  },
  wordmark: {
    fontFamily:   Fonts.headline,
    fontSize:     22,
    fontWeight:   '900',
    fontStyle:    'italic',
    letterSpacing: -0.5,
  },
  iconBtn:  { padding: 8 },
  iconText: { fontSize: 18 },
});