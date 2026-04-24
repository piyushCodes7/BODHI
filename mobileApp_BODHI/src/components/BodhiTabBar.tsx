// ─────────────────────────────────────────────────────────────
//  BodhiTabBar.tsx — Custom floating bottom navigation
//  Updated: 5 Tabs (Vault | Social | AI | Trade | Market) with Lucide Icons
// ─────────────────────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { isTablet, isLandscape, responsiveFont, responsiveWidth, responsiveHeight } from '../utils/responsive';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Import official line-art icons
import { Lock, Users, Cpu, BarChart2, Shuffle, Compass } from 'lucide-react-native';

import { Colors, Fonts, Radius } from '../theme/tokens';

type TabConfig = {
  label: string;
  Icon: React.ElementType; // Using React components for icons now
};

// Map routes to official Lucide icons. "Me" tab has been removed.
const TAB_CONFIG: Record<string, TabConfig> = {
  Vault:     { label: 'VAULT',     Icon: Lock },
  Social:    { label: 'SOCIAL',    Icon: Users },
  AI:        { label: 'AI',        Icon: Cpu },
  Trade:     { label: 'TRADE',     Icon: BarChart2 },
  Market:    { label: 'MARKET',    Icon: Shuffle },
};

interface BodhiTabBarProps extends BottomTabBarProps {
  isDarkScreen?: boolean;
}

export function BodhiTabBar({ state, descriptors, navigation, isDarkScreen }: BodhiTabBarProps) {
  const dark   = isDarkScreen ?? false;
  const insets = useSafeAreaInsets();

  const barBg    = dark ? 'rgba(12,14,18,0.75)'  : 'rgba(255,255,255,0.72)';
  const iconCol  = dark ? '#9ca3af'               : Colors.tabInactive;
  const activeCol= dark ? '#c084fc'               : Colors.electricViolet; // Purple active state
  const labelCol = dark ? '#6b7280'               : Colors.tabInactive;

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom || (Platform.OS === 'android' ? 24 : 16) }]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={dark ? 'dark' : 'light'}
          blurAmount={24}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(12,14,18,0.9)' : 'rgba(255,255,255,0.9)' }]} />
      )}

      <View style={[StyleSheet.absoluteFill, { backgroundColor: barBg }]} />

      <View style={[styles.hairline, { backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]} />

      <View style={[styles.row, { maxWidth: isTablet ? 700 : '100%', alignSelf: 'center', width: '100%' }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          const tab = TAB_CONFIG[route.name] || { label: route.name, Icon: Lock };
          const isAI = route.name === 'AI';
          const IconComponent = tab.Icon;

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
                    { 
                      backgroundColor: dark ? '#1A1A24' : '#FFFFFF',
                      shadowColor: isFocused ? Colors.electricViolet : '#c084fc',
                    }
                  ]}
                >
                  <IconComponent 
                    size={28} 
                    color={dark ? Colors.textPrimary : '#12102A'} 
                    strokeWidth={2}
                  />
                </TouchableOpacity>
                <Text style={[styles.aiLabel, { color: isFocused ? activeCol : labelCol }]}>
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
              <IconComponent 
                size={22} 
                color={isFocused ? activeCol : iconCol} 
                strokeWidth={isFocused ? 2.5 : 2}
                style={styles.tabIcon}
              />
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
    paddingHorizontal: 12, // Adjusted for 5 tabs
    paddingTop:     8,
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontFamily:    Fonts.label,
    fontSize: responsiveFont(10), // Sized up slightly since we have more room with 5 tabs
    fontWeight:    '600',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    fontWeight: '800',
  },
  aiWrapper: {
    flex:       1.2, 
    alignItems: 'center',
    marginTop:  -36, // Pulled up higher to match your image
  },
  aiButton: {
    width:           60,
    height:          60,
    borderRadius:    30,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     'rgba(192, 132, 252, 0.15)', // Soft purple border ring
    // The soft glowing shadow from your image
    shadowOffset:   { width: 0, height: 8 },
    shadowOpacity:  0.4,
    shadowRadius:   16,
    elevation:      10,
  },
  aiLabel: {
    fontFamily:    Fonts.label,
    fontSize: responsiveFont(10),
    fontWeight:    '700',
    letterSpacing: 1.2,
    marginTop:     8,
  },
});