// App.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { Colors } from './src/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { TripWalletScreen } from './src/screens/TripWalletScreen';
import { SocialScreen } from './src/screens/SocialScreen';
import { InsuranceScreen } from './src/screens/InsuranceScreen';
import { PaymentScreen } from './src/screens/PaymentScreen';
import type { NavTab } from './src/components/shared';
import { BootstrapAPI, type DemoBootstrapResponse } from './src/services/api';

type Screen = 'HOME' | 'TRIP' | 'SOCIAL' | 'PAYMENT';

export default function App() {
  const [screen, setScreen]         = useState<Screen>('HOME');
  const [activeTab, setActiveTab]   = useState<NavTab>('VAULT');
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [demoData, setDemoData]     = useState<DemoBootstrapResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    BootstrapAPI.ensureDemoData()
      .then(data => { if (mounted) setDemoData(data); })
      .catch(err => console.warn('Bootstrap unavailable, using local fallbacks.', err));
    return () => { mounted = false; };
  }, []);

  const handleTabPress = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'VAULT')   setScreen('HOME');
    else if (tab === 'SOCIAL') setScreen('SOCIAL');
    else setScreen('HOME');
  };

  const goHome = () => { setScreen('HOME'); setActiveTab('VAULT'); };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      {screen === 'HOME' && (
        <HomeScreen
          activeTab={activeTab}
          onNavigate={handleTabPress}
          onInsurancePress={() => setInsuranceOpen(true)}
          onSocialPress={() => { setScreen('SOCIAL'); setActiveTab('SOCIAL'); }}
          onTripPress={() => { setScreen('TRIP'); setActiveTab('VAULT'); }}
          onPayPress={() => setScreen('PAYMENT')}
        />
      )}

      {screen === 'SOCIAL' && (
        <SocialScreen
          activeTab={activeTab}
          onNavigate={handleTabPress}
          onInsurancePress={() => setInsuranceOpen(true)}
          currentUserId={demoData?.current_user_id}
          demoGroupId={demoData?.group_id}
        />
      )}

      {screen === 'TRIP' && (
        <TripWalletScreen
          activeTab={activeTab}
          onNavigate={handleTabPress}
          onInsurancePress={() => setInsuranceOpen(true)}
          onBack={goHome}
          currentUserId={demoData?.current_user_id}
          tripId={demoData?.trip_id}
        />
      )}

      {screen === 'PAYMENT' && (
        <PaymentScreen
          activeTab={activeTab}
          onNavigate={handleTabPress}
          onInsurancePress={() => setInsuranceOpen(true)}
          onBack={goHome}
          currentUserId={demoData?.current_user_id}
        />
      )}

      <InsuranceScreen
        visible={insuranceOpen}
        onClose={() => setInsuranceOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
});
