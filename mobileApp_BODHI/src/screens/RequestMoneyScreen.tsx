/**
 * RequestMoneyScreen.tsx
 * Create payment requests and view/fulfill incoming requests.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Modal, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, ArrowDownToLine, Clock, CheckCircle, X, ChevronRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BASE_URL } from '../api/client';

const API = `${BASE_URL}/transfers`;

interface PendingRequest {
  request_id: string;
  requester_name: string;
  requester_email: string;
  amount: number;
  note: string;
  created_at: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function RequestMoneyScreen() {
  const navigation = useNavigation<any>();

  const [tab, setTab] = useState<'create' | 'pending'>('create');

  // Create request form
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Pending requests
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fulfill modal
  const [fulfillTarget, setFulfillTarget] = useState<PendingRequest | null>(null);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [fulfillSuccess, setFulfillSuccess] = useState(false);

  // ── Fetch pending ─────────────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    setIsLoadingPending(true);
    try {
      const token = await AsyncStorage.getItem('bodhi_access_token');
      const res = await fetch(`${API}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawText = await res.text();
      let data: any;
      try { data = JSON.parse(rawText); } catch { data = { requests: [] }; }
      if (res.ok) setPendingRequests(data.requests || []);
    } catch (e) {
      console.error('Failed to fetch requests', e);
    } finally {
      setIsLoadingPending(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'pending') fetchPending();
  }, [tab, fetchPending]);

  // ── Create request ────────────────────────────────────────────────────────
  const handleCreateRequest = async () => {
    if (!recipientId.trim()) {
      Alert.alert('Required', 'Please enter the person\'s email or phone number.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setIsSending(true);
    try {
      const token = await AsyncStorage.getItem('bodhi_access_token');
      const res = await fetch(`${API}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requester_identifier: recipientId.trim().toLowerCase(),
          amount: parseFloat(amount),
          note: note || undefined,
        }),
      });

      const rawText = await res.text();
      let data: any;
      try { data = JSON.parse(rawText); } catch { data = {}; }

      if (!res.ok) {
        throw new Error(data.detail || 'Could not send payment request.');
      }

      setSuccessMsg(`Payment request of ₹${parseFloat(amount).toFixed(2)} sent to ${recipientId}!`);
      setCreateSuccess(true);
    } catch (err: any) {
      Alert.alert('Request Failed', err.message);
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setRecipientId('');
    setAmount('');
    setNote('');
    setCreateSuccess(false);
  };

  // ── Fulfill request ───────────────────────────────────────────────────────
  const handleFulfill = async () => {
    if (!fulfillTarget) return;
    setIsFulfilling(true);
    try {
      const token = await AsyncStorage.getItem('bodhi_access_token');
      const res = await fetch(`${API}/requests/${fulfillTarget.request_id}/fulfill`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const rawText = await res.text();
      let data: any;
      try { data = JSON.parse(rawText); } catch { data = {}; }

      if (!res.ok) {
        throw new Error(data.detail || 'Payment failed.');
      }

      setFulfillSuccess(true);
      // Remove from list
      setPendingRequests(prev => prev.filter(r => r.request_id !== fulfillTarget.request_id));
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message);
    } finally {
      setIsFulfilling(false);
    }
  };

  // ── Renderers ─────────────────────────────────────────────────────────────
  const renderCreateTab = () => {
    if (createSuccess) {
      return (
        <View style={styles.successContainer}>
          <CheckCircle size={72} color="#34c759" />
          <Text style={styles.successTitle}>Request Sent!</Text>
          <Text style={styles.successSub}>{successMsg}</Text>
          <Text style={styles.successHint}>
            They'll receive a notification to pay you.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => { resetForm(); navigation.goBack(); }}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetForm} style={{ marginTop: 14 }}>
            <Text style={{ color: '#A855F7', fontSize: 14 }}>Request from someone else</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Who do you want to request from?</Text>

          <Text style={styles.inputLabel}>EMAIL OR PHONE NUMBER</Text>
          <TextInput
            style={styles.input}
            value={recipientId}
            onChangeText={setRecipientId}
            placeholder="name@example.com or +91xxxxxxxxxx"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>AMOUNT (₹)</Text>
          <View style={styles.amtRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.amtInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          </View>

          {/* Quick amounts */}
          <View style={styles.quickAmounts}>
            {[100, 500, 1000, 5000].map(q => (
              <TouchableOpacity key={q} style={styles.quickPill} onPress={() => setAmount(String(q))}>
                <Text style={styles.quickPillText}>₹{q >= 1000 ? `${q / 1000}k` : q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>NOTE (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, { marginBottom: 32 }]}
            value={note}
            onChangeText={setNote}
            placeholder="What's it for? e.g. Dinner split"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />

          <TouchableOpacity
            onPress={handleCreateRequest}
            disabled={isSending || !recipientId || !amount}
            style={{ opacity: isSending || !recipientId || !amount ? 0.5 : 1 }}
          >
            <LinearGradient
              colors={['#7B2FBE', '#4A00E0']}
              style={styles.requestBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {isSending
                ? <ActivityIndicator color="#FFF" />
                : <>
                    <ArrowDownToLine size={18} color="#FFF" />
                    <Text style={styles.requestBtnText}>
                      Send Request {amount ? `for ₹${parseFloat(amount).toFixed(2)}` : ''}
                    </Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderPendingTab = () => {
    if (isLoadingPending) {
      return <View style={styles.centered}><ActivityIndicator color="#A855F7" size="large" /></View>;
    }

    if (pendingRequests.length === 0) {
      return (
        <View style={styles.centered}>
          <CheckCircle size={52} color="rgba(255,255,255,0.1)" />
          <Text style={styles.emptyTitle}>All clear!</Text>
          <Text style={styles.emptySub}>You have no pending payment requests.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={pendingRequests}
        keyExtractor={item => item.request_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPending(); }} tintColor="#A855F7" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <View style={styles.requestCardLeft}>
              <View style={styles.reqAvatar}>
                <Text style={styles.reqAvatarText}>{getInitials(item.requester_name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reqName}>{item.requester_name}</Text>
                {item.note ? <Text style={styles.reqNote}>"{item.note}"</Text> : null}
                <Text style={styles.reqTime}>
                  {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
            <View style={styles.requestCardRight}>
              <Text style={styles.reqAmount}>₹{item.amount.toLocaleString('en-IN')}</Text>
              <TouchableOpacity
                style={styles.payReqBtn}
                onPress={() => {
                  setFulfillTarget(item);
                  setFulfillSuccess(false);
                  setShowFulfillModal(true);
                }}
              >
                <Text style={styles.payReqBtnText}>Pay</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#2A0066', '#660099']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Money</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tab Toggle */}
      <View style={styles.tabToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'create' && styles.toggleBtnActive]}
          onPress={() => setTab('create')}
        >
          <Text style={[styles.toggleBtnText, tab === 'create' && styles.toggleBtnTextActive]}>
            New Request
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, tab === 'pending' && styles.toggleBtnActive]}
          onPress={() => setTab('pending')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.toggleBtnText, tab === 'pending' && styles.toggleBtnTextActive]}>
              Pending
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === 'create' ? renderCreateTab() : renderPendingTab()}

      {/* Fulfill Modal */}
      <Modal visible={showFulfillModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {fulfillSuccess ? (
              <View style={styles.successContainer}>
                <CheckCircle size={64} color="#34c759" />
                <Text style={styles.successTitle}>Paid!</Text>
                <Text style={styles.successSub}>
                  ₹{fulfillTarget?.amount.toFixed(2)} sent to {fulfillTarget?.requester_name}
                </Text>
                <TouchableOpacity style={styles.doneBtn} onPress={() => setShowFulfillModal(false)}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Pay Request</Text>
                  <TouchableOpacity onPress={() => setShowFulfillModal(false)}>
                    <X size={22} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.fulfillSummary}>
                  <Text style={styles.fulfillFrom}>{fulfillTarget?.requester_name} is requesting</Text>
                  <Text style={styles.fulfillAmt}>₹{fulfillTarget?.amount.toFixed(2)}</Text>
                  {fulfillTarget?.note ? (
                    <Text style={styles.fulfillNote}>"{fulfillTarget.note}"</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={handleFulfill}
                  disabled={isFulfilling}
                  style={{ opacity: isFulfilling ? 0.6 : 1 }}
                >
                  <LinearGradient
                    colors={['#FFE259', '#C8FF00']}
                    style={styles.requestBtn}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    {isFulfilling
                      ? <ActivityIndicator color="#000" />
                      : <Text style={[styles.requestBtnText, { color: '#000' }]}>
                          Confirm & Pay ₹{fulfillTarget?.amount.toFixed(2)}
                        </Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.declineBtn} onPress={() => setShowFulfillModal(false)}>
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05050A' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  tabToggle: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)',
    margin: 16, borderRadius: 14, padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, flexDirection: 'row', justifyContent: 'center' },
  toggleBtnActive: { backgroundColor: 'rgba(168,85,247,0.25)' },
  toggleBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' },
  toggleBtnTextActive: { color: '#A855F7' },
  badge: { backgroundColor: '#A855F7', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  formContainer: { padding: 20, flex: 1 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 24 },
  inputLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 16, color: '#FFF', fontSize: 15, marginBottom: 20,
  },
  amtRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  rupee: { color: 'rgba(255,255,255,0.4)', fontSize: 40, fontWeight: '300', marginRight: 8 },
  amtInput: { color: '#FFF', fontSize: 56, fontWeight: '800', flex: 1 },
  quickAmounts: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  quickPill: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  quickPillText: { color: '#A855F7', fontSize: 13, fontWeight: '600' },
  requestBtn: {
    borderRadius: 30, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10,
  },
  requestBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // pending
  requestCard: {
    backgroundColor: '#12121A', borderRadius: 16,
    padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  requestCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  reqAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7B2FBE', alignItems: 'center', justifyContent: 'center',
  },
  reqAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  reqName: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  reqNote: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontStyle: 'italic', marginBottom: 2 },
  reqTime: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  requestCardRight: { alignItems: 'flex-end', gap: 8 },
  reqAmount: { color: '#FFE259', fontSize: 17, fontWeight: '800' },
  payReqBtn: { backgroundColor: '#A855F7', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  payReqBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptySub: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' },

  // modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: '#0F0A20', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 44,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  fulfillSummary: { alignItems: 'center', paddingVertical: 20, marginBottom: 24 },
  fulfillFrom: { color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 8 },
  fulfillAmt: { color: '#FFE259', fontSize: 48, fontWeight: '800', marginBottom: 8 },
  fulfillNote: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontStyle: 'italic' },
  declineBtn: { marginTop: 14, alignItems: 'center' },
  declineBtnText: { color: '#FF3B30', fontSize: 15, fontWeight: '600' },

  // success
  successContainer: { alignItems: 'center', paddingVertical: 16 },
  successTitle: { color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  successSub: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  successHint: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 32 },
  doneBtn: { backgroundColor: '#34c759', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 30 },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
