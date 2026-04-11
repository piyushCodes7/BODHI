// src/screens/TripWalletScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import {
  BodhiHeader,
  BottomNav,
  GradientCard,
  ProgressBar,
  SectionHeader,
  LoadingOverlay,
  ErrorBanner,
} from '../components/shared';
import type { NavTab } from '../components/shared';
import { TripAPI, type TripWallet, type TripMember, type TripExpense } from '../services/api';

// Hard-coded demo trip ID — replace with real navigation param
const DEMO_TRIP_ID = 'demo-trip-kyoto';
const FALLBACK_USER_ID = 'user-james';

interface Props {
  onNavigate: (tab: NavTab) => void;
  activeTab: NavTab;
  onInsurancePress: () => void;
  onBack: () => void;
  tripId?: string;
  currentUserId?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  ACCOMMODATION: '🏨',
  TRANSPORT: '🚄',
  DINING: '🍜',
  ACTIVITIES: '🎯',
  DEFAULT: '💳',
};

const MOCK_MEMBERS = [
  { user_id: 'me', contributed_amount: 2800000 },
  { user_id: 'hana', contributed_amount: 2800000 },
  { user_id: 'kenji', contributed_amount: 2800000 },
];

const MOCK_EXPENSES: TripExpense[] = [
  { id: '1', trip_id: DEMO_TRIP_ID, recorded_by: 'me', amount: 4200000, currency: 'JPY', description: 'Ritz-Carlton Kyoto', category: 'ACCOMMODATION', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '2', trip_id: DEMO_TRIP_ID, recorded_by: 'me', amount: 1450000, currency: 'JPY', description: 'Shinkansen Nozomi', category: 'TRANSPORT', created_at: new Date(Date.now() - 18000000).toISOString() },
  { id: '3', trip_id: DEMO_TRIP_ID, recorded_by: 'me', amount: 820000, currency: 'JPY', description: 'Gion Dinner Split', category: 'DINING', created_at: new Date(Date.now() - 86400000).toISOString() },
];

const formatTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return 'Yesterday';
};

const formatAmount = (paise: number, currency = 'JPY') => {
  const symbol = currency === 'JPY' ? '¥' : currency === 'INR' ? '₹' : '$';
  return `${symbol}${(paise / 100).toLocaleString()}`;
};

export const TripWalletScreen: React.FC<Props> = ({
  onNavigate, activeTab, onInsurancePress, onBack, tripId, currentUserId,
}) => {
  const activeUserId = currentUserId || FALLBACK_USER_ID;
  const [trip, setTrip] = useState<TripWallet | null>(null);
  const [members, setMembers] = useState<TripMember[]>(MOCK_MEMBERS as unknown as TripMember[]);
  const [expenses, setExpenses] = useState<TripExpense[]>(MOCK_EXPENSES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCat, setExpCat] = useState('ACCOMMODATION');

  const DEMO_TRIP: TripWallet = {
    id: DEMO_TRIP_ID, name: 'Kyoto Retreat', description: null, currency: 'JPY',
    status: 'ACTIVE', total_contributed: 8400000, total_expenses: 6470000,
    remaining_balance: 1930000, created_by: activeUserId,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), closed_at: null,
  };

  const load = useCallback(async () => {
    try {
      setError(null);
      const id = tripId || DEMO_TRIP_ID;
      const data = await TripAPI.get(id);
      setTrip(data);
      const [m, e] = await Promise.all([TripAPI.members(id), TripAPI.expenses(id)]);
      setMembers(m);
      setExpenses(e);
    } catch {
      // Fall back to mock data for demo
      setError('Live backend unavailable. Showing local demo data.');
      setTrip(DEMO_TRIP);
    }
  }, [tripId, activeUserId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleAddExpense = async () => {
    if (!expDesc || !expAmount) return;
    try {
      setLoading(true);
      const id = tripId || DEMO_TRIP_ID;
      const exp = await TripAPI.addExpense(id, {
        recorded_by: activeUserId,
        amount: Math.round(parseFloat(expAmount) * 100),
        description: expDesc,
        category: expCat,
      });
      setExpenses(prev => [exp, ...prev]);
      setExpenseModal(false);
      setExpDesc('');
      setExpAmount('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const displayTrip = trip || DEMO_TRIP;
  const budget = displayTrip.total_contributed;
  const spent = displayTrip.total_expenses;
  const budgetPercent = budget > 0 ? spent / budget : 0;
  const daysLeft = 2;

  return (
    <View style={styles.container}>
      <BodhiHeader
        onInsurancePress={onInsurancePress}
        showBack
        onBack={onBack}
        rightExtra={<TouchableOpacity><Text style={{ fontSize: 22 }}>⋮</Text></TouchableOpacity>}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.modePill}>ACTIVE TRIP MODE</Text>
            <Text style={styles.tripName}>{displayTrip.name}</Text>
          </View>
          <Text style={styles.closingText}>Wallet closes in {daysLeft} days</Text>
        </View>

        <ErrorBanner message={error} />

        {/* Balance card */}
        <GradientCard style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>SHARED BALANCE</Text>
            <View style={styles.balanceIconBtn}><Text style={{ color: Colors.textWhite, fontSize: 16 }}>▣</Text></View>
          </View>
          <View style={styles.balanceAmountRow}>
            <Text style={styles.balanceAmount}>
              {displayTrip.currency === 'JPY' ? '¥' : '₹'}
              {(displayTrip.remaining_balance / 100).toLocaleString()}
            </Text>
            <Text style={styles.balanceCurrency}>{displayTrip.currency}</Text>
          </View>
          <ProgressBar progress={budgetPercent} color={Colors.lime} height={8} />
          <Text style={styles.budgetUsed}>{Math.round(budgetPercent * 100)}% Budget Used</Text>
        </GradientCard>

        {/* Contributors */}
        <View style={styles.section}>
          <SectionHeader
            title="Contributors"
            action={`SPLIT: EQUAL`}
          />
          <View style={styles.contributorsGrid}>
            {members.slice(0, 3).map((m, i) => {
              const names = ['Me', 'Hana', 'Kenji'];
              const emojis = ['👩', '👩‍🦰', '🧔'];
              return (
                <View key={m.user_id} style={styles.contributorCard}>
                  <View style={styles.contributorAvatar}>
                    <Text style={{ fontSize: 28 }}>{emojis[i] || '👤'}</Text>
                  </View>
                  <Text style={styles.contributorName}>{names[i] || m.user_id}</Text>
                  <Text style={styles.contributorAmount}>
                    {displayTrip.currency === 'JPY' ? '¥' : '₹'}{(m.contributed_amount / 100).toLocaleString()}
                  </Text>
                </View>
              );
            })}
            <TouchableOpacity style={styles.inviteCard}>
              <View style={styles.inviteBtn}><Text style={{ fontSize: 24, color: Colors.textSecondary }}>+</Text></View>
              <Text style={styles.inviteText}>INVITE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auto-Deductions */}
        <View style={styles.section}>
          <SectionHeader title="Auto-Deductions" />
          <View style={styles.timeline}>
            {expenses.map((exp, i) => (
              <View key={exp.id} style={styles.expenseRow}>
                <View style={styles.timelineDot}>
                  <View style={[styles.dot, { backgroundColor: i === 0 ? Colors.lime : i === 1 ? Colors.purple : Colors.pink }]} />
                  {i < expenses.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.expenseContent}>
                  <View style={styles.expenseMain}>
                    <Text style={styles.expenseName}>{exp.description}</Text>
                    <Text style={styles.expenseAmount}>
                      -{displayTrip.currency === 'JPY' ? '¥' : '₹'}{(exp.amount / 100).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.expenseMeta}>
                    {CATEGORY_ICONS[exp.category || 'DEFAULT']} {exp.category || 'OTHER'} · {formatTime(exp.created_at)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setExpenseModal(true)}>
        <Text style={{ fontSize: 22 }}>🛒</Text>
      </TouchableOpacity>

      {/* Add expense modal */}
      <Modal visible={expenseModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={expDesc}
              onChangeText={setExpDesc}
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={styles.input}
              placeholder={`Amount (${displayTrip.currency})`}
              value={expAmount}
              onChangeText={setExpAmount}
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textMuted}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {Object.keys(CATEGORY_ICONS).filter(c => c !== 'DEFAULT').map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, expCat === cat && styles.catPillActive]}
                  onPress={() => setExpCat(cat)}
                >
                  <Text style={[styles.catPillText, expCat === cat && styles.catPillTextActive]}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setExpenseModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddExpense}>
                <Text style={styles.confirmBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LoadingOverlay visible={loading} />
      <BottomNav active={activeTab} onPress={onNavigate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  titleRow: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  modePill: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1, marginBottom: 4 },
  tripName: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  closingText: { fontSize: Typography.sm, color: Colors.pink, fontWeight: Typography.semibold },

  balanceCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.xl },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  balanceLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.75)', letterSpacing: 1 },
  balanceIconBtn: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  balanceAmountRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.md },
  balanceAmount: { fontSize: 40, fontWeight: Typography.extrabold, color: Colors.textWhite },
  balanceCurrency: { fontSize: Typography.lg, color: 'rgba(255,255,255,0.75)', marginLeft: Spacing.xs, marginBottom: 6 },
  budgetUsed: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.75)', marginTop: Spacing.xs, textAlign: 'right' },

  section: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },
  contributorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  contributorCard: {
    width: '47%', backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', ...Shadow.sm,
  },
  contributorAvatar: {
    width: 64, height: 64, borderRadius: Radius.full,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  contributorName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  contributorAmount: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  inviteCard: {
    width: '47%', backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1.5,
    borderColor: Colors.border, borderStyle: 'dashed', ...Shadow.sm,
  },
  inviteBtn: {
    width: 64, height: 64, borderRadius: Radius.full,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  inviteText: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1, fontWeight: Typography.semibold },

  timeline: {},
  expenseRow: { flexDirection: 'row', marginBottom: Spacing.lg },
  timelineDot: { width: 32, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: Radius.full, marginTop: 4 },
  timelineLine: { flex: 1, width: 1, backgroundColor: Colors.border, marginTop: 4 },
  expenseContent: { flex: 1 },
  expenseMain: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  expenseName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  expenseAmount: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.red },
  expenseMeta: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },

  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 90,
    width: 56, height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.lime,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.lg,
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  input: {
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    fontSize: Typography.base, color: Colors.textPrimary,
  },
  catRow: { marginBottom: Spacing.lg },
  catPill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, backgroundColor: Colors.bg,
    marginRight: Spacing.sm,
  },
  catPillActive: { backgroundColor: Colors.purple },
  catPillText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  catPillTextActive: { color: Colors.textWhite },
  modalBtns: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: Colors.bg, alignItems: 'center',
  },
  cancelBtnText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.semibold },
  confirmBtn: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: Colors.purple, alignItems: 'center',
  },
  confirmBtnText: { fontSize: Typography.base, color: Colors.textWhite, fontWeight: Typography.bold },
});
