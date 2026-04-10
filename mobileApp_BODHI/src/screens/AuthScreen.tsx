// ─────────────────────────────────────────────────────────────
//  AuthScreen.tsx — Login + Signup
//  Dark-to-light hybrid | Not in Stitch (designed from DESIGN.md)
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';

const { width: W, height: H } = Dimensions.get('window');

type AuthMode = 'login' | 'signup';

export function AuthScreen({ navigation }: any) {
  const [mode, setMode]         = useState<AuthMode>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');

  const proceed = () => {
    navigation?.replace('Main');
  };

  return (
    <View style={styles.root}>
      {/* ── Gradient hero top half ──────────────────────────── */}
      <LinearGradient
        colors={[Colors.electricViolet, Colors.magenta, Colors.hotPink]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.heroBg}
      />

      {/* Ambient orb behind logo */}
      <View style={styles.ambientOrb} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Wordmark + tagline ────────────────────────── */}
          <View style={styles.logoArea}>
            <Text style={styles.wordmark}>BODHI</Text>
            <Text style={styles.tagline}>Your money. Alive.</Text>
          </View>

          {/* ── Card ─────────────────────────────────────── */}
          <View style={styles.card}>
            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              {(['login', 'signup'] as AuthMode[]).map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMode(m)}
                  style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                >
                  <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                    {m === 'login' ? 'Login' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Form fields */}
            <View style={styles.form}>
              {mode === 'signup' && (
                <>
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>FULL NAME</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="James Rivera"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.field}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>PHONE</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+91 98765 43210"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.field}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              )}

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@domain.com"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.field}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.field}
                  secureTextEntry
                />
              </View>
            </View>

            {mode === 'login' && (
              <TouchableOpacity style={styles.forgotWrap}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Primary CTA */}
            <TouchableOpacity style={styles.ctaBtn} onPress={proceed} activeOpacity={0.88}>
              <Text style={styles.ctaText}>
                {mode === 'login' ? 'Login to BODHI' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social auth */}
            <View style={styles.socialRow}>
              {['🍎', 'G', '📱'].map((icon, i) => (
                <TouchableOpacity key={i} style={styles.socialBtn} activeOpacity={0.8}>
                  <Text style={{ fontSize: icon === 'G' ? 16 : 20, fontWeight: '700', color: Colors.textPrimary }}>
                    {icon}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Switch mode */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
              </Text>
              <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                <Text style={styles.switchLink}>
                  {mode === 'login' ? 'Sign Up' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fine print */}
          <Text style={styles.finePrint}>
            By continuing, you agree to BODHI's Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const S = Spacing;

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  heroBg: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    height:   H * 0.38,
  },
  ambientOrb: {
    position:        'absolute',
    top:             H * 0.05,
    left:            W / 2 - 120,
    width:           240,
    height:          240,
    borderRadius:    120,
    backgroundColor: 'rgba(209,252,0,0.12)',
  },
  scroll: {
    paddingHorizontal: S.xxl,
    paddingBottom:     S.xxl + 20,
    minHeight:         H,
    justifyContent:    'center',
    gap:               S.xxl,
  },

  // Logo
  logoArea: {
    alignItems:  'center',
    marginTop:   Platform.OS === 'ios' ? 60 : 40,
    marginBottom: S.xxl,
  },
  wordmark: {
    fontFamily:  Fonts.headline,
    fontSize:    52,
    fontWeight:  '900',
    fontStyle:   'italic',
    color:       '#fff',
    letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontFamily:  Fonts.body,
    fontSize:    16,
    fontWeight:  '400',
    color:       'rgba(255,255,255,0.85)',
    marginTop:   4,
  },

  // Card
  card: {
    backgroundColor: Colors.surfaceWhite,
    borderRadius:    Radius.xl,
    padding:         S.xxl + 4,
    gap:             S.xl,
    shadowColor:     '#000',
    shadowOpacity:   0.1,
    shadowRadius:    40,
    elevation:       12,
  },

  // Mode toggle
  modeToggle: {
    flexDirection:   'row',
    backgroundColor: Colors.surfaceLow,
    borderRadius:    Radius.full,
    padding:         4,
  },
  modeBtn: {
    flex:        1,
    paddingVertical: 12,
    alignItems:  'center',
    borderRadius: Radius.full,
  },
  modeBtnActive: {
    backgroundColor: Colors.neonLime,
  },
  modeBtnText: {
    fontFamily:  Fonts.headline,
    fontSize:    15,
    fontWeight:  '600',
    color:       Colors.textSecondary,
  },
  modeBtnTextActive: {
    color:      Colors.neonLimeDark,
    fontWeight: '700',
  },

  // Fields
  form: { gap: S.lg },
  fieldWrap: { gap: 6 },
  fieldLabel: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       Colors.textSecondary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  field: {
    backgroundColor:  Colors.surfaceLow,
    borderRadius:     Radius.md,
    paddingHorizontal: S.xl,
    paddingVertical:   S.xl,
    fontFamily:       Fonts.body,
    fontSize:         16,
    color:            Colors.textPrimary,
    // On focus: neonLime ghost border (use onFocus state for production)
  },

  forgotWrap: { alignSelf: 'flex-end' },
  forgotText: {
    fontFamily:  Fonts.label,
    fontSize:    12,
    fontWeight:  '600',
    color:       Colors.electricViolet,
  },

  // CTA
  ctaBtn: {
    backgroundColor: Colors.neonLime,
    borderRadius:    Radius.lg,
    paddingVertical: 18,
    alignItems:      'center',
    shadowColor:     Colors.neonLime,
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       8,
  },
  ctaText: {
    fontFamily:  Fonts.headline,
    fontSize:    17,
    fontWeight:  '900',
    color:       Colors.neonLimeDark,
    letterSpacing: 0.5,
  },

  // Divider
  divider: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            S.lg,
  },
  dividerLine: {
    flex:            1,
    height:          1,
    backgroundColor: Colors.surfaceContainer,
  },
  dividerText: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    color:       Colors.textSecondary,
  },

  // Social
  socialRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            S.xl,
  },
  socialBtn: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: Colors.surfaceLow,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     Colors.surfaceContainer,
  },

  // Switch
  switchRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
  },
  switchText: {
    fontFamily:  Fonts.body,
    fontSize:    14,
    color:       Colors.textSecondary,
  },
  switchLink: {
    fontFamily:  Fonts.body,
    fontSize:    14,
    fontWeight:  '700',
    color:       Colors.electricViolet,
  },

  finePrint: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    color:       Colors.textMuted,
    textAlign:   'center',
    lineHeight:  16,
  },
});
