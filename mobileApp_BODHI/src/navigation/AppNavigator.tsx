import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer }           from '@react-navigation/native';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { SafeAreaProvider }              from 'react-native-safe-area-context';

// Screens
import { PaymentScreen }                 from '../screens/PaymentScreen';
import { BodhiTabBar }                   from '../components/BodhiTabBar';
import { AuthScreen }                    from '../screens/AuthScreen';
import { VaultScreen }                   from '../screens/VaultScreen';
import { SocialScreen }                  from '../screens/SocialScreen';
import { AIVoiceScreen }                 from '../screens/AIVoiceScreen';
import { MarketScreen }                  from '../screens/MarketScreen';
import { PaperTradingScreen }            from '../screens/PaperTradingScreen';
import { InsuranceStoriesScreen }        from '../screens/InsuranceStoriesScreen';
import { GroupTripWalletScreen, ImmuneSystemAlertScreen } from '../screens/TripAndAlertScreens';
import { Colors, Fonts }                 from '../theme/tokens';

function MeScreen({ navigation }: any) {
  return (
    <View style={ph.root}>
      <Text style={ph.title}>Profile</Text>
      <TouchableOpacity style={ph.btn} onPress={() => navigation.navigate('InsuranceStories')}>
        <Text style={ph.btnText}>→ Insurance Stories</Text>
      </TouchableOpacity>
      <TouchableOpacity style={ph.btn} onPress={() => navigation.navigate('TripWallet')}>
        <Text style={ph.btnText}>→ Trip Wallet</Text>
      </TouchableOpacity>
    </View>
  );
}

const ph = StyleSheet.create({
  root:    { flex:1, backgroundColor: Colors.surface, alignItems:'center', justifyContent:'center', gap:16 },
  title:   { fontFamily: Fonts.headline, fontSize:24, fontWeight:'700', color: Colors.textPrimary, marginBottom:8 },
  btn:     { backgroundColor: Colors.surfaceLow, borderRadius:12, paddingHorizontal:24, paddingVertical:14 },
  btnText: { fontFamily: Fonts.label, fontSize:13, fontWeight:'700', color: Colors.electricViolet },
});

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
      <Tab.Screen name="Me"     component={MeScreen}      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      <RootStack.Screen
        name="InsuranceStories"
        component={InsuranceStoriesScreen}
        options={{ presentation:'fullScreenModal', animation:'slide_from_bottom' }}
      />
      <RootStack.Screen
        name="TripWallet"
        component={GroupTripWalletScreen}
        options={{ animation:'slide_from_right' }}
      />
      <RootStack.Screen
        name="ImmuneAlert"
        component={ImmuneSystemAlertScreen}
        options={{ presentation:'modal', animation:'fade_from_bottom' }}
      />
      
      {/* PERFECTLY WIRED PAYMENT SCREEN */}
      <RootStack.Screen
        name="PaymentScreen"
        component={PaymentScreen}
        options={{ animation:'slide_from_right' }}
      />
    </RootStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthStack.Navigator screenOptions={{ headerShown:false, animation:'fade' }}>
          <AuthStack.Screen name="Auth" component={AuthScreen} />
          <AuthStack.Screen name="Main" component={RootNavigator} />
        </AuthStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}