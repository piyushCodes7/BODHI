/**
 * ScanPayScreen.tsx
 * QR scanner using react-native-vision-camera v4 (stable, widely used).
 * useCodeScanner detects QR codes natively via the camera.
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  TextInput, Modal, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, X, CheckCircle, ExternalLink } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BASE_URL } from '../api/client';

const API = `${BASE_URL}/transfers`;

export function ScanPayScreen() {
  const navigation = useNavigation<any>();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [isActive, setIsActive] = useState(true);
  const hasScanned = useRef(false);

  // Post-scan payment state
  const [scannedData, setScannedData] = useState<string | null>(null);  // raw QR
  const [parsedRecipient, setParsedRecipient] = useState<string | null>(null); // display label
  const [showPayModal, setShowPayModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Parse a UPI QR URL into a clean pa= identifier
  const parseQRDisplay = (raw: string): string => {
    if (raw.toLowerCase().startsWith('upi://')) {
      const match = raw.match(/[?&]pa=([^&]+)/i);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    return raw;
  };

  // ── QR scanner (v4 API) ──────────────────────────────────────────────────
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: useCallback((codes: any[]) => {
      if (hasScanned.current || codes.length === 0) return;
      const value: string | undefined = codes[0]?.value;
      if (!value) return;

      hasScanned.current = true;
      setIsActive(false);
      setScannedData(value);
      setParsedRecipient(parseQRDisplay(value));
      setShowPayModal(true);
    }, []),
  });

  // ── Payment handler (BODHI Wallet) ───────────────────────────────────────
  const handlePay = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!scannedData) return;

    setIsProcessing(true);
    try {
      const token = await AsyncStorage.getItem('bodhi_access_token');
      const res = await fetch(`${API}/qr-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          qr_data: scannedData,
          amount: parseFloat(amount),
          note: note || undefined,
        }),
      });

      const rawText = await res.text();
      let data: any;
      try { data = JSON.parse(rawText); } catch { data = {}; }

      if (!res.ok) throw new Error(data.detail || 'Payment failed. Please try again.');

      setSuccessMsg(`₹${parseFloat(amount).toFixed(2)} sent to ${data.recipient_name} successfully!`);
      setPaySuccess(true);
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Payment handler (Native UPI Deep Linking) ────────────────────────────
  const handleNativeUPIPay = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!scannedData || !scannedData.toLowerCase().startsWith('upi://')) {
      Alert.alert('Invalid QR', 'This is not a valid UPI QR code for external payment.');
      return;
    }

    setIsProcessing(true);
    try {
      let finalUrl = scannedData;
      
      // Remove any existing amount or note to prevent overrides
      finalUrl = finalUrl.replace(/([?&])am=[^&]*/g, '$1');
      finalUrl = finalUrl.replace(/([?&])tn=[^&]*/g, '$1');
      // Cleanup stray ampersands
      finalUrl = finalUrl.replace(/&&+/g, '&').replace(/\?&/g, '?').replace(/&$/, '');

      // Append our amount formatted strictly to 2 decimal places (required by UPI spec)
      const formattedAmount = parseFloat(amount).toFixed(2);
      finalUrl += finalUrl.includes('?') ? '&' : '?';
      finalUrl += `am=${formattedAmount}`;
      if (note) {
        finalUrl += `&tn=${encodeURIComponent(note)}`;
      }

      // Try specific Google Pay schemes first to avoid WhatsApp taking over
      const gpayUrl = finalUrl.replace(/^upi:\/\//i, 'gpay://upi/');
      const tezUrl = finalUrl.replace(/^upi:\/\//i, 'tez://upi/');

      if (await Linking.canOpenURL(gpayUrl)) {
        await Linking.openURL(gpayUrl);
        setSuccessMsg(`Google Pay opened! Please complete the payment.`);
        setPaySuccess(true);
      } else if (await Linking.canOpenURL(tezUrl)) {
        await Linking.openURL(tezUrl);
        setSuccessMsg(`Google Pay opened! Please complete the payment.`);
        setPaySuccess(true);
      } else if (await Linking.canOpenURL(finalUrl)) {
        // Fallback to generic UPI chooser
        await Linking.openURL(finalUrl);
        setSuccessMsg(`Payment intent opened. Please complete the payment!`);
        setPaySuccess(true);
      } else {
        Alert.alert('App Not Found', 'No UPI app found on your device (tried GPay and generic UPI). Please install Google Pay.');
      }
    } catch (err: any) {
      Alert.alert('UPI Error', err.message || 'Could not open UPI app.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAndScanAgain = () => {
    hasScanned.current = false;
    setScannedData(null);
    setParsedRecipient(null);
    setShowPayModal(false);
    setAmount('');
    setNote('');
    setPaySuccess(false);
    setIsActive(true);
  };

  // ── No permission ─────────────────────────────────────────────────────────
  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionSub}>
          BODHI needs camera permission to scan QR codes for payments.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#A855F7' }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionTitle}>No Camera Found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#A855F7' }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isUpiQr = scannedData?.toLowerCase().startsWith('upi://');

  return (
    <View style={styles.root}>
      {/* Camera with QR code scanner */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
      />

      {/* Dark overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan to Pay</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinderContainer}>
          <Text style={styles.scanInstructions}>
            Point your camera at a{'\n'}BODHI or UPI QR code
          </Text>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <Text style={styles.scanHint}>QR code will be detected automatically</Text>
        </View>
      </View>

      {/* Pay Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {paySuccess ? (
              <View style={styles.successContainer}>
                <CheckCircle size={64} color="#34c759" />
                <Text style={styles.successTitle}>Done</Text>
                <Text style={styles.successSub}>{successMsg}</Text>
                <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
                  <Text style={styles.doneBtnText}>Return Home</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={resetAndScanAgain} style={{ marginTop: 12 }}>
                  <Text style={{ color: '#A855F7', fontSize: 14 }}>Scan Another</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Pay via QR</Text>
                  <TouchableOpacity onPress={resetAndScanAgain}>
                    <X size={22} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.scannedTag}>
                  <Text style={styles.scannedLabel}>Paying to</Text>
                  <Text style={styles.scannedValue} numberOfLines={1}>{parsedRecipient}</Text>
                </View>

                <Text style={styles.inputLabel}>AMOUNT (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoFocus
                />

                <Text style={styles.inputLabel}>NOTE (OPTIONAL)</Text>
                <TextInput
                  style={[styles.input, { marginBottom: 24 }]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="What's it for?"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />

                <View style={{ gap: 12 }}>
                  {isUpiQr && (
                    <TouchableOpacity
                      onPress={handleNativeUPIPay}
                      disabled={isProcessing || !amount}
                      style={{ opacity: isProcessing || !amount ? 0.6 : 1 }}
                    >
                      <LinearGradient
                        colors={['#4A00E0', '#8E2DE2']}
                        style={styles.payBtn}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="#FFF" />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.payBtnText, { color: '#FFF' }]}>
                              PAY VIA GPAY / UPI
                            </Text>
                            <ExternalLink size={18} color="#FFF" />
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={handlePay}
                    disabled={isProcessing || !amount}
                    style={{ opacity: isProcessing || !amount ? 0.6 : 1 }}
                  >
                    <LinearGradient
                      colors={isUpiQr ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)'] : ['#FFE259', '#C8FF00']}
                      style={[styles.payBtn, isUpiQr && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color={isUpiQr ? '#FFF' : '#000'} />
                      ) : (
                        <Text style={[styles.payBtnText, isUpiQr && { color: '#FFF' }]}>
                          PAY VIA BODHI WALLET
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#05050A', padding: 24 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'space-between' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  viewfinderContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  scanInstructions: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  viewfinder: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#d1fc00' },
  tl: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 6 },
  scanHint: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 32 },
  permissionTitle: { color: '#FFF', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  permissionSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  grantBtn: { backgroundColor: '#A855F7', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  grantBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: '#0F0A20', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  scannedTag: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  scannedLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  scannedValue: { color: '#A855F7', fontSize: 14, fontWeight: '600' },
  inputLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16,
    color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  payBtn: { borderRadius: 30, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  payBtnText: { fontSize: 15, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successTitle: { color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  successSub: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  doneBtn: { backgroundColor: '#34c759', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 30 },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
