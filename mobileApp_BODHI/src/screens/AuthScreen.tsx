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
import { Smartphone, Eye, EyeOff } from 'lucide-react-native';
import { Colors, Radius, Spacing, Shadow } from '../theme/tokens';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

// Automatically route to localhost on iOS Simulator, or 10.0.2.2 on Android
const API_URL = Platform.OS === 'ios' ? 'http://127.0.0.1:8000/auth' : 'http://10.0.2.2:8000/auth';

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
        const formData = new URLSearchParams();
        formData.append('username', email.trim().toLowerCase()); 
        formData.append('password', password);

        const response = await fetch(`${API_URL}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Incorrect credentials');

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

        const data = await response.json();
        
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
      
      const data = await response.json();
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
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          otp, 
          new_password: newPassword 
        }),
      });

      const data = await response.json();
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
      {/* 🟢 YOUR NEW LOGO IMAGE 🟢 */}
      {/* Make sure 'bodhi-logo.png' exists in your assets/images folder! */}
      <Image 
        source={require('../../assets/images/bodhi-logo.png')} 
        style={styles.logoImage}
        resizeMode="contain" 
      />
      <Text style={styles.tagline}>Your money. Alive.</Text>
    </View>
  );

  const renderToggle = () => (
    <View style={styles.toggleContainer}>
      <TouchableOpacity 
        style={[styles.toggleBtn, authMode === 'login' && styles.toggleBtnActive]}
        onPress={() => setAuthMode('login')}
      >
        <Text style={[styles.toggleText, authMode === 'login' && styles.toggleTextActive]}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.toggleBtn, authMode === 'signup' && styles.toggleBtnActive]}
        onPress={() => setAuthMode('signup')}
      >
        <Text style={[styles.toggleText, authMode === 'signup' && styles.toggleTextActive]}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7B2FBE', '#FF2A5F']}
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

          {/* 🟢 Mascot Placeholder: If you add Spline/Rive later, put the View here! */}
          
          <View style={styles.card}>
            
            {/* Standard Login / Signup Flow */}
            {(authMode === 'login' || authMode === 'signup') && (
              <>
                {renderToggle()}
                <View style={styles.form}>
                  {authMode === 'signup' && (
                    <>
                      <Text style={styles.inputLabel}>FULL NAME</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor="#9CA3AF"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                      <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="+91 XXXXX-XXXXX"
                        placeholderTextColor="#9CA3AF"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                    </>
                  )}

                  <Text style={styles.inputLabel}>EMAIL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="user@domain.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Enter strong password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                      style={styles.eyeBtn} 
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                    </TouchableOpacity>
                  </View>

                  {authMode === 'login' ? (
                    <TouchableOpacity style={styles.forgotBtn} onPress={() => setAuthMode('forgot')}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ height: Spacing.lg }} />
                  )}

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleStandardAuth} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#000" /> : (
                      <Text style={styles.primaryBtnText}>{authMode === 'login' ? 'Login to BODHI' : 'Create Account'}</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Social Auth */}
                <View style={styles.socialSection}>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <View style={styles.socialRow}>
                    <SocialAuthButtons onSuccess={handleOAuthSuccess} />
                    <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert('Phone', 'Coming soon!')}>
                      <Smartphone size={22} color="#000" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* Forgot Password Flow */}
            {authMode === 'forgot' && (
              <View style={styles.form}>
                <Text style={[styles.toggleTextActive, { fontSize: 22, marginBottom: 8 }]}>Reset Password</Text>
                <Text style={{ color: '#6B7280', marginBottom: 24 }}>Enter your email and we'll send you a 6-digit reset code.</Text>

                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@domain.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={handleForgotPassword} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Send Reset Code</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', marginTop: 24 }} onPress={() => setAuthMode('login')}>
                  <Text style={styles.footerLink}>← Back to Login</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Reset Password (OTP) Flow */}
            {authMode === 'reset' && (
              <View style={styles.form}>
                <Text style={[styles.toggleTextActive, { fontSize: 22, marginBottom: 8 }]}>Enter Code</Text>
                <Text style={{ color: '#6B7280', marginBottom: 24 }}>We sent a 6-digit code to <Text style={{ color: Colors.electricViolet, fontWeight: '700' }}>{email}</Text>.</Text>

                <Text style={styles.inputLabel}>6-DIGIT CODE</Text>
                <TextInput
                  style={[styles.input, { letterSpacing: 8, fontSize: 22, textAlign: 'center', fontWeight: '700' }]}
                  placeholder="••••••"
                  placeholderTextColor="#9CA3AF"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min 8 chars, 1 uppercase, 1 special"
                  placeholderTextColor="#9CA3AF"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={handleResetPassword} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Confirm New Password</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', marginTop: 24 }} onPress={() => setAuthMode('forgot')}>
                  <Text style={styles.footerLink}>← Resend Code</Text>
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
  header: { alignItems: 'center', marginBottom: 40 },
  
  // 🟢 NEW LOGO STYLES 🟢
  logoImage: { width: 185, height: 65, marginBottom: 8 },
  
  logoText: { fontSize: 48, fontWeight: '900', color: '#FFF', letterSpacing: -1.5 },
  tagline: { fontSize: 16,fontWeight: '500', color: 'rgba(255,255,255,0.9)', marginTop: -4,textShadowOffset: { width: 0, height: 0 },textShadowRadius: 10, },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: Spacing.xl, ...Shadow.lg },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: Radius.full, padding: 4, marginBottom: Spacing.xl },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.full, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Colors.neonLime, ...Shadow.sm },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#000', fontWeight: '800' },

  form: { marginBottom: Spacing.sm },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1.5, marginBottom: 8, marginTop: Spacing.md },
  input: { backgroundColor: '#F3F4F6', borderRadius: Radius.md, padding: 16, fontSize: 16, color: '#000', fontWeight: '500' },
  
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: Radius.md },
  eyeBtn: { padding: 16 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: 12, marginBottom: Spacing.xl },
  forgotText: { color: Colors.electricViolet, fontWeight: '700', fontSize: 13 },

  primaryBtn: { backgroundColor: Colors.neonLime, borderRadius: Radius.full, paddingVertical: 18, alignItems: 'center', shadowColor: Colors.neonLime, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },

  socialSection: { marginTop: Spacing.xl },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg },
  socialBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  
  footerLink: { color: Colors.electricViolet, fontWeight: '800', fontSize: 14 },
});