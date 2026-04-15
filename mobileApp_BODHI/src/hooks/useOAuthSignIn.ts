import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes as GoogleStatusCodes,
} from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Automatically route to localhost on iOS Simulator, or 10.0.2.2 on Android Emulator
const API_URL = Platform.OS === 'ios' ? 'http://127.0.0.1:8000/auth' : 'http://10.0.2.2:8000/auth';
const JWT_STORAGE_KEY = 'bodhi_access_token';

interface OAuthResult {
  accessToken: string;
  isNewUser: boolean;
}

export function configureGoogleSignIn(): void {
  GoogleSignin.configure({
    // Your actual Web Client ID from Google Cloud Console
    webClientId: '527448749071-5b6bitovo5njvvgr7nctkc1mqgdv1l3j.apps.googleusercontent.com',
    iosClientId: '527448749071-janpij0bp1m4mc72ffcq0cbkumfkitd6.apps.googleusercontent.com',
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });
}

export function useOAuthSignIn() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const saveToken = async (token: string) => {
    await AsyncStorage.setItem(JWT_STORAGE_KEY, token);
  };

  // ── GOOGLE ──────────────────────────────────────────────────────────────────
  const handleGoogleLogin = useCallback(async (): Promise<OAuthResult | null> => {
    setIsLoading('google');
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken;

      if (!idToken) throw new Error('Google Sign-In did not return an id_token.');

      const response = await fetch(`${API_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Backend verification failed');

      await saveToken(data.access_token);
      return { accessToken: data.access_token, isNewUser: data.is_new_user };

    } catch (error: any) {
      if (
        error.code === GoogleStatusCodes.SIGN_IN_CANCELLED ||
        error.code === GoogleStatusCodes.IN_PROGRESS
      ) return null;

      Alert.alert('Google Sign-In Failed', error.message || 'An unexpected error occurred.');
      return null;
    } finally {
      setIsLoading(null);
    }
  }, []);

  // ── APPLE ───────────────────────────────────────────────────────────────────
  const handleAppleLogin = useCallback(async (): Promise<OAuthResult | null> => {
    if (!appleAuth.isSupported) {
      Alert.alert('Not Supported', 'Sign in with Apple requires iOS 13 or later.');
      return null;
    }

    setIsLoading('apple');
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);
      if (credentialState !== appleAuth.State.AUTHORIZED) throw new Error('Apple credential state is not authorized.');

      const { identityToken, fullName } = appleAuthRequestResponse;
      if (!identityToken) throw new Error('Apple Sign-In did not return an identityToken.');

      const displayName = fullName?.givenName && fullName?.familyName
        ? `${fullName.givenName} ${fullName.familyName}`.trim()
        : fullName?.givenName || null;

      const response = await fetch(`${API_URL}/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity_token: identityToken, full_name: displayName }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Backend verification failed');

      await saveToken(data.access_token);
      return { accessToken: data.access_token, isNewUser: data.is_new_user };

    } catch (error: any) {
      if (error?.code === appleAuth.Error.CANCELED || error?.code === '1001') return null;

      Alert.alert('Apple Sign-In Failed', error.message || 'An unexpected error occurred.');
      return null;
    } finally {
      setIsLoading(null);
    }
  }, []);

  return { isLoading, handleGoogleLogin, handleAppleLogin };
}