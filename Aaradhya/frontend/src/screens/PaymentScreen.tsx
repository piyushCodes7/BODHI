// src/screens/PaymentScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { BodhiHeader, BottomNav, GradientCard, SectionHeader } from '../components/shared';
import type { NavTab } from '../components/shared';
import { PaymentAPI } from '../services/api';

const { width: W } = Dimensions.get('window');

interface Props {
  onNavigate: (tab: NavTab) => void;
  activeTab: NavTab;
  onInsurancePress: () => void;
  onBack: () => void;
  currentUserId?: string;
}

type PaymentMode = 'home' | 'send' | 'qr' | 'confirm';

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  recent?: boolean;
  upiId?: string;
}

const CONTACTS: Contact[] = [
  { id: '1', name: 'Hana Mori',    phone: '+91 98765 43210', avatar: '👩',    recent: true,  upiId: 'hana@bodhi'  },
  { id: '2', name: 'Kenji Sato',   phone: '+91 87654 32109', avatar: '🧔',    recent: true,  upiId: 'kenji@bodhi' },
  { id: '3', name: 'Priya Sharma', phone: '+91 76543 21098', avatar: '👩‍🦰',  upiId: 'priya@bodhi' },
  { id: '4', name: 'Arjun Nair',   phone: '+91 65432 10987', avatar: '🧑',    upiId: 'arjun@bodhi' },
  { id: '5', name: 'Zara Khan',    phone: '+91 54321 09876', avatar: '👩‍💼',  upiId: 'zara@bodhi'  },
];

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const RECENT_TRANSACTIONS = [
  { id: 'r1', name: 'Hana Mori',  amount: 1200, type: 'sent',     time: '2h ago',    avatar: '👩' },
  { id: 'r2', name: 'Kenji Sato', amount: 3400, type: 'received', time: 'Yesterday', avatar: '🧔' },
  { id: 'r3', name: 'Netflix',    amount:  799, type: 'sent',     time: '3 days ago',avatar: '📺' },
];

export const PaymentScreen: React.FC<Props> = ({
  onNavigate, activeTab, onInsurancePress, onBack, currentUserId,
}) => {
  const [mode, setMode]                         = useState<PaymentMode>('home');
  const [selectedContact, setSelectedContact]   = useState<Contact | null>(null);
  const [amount, setAmount]                     = useState('');
  const [note, setNote]                         = useState('');
  const [phoneInput, setPhoneInput]             = useState('');
  const [searchQuery, setSearchQuery]           = useState('');
  const [loading, setLoading]                   = useState(false);
  const [paySuccess, setPaySuccess]             = useState(false);
  const [inputTab, setInputTab]                 = useState<'contacts' | 'phone' | 'upi'>('contacts');
  const [qrScanning, setQrScanning]             = useState(false);

  const successAnim = useRef(new Animated.Value(0)).current;

  const filteredContacts = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery),
  );

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setMode('send');
  };

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    setMode('confirm');
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      if (currentUserId) {
        await PaymentAPI.createIntent({
          user_id: currentUserId,
          amount: Math.round(parseFloat(amount) * 100), // convert to paise
          currency: 'INR',
          description: note || `Payment to ${selectedContact?.name ?? phoneInput}`,
        });
      }
      setPaySuccess(true);
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true }).start();
      setTimeout(() => {
        setPaySuccess(false);
        successAnim.setValue(0);
        setMode('home');
        setSelectedContact(null);
        setAmount('');
        setNote('');
        setPhoneInput('');
      }, 2400);
    } catch (e: any) {
      Alert.alert('Payment Failed', e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQrMock = () => {
    setQrScanning(true);
    setTimeout(() => {
      setQrScanning(false);
      setSelectedContact(CONTACTS[0]);
      setMode('send');
    }, 2000);
  };

  const resetToHome = () => {
    setMode('home');
    setSelectedContact(null);
    setAmount('');
    setNote('');
    setPhoneInput('');
    setSearchQuery('');
  };

  // ── SUCCESS SCREEN ─────────────────────────────────────────────────────────
  if (paySuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <Animated.View style={[styles.successCircle, { transform: [{ scale: successAnim }] }]}>
          <Text style={{ fontSize: 52, color: Colors.textPrimary }}>✓</Text>
        </Animated.View>
        <Text style={styles.successTitle}>Payment Sent!</Text>
        <Text style={styles.successSub}>
          ₹{parseFloat(amount).toLocaleString('en-IN')} → {selectedContact?.name ?? phoneInput}
        </Text>
        <Text style={styles.successNote}>TXN{Date.now().toString().slice(-8)}</Text>
      </View>
    );
  }

  // ── CONFIRM SCREEN ─────────────────────────────────────────────────────────
  if (mode === 'confirm') {
    return (
      <View style={styles.container}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />

        <View style={styles.darkHeader}>
          <TouchableOpacity onPress={() => setMode('send')} style={styles.backBtn}>
            <Text style={styles.darkBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.darkHeaderTitle}>Confirm Payment</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.confirmBody}>
          <View style={styles.confirmAvatarWrap}>
            <Text style={{ fontSize: 56 }}>{selectedContact?.avatar ?? '📱'}</Text>
          </View>
          <Text style={styles.confirmTo}>SENDING TO</Text>
          <Text style={styles.confirmName}>{selectedContact?.name ?? phoneInput}</Text>
          {selectedContact?.upiId ? (
            <Text style={styles.confirmUpi}>{selectedContact.upiId}</Text>
          ) : null}

          <View style={styles.confirmAmountBox}>
            <Text style={styles.confirmCurrency}>₹</Text>
            <Text style={styles.confirmAmount}>
              {parseFloat(amount).toLocaleString('en-IN')}
            </Text>
          </View>

          {note ? <Text style={styles.confirmNote}>"{note}"</Text> : null}

          <View style={styles.confirmMeta}>
            {[
              { label: 'Payment method', value: 'BODHI Vault' },
              { label: 'Processing time', value: 'Instant' },
              { label: 'Transaction fee',  value: 'FREE', highlight: true },
            ].map(row => (
              <View key={row.label} style={styles.confirmMetaRow}>
                <Text style={styles.confirmMetaLabel}>{row.label}</Text>
                <Text style={[styles.confirmMetaValue, row.highlight && { color: Colors.green }]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.confirmFooter}>
          <TouchableOpacity style={styles.editBtn} onPress={() => setMode('send')}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.payNowBtn, loading && { opacity: 0.7 }]}
            onPress={handleConfirmPayment}
            disabled={loading}
          >
            <Text style={styles.payNowBtnText}>{loading ? 'Processing…' : 'PAY NOW'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── SEND / AMOUNT SCREEN ───────────────────────────────────────────────────
  if (mode === 'send') {
    return (
      <View style={styles.container}>
        {/* header */}
        <View style={styles.sendHeader}>
          <TouchableOpacity onPress={resetToHome} style={styles.backBtn}>
            <Text style={{ fontSize: 20, color: Colors.textPrimary }}>←</Text>
          </TouchableOpacity>
          <View style={styles.sendHeaderContact}>
            <Text style={{ fontSize: 26 }}>{selectedContact?.avatar ?? '📱'}</Text>
            <View>
              <Text style={styles.sendHeaderName}>{selectedContact?.name ?? phoneInput}</Text>
              {selectedContact?.upiId ? (
                <Text style={styles.sendHeaderUpi}>{selectedContact.upiId}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.sendBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.enterAmtLabel}>ENTER AMOUNT</Text>

          <View style={styles.amountInputRow}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          <View style={styles.quickAmtsRow}>
            {QUICK_AMOUNTS.map(qa => (
              <TouchableOpacity
                key={qa}
                style={styles.quickAmtPill}
                onPress={() => setAmount(qa.toString())}
              >
                <Text style={styles.quickAmtText}>+₹{qa >= 1000 ? `${qa / 1000}k` : qa}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor={Colors.textMuted}
          />

          <View style={styles.balanceInfo}>
            <Text style={styles.balanceInfoText}>Available balance</Text>
            <Text style={styles.balanceInfoAmt}>₹4,82,930</Text>
          </View>
        </ScrollView>

        <View style={styles.sendFooter}>
          <TouchableOpacity
            style={[styles.proceedBtn, (!amount || parseFloat(amount) <= 0) && styles.proceedBtnDisabled]}
            onPress={handleProceed}
          >
            <Text style={styles.proceedBtnText}>PROCEED TO PAY</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── QR SCREEN ──────────────────────────────────────────────────────────────
  if (mode === 'qr') {
    return (
      <View style={styles.qrContainer}>
        <View style={styles.qrHeader}>
          <TouchableOpacity onPress={resetToHome} style={styles.backBtn}>
            <Text style={{ fontSize: 20, color: Colors.textWhite }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.qrHeaderTitle}>Scan to Pay</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.qrViewfinder}>
          <View style={styles.qrFrame}>
            <View style={[styles.qrCorner, styles.qrTL]} />
            <View style={[styles.qrCorner, styles.qrTR]} />
            <View style={[styles.qrCorner, styles.qrBL]} />
            <View style={[styles.qrCorner, styles.qrBR]} />
            {qrScanning ? (
              <View style={styles.qrScanLine} />
            ) : (
              /* decorative mock QR grid */
              <View style={styles.qrMockGrid}>
                {[
                  [1,1,1,0,1],[1,0,1,1,0],[0,1,0,1,1],
                  [1,1,0,0,1],[1,0,1,0,1],
                ].map((row, r) => (
                  <View key={r} style={{ flexDirection: 'row' }}>
                    {row.map((cell, c) => (
                      <View
                        key={c}
                        style={[styles.qrCell, { opacity: cell ? 1 : 0.08 }]}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.qrHint}>
            {qrScanning ? 'Scanning…' : 'Point camera at a Bodhi QR code'}
          </Text>
        </View>

        <View style={styles.qrFooter}>
          <TouchableOpacity style={styles.qrScanBtn} onPress={handleQrMock} disabled={qrScanning}>
            <Text style={styles.qrScanBtnText}>
              {qrScanning ? 'Scanning…' : 'TAP TO SIMULATE SCAN'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.myQrBtn}>
            <Text style={styles.myQrBtnText}>SHOW MY QR CODE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── HOME SCREEN ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <BodhiHeader onInsurancePress={onInsurancePress} showBack onBack={onBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Payments</Text>
          <Text style={styles.pageSub}>INSTANT · ZERO FEE · SECURE</Text>
        </View>

        {/* Balance card */}
        <GradientCard style={styles.balanceCard}>
          <Text style={styles.cardLabel}>VAULT BALANCE</Text>
          <Text style={styles.cardBalance}>₹4,82,930</Text>
          <View style={styles.cardActions}>
            {[
              { icon: '📤', label: 'SEND',    onPress: () => setMode('send') },
              { icon: '📷', label: 'QR PAY',  onPress: () => setMode('qr')   },
              { icon: '📥', label: 'REQUEST', onPress: () => {}               },
            ].map(a => (
              <TouchableOpacity key={a.label} style={styles.cardAction} onPress={a.onPress}>
                <View style={styles.cardActionIcon}>
                  <Text style={{ fontSize: 20 }}>{a.icon}</Text>
                </View>
                <Text style={styles.cardActionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GradientCard>

        {/* Send money section */}
        <View style={styles.section}>
          <SectionHeader title="Send Money" />

          {/* Tabs */}
          <View style={styles.tabRow}>
            {(['contacts', 'phone', 'upi'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, inputTab === t && styles.tabActive]}
                onPress={() => setInputTab(t)}
              >
                <Text style={[styles.tabText, inputTab === t && styles.tabTextActive]}>
                  {t === 'contacts' ? '👥 Contacts' : t === 'phone' ? '📱 Phone' : '⚡ UPI'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CONTACTS tab */}
          {inputTab === 'contacts' && (
            <>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search name or number…"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.subLabel}>RECENT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentsRow}>
                {CONTACTS.filter(c => c.recent).map(c => (
                  <TouchableOpacity key={c.id} style={styles.recentContact} onPress={() => handleSelectContact(c)}>
                    <View style={styles.recentAvatar}>
                      <Text style={{ fontSize: 24 }}>{c.avatar}</Text>
                    </View>
                    <Text style={styles.recentName}>{c.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.subLabel}>ALL CONTACTS</Text>
              {filteredContacts.map(c => (
                <TouchableOpacity key={c.id} style={styles.contactRow} onPress={() => handleSelectContact(c)}>
                  <View style={styles.contactAvatar}>
                    <Text style={{ fontSize: 22 }}>{c.avatar}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactPhone}>{c.phone}</Text>
                  </View>
                  <Text style={{ color: Colors.purple, fontSize: 20 }}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* PHONE tab */}
          {inputTab === 'phone' && (
            <View style={{ gap: Spacing.md }}>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="Enter mobile number"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <TouchableOpacity
                style={[styles.proceedBtn, phoneInput.length !== 10 && styles.proceedBtnDisabled]}
                disabled={phoneInput.length !== 10}
                onPress={() => { setSelectedContact(null); setMode('send'); }}
              >
                <Text style={styles.proceedBtnText}>CONTINUE</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* UPI tab */}
          {inputTab === 'upi' && (
            <View style={{ gap: Spacing.md }}>
              <TextInput
                style={styles.upiInput}
                value={phoneInput}
                onChangeText={setPhoneInput}
                placeholder="Enter UPI ID  e.g. name@bodhi"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.proceedBtn, !phoneInput.includes('@') && styles.proceedBtnDisabled]}
                disabled={!phoneInput.includes('@')}
                onPress={() => { setSelectedContact(null); setMode('send'); }}
              >
                <Text style={styles.proceedBtnText}>VERIFY & CONTINUE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent transactions */}
        <View style={styles.section}>
          <SectionHeader title="Recent" />
          {RECENT_TRANSACTIONS.map(tx => (
            <TouchableOpacity
              key={tx.id}
              style={styles.txRow}
              onPress={() => {
                const c = CONTACTS.find(x => x.name === tx.name);
                if (c) handleSelectContact(c);
              }}
            >
              <View style={styles.txAvatar}>
                <Text style={{ fontSize: 22 }}>{tx.avatar}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txName}>{tx.name}</Text>
                <Text style={styles.txTime}>{tx.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.txAmount, { color: tx.type === 'received' ? Colors.green : Colors.textPrimary }]}>
                  {tx.type === 'received' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </Text>
                <View style={[styles.txPill, { backgroundColor: tx.type === 'received' ? '#DCFCE7' : Colors.bg }]}>
                  <Text style={[styles.txPillText, { color: tx.type === 'received' ? Colors.green : Colors.textSecondary }]}>
                    {tx.type.toUpperCase()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomNav active={activeTab} onPress={onNavigate} />
    </View>
  );
};

// ─── styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bg },
  scroll:          { paddingBottom: 32 },

  // blobs (decorative, used in dark screens)
  blob:  { position: 'absolute', borderRadius: 999 },
  blob1: { width: 260, height: 260, backgroundColor: '#3B1A6E', opacity: 0.18, top: -60,   right: -60  },
  blob2: { width: 200, height: 200, backgroundColor: Colors.pink, opacity: 0.12, bottom: 80, left: -50  },

  // ── home ──
  pageHeader: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.lg },
  pageTitle:  { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  pageSub:    { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1, marginTop: 2 },

  balanceCard:    { marginHorizontal: Spacing.base, marginBottom: Spacing.xl },
  cardLabel:      { fontSize: Typography.xs, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, marginBottom: Spacing.xs },
  cardBalance:    { fontSize: Typography['3xl'], fontWeight: Typography.extrabold, color: Colors.textWhite, marginBottom: Spacing.lg },
  cardActions:    { flexDirection: 'row', justifyContent: 'space-around' },
  cardAction:     { alignItems: 'center' },
  cardActionIcon: {
    width: 52, height: 52, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  cardActionLabel: { fontSize: Typography.xs, color: Colors.textWhite, fontWeight: Typography.bold, letterSpacing: 0.5 },

  section: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },

  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.border,
    borderRadius: Radius.lg, padding: 3, marginBottom: Spacing.md,
  },
  tab:           { flex: 1, paddingVertical: Spacing.xs, borderRadius: Radius.md, alignItems: 'center' },
  tabActive:     { backgroundColor: Colors.bgCard, ...Shadow.sm },
  tabText:       { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  tabTextActive: { color: Colors.purple, fontWeight: Typography.bold },

  searchInput: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary,
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  subLabel: {
    fontSize: Typography.xs, color: Colors.textSecondary,
    letterSpacing: 1, fontWeight: Typography.semibold, marginBottom: Spacing.sm,
  },

  recentsRow: { marginHorizontal: -Spacing.base, paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  recentContact: { alignItems: 'center', marginRight: Spacing.lg, width: 62 },
  recentAvatar: {
    width: 54, height: 54, borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 2, borderColor: Colors.purple,
    ...Shadow.sm,
  },
  recentName: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semibold, textAlign: 'center' },

  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  contactAvatar: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  contactInfo:  { flex: 1 },
  contactName:  { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  contactPhone: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },

  phoneRow: {
    flexDirection: 'row', backgroundColor: Colors.bgCard,
    borderRadius: Radius.md, overflow: 'hidden', ...Shadow.sm,
  },
  countryCode: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.bg, borderRightWidth: 1,
    borderRightColor: Colors.border, justifyContent: 'center',
  },
  countryCodeText: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.medium },
  phoneInput:      { flex: 1, padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary },
  upiInput: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, ...Shadow.sm,
  },

  txRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  txAvatar: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  txInfo:    { flex: 1 },
  txName:    { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  txTime:    { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },
  txAmount:  { fontSize: Typography.base, fontWeight: Typography.bold },
  txPill:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  txPillText:{ fontSize: 9, fontWeight: Typography.bold, letterSpacing: 0.5 },

  // ── send ──
  sendHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md, backgroundColor: Colors.bg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:          { padding: Spacing.xs },
  sendHeaderContact:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sendHeaderName:   { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  sendHeaderUpi:    { fontSize: Typography.sm, color: Colors.textSecondary },

  sendBody:       { paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'], paddingBottom: 140 },
  enterAmtLabel:  { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1.5, textAlign: 'center', marginBottom: Spacing.md },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  rupeeSymbol:    { fontSize: 40, fontWeight: Typography.bold, color: Colors.textPrimary, marginRight: 4, marginBottom: 4 },
  amountInput:    { fontSize: 64, fontWeight: Typography.extrabold, color: Colors.textPrimary, minWidth: 100, textAlign: 'center' },

  quickAmtsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.xl },
  quickAmtPill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: Colors.bgCard, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  quickAmtText: { fontSize: Typography.sm, color: Colors.purple, fontWeight: Typography.semibold },

  noteInput: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary,
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  balanceInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md,
  },
  balanceInfoText: { fontSize: Typography.sm, color: Colors.textSecondary },
  balanceInfoAmt:  { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },

  sendFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.base, paddingBottom: 32,
    backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  proceedBtn: {
    backgroundColor: Colors.purple, borderRadius: Radius.full,
    padding: Spacing.lg, alignItems: 'center',
  },
  proceedBtnDisabled: { opacity: 0.4 },
  proceedBtnText:     { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textWhite, letterSpacing: 1 },

  // ── confirm ──
  darkHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg,
    paddingBottom: Spacing.md,
  },
  darkBackText:    { fontSize: 22, color: Colors.textPrimary },
  darkHeaderTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },

  confirmBody:      { alignItems: 'center', padding: Spacing.xl, paddingBottom: 140 },
  confirmAvatarWrap:{ marginBottom: Spacing.md },
  confirmTo:        { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1.5, marginBottom: 4 },
  confirmName:      { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  confirmUpi:       { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.md },
  confirmAmountBox: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: Spacing.xl },
  confirmCurrency:  { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 6 },
  confirmAmount:    { fontSize: 56, fontWeight: Typography.extrabold, color: Colors.textPrimary },
  confirmNote:      { fontSize: Typography.base, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: Spacing.xl },
  confirmMeta: {
    width: '100%', backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md, ...Shadow.sm,
  },
  confirmMetaRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confirmMetaLabel:{ fontSize: Typography.base, color: Colors.textSecondary },
  confirmMetaValue:{ fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },

  confirmFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: Spacing.md,
    padding: Spacing.base, paddingBottom: 32,
    backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  editBtn: {
    flex: 1, padding: Spacing.lg, borderRadius: Radius.full,
    backgroundColor: Colors.bg, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  editBtnText:   { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.semibold },
  payNowBtn:     { flex: 2, backgroundColor: Colors.purple, borderRadius: Radius.full, padding: Spacing.lg, alignItems: 'center' },
  payNowBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textWhite, letterSpacing: 1 },

  // ── success ──
  successContainer: {
    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  successCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.lime,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl, ...Shadow.lg,
  },
  successTitle: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  successSub:   { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: Spacing.sm },
  successNote:  { fontSize: Typography.sm, color: Colors.textMuted, letterSpacing: 1 },

  // ── QR ──
  qrContainer: { flex: 1, backgroundColor: '#0A0A14' },
  qrHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg,
    paddingBottom: Spacing.md,
  },
  qrHeaderTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textWhite },
  qrViewfinder:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qrFrame: {
    width: W * 0.65, height: W * 0.65,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  qrCorner:     { position: 'absolute', width: 32, height: 32, borderColor: Colors.lime, borderWidth: 3 },
  qrTL:         { top: -2, left: -2, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: Radius.sm },
  qrTR:         { top: -2, right: -2, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: Radius.sm },
  qrBL:         { bottom: -2, left: -2, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: Radius.sm },
  qrBR:         { bottom: -2, right: -2, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: Radius.sm },
  qrScanLine:   { position: 'absolute', width: '90%', height: 2, backgroundColor: Colors.lime, opacity: 0.8 },
  qrMockGrid:   { gap: 8 },
  qrCell:       { width: 28, height: 28, backgroundColor: Colors.textWhite, margin: 4, borderRadius: 3 },
  qrHint:       { color: 'rgba(255,255,255,0.5)', marginTop: Spacing.xl, fontSize: Typography.sm, textAlign: 'center' },

  qrFooter: { padding: Spacing.xl, paddingBottom: 48, gap: Spacing.md },
  qrScanBtn: {
    backgroundColor: Colors.lime, borderRadius: Radius.full,
    padding: Spacing.lg, alignItems: 'center',
  },
  qrScanBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, letterSpacing: 1 },
  myQrBtn: {
    borderRadius: Radius.full, padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  myQrBtnText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.6)', fontWeight: Typography.semibold, letterSpacing: 1 },
});
