import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { configureGoogleSignIn } from './src/hooks/useOAuthSignIn'; 
import { AppNavigator } from './src/navigation/AppNavigator';

// Import the Onboarding Screen
import { OnboardingScreen } from './src/screens/Onboarding/OnboardingScreen';

LogBox.ignoreLogs(['ViewPropTypes will be removed', 'ColorPropType will be removed']);

export default function App() {
  // State to control whether we show Onboarding or the Main App
  // Set to true by default so it shows on boot.
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    configureGoogleSignIn(); 
  }, []);

  return (
    <>
      {/* Dynamically match the status bar to the dark onboarding or your light app */}
      <StatusBar barStyle={showOnboarding ? "light-content" : "dark-content"} />
      
      {showOnboarding ? (
        // Pass a callback so the START button can trigger the app launch
        <OnboardingScreen onFinish={() => setShowOnboarding(false)} />
      ) : (
        // Once Onboarding is finished, boot up the main application
        <AppNavigator />
      )}
    </>
  );
}