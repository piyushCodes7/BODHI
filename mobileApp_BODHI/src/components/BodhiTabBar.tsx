// ─────────────────────────────────────────────────────────────
//  BodhiTabBar.tsx — Custom floating bottom navigation
//  Matches Stitch design exactly:
//    • 5 tabs: Vault | Social | AI (elevated pill) | Market | Me
//    • AI tab = neon lime circle elevated -24px from bar
//    • Glass/frosted bar on light screens, dark on dark screens
//    • Active non-AI tabs: violet icon + label
//    • Inactive: slate-400
// ─────────────────────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Shadow } from '../theme/tokens';

// ── Icons (simple SVG-style via Unicode Material Symbols — swap
//    for react-native-vector-icons or @expo/vector-icons in Xcode) ──

type TabConfig = {
  key: string;
  label: string;
  icon: string;       // fallback text icon key
  isDark?: boolean;   // whether the screen this tab leads to is dark
};

const TAB_CONFIG: TabConfig[] = [
  { key: 'Vault',   label: 'VAULT',  icon: '💳' },
  { key: 'Social',  label: 'SOCIAL', icon: '👥' },
  { key: 'AI',      label: 'AI',     icon: '🎙' },
  { key: 'Market',  label: 'MARKET', icon: '📈' },
  { key: 'Me',      label: 'ME',     icon: '👤' },
];

interface BodhiTabBarProps extends BottomTabBarProps {
  /** Pass true from screens that have a dark background (#0c0e12) */
  isDarkScreen?: boolean;
}

export function BodhiTabBar({ state, descriptors, navigation, isDarkScreen }: BodhiTabBarProps) {
  const dark   = isDarkScreen ?? false;
  const insets = useSafeAreaInsets();

  const barBg    = dark ? 'rgba(12,14,18,0.75)'  : 'rgba(255,255,255,0.72)';
  const iconCol  = dark ? '#9ca3af'               : Colors.tabInactive;
  const activeCol= dark ? '#c084fc'               : Colors.electricViolet;
  const labelCol = dark ? '#6b7280'               : Colors.tabInactive;

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom || 16 }]}>
      {/* Blur backdrop */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={dark ? 'dark' : 'light'}
        blurAmount={24}
        reducedTransparencyFallbackColor={dark ? '#0c0e12' : '#f6f6fb'}
      />

      {/* Tinted overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: barBg }]} />

      {/* Top hairline */}
      <View style={[styles.hairline, { backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]} />

      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tab = TAB_CONFIG[index];
          const isAI = tab.key === 'AI';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (isAI) {
            return (
              <View key={route.key} style={styles.aiWrapper}>
                <TouchableOpacity
                  onPress={onPress}
                  activeOpacity={0.85}
                  style={[
                    styles.aiButton,
                    isFocused ? Shadow.neonLime : {},
                  ]}
                >
                  <Text style={styles.aiIcon}>🎙</Text>
                </TouchableOpacity>
                <Text style={[styles.aiLabel, { color: isFocused ? Colors.neonLimeDark : labelCol }]}>
                  AI
                </Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tab}
            >
              <Text style={[styles.tabIcon, { color: isFocused ? activeCol : iconCol }]}>
                {tab.icon}
              </Text>
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? activeCol : labelCol },
                isFocused && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position:       'absolute',
    bottom:         0,
    left:           0,
    right:          0,
    paddingTop:     4,
    overflow:       'visible',
    zIndex:         100,
  },
  hairline: {
    height: 0.5,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop:     8,
  },

  // ── Regular tab ─────────────────────────────────────────────
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontFamily:    Fonts.label,
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 1.2,
  },
  tabLabelActive: {
    fontWeight: '800',
  },

  // ── AI elevated pill ─────────────────────────────────────────
  aiWrapper: {
    flex:       1,
    alignItems: 'center',
    marginTop:  -28,            // lifts the pill up above bar
  },
  aiButton: {
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: Colors.neonLime,
    alignItems:      'center',
    justifyContent:  'center',
    // Neon glow from Stitch: shadow-[0_0_20px_rgba(209,252,0,0.5)]
    shadowColor:    '#d1fc00',
    shadowOffset:   { width: 0, height: 0 },
    shadowOpacity:  0.55,
    shadowRadius:   18,
    elevation:      14,
  },
  aiIcon: {
    fontSize: 22,
  },
  aiLabel: {
    fontFamily:    Fonts.label,
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 1.2,
    marginTop:     6,
  },
});