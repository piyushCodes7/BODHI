// ─────────────────────────────────────────────────────────────
//  App.tsx — Root entry point
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['ViewPropTypes will be removed', 'ColorPropType will be removed']);

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </>
  );
}

