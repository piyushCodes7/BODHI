import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Smartphone,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../theme/tokens';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { BASE_URL } from '../api/client';

// Automatically route to auth endpoints based on the global BASE_URL
const API_URL = `${BASE_URL}/auth`;

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export function AuthScreen({ navigation }: any) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // ─── HANDLERS ────────────────────────────────────────────────────────────

  const handleOAuthSuccess = (accessToken: string, isNewUser: boolean) => {
    console.log("OAuth Success Token:", accessToken);
    navigation.replace('Main');
  };

  const handleStandardAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'login') {
        // Robust form encoding for React Native instead of URLSearchParams
        const formBody = [];
        const details: any = {
          username: email.trim().toLowerCase(),
          password: password,
        };
        for (const property in details) {
          const encodedKey = encodeURIComponent(property);
          const encodedValue = encodeURIComponent(details[property]);
          formBody.push(encodedKey + "=" + encodedValue);
        }

        const response = await fetch(`${API_URL}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formBody.join('&'),
        });

        const rawText = await response.text();
        let data;
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          throw new Error(`Server error: ${rawText.substring(0, 100)}`);
        }

        if (!response.ok) throw new Error(data.detail || 'Incorrect credentials');

        await AsyncStorage.setItem('bodhi_access_token', data.access_token);

        navigation.replace('Main');

      } else if (authMode === 'signup') {
        if (!name || !phone) throw new Error('Please fill in all fields.');

        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password,
            full_name: name,
            phone_number: phone
          }),
        });

        const rawText = await response.text();
        let data;
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          throw new Error(`Server error: ${rawText.substring(0, 100)}`);
        }
        
        if (!response.ok) {
          let errorMsg = 'Could not create account';
          if (data.detail) {
            if (typeof data.detail === 'string') {
              errorMsg = data.detail;
            } else if (Array.isArray(data.detail)) {
              errorMsg = data.detail.map((err: any) => {
                const fieldName = err.loc ? err.loc[err.loc.length - 1] : 'Field';
                return `${fieldName}: ${err.msg}`;
              }).join('\n');
            } else {
              errorMsg = JSON.stringify(data.detail);
            }
          }
          throw new Error(errorMsg);
        }

        Alert.alert('Success', 'Account created! Please log in.');
        setAuthMode('login');
      }
    } catch (error: any) {
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address above.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Server error: ${rawText.substring(0, 100)}`);
      }

      if (!response.ok) throw new Error(data.detail || 'Failed to send reset code.');

      setAuthMode('reset');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6 || newPassword.length < 8) {
      Alert.alert('Invalid Input', 'Please enter the 6-digit code and a valid new password.');
      return;
    }

    setIsLoading(true);
    try {
      // Endpoint should be /reset-password based on auth.py
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
          new_password: newPassword
        }),
      });

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Server error: ${rawText.substring(0, 100)}`);
      }

      if (!response.ok) throw new Error(data.detail || 'Invalid or expired code.');

      Alert.alert('Success 🎉', 'Your password has been reset!');
      setAuthMode('login');
      setOtp('');
      setNewPassword('');
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── RENDERERS ───────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={styles.header}>
      <Image
        source={require('../../assets/images/bodhi-logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={styles.tagline}>
        Your money. <Text style={styles.taglineHighlight}>Alive.</Text>
      </Text>
    </View>
  );

  const renderToggle = () => (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => setAuthMode('login')}
        activeOpacity={0.8}
      >
        {authMode === 'login' ? (
          <LinearGradient
            colors={['#7B2FBE', '#4A00E0']}
            style={styles.activeToggleBg}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.toggleTextActive}>Login</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.toggleText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => setAuthMode('signup')}
        activeOpacity={0.8}
      >
        {authMode === 'signup' ? (
          <LinearGradient
            colors={['#7B2FBE', '#4A00E0']}
            style={styles.activeToggleBg}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.toggleTextActive}>Sign Up</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.toggleText}>Sign Up</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Deep Neon Background Gradient */}
      <LinearGradient
        colors={['#05001F', '#2A0845', '#7A004A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderHeader()}

          <View style={styles.glassCard}>

            {/* ─── Standard Login / Signup Flow ─── */}
            {(authMode === 'login' || authMode === 'signup') && (
              <>
                {renderToggle()}
                <View style={styles.form}>
                  {authMode === 'signup' && (
                    <>
                      <Text style={styles.inputLabel}>FULL NAME</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g., Jane Doe"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={name}
                          onChangeText={setName}
                          autoCapitalize="words"
                        />
                      </View>

                      <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g., 98765 43210"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          value={phone}
                          onChangeText={setPhone}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </>
                  )}

                  <Text style={styles.inputLabel}>EMAIL</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={18} color="#A855F7" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., name@example.com"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color="#A855F7" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1, paddingLeft: 0 }]}
                      placeholder="Min. 8 characters"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} color="#A855F7" /> : <Eye size={18} color="#A855F7" />}
                    </TouchableOpacity>
                  </View>

                  {authMode === 'login' ? (
                    <TouchableOpacity style={styles.forgotBtn} onPress={() => setAuthMode('forgot')}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ height: Spacing.xl }} />
                  )}

                  <TouchableOpacity activeOpacity={0.8} onPress={handleStandardAuth} disabled={isLoading}>
                    <LinearGradient
                      colors={['#FFE259', '#C8FF00']}
                      style={styles.primaryBtn}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                      {isLoading ? <ActivityIndicator color="#000" /> : (
                        <>
                          <Text style={styles.primaryBtnText}>
                            {authMode === 'login' ? 'Login to BODHI' : 'Create Account'}
                          </Text>
                          <ChevronRight size={20} color="#000" style={{ position: 'absolute', right: 20 }} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Social Auth (Restored Original Logic) */}
                <View style={styles.socialSection}>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <View style={styles.socialRow}>

                    {/* Your existing functioning Social Component */}
                    <SocialAuthButtons onSuccess={handleOAuthSuccess} />

                    <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert('Phone', 'Coming soon!')}>
                      <Smartphone size={22} color="#FFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Security Footer */}
                  <View style={styles.securityFooter}>
                    <ShieldCheck size={14} color="#A855F7" />
                    <Text style={styles.securityText}>
                      Your data is <Text style={{ color: Colors.neonLime, fontWeight: '700' }}>100% secure</Text> with bank-level encryption
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* ─── Forgot Password Flow ─── */}
            {authMode === 'forgot' && (
              <View style={styles.form}>
                <Text style={styles.flowTitle}>Reset Password</Text>
                <Text style={styles.flowSub}>Enter your email and we'll send you a 6-digit reset code.</Text>

                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#A855F7" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., name@example.com"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity activeOpacity={0.8} onPress={handleForgotPassword} disabled={isLoading} style={{ marginTop: 32 }}>
                  <LinearGradient
                    colors={['#FFE259', '#C8FF00']}
                    style={styles.primaryBtn}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? <ActivityIndicator color="#000" /> : (
                      <>
                        <Text style={styles.primaryBtnText}>Send Reset Code</Text>
                        <ChevronRight size={20} color="#000" style={{ position: 'absolute', right: 20 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', marginTop: 32 }} onPress={() => setAuthMode('login')}>
                  <Text style={styles.forgotText}>← Back to Login</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ─── Reset Password (OTP) Flow ─── */}
            {authMode === 'reset' && (
              <View style={styles.form}>
                <Text style={styles.flowTitle}>Enter Code</Text>
                <Text style={styles.flowSub}>
                  We sent a 6-digit code to <Text style={{ color: Colors.neonLime }}>{email}</Text>.
                </Text>

                <Text style={styles.inputLabel}>6-DIGIT CODE</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { letterSpacing: 8, fontSize: 22, textAlign: 'center', fontWeight: '700' }]}
                    placeholder="••••••"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#A855F7" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1, paddingLeft: 0 }]}
                    placeholder="Min 8 chars, 1 uppercase, 1 special"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity activeOpacity={0.8} onPress={handleResetPassword} disabled={isLoading} style={{ marginTop: 32 }}>
                  <LinearGradient
                    colors={['#FFE259', '#C8FF00']}
                    style={styles.primaryBtn}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? <ActivityIndicator color="#000" /> : (
                      <Text style={styles.primaryBtnText}>Confirm New Password</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', marginTop: 32 }} onPress={() => setAuthMode('forgot')}>
                  <Text style={styles.forgotText}>← Resend Code</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30 },

  logoImage: { width: 180, height: 60, marginBottom: 12, tintColor: '#FFF' },
  tagline: { fontSize: 15, fontWeight: '500', color: '#FFF' },
  taglineHighlight: { color: Colors.neonLime, fontWeight: '800' },

  // ── GLASS CARD ──
  glassCard: {
    backgroundColor: 'rgba(15, 10, 30, 0.6)',
    borderRadius: 30,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 50, 150, 0.3)',
  },

  // ── TOGGLE ──
  toggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.full, padding: 4, marginBottom: Spacing.xl },
  toggleBtn: { flex: 1, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', height: 44 },
  activeToggleBg: { width: '100%', height: '100%', borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', shadowColor: '#A855F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 },
  toggleText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  toggleTextActive: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  // ── FORM & TEXT ──
  form: { marginBottom: Spacing.sm },
  flowTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  flowSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 24, textAlign: 'center', lineHeight: 20 },

  inputLabel: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 1.5, marginBottom: 8, marginTop: Spacing.md },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inputIcon: { marginLeft: 16, marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, paddingHorizontal: 16, fontSize: 15, color: '#FFF', fontWeight: '500' },
  eyeBtn: { padding: 16 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: 12, marginBottom: Spacing.xl },
  forgotText: { color: '#FF2D78', fontWeight: '700', fontSize: 13 },

  // ── BUTTON ──
  primaryBtn: { borderRadius: Radius.full, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: Colors.neonLime, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },

  // ── SOCIAL & FOOTER ──
  socialSection: { marginTop: Spacing.xl },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: Spacing.xl },

  // NOTE: If your SocialAuthButtons look out of place, go into your SocialAuthButtons.tsx file 
  // and update their background color to 'rgba(255,255,255,0.05)' to match this dark theme!
  socialBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  securityFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  securityText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginLeft: 6 },
});