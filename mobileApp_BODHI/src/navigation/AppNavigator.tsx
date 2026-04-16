import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer }           from '@react-navigation/native';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { SafeAreaProvider }              from 'react-native-safe-area-context';

// ─── SCREEN IMPORTS ───
import { AuthScreen }                    from '../screens/AuthScreen';
import { VaultScreen }                   from '../screens/VaultScreen';
import { SocialScreen }                  from '../screens/SocialScreen';
import { AIVoiceScreen }                 from '../screens/AIVoiceScreen';
import { MarketScreen }                  from '../screens/MarketScreen';
import { PaperTradingScreen }            from '../screens/PaperTradingScreen';
import { PaymentScreen }                 from '../screens/PaymentScreen';
import { VentureClubScreen }             from '../screens/VentureClubScreen';
import InsuranceScreen                   from '../screens/TripWalletScreen';
import { ImmuneSystemAlertScreen }       from '../screens/TripAndAlertScreens';

// ─── COMPONENT IMPORTS ───
import { BodhiTabBar }                   from '../components/BodhiTabBar';

const Tab       = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BodhiTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Vault"  component={VaultScreen}   />
      <Tab.Screen name="Social" component={SocialScreen}  />
      <Tab.Screen name="AI"     component={AIVoiceScreen} />
      <Tab.Screen name="Trade"  component={PaperTradingScreen} /> 
      <Tab.Screen name="Market" component={MarketScreen}  />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      
      <RootStack.Screen name="VentureClub" component={VentureClubScreen} options={{ animation: 'slide_from_right' }} />
      <RootStack.Screen name="TripWallet" component={InsuranceScreen} options={{ animation: 'slide_from_right' }} />
      <RootStack.Screen name="PaymentScreen" component={PaymentScreen} options={{ animation: 'slide_from_right' }} />
      
      <RootStack.Screen name="ImmuneAlert" component={ImmuneSystemAlertScreen} options={{ presentation: 'modal', animation: 'fade_from_bottom' }} />
    </RootStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          <AuthStack.Screen name="Auth" component={AuthScreen} />
          <AuthStack.Screen name="Main" component={RootNavigator} />
        </AuthStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}