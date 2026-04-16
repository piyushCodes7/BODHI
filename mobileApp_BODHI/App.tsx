import React, { useEffect } from 'react';
import { configureGoogleSignIn } from './src/hooks/useOAuthSignIn'; // Adjust path if needed
import { StatusBar, LogBox } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';

LogBox.ignoreLogs(['ViewPropTypes will be removed', 'ColorPropType will be removed']);

export default function App() {
  useEffect(() => {
    // This tells the native Google SDK what your Web Client ID is
    configureGoogleSignIn(); 
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </>
  );
}