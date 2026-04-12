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
  KeyboardAvoidingView,
  Platform,
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

const FALLBACK_USER_ID = 'user-james';

interface Props {
  onNavigate: (tab: NavTab) => void;
  activeTab: NavTab;
  onInsurancePress: () => void;
  onBack: () => void;
  tripId?: string;
  currentUserId?: string;
}

// ─── Category config: text-based icons, no emojis ────────────────────────────
const CATEGORIES: { key: string; icon: string; color: string }[] = [
  { key: 'ACCOMMODATION', icon: '⌂', color: '#7B2FBE' },
  { key: 'TRANSPORT',     icon: '→', color: '#0D6E9E' },
  { key: 'DINING',        icon: '♦', color: '#C0390A' },
  { key: 'ACTIVITIES',    icon: '◈', color: '#2A8A4A' },
  { key: 'SHOPPING',      icon: '◻', color: '#8A6000' },
  { key: 'OTHER',         icon: '·', color: '#6B6B8A' },
];
const catMap = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));
const getCat = (key?: string | null) => catMap[key ?? ''] ?? catMap['OTHER'];

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_TRIP_ID = '6b8ca3c7-cf68-4a73-8a7e-f0947f0b45e0';

const makeMockTrip = (userId: string): TripWallet => ({
  id: MOCK_TRIP_ID, name: 'Kyoto Retreat', description: 'Spring planning trip',
  currency: 'JPY', status: 'ACTIVE',
  total_contributed: 8_400_000, total_expenses: 6_470_000, remaining_balance: 1_930_000,
  created_by: userId,
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(), closed_at: null,
});

const MOCK_MEMBERS: TripMember[] = [
  { id: 'm1', trip_id: MOCK_TRIP_ID, user_id: 'user-james', role: 'ADMIN', contributed_amount: 2_800_000, refunded_amount: 0, joined_at: new Date().toISOString() },
  { id: 'm2', trip_id: MOCK_TRIP_ID, user_id: 'user-hana',  role: 'MEMBER', contributed_amount: 2_800_000, refunded_amount: 0, joined_at: new Date().toISOString() },
  { id: 'm3', trip_id: MOCK_TRIP_ID, user_id: 'user-kenji', role: 'MEMBER', contributed_amount: 2_800_000, refunded_amount: 0, joined_at: new Date().toISOString() },
];

const MOCK_EXPENSES: TripExpense[] = [
  { id: 'e1', trip_id: MOCK_TRIP_ID, recorded_by: 'user-james', amount: 4_200_000, currency: 'JPY', description: 'Ritz-Carlton Kyoto', category: 'ACCOMMODATION', created_at: new Date(Date.now() - 7_200_000).toISOString() },
  { id: 'e2', trip_id: MOCK_TRIP_ID, recorded_by: 'user-james', amount: 1_450_000, currency: 'JPY', description: 'Shinkansen Nozomi',  category: 'TRANSPORT',     created_at: new Date(Date.now() - 18_000_000).toISOString() },
  { id: 'e3', trip_id: MOCK_TRIP_ID, recorded_by: 'user-james', amount:   820_000, currency: 'JPY', description: 'Gion Dinner',         category: 'DINING',        created_at: new Date(Date.now() - 86_400_000).toISOString() },
];

const USER_LABELS: Record<string, string> = {
  'user-james': 'James', 'user-hana': 'Hana', 'user-kenji': 'Kenji',
};
const labelFor = (id: string) => USER_LABELS[id] ?? id.slice(-6);

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtMoney = (paise: number, currency = 'JPY') => {
  const sym = currency === 'JPY' ? '¥' : currency === 'INR' ? '₹' : '$';
  return `${sym}${(paise / 100).toLocaleString()}`;
};

const fmtTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 172_800_000) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── Subcomponents ────────────────────────────────────────────────────────────
const MemberRow: React.FC<{ member: TripMember; total: number; isMe: boolean }> = ({ member, total, isMe }) => {
  const pct = total > 0 ? member.contributed_amount / total : 0;
  const initials = labelFor(member.user_id).slice(0, 2).toUpperCase();
  return (
    <View style={memberStyles.row}>
      <View style={[memberStyles.avatar, isMe && memberStyles.avatarMe]}>
        <Text style={memberStyles.avatarText}>{initials}</Text>
      </View>
      <View style={memberStyles.info}>
        <View style={memberStyles.nameRow}>
          <Text style={memberStyles.name}>{labelFor(member.user_id)}{isMe ? ' (You)' : ''}</Text>
          {member.role === 'ADMIN' && <View style={memberStyles.adminBadge}><Text style={memberStyles.adminText}>ADMIN</Text></View>}
        </View>
        <View style={memberStyles.progressRow}>
          <View style={memberStyles.progressTrack}>
            <View style={[memberStyles.progressFill, { width: `${Math.min(100, pct * 100)}%` }]} />
          </View>
          <Text style={memberStyles.pctText}>{Math.round(pct * 100)}%</Text>
        </View>
      </View>
      <Text style={memberStyles.amount}>{fmtMoney(member.contributed_amount, 'JPY')}</Text>
    </View>
  );
};

const memberStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarMe: { backgroundColor: Colors.purple },
  avatarText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textWhite },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  name: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  adminBadge: { backgroundColor: Colors.lime, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  adminText: { fontSize: 8, fontWeight: Typography.bold, color: Colors.textPrimary, letterSpacing: 0.5 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressTrack: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: Colors.purple, borderRadius: 2 },
  pctText: { fontSize: Typography.xs, color: Colors.textMuted, width: 28, textAlign: 'right' },
  amount: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary },
});

// ─── Main component ───────────────────────────────────────────────────────────
export const TripWalletScreen: React.FC<Props> = ({
  onNavigate, activeTab, onInsurancePress, onBack, tripId, currentUserId,
}) => {
  const activeUserId = currentUserId || FALLBACK_USER_ID;
  const resolvedTripId = tripId || MOCK_TRIP_ID;

  const [trip, setTrip]       = useState<TripWallet | null>(null);
  const [members, setMembers] = useState<TripMember[]>(MOCK_MEMBERS);
  const [expenses, setExpenses] = useState<TripExpense[]>(MOCK_EXPENSES);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [expenseModal, setExpenseModal] = useState(false);
  const [contribModal, setContribModal] = useState(false);
  const [settleModal, setSettleModal]   = useState(false);
  const [closeModal, setCloseModal]     = useState(false);

  // Expense form
  const [expDesc, setExpDesc]   = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCat, setExpCat]     = useState('ACCOMMODATION');

  // Contribution form
  const [contribAmt, setContribAmt] = useState('');

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setError(null);
      const [t, m, e] = await Promise.all([
        TripAPI.get(resolvedTripId),
        TripAPI.members(resolvedTripId),
        TripAPI.expenses(resolvedTripId),
      ]);
      setTrip(t);
      setMembers(m.length > 0 ? m : MOCK_MEMBERS);
      setExpenses(e.length > 0 ? e : MOCK_EXPENSES);
    } catch {
      setTrip(makeMockTrip(activeUserId));
    }
  }, [resolvedTripId, activeUserId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleAddExpense = async () => {
    if (!expDesc.trim() || !expAmount || parseFloat(expAmount) <= 0) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    const displayTrip = trip ?? makeMockTrip(activeUserId);
    const amountPaise = Math.round(parseFloat(expAmount) * 100);
    if (amountPaise > displayTrip.remaining_balance) {
      Alert.alert('Insufficient Funds', `Only ${fmtMoney(displayTrip.remaining_balance, displayTrip.currency)} remaining.`);
      return;
    }
    try {
      setLoading(true);
      const exp = await TripAPI.addExpense(resolvedTripId, {
        recorded_by: activeUserId,
        amount: amountPaise,
        description: expDesc.trim(),
        category: expCat,
      });
      setExpenses(prev => [exp, ...prev]);
      setTrip(prev => prev ? { ...prev, total_expenses: prev.total_expenses + amountPaise, remaining_balance: prev.remaining_balance - amountPaise } : prev);
      setExpenseModal(false); setExpDesc(''); setExpAmount('');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const handleContribute = async () => {
    if (!contribAmt || parseFloat(contribAmt) <= 0) { Alert.alert('Invalid Amount', 'Enter a positive amount.'); return; }
    const amountPaise = Math.round(parseFloat(contribAmt) * 100);
    try {
      setLoading(true);
      await TripAPI.contribute(resolvedTripId, activeUserId, amountPaise);
      await load();
      setContribModal(false); setContribAmt('');
      Alert.alert('Contributed', `${fmtMoney(amountPaise, displayTrip.currency)} added to the pool.`);
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const handleCloseTrip = async () => {
    try {
      setLoading(true);
      await TripAPI.close(resolvedTripId);
      await load();
      setCloseModal(false);
      Alert.alert('Wallet Closed', 'Remaining funds have been proportionally refunded to members.');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const displayTrip   = trip ?? makeMockTrip(activeUserId);
  const isClosed      = displayTrip.status === 'CLOSED';
  const isActive      = displayTrip.status === 'ACTIVE';
  const budgetPct     = displayTrip.total_contributed > 0 ? displayTrip.total_expenses / displayTrip.total_contributed : 0;
  const myMember      = members.find(m => m.user_id === activeUserId);
  const totalContrib  = members.reduce((s, m) => s + m.contributed_amount, 0);
  const sym           = displayTrip.currency === 'JPY' ? '¥' : '₹';

  return (
    <View style={styles.container}>
      <BodhiHeader
        showBack
        onBack={onBack}
        onInsurancePress={onInsurancePress}
        rightExtra={
          !isClosed ? (
            <TouchableOpacity onPress={() => setCloseModal(true)} style={styles.moreBtn}>
              <Text style={styles.moreBtnText}>···</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Title ── */}
        <View style={styles.titleRow}>
          <View>
            <View style={styles.statusPillRow}>
              <View style={[styles.statusPill, { backgroundColor: isClosed ? Colors.red + '20' : Colors.green + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: isClosed ? Colors.red : Colors.green }]} />
                <Text style={[styles.statusPillText, { color: isClosed ? Colors.red : Colors.green }]}>
                  {displayTrip.status}
                </Text>
              </View>
            </View>
            <Text style={styles.tripName}>{displayTrip.name}</Text>
            {displayTrip.description && <Text style={styles.tripDesc}>{displayTrip.description}</Text>}
          </View>
        </View>

        <ErrorBanner message={error} />

        {/* ── Balance card ── */}
        <GradientCard style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <Text style={styles.balanceCardLabel}>SHARED BALANCE</Text>
            <View style={styles.currencyChip}>
              <Text style={styles.currencyChipText}>{displayTrip.currency}</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>{fmtMoney(displayTrip.remaining_balance, displayTrip.currency)}</Text>
          <View style={styles.balanceMetaRow}>
            <Text style={styles.balanceMeta}>Contributed {fmtMoney(displayTrip.total_contributed, displayTrip.currency)}</Text>
            <Text style={styles.balanceMeta}>Spent {fmtMoney(displayTrip.total_expenses, displayTrip.currency)}</Text>
          </View>
          <ProgressBar progress={budgetPct} color={Colors.lime} height={6} />
          <Text style={styles.budgetUsedLabel}>{Math.round(budgetPct * 100)}% of budget spent</Text>
        </GradientCard>

        {/* ── Summary tiles ── */}
        <View style={styles.summaryTiles}>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryTileLabel}>MEMBERS</Text>
            <Text style={styles.summaryTileValue}>{members.length}</Text>
          </View>
          <View style={[styles.summaryTile, styles.summaryTileMid]}>
            <Text style={styles.summaryTileLabel}>EXPENSES</Text>
            <Text style={styles.summaryTileValue}>{expenses.length}</Text>
          </View>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryTileLabel}>YOUR SHARE</Text>
            <Text style={styles.summaryTileValue}>
              {myMember ? `${Math.round((myMember.contributed_amount / totalContrib) * 100)}%` : '—'}
            </Text>
          </View>
        </View>

        {/* ── Members ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <SectionHeader title="Members" />
            {!isClosed && (
              <TouchableOpacity style={styles.inviteBtn} onPress={() => Alert.alert('Invite', 'Share invite link with your friends.')}>
                <Text style={styles.inviteBtnText}>+ Invite</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.membersCard}>
            {members.map((m, i) => (
              <React.Fragment key={m.id}>
                {i > 0 && <View style={styles.memberDivider} />}
                <MemberRow member={m} total={totalContrib} isMe={m.user_id === activeUserId} />
              </React.Fragment>
            ))}
          </View>
          {!isClosed && (
            <TouchableOpacity style={styles.contribBannerBtn} onPress={() => setContribModal(true)}>
              <Text style={styles.contribBannerText}>Add Contribution</Text>
              <Text style={styles.contribBannerArrow}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Expenses ── */}
        <View style={styles.section}>
          <SectionHeader title="Expenses" />
          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>◻</Text>
              <Text style={styles.emptyStateText}>No expenses yet</Text>
            </View>
          ) : (
            <View style={styles.expensesCard}>
              {expenses.map((exp, i) => {
                const cat = getCat(exp.category);
                return (
                  <React.Fragment key={exp.id}>
                    {i > 0 && <View style={styles.expenseDivider} />}
                    <View style={styles.expenseRow}>
                      <View style={[styles.expenseCatIcon, { backgroundColor: cat.color + '20' }]}>
                        <Text style={[styles.expenseCatIconText, { color: cat.color }]}>{cat.icon}</Text>
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseName}>{exp.description}</Text>
                        <Text style={styles.expenseMeta}>
                          {exp.category ?? 'OTHER'} · {labelFor(exp.recorded_by)} · {fmtTime(exp.created_at)}
                        </Text>
                      </View>
                      <Text style={styles.expenseAmt}>-{fmtMoney(exp.amount, exp.currency)}</Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Settle debts CTA (non-closed) ── */}
        {!isClosed && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.settleBtn} onPress={() => setSettleModal(true)}>
              <View style={styles.settleBtnLeft}>
                <Text style={styles.settleBtnTitle}>Settle Debts</Text>
                <Text style={styles.settleBtnSub}>View who owes whom and mark as paid</Text>
              </View>
              <Text style={styles.settleBtnArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom padding for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── FAB: Add expense (only ACTIVE) ── */}
      {isActive && !isClosed && (
        <TouchableOpacity style={styles.fab} onPress={() => setExpenseModal(true)}>
          <Text style={styles.fabText}>+ Expense</Text>
        </TouchableOpacity>
      )}

      {/* ═══ MODALS ══════════════════════════════════════════════════════════ */}

      {/* Add Expense */}
      <Modal visible={expenseModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add Expense</Text>

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Hotel, Dinner, Taxi..."
                value={expDesc}
                onChangeText={setExpDesc}
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Amount ({displayTrip.currency})</Text>
              <View style={styles.amtInputRow}>
                <Text style={styles.amtSym}>{sym}</Text>
                <TextInput
                  style={styles.amtInput}
                  placeholder="0"
                  value={expAmount}
                  onChangeText={setExpAmount}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <Text style={styles.balanceHint}>
                Balance: {fmtMoney(displayTrip.remaining_balance, displayTrip.currency)}
              </Text>

              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.catPill, expCat === c.key && { backgroundColor: c.color }]}
                    onPress={() => setExpCat(c.key)}
                  >
                    <Text style={[styles.catPillText, expCat === c.key && { color: Colors.textWhite }]}>
                      {c.icon} {c.key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setExpenseModal(false); setExpDesc(''); setExpAmount(''); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleAddExpense}>
                  <Text style={styles.confirmBtnText}>Add Expense</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Contribution */}
      <Modal visible={contribModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add Contribution</Text>
              <Text style={styles.modalSub}>Your current share: {fmtMoney(myMember?.contributed_amount ?? 0, displayTrip.currency)}</Text>

              <Text style={styles.fieldLabel}>Amount ({displayTrip.currency})</Text>
              <View style={styles.amtInputRow}>
                <Text style={styles.amtSym}>{sym}</Text>
                <TextInput
                  style={styles.amtInput}
                  placeholder="0"
                  value={contribAmt}
                  onChangeText={setContribAmt}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setContribModal(false); setContribAmt(''); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleContribute}>
                  <Text style={styles.confirmBtnText}>Contribute</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Settle debts info */}
      <Modal visible={settleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Settle Debts</Text>
            <Text style={styles.modalSub}>Based on contributions vs expenses, here is who owes whom:</Text>
            {members.map(m => {
              const share = totalContrib > 0 ? (m.contributed_amount / totalContrib) : 0;
              const owedExpenses = displayTrip.total_expenses * share;
              const contributed = m.contributed_amount;
              const net = contributed - owedExpenses;
              return (
                <View key={m.id} style={styles.debtRow}>
                  <Text style={styles.debtName}>{labelFor(m.user_id)}</Text>
                  <View style={[styles.debtBadge, { backgroundColor: net >= 0 ? Colors.green + '20' : Colors.red + '20' }]}>
                    <Text style={[styles.debtBadgeText, { color: net >= 0 ? Colors.green : Colors.red }]}>
                      {net >= 0 ? '+' : ''}{fmtMoney(Math.abs(Math.round(net)), displayTrip.currency)}
                    </Text>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity style={[styles.confirmBtn, { marginTop: Spacing.lg }]} onPress={() => setSettleModal(false)}>
              <Text style={styles.confirmBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Close wallet confirmation */}
      <Modal visible={closeModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, styles.alertSheet]}>
            <Text style={styles.alertIcon}>!</Text>
            <Text style={styles.alertTitle}>Close Wallet?</Text>
            <Text style={styles.alertBody}>
              This will permanently close the trip wallet. Remaining funds ({fmtMoney(displayTrip.remaining_balance, displayTrip.currency)}) will be proportionally refunded to all contributors.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCloseModal(false)}>
                <Text style={styles.cancelBtnText}>Keep Open</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: Colors.red }]} onPress={handleCloseTrip}>
                <Text style={styles.confirmBtnText}>Close & Refund</Text>
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
  scroll: { paddingBottom: 24 },

  moreBtn: { padding: Spacing.xs },
  moreBtnText: { fontSize: Typography.xl, color: Colors.textSecondary, letterSpacing: 2 },

  // ── Title
  titleRow: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  statusPillRow: { marginBottom: Spacing.xs },
  statusPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 0.5 },
  tripName: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  tripDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },

  // ── Balance card
  balanceCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.md },
  balanceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  balanceCardLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.75)', letterSpacing: 1 },
  currencyChip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  currencyChipText: { fontSize: Typography.xs, color: Colors.textWhite, fontWeight: Typography.semibold },
  balanceAmount: { fontSize: 42, fontWeight: Typography.extrabold, color: Colors.textWhite, marginBottom: Spacing.md },
  balanceMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  balanceMeta: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)' },
  budgetUsedLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'right' },

  // ── Summary tiles
  summaryTiles: { flexDirection: 'row', marginHorizontal: Spacing.base, marginBottom: Spacing.base, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  summaryTile: { flex: 1, padding: Spacing.md, alignItems: 'center' },
  summaryTileMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  summaryTileLabel: { fontSize: Typography.xs, color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  summaryTileValue: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },

  // ── Section
  section: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  inviteBtn: { backgroundColor: Colors.purple + '18', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  inviteBtnText: { fontSize: Typography.sm, color: Colors.purple, fontWeight: Typography.semibold },

  // ── Members
  membersCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, ...Shadow.sm },
  memberDivider: { height: 1, backgroundColor: Colors.border },
  contribBannerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.purple + '12', borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.sm,
    borderWidth: 1, borderColor: Colors.purple + '30',
  },
  contribBannerText: { fontSize: Typography.base, color: Colors.purple, fontWeight: Typography.semibold },
  contribBannerArrow: { fontSize: Typography.xl, color: Colors.purple, fontWeight: Typography.bold },

  // ── Expenses
  expensesCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, ...Shadow.sm },
  expenseDivider: { height: 1, backgroundColor: Colors.border },
  expenseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  expenseCatIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  expenseCatIconText: { fontSize: 18, fontWeight: Typography.bold },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: 2 },
  expenseMeta: { fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  expenseAmt: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.red },

  // ── Empty
  emptyState: { alignItems: 'center', padding: Spacing['2xl'], backgroundColor: Colors.bgCard, borderRadius: Radius.lg },
  emptyStateIcon: { fontSize: 32, color: Colors.textMuted, marginBottom: Spacing.sm },
  emptyStateText: { fontSize: Typography.base, color: Colors.textMuted },

  // ── Settle btn
  settleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, ...Shadow.sm,
  },
  settleBtnLeft: {},
  settleBtnTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  settleBtnSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  settleBtnArrow: { fontSize: Typography.xl, color: Colors.purple },

  // ── FAB
  fab: {
    position: 'absolute', right: Spacing.lg, bottom: 90,
    backgroundColor: Colors.purple, borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    ...Shadow.lg,
  },
  fabText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textWhite, letterSpacing: 0.5 },

  // ── Modal shared
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl, paddingBottom: 44 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  fieldLabel: { fontSize: Typography.xs, color: Colors.textMuted, letterSpacing: 0.5, fontWeight: Typography.semibold, marginBottom: Spacing.xs },
  input: { backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  amtInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: 4, borderWidth: 1, borderColor: Colors.border },
  amtSym: { fontSize: Typography.xl, color: Colors.textSecondary, marginRight: Spacing.xs },
  amtInput: { flex: 1, fontSize: Typography.xl, color: Colors.textPrimary, fontWeight: Typography.bold, paddingVertical: Spacing.md },
  balanceHint: { fontSize: Typography.xs, color: Colors.textMuted, marginBottom: Spacing.md, textAlign: 'right' },
  catRow: { marginBottom: Spacing.lg },
  catPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.bg, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  catPillText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  modalBtns: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.bg, alignItems: 'center' },
  cancelBtnText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.semibold },
  confirmBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.purple, alignItems: 'center' },
  confirmBtnText: { fontSize: Typography.base, color: Colors.textWhite, fontWeight: Typography.bold },

  // ── Debt rows
  debtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  debtName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  debtBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  debtBadgeText: { fontSize: Typography.sm, fontWeight: Typography.bold },

  // ── Alert sheet
  alertSheet: { alignItems: 'center' },
  alertIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.red + '20', color: Colors.red, fontSize: 28, fontWeight: Typography.extrabold, textAlign: 'center', lineHeight: 52, marginBottom: Spacing.md, overflow: 'hidden' },
  alertTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  alertBody: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
});
