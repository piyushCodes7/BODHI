import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Camera, CheckCircle2, Landmark, Fingerprint, Plane, Bell, ChevronRight, UserCog, User, Mail, Phone, ChevronLeft, LogOut, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';
import { UsersAPI } from '../api/client';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [originalData, setOriginalData] = useState<any>(null);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'update' | 'delete'>('update');
  const [password, setPassword] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await UsersAPI.fetchProfile();
      setFullName(data.full_name);
      setEmail(data.email);
      setPhone(data.phone || '');
      setAge(data.age ? String(data.age) : '');
      setGender(data.gender || '');
      setOriginalData(data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      Alert.alert("Error", "Could not load profile details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(['bodhi_access_token', 'user_full_name']);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          }
        }
      ]
    );
  };

  const handleSecureAction = (type: 'update' | 'delete') => {
    setModalType(type);
    setPassword('');
    setIsModalVisible(true);
  };

  const executeAction = async () => {
    if (!password) {
      Alert.alert("Error", "Password is required.");
      return;
    }

    setIsActionLoading(true);
    try {
      if (modalType === 'update') {
        await UsersAPI.updateProfile({
          full_name: fullName,
          phone: phone,
          age: parseInt(age) || 0,
          gender: gender,
          current_password: password
        });
        await AsyncStorage.setItem('user_full_name', fullName);
        setOriginalData({ ...originalData, full_name: fullName, phone, age: parseInt(age), gender });
        setIsModalVisible(false);
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        await UsersAPI.deleteAccount(password);
        setIsModalVisible(false);
        await AsyncStorage.multiRemove(['bodhi_access_token', 'user_full_name']);
        Alert.alert("Account Deleted", "Your account and all associated data have been permanently removed.");
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      }
    } catch (error: any) {
      Alert.alert("Failed", error.response?.data?.detail || "Operation failed.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const isDirty = originalData && (
    fullName !== originalData.full_name || 
    phone !== (originalData.phone || '') ||
    age !== (originalData.age ? String(originalData.age) : '') ||
    gender !== (originalData.gender || '')
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.neonLime} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ─── Background Gradient ─── */}
      <LinearGradient
        colors={['#05001F', '#2A0845', '#7A004A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MY PROFILE</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* ─── Avatar Section ─── */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarGlow}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{fullName.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Camera size={16} color="#000" />
            </TouchableOpacity>
            <Text style={styles.userNameText}>{fullName}</Text>
            <Text style={styles.userEmailText}>{email}</Text>
          </View>

          {/* ─── Profile Details Card ─── */}
          <BlurView blurType="dark" blurAmount={20} style={styles.glassCard}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <User size={20} color={Colors.neonLime} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter Full Name"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
              {isDirty && fullName !== originalData.full_name && (
                <CheckCircle2 size={18} color={Colors.neonLime} />
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <Mail size={20} color="rgba(255,255,255,0.4)" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <Text style={styles.readOnlyText}>{email}</Text>
              </View>
              <ShieldCheck size={18} color="rgba(255,255,255,0.3)" />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <View style={styles.fieldIcon}>
                <Phone size={20} color={Colors.neonLime} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g., +91 9876543210"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="phone-pad"
                />
              </View>
              {isDirty && phone !== (originalData.phone || '') && (
                <CheckCircle2 size={18} color={Colors.neonLime} />
              )}
            </View>

            <View style={styles.divider} />

            <View style={{ flexDirection: 'row' }}>
              <View style={[styles.fieldRow, { flex: 1 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>AGE</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={age}
                    onChangeText={setAge}
                    placeholder="00"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              
              <View style={[styles.divider, { width: 1, height: '60%', alignSelf: 'center', marginHorizontal: 12 }]} />

              <View style={[styles.fieldRow, { flex: 2 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>GENDER</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={gender}
                    onChangeText={setGender}
                    placeholder="e.g., Male"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>
              </View>
            </View>
          </BlurView>

          {/* ─── Account & Banking ─── */}
          <Text style={styles.sectionLabel}>ACCOUNT & BANKING</Text>
          <BlurView blurType="dark" blurAmount={20} style={styles.glassCard}>
            <TouchableOpacity 
              style={styles.linkRow} 
              onPress={() => navigation.navigate('BankAccounts')}
            >
              <View style={[styles.fieldIcon, { backgroundColor: 'rgba(51, 153, 255, 0.1)' }]}>
                <Landmark size={20} color="#3399FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Linked Bank Accounts</Text>
                <Text style={styles.linkSub}>Manage your primary funding sources</Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => navigation.navigate('VentureClub')}
            >
              <View style={[styles.fieldIcon, { backgroundColor: 'rgba(200, 255, 0, 0.1)' }]}>
                <UserCog size={20} color={Colors.neonLime} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Venture Club Status</Text>
                <Text style={styles.linkSub}>Review your club membership details</Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          </BlurView>

          {/* ─── Security & Privacy ─── */}
          <Text style={styles.sectionLabel}>SECURITY & PRIVACY</Text>
          <BlurView blurType="dark" blurAmount={20} style={styles.glassCard}>
            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => navigation.navigate('SecuritySettings')}
            >
              <View style={[styles.fieldIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                <Fingerprint size={20} color="#A855F7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Biometrics & Security</Text>
                <Text style={styles.linkSub}>Secure your assets with FaceID / PIN</Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          </BlurView>

          {/* ─── Preferences ─── */}
          <Text style={styles.sectionLabel}>APP PREFERENCES</Text>
          <BlurView blurType="dark" blurAmount={20} style={styles.glassCard}>
            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => navigation.navigate('TravelBooking')}
            >
              <View style={[styles.fieldIcon, { backgroundColor: 'rgba(255, 153, 0, 0.1)' }]}>
                <Plane size={20} color="#FF9900" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Travel Preferences</Text>
                <Text style={styles.linkSub}>Configure your luxury travel concierge</Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={[styles.fieldIcon, { backgroundColor: 'rgba(0, 230, 118, 0.1)' }]}>
                <Bell size={20} color="#00E676" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Notifications</Text>
                <Text style={styles.linkSub}>Manage alerts and price updates</Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          </BlurView>

          {/* ─── Action Buttons ─── */}
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={[styles.primaryBtn, !isDirty && styles.disabledBtn]}
              disabled={!isDirty}
              onPress={() => handleSecureAction('update')}
            >
              <LinearGradient
                colors={isDirty ? ['#FFE259', '#C8FF00'] : ['#333', '#222']}
                style={styles.gradientBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.btnText, { color: isDirty ? '#000' : '#666' }]}>SAVE CHANGES</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={20} color="rgba(255,255,255,0.6)" />
              <Text style={styles.logoutBtnText}>Logout Session</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleSecureAction('delete')}>
              <Trash2 size={18} color="#FF4B4B" />
              <Text style={styles.deleteBtnText}>Delete Account Permanently</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ─── Security Modal ─── */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <BlurView blurType="dark" blurAmount={30} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ShieldCheck size={24} color={modalType === 'delete' ? '#FF4B4B' : Colors.neonLime} />
              <Text style={styles.modalTitle}>Security Check</Text>
              <Text style={styles.modalSub}>
                {modalType === 'delete' 
                  ? 'Please enter your password to confirm account deletion. This action is irreversible.'
                  : 'Enter password to authorize profile changes.'}
              </Text>
            </View>

            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter Password"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalConfirm, modalType === 'delete' && styles.modalDelete]} 
                onPress={executeAction}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {modalType === 'delete' ? 'Confirm Delete' : 'Verify & Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05001F' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    height: 60,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: Fonts.label,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(192, 226, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192, 226, 89, 0.2)',
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundGradient: ['#FFE259', '#C8FF00'], // Conceptually
    backgroundColor: Colors.neonLime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neonLime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#000',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 60,
    right: '38%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neonLime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#05001F',
  },
  userNameText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  userEmailText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginTop: 4,
  },
  glassCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  fieldInput: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    padding: 0,
  },
  readOnlyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 8,
  },
  actionContainer: {
    marginTop: 24,
    gap: 16,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 32,
    marginBottom: 12,
    marginLeft: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  linkTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  linkSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  gradientBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 8,
  },
  logoutBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  deleteBtnText: {
    color: '#FF4B4B',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  modalSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalInputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  modalInput: {
    height: 56,
    paddingHorizontal: 20,
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 1.5,
    height: 50,
    backgroundColor: Colors.neonLime,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  modalDelete: {
    backgroundColor: '#FF4B4B',
  },
  modalDeleteText: {
    color: '#FFF',
  }
});
