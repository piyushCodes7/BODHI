import React, { useState, useEffect } from 'react';
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
  User,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../theme/tokens';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { BASE_URL, AuthAPI } from '../api/client';

// Automatically route to auth endpoints based on the global BASE_URL
const API_URL = `${BASE_URL}/auth`;

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export function AuthScreen({ navigation }: any) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Wizard State
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mPin, setMPin] = useState('');
  const [uPin, setUPin] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // ─── HANDLERS ────────────────────────────────────────────────────────────

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const startResendTimer = () => setResendTimer(60);


  const handleSendOtp = async (target: 'email' | 'phone') => {
    try {
      const val = target === 'email' ? email : phone;
      if (!val) {
        Alert.alert("Error", `Please enter ${target} first`);
        return;
      }
      
      setIsLoading(true);
      if (target === 'email') {
        await AuthAPI.sendRegisterOtp({ email });
        setIsEmailVerified(true);
      } else {
        await AuthAPI.sendRegisterOtp({ phone });
        setIsPhoneVerified(true);
      }
      startResendTimer();
      Alert.alert("Sent!", `OTP has been sent to your ${target}`);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.detail || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (target: 'email' | 'phone') => {
    try {
      if (!otp || otp.length !== 6) {
        Alert.alert("Error", "Please enter a valid 6-digit code");
        return;
      }

      setIsLoading(true);
      if (target === 'email') {
        const res = await AuthAPI.verifyRegisterOtp({ email, otp });
        setOtp(''); // Clear for next use
        setResendTimer(0); // Clear timer
        setCurrentStep(2); // Move straight to Step 2 (Security)
      }
    } catch (error: any) {
      Alert.alert("Invalid Code", error.response?.data?.detail || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSuccess = (accessToken: string, isNewUser: boolean) => {
    console.log("OAuth Success Token:", accessToken);
    navigation.replace('Main');
  };

  const handleStandardAuth = async () => {
    // Validate based on mode
    if (authMode === 'signup') {
      if (!email || !mPin || !uPin) {
        Alert.alert('Error', 'Please enter your Email, M-PIN and U-PIN.');
        return;
      }
    } else {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter your email and password.');
        return;
      }
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

        // AbortController gives fetch() an actual timeout (unlike axios, fetch has none by default)
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000); // 30s
        let response;
        try {
          response = await fetch(`${API_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.join('&'),
            signal: controller.signal,
          });
        } catch (fetchErr: any) {
          if (fetchErr.name === 'AbortError') throw new Error('Connection timed out. Please check your network.');
          throw new Error(`Network request failed. Ensure you have an active internet connection. (${fetchErr.message || fetchErr})`);
        } finally {
          clearTimeout(timer);
        }

        const rawText = await response.text();
        let data;
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          throw new Error(`Server error: ${rawText.substring(0, 100)}`);
        }

        if (!response.ok) throw new Error(data.detail || 'Incorrect credentials');

        await AsyncStorage.setItem('bodhi_access_token', data.access_token);
        // Also persist the user's full name for display across the app
        if (data.full_name) await AsyncStorage.setItem('user_full_name', data.full_name);

        navigation.replace('Main');

      } else if (authMode === 'signup') {
        if (!name || !phone) throw new Error('Please fill in all fields.');

        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: mPin, // Using M-PIN as the login password
            full_name: name,
            phone_number: phone,
            m_pin: mPin,
            u_pin: uPin,
            age: parseInt(age) || 0,
            gender: gender
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

        Alert.alert('Success', 'Account created! Welcome to BODHI.');
        setAuthMode('login');
        setCurrentStep(0);
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
            {authMode === 'login' && (
              <>
                <Text style={styles.flowTitle}>Login to BODHI</Text>
                <Text style={styles.flowSub}>Enter your credentials to access your account</Text>

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

                  <View style={styles.linksRow}>
                    <TouchableOpacity onPress={() => setAuthMode('signup')}>
                      <Text style={styles.linkText}>Sign Up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setAuthMode('forgot')}>
                      <Text style={styles.linkText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>

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

            {/* ─── Sign Up Multi-Step Wizard ─── */}
            {authMode === 'signup' && (
              <View style={styles.form}>

                {/* Progress Bar */}
                <View style={styles.stepIndicator}>
                  {[0, 1, 2].map((s) => (
                    <View
                      key={s}
                      style={[
                        styles.stepDot,
                        currentStep >= s && { backgroundColor: Colors.neonLime, shadowColor: Colors.neonLime, shadowRadius: 4, elevation: 4 }
                      ]}
                    />
                  ))}
                </View>

                {/* Step Titles */}
                <Text style={styles.flowTitle}>
                  {currentStep === 0 && "About You"}
                  {currentStep === 1 && "Verifying Email"}
                  {currentStep === 2 && "Secure Your Assets"}
                </Text>
                <Text style={styles.flowSub}>
                  {currentStep === 0 && "Help us personalize your financial journey"}
                  {currentStep === 1 && "Ensure your account is reachable"}
                  {currentStep === 2 && "Set your secret access codes"}
                </Text>

                {/* STEP 0: BIO */}
                {currentStep === 0 && (
                  <>
                    <Text style={styles.inputLabel}>FULL NAME</Text>
                    <View style={styles.inputWrapper}>
                      <User size={18} color="#A855F7" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., Jane Doe"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 16, zIndex: 1000 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>AGE</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="Age"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={age}
                            onChangeText={setAge}
                            keyboardType="number-pad"
                          />
                        </View>
                      </View>

                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.inputLabel}>GENDER</Text>
                        <TouchableOpacity 
                          style={[styles.dropdownHeader, isGenderOpen && { borderColor: Colors.neonLime, backgroundColor: 'rgba(200, 255, 0, 0.05)' }]} 
                          onPress={() => setIsGenderOpen(!isGenderOpen)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.dropdownHeaderText, !gender && { color: 'rgba(255,255,255,0.6)' }]}>
                            {gender || "Select"}
                          </Text>
                          <ChevronDown size={18} color={Colors.neonLime} style={{ marginLeft: 8, transform: [{ rotate: isGenderOpen ? '180deg' : '0deg' }] }} />
                        </TouchableOpacity>

                        {isGenderOpen && (
                          <View style={styles.dropdownList}>
                            {['Male', 'Female', 'Other'].map((g) => (
                              <TouchableOpacity 
                                key={g} 
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setGender(g);
                                  setIsGenderOpen(false);
                                }}
                              >
                                <Text style={styles.dropdownItemText}>{g}</Text>
                                {gender === g && <CheckCircle2 size={16} color={Colors.neonLime} />}
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>

                    <Text style={styles.inputLabel}>PHONE NUMBER (Optional)</Text>
                    <View style={styles.inputWrapper}>
                      <Smartphone size={18} color="#A855F7" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="+91 9876543210"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => name && age && setCurrentStep(1)}
                      style={{ marginTop: 32 }}
                    >
                      <LinearGradient colors={['#FFE259', '#C8FF00']} style={styles.primaryBtn}>
                        <Text style={styles.primaryBtnText}>Continue</Text>
                        <ChevronRight size={20} color="#000" style={{ position: 'absolute', right: 20 }} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 1: EMAIL */}
                {currentStep === 1 && (
                  <>
                    <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                    <View style={styles.inputWrapper}>
                      <Mail size={18} color="#A855F7" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, isEmailVerified && { color: 'rgba(255,255,255,0.4)' }]}
                        placeholder="name@example.com"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isEmailVerified}
                      />
                      <TouchableOpacity 
                        style={styles.verifyInlineBtn} 
                        disabled={resendTimer > 0 || isLoading}
                        onPress={() => isEmailVerified ? setIsEmailVerified(false) : handleSendOtp('email')}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color={Colors.neonLime} />
                        ) : (
                          <Text style={[styles.verifyInlineText, resendTimer > 0 && { color: 'rgba(255,255,255,0.3)' }]}>
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : (isEmailVerified ? "Change" : "Send Code")}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {isEmailVerified && (
                      <>
                        <Text style={styles.inputLabel}>6-DIGIT EMAIL CODE</Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={[styles.input, { letterSpacing: 8, textAlign: 'center', fontWeight: '800' }]}
                            placeholder="••••••"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otp}
                            onChangeText={setOtp}
                          />
                        </View>
                      </>
                    )}

                    <TouchableOpacity 
                      activeOpacity={0.8} 
                      onPress={() => handleVerifyOtp('email')}
                      style={{ marginTop: 32 }}
                      disabled={!isEmailVerified || isLoading}
                    >
                      <LinearGradient 
                        colors={isEmailVerified ? ['#FFE259', '#C8FF00'] : ['#333', '#222']} 
                        style={styles.primaryBtn}
                      >
                        {isLoading ? <ActivityIndicator color="#000" /> : (
                          <>
                            <Text style={[styles.primaryBtnText, !isEmailVerified && { color: '#666' }]}>Verify & Next</Text>
                            <ChevronRight size={20} color={isEmailVerified ? "#000" : "#666"} style={{ position: 'absolute', right: 20 }} />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 2: SECURITY & PINs */}
                {currentStep === 2 && (
  <>
                    <Text style={styles.inputLabel}>SET M-PIN (LOGIN PASSWORD)</Text>
                    <View style={styles.inputWrapper}>
                      <Lock size={18} color="#A855F7" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Can be text or numbers"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={mPin}
                        onChangeText={setMPin}
                        secureTextEntry
                      />
                    </View>

                    <Text style={styles.inputLabel}>SET U-PIN (4 OR 6 DIGIT TRANSACTION PIN)</Text>
                    <View style={styles.inputWrapper}>
                      <ShieldCheck size={18} color={Colors.neonLime} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { letterSpacing: 4, fontWeight: '700' }]}
                        placeholder="••••••"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={uPin}
                        onChangeText={(val) => setUPin(val.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={6}
                        secureTextEntry
                      />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleStandardAuth}
                      style={{ marginTop: 32 }}
                    >
                      <LinearGradient
                        colors={(mPin && (uPin.length === 4 || uPin.length === 6)) ? ['#FFE259', '#C8FF00'] : ['#333', '#222']}
                        style={styles.primaryBtn}
                      >
                        {isLoading ? <ActivityIndicator color="#000" /> : (
                          <Text style={[styles.primaryBtnText, !(mPin && (uPin.length === 4 || uPin.length === 6)) && { color: '#666' }]}>Complete Registration</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* Navigation Links */}
                <View style={styles.wizardFooter}>
                  {currentStep > 0 && (
                    <TouchableOpacity onPress={() => setCurrentStep(prev => prev - 1)}>
                      <Text style={styles.linkText}>← Previous Step</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => { setAuthMode('login'); setCurrentStep(0); }}>
                    <Text style={styles.linkText}>Back to Login</Text>
                  </TouchableOpacity>
                </View>

              </View>
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
    paddingHorizontal: 20,
    paddingVertical: 32,
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
  flowTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#FFF', 
    marginBottom: 6, 
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  flowSub: { 
    fontSize: 12.5, 
    color: 'rgba(255,255,255,0.6)', 
    marginBottom: 20, 
    textAlign: 'center', 
    lineHeight: 18 
  },

  inputLabel: { 
    fontSize: 10.5, 
    fontWeight: '800', 
    color: 'rgba(255,255,255,0.5)', 
    letterSpacing: 1.2, 
    marginBottom: 8, 
    marginTop: 14 
  },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inputIcon: { marginLeft: 16, marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, paddingHorizontal: 16, fontSize: 15, color: '#FFF', fontWeight: '500' },
  eyeBtn: { padding: 16 },

  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: Spacing.xl
  },
  linkText: { color: '#FF2D78', fontWeight: '700', fontSize: 13 },

  // ── WIZARD ──
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' },
  verifyInlineBtn: { paddingRight: 16, justifyContent: 'center' },
  verifyInlineText: { color: Colors.neonLime, fontWeight: '700', fontSize: 12 },
  wizardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, alignItems: 'center' },

  genderBtnTextActive: { color: Colors.neonLime, fontWeight: '800' },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md,
    height: 50,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  segmentBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.sm
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2
  },
  segmentText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '600'
  },
  segmentTextActive: {
    color: Colors.neonLime,
    fontWeight: '800'
  },

  dropdownHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: Radius.md, 
    height: 52, 
    paddingHorizontal: 8, 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },
  dropdownHeaderText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dropdownList: { 
    position: 'absolute', 
    top: 60, 
    left: 0, 
    right: 0, 
    backgroundColor: '#2A0845', 
    borderRadius: Radius.md, 
    borderWidth: 1, 
    borderColor: Colors.neonLime, 
    overflow: 'hidden', 
    shadowColor: Colors.neonLime, 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 20, 
    elevation: 20,
    zIndex: 1000,
  },
  dropdownItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 18, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.1)' 
  },
  dropdownItemText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

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