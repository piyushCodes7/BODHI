/**
 * BODHI — HomeStack Navigator
 * ───────────────────────────
 * Replaces the old static modal overlay with a proper
 * @react-navigation/native-stack architecture.
 *
 * Stack:
 *  Home              → HomeScreen
 *  PaperTrade        → PaperTradeScreen
 *  PersonalDetails   → PersonalDetailsScreen
 *  BankAccounts      → BankAccountsScreen
 *  SecuritySettings  → SecuritySettingsScreen
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { VaultScreen as HomeScreen } from '../screens/VaultScreen';
import PaperTradeScreen from '../screens/PaperTradeScreen';
import PersonalDetailsScreen from '../screens/PersonalDetailsScreen';
import BankAccountsScreen from '../screens/BankAccountsScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';

import { Colors } from '../theme/tokens';

// ─── Param List (strict typing for all routes) ────────────────────────────────

export type HomeStackParamList = {
  Home:             undefined;
  PaperTrade:       undefined;
  PersonalDetails:  undefined;
  BankAccounts:     undefined;
  SecuritySettings: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

// ─── Shared header theme ──────────────────────────────────────────────────────

const screenOptions = {
  headerStyle:       { backgroundColor: Colors.darkBase },
  headerTintColor:   Colors.neonLime,
  headerTitleStyle:  { color: Colors.textPrimary, fontWeight: '700' as const },
  headerBackTitleVisible: false,
  contentStyle:      { backgroundColor: Colors.bgDeep },
} as const;

// ─── Navigator ────────────────────────────────────────────────────────────────

const HomeStack: React.FC = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}  // custom header inside HomeScreen
    />
    <Stack.Screen
      name="PaperTrade"
      component={PaperTradeScreen}
      options={{ title: '📈 Paper Trade' }}
    />
    <Stack.Screen
      name="PersonalDetails"
      component={PersonalDetailsScreen}
      options={{ title: 'Personal Details' }}
    />
    <Stack.Screen
      name="BankAccounts"
      component={BankAccountsScreen}
      options={{ title: 'Bank Accounts' }}
    />
    <Stack.Screen
      name="SecuritySettings"
      component={SecuritySettingsScreen}
      options={{ title: '🔐 Security' }}
    />
  </Stack.Navigator>
);

export default HomeStack;
