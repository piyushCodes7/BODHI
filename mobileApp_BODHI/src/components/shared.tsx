// src/components/shared.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { isTablet, isLandscape, responsiveFont, responsiveWidth, responsiveHeight } from '../utils/responsive';

export type NavTab = 'home' | 'payments' | 'social';

export const BodhiHeader = ({ onBack, onInsurancePress, showBack }: any) => (
  <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0A0A0A' }}>
    {showBack ? (
      <TouchableOpacity onPress={onBack} style={{ padding: 8 }}>
        <Text style={{ color: 'white', fontSize: responsiveFont(18) }}>←</Text>
      </TouchableOpacity>
    ) : <View style={{ width: 40 }} />}
    <TouchableOpacity onPress={onInsurancePress} style={{ padding: 8 }}>
      <Text style={{ color: '#D4FF00', fontSize: responsiveFont(20) }}>🛡️</Text>
    </TouchableOpacity>
  </View>
);

export const BottomNav = ({ active, onPress }: any) => <View />; // Hide this since you have MainTabNavigator

export const SectionHeader = ({ title }: { title: string }) => (
  <Text style={{ color: 'white', fontSize: responsiveFont(18), fontWeight: 'bold', marginBottom: 16, marginTop: 8 }}>
    {title}
  </Text>
);