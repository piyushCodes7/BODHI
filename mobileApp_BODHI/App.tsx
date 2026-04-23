import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { configureGoogleSignIn } from './src/hooks/useOAuthSignIn'; 
import { AppNavigator } from './src/navigation/AppNavigator';
import { CalculatorProvider } from './src/context/CalculatorContext';
import { FloatingCalculator } from './src/components/FloatingCalculator';

// Screens
import { OnboardingScreen } from './src/screens/Onboarding/OnboardingScreen';
import VideoSplashScreen from './src/screens/Splash/VideoSplashScreen'; // Adjust path if needed

LogBox.ignoreLogs(['ViewPropTypes will be removed', 'ColorPropType will be removed']);

export default function App() {
  // 1. Controls the video splash animation
  const [showSplash, setShowSplash] = useState(true);
  
  // 2. Controls the Cyber-Glass onboarding
  // (In a real app, you'd check AsyncStorage here to see if they've already onboarded)
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    configureGoogleSignIn(); 
  }, []);

  return (
    <>
      {/* Dynamically match the status bar. Splash and Onboarding are dark, App is light */}
    <CalculatorProvider>
      <StatusBar barStyle={(showSplash || showOnboarding) ? "light-content" : "dark-content"} />
      
      {showSplash ? (
        // Step 1: Play the video. When done, it triggers setShowSplash(false)
        <VideoSplashScreen onFinish={() => setShowSplash(false)} />
      ) : showOnboarding ? (
        // Step 2: Show Onboarding. When they click START, it triggers setShowOnboarding(false)
        <OnboardingScreen onFinish={() => setShowOnboarding(false)} />
      ) : (
        // Step 3: Boot up the main application
        <AppNavigator />
      )}
      <FloatingCalculator />
    </CalculatorProvider>
    </>
  );
}