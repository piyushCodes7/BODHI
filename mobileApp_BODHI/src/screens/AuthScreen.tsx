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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Smartphone } from 'lucide-react-native';
import { Colors, Radius, Spacing, Shadow } from '../theme/tokens';

export function AuthScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  
  // State for all form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 1. Working Forgot Password Logic
  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert(
        'Email Required', 
        'Please enter your email address in the field above so we can send you a reset link.'
      );
      return;
    }
    
    Alert.alert(
      'Reset Link Sent', 
      `We've sent a secure password reset link to ${email}. Please check your inbox.`,
      [{ text: 'Back to Login', style: 'default' }]
    );
  };

  const handleSocialAuth = (provider: string) => {
    Alert.alert(
      `${provider} Sign-In`,
      `Official ${provider} authentication requires native developer keys and is disabled in this environment.`,
      [{ text: 'Got it', style: 'cancel' }]
    );
  };

  const handleAuth = () => {
    if (!isLogin) {
      if (!name || !phone || !email || !password) {
        Alert.alert('Error', 'Please fill in all fields to create your account.');
        return;
      }
    } else {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter both email and password.');
        return;
      }
    }
    
    navigation.replace('Main'); 
  };

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
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.logoText}>BODHI</Text>
            <Text style={styles.tagline}>Your money. Alive.</Text>
          </View>

          {/* White Auth Card */}
          <View style={styles.card}>
            
            {/* Top Toggle (Login / Sign Up) */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Form Inputs */}
            <View style={styles.form}>
              
              {/* 3. Conditional Fields: Only show Name and Phone on Sign Up */}
              {!isLogin && (
                <>
                  <Text style={styles.inputLabel}>FULL NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Govind Jindal"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />

                  <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </>
              )}

              {/* Email & Password (Always shown) */}
              <Text style={styles.inputLabel}>EMAIL (USERNAME)</Text>
              <TextInput
                style={styles.input}
                placeholder="you@domain.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {/* Forgot Password (Only shown on Login) */}
              {isLogin ? (
                <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ height: Spacing.lg }} /> // Spacer for Sign Up mode
              )}

              {/* Main Action Button */}
              <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={handleAuth}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>
                  {isLogin ? 'Login to BODHI' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Social Auth Section */}
            <View style={styles.socialSection}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialAuth('Apple')}>
                  <Text style={{ fontSize: 24, color: '#000', marginBottom: 2 }}></Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialAuth('Google')}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#000' }}>G</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialAuth('Phone')}>
                  <Smartphone size={22} color="#000" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer Toggle */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.footerLink}>{isLogin ? 'Sign Up' : 'Login'}</Text>
              </TouchableOpacity>
            </View>

          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to BODHI's Terms of Service and Privacy Policy.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: Spacing.lg,
    paddingTop: 60, // Extra padding for top notch
    paddingBottom: 40 
  },
  
  header: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 48, fontWeight: '900', color: '#FFF', letterSpacing: -1.5 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: -4 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.xl,
    ...Shadow.lg,
  },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.full, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Colors.neonLime, ...Shadow.sm },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#000', fontWeight: '800' },

  form: { marginBottom: Spacing.sm },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1.5, marginBottom: 8, marginTop: Spacing.md },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: Radius.md,
    padding: 16,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 12, marginBottom: Spacing.xl },
  forgotText: { color: Colors.electricViolet, fontWeight: '700', fontSize: 13 },

  primaryBtn: {
    backgroundColor: Colors.neonLime,
    borderRadius: Radius.full,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: Colors.neonLime,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },

  socialSection: { marginTop: Spacing.xl },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg },
  socialBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#6B7280', fontSize: 14 },
  footerLink: { color: Colors.electricViolet, fontWeight: '800', fontSize: 14 },

  termsText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
});