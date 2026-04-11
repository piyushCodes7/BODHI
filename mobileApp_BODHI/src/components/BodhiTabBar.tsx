// ─────────────────────────────────────────────────────────────
//  BodhiTabBar.tsx — Custom floating bottom navigation
//  Updated: Supports 6 tabs (Vault | Social | AI | Trade | Market | Me)
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

type TabConfig = {
  key: string;
  label: string;
  icon: string;
};

// Map icons directly to the Route Names defined in AppNavigator
const TAB_CONFIG: Record<string, TabConfig> = {
  Vault:  { key: 'Vault',  label: 'VAULT',  icon: '💳' },
  Social: { key: 'Social', label: 'SOCIAL', icon: '👥' },
  AI:     { key: 'AI',     label: 'AI',     icon: '🎙' },
  Trade:  { key: 'Trade',  label: 'TRADE',  icon: '💹' }, // New Trade Icon
  Market: { key: 'Market', label: 'MARKET', icon: '📈' },
  Me:     { key: 'Me',     label: 'ME',     icon: '👤' },
};

interface BodhiTabBarProps extends BottomTabBarProps {
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
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={dark ? 'dark' : 'light'}
        blurAmount={24}
        reducedTransparencyFallbackColor={dark ? '#0c0e12' : '#f6f6fb'}
      />

      <View style={[StyleSheet.absoluteFill, { backgroundColor: barBg }]} />

      <View style={[styles.hairline, { backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]} />

      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          // Lookup config by route name (More robust than index)
          const tab = TAB_CONFIG[route.name] || { label: route.name, icon: '⚪️' };
          const isAI = route.name === 'AI';

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
                  <Text style={styles.aiIcon}>{tab.icon}</Text>
                </TouchableOpacity>
                <Text style={[styles.aiLabel, { color: isFocused ? Colors.neonLimeDark : labelCol }]}>
                  {tab.label}
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
    paddingHorizontal: 4, // Tightened for 6 tabs
    paddingTop:     8,
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 18, // Slightly smaller for 6-tab fit
    marginBottom: 2,
  },
  tabLabel: {
    fontFamily:    Fonts.label,
    fontSize:      8, // Slightly smaller for 6-tab fit
    fontWeight:    '700',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    fontWeight: '800',
  },
  aiWrapper: {
    flex:       1.2, // Give the elevated button slightly more room
    alignItems: 'center',
    marginTop:  -32, 
  },
  aiButton: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: Colors.neonLime,
    alignItems:      'center',
    justifyContent:  'center',
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