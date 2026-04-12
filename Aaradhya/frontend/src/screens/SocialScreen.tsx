// src/screens/SocialScreen.tsx
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
  ProgressBar,
  SectionHeader,
  LoadingOverlay,
  ErrorBanner,
} from '../components/shared';
import type { NavTab } from '../components/shared';
import { GroupAPI, type GroupWallet } from '../services/api';

const FALLBACK_USER_ID = 'user-james';
const FALLBACK_GROUP_ID = 'goa-fund';

interface Props {
  onNavigate: (tab: NavTab) => void;
  activeTab: NavTab;
  onInsurancePress: () => void;
  currentUserId?: string;
  demoGroupId?: string;
}

type SocialGroup = GroupWallet & {
  member_initials: string[];
  extra_count: number;
  last_activity?: string;
  description_tag?: string;
  fund_type: 'GROWTH' | 'VENTURE' | 'INDEX' | 'BOND';
  returns_ytd?: string;
  risk_level?: 'Low' | 'Medium' | 'High';
};

const buildMockGroups = (userId: string, groupId: string): SocialGroup[] => [
  {
    id: groupId,
    name: 'Nifty 50 Index Club',
    description: 'Passive long-term index investing pool',
    currency: 'INR',
    status: 'OPEN',
    target_amount: 2_000_000,
    total_contributed: 1_425_000,
    created_by: userId,
    created_at: new Date().toISOString(),
    member_initials: ['JC', 'HM', 'KS'],
    extra_count: 12,
    last_activity: 'James added ₹5,000 · 2h ago',
    description_tag: 'ACTIVE FUND',
    fund_type: 'INDEX',
    returns_ytd: '+14.2%',
    risk_level: 'Low',
  },
  {
    id: 'startup-bets',
    name: 'Startup Bets',
    description: 'Early-stage venture bets across fintech and SaaS',
    currency: 'USD',
    status: 'OPEN',
    target_amount: 0,
    total_contributed: 12_840_000,
    created_by: userId,
    created_at: new Date().toISOString(),
    member_initials: ['KS', 'PS'],
    extra_count: 42,
    description_tag: 'VENTURE CLUB',
    fund_type: 'VENTURE',
    returns_ytd: '+38.7%',
    risk_level: 'High',
  },
];

const formatMoney = (units: number, currency = 'INR') => {
  const sym = currency === 'USD' ? '$' : '₹';
  const val = units / 100;
  if (val >= 100_000) return `${sym}${(val / 100_000).toFixed(1)}L`;
  if (val >= 1_000) return `${sym}${(val / 1_000).toFixed(1)}k`;
  return `${sym}${val.toLocaleString()}`;
};

const RISK_COLORS = { Low: Colors.green, Medium: Colors.orange, High: Colors.red };
const FUND_TYPE_LABELS: Record<string, string> = { GROWTH: 'GRW', VENTURE: 'VC', INDEX: 'IDX', BOND: 'BND' };
const QUICK_INVEST_AMOUNTS = [1000, 5000, 10000, 25000];

export const SocialScreen: React.FC<Props> = ({
  onNavigate, activeTab, onInsurancePress, currentUserId, demoGroupId,
}) => {
  const activeUserId = currentUserId || FALLBACK_USER_ID;
  const activeGroupId = demoGroupId || FALLBACK_GROUP_ID;

  const [groups, setGroups] = useState<SocialGroup[]>(() => buildMockGroups(activeUserId, activeGroupId));
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [contributeModal, setContributeModal] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [selectedQuick, setSelectedQuick] = useState<number | null>(null);

  useEffect(() => { setGroups(buildMockGroups(activeUserId, activeGroupId)); }, [activeUserId, activeGroupId]);

  const load = useCallback(async () => {
    try {
      const liveGroup = await GroupAPI.get(activeGroupId);
      setGroups(prev => prev.map((g, i) => i === 0 ? { ...g, ...liveGroup, member_initials: g.member_initials, extra_count: g.extra_count, last_activity: g.last_activity, fund_type: g.fund_type, returns_ytd: g.returns_ytd, risk_level: g.risk_level } : g));
    } catch { /* keep mock */ }
  }, [activeGroupId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const handleContribute = async (groupId: string) => {
    const finalAmount = selectedQuick ? String(selectedQuick) : contributeAmount;
    if (!finalAmount || parseFloat(finalAmount) <= 0) { Alert.alert('Invalid Amount', 'Enter or select an amount.'); return; }
    try {
      setLoading(true);
      await GroupAPI.contribute(groupId, activeUserId, Math.round(parseFloat(finalAmount) * 100));
      await load();
      setContributeModal(null); setContributeAmount(''); setSelectedQuick(null);
      Alert.alert('Invested', `₹${parseFloat(finalAmount).toLocaleString('en-IN')} added to pool.`);
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const openContribute = (id: string) => { setSelectedQuick(null); setContributeAmount(''); setContributeModal(id); };

  const [g0, g1] = groups;
  if (!g0 || !g1) return null;
  const mainProgress = g0.target_amount > 0 ? g0.total_contributed / g0.target_amount : 0;
  const contributingGroup = groups.find(g => g.id === contributeModal);

  return (
    <View style={styles.container}>
      <BodhiHeader
        onInsurancePress={onInsurancePress}
        rightExtra={
          <TouchableOpacity style={styles.createClubBtn} onPress={() => {}}>
            <Text style={styles.createClubText}>+ Club</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Investment Clubs</Text>
          <Text style={styles.pageSub}>POOL · VOTE · GROW TOGETHER</Text>
        </View>

        {/* ── Primary fund card ── */}
        <View style={styles.primaryCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.tagRow}>
              <View style={styles.fundTag}><Text style={styles.fundTagText}>{g0.description_tag}</Text></View>
              {g0.risk_level && (
                <View style={[styles.riskTag, { backgroundColor: RISK_COLORS[g0.risk_level] + '20' }]}>
                  <View style={[styles.riskDot, { backgroundColor: RISK_COLORS[g0.risk_level] }]} />
                  <Text style={[styles.riskText, { color: RISK_COLORS[g0.risk_level] }]}>{g0.risk_level} Risk</Text>
                </View>
              )}
            </View>
            <View style={styles.memberStack}>
              {g0.member_initials.map((init, i) => (
                <View key={i} style={[styles.memberBadge, { marginLeft: i > 0 ? -8 : 0 }]}>
                  <Text style={styles.memberBadgeText}>{init}</Text>
                </View>
              ))}
              <View style={[styles.memberBadge, styles.memberBadgeExtra, { marginLeft: -8 }]}>
                <Text style={styles.memberBadgeExtraText}>+{g0.extra_count}</Text>
              </View>
            </View>
          </View>

          <View style={styles.fundNameRow}>
            <View style={styles.fundTypeChip}><Text style={styles.fundTypeChipText}>{FUND_TYPE_LABELS[g0.fund_type]}</Text></View>
            <Text style={styles.fundName}>{g0.name}</Text>
          </View>
          <Text style={styles.fundDesc}>{g0.description}</Text>

          {g0.returns_ytd && (
            <View style={styles.returnsRow}>
              <Text style={styles.returnsLabel}>YTD Returns</Text>
              <Text style={styles.returnsValue}>{g0.returns_ytd}</Text>
            </View>
          )}

          <View style={styles.poolStats}>
            {[
              { label: 'POOLED', value: formatMoney(g0.total_contributed, g0.currency) },
              { label: 'TARGET', value: formatMoney(g0.target_amount, g0.currency) },
              { label: 'MEMBERS', value: String(g0.extra_count + g0.member_initials.length) },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.poolStat}>
                  <Text style={styles.poolStatLabel}>{s.label}</Text>
                  <Text style={styles.poolStatValue}>{s.value}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <View style={styles.progressWrap}>
            <ProgressBar progress={mainProgress} color={Colors.purple} height={6} />
            <Text style={styles.progressLabel}>{Math.round(mainProgress * 100)}% of target raised</Text>
          </View>

          <TouchableOpacity style={styles.investBtn} onPress={() => openContribute(g0.id)}>
            <Text style={styles.investBtnText}>Invest Together</Text>
            <Text style={styles.investBtnArrow}>→</Text>
          </TouchableOpacity>

          {g0.last_activity && (
            <View style={styles.activityRow}>
              <View style={styles.activityDot} />
              <Text style={styles.activityText}>{g0.last_activity}</Text>
            </View>
          )}
        </View>

        {/* ── Venture club card ── */}
        <View style={styles.ventureCard}>
          <View style={styles.ventureTopRow}>
            <View style={styles.ventureLeft}>
              <Text style={styles.ventureTag}>{g1.description_tag ?? 'VENTURE CLUB'}</Text>
              <Text style={styles.ventureName}>{g1.name}</Text>
              <Text style={styles.ventureDesc}>{g1.description}</Text>
            </View>
            <View style={styles.ventureRight}>
              <View style={[styles.riskTag, { backgroundColor: Colors.red + '20' }]}>
                <View style={[styles.riskDot, { backgroundColor: Colors.red }]} />
                <Text style={[styles.riskText, { color: Colors.red }]}>High Risk</Text>
              </View>
              {g1.returns_ytd && <Text style={styles.ventureReturns}>{g1.returns_ytd}</Text>}
            </View>
          </View>

          <View style={styles.ventureStats}>
            {[
              { label: 'ACTIVE BETS', value: '08' },
              { label: 'POOL TVL', value: formatMoney(g1.total_contributed, g1.currency) },
              { label: 'MEMBERS', value: String(g1.extra_count + g1.member_initials.length) },
            ].map(s => (
              <View key={s.label} style={styles.ventureStat}>
                <Text style={styles.ventureStatLabel}>{s.label}</Text>
                <Text style={styles.ventureStatValue}>{s.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.trendingBanner}>
            <Text style={styles.trendingIcon}>▲</Text>
            <Text style={styles.trendingText}>Trending: Neo-Bank seed round closing in 4h</Text>
          </View>

          <View style={styles.ventureActions}>
            <TouchableOpacity style={styles.ventureSecBtn} onPress={() => openContribute(g1.id)}>
              <Text style={styles.ventureSecBtnText}>+ Add Capital</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.venturePriBtn}>
              <Text style={styles.venturePriBtnText}>View Deals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats tiles ── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statTile, { backgroundColor: Colors.lime }]}>
            <Text style={styles.statTileLabel}>YOUR NETWORK VALUE</Text>
            <Text style={styles.statTileVal}>$2.4k</Text>
            <Text style={styles.statTileSub}>across 2 clubs</Text>
          </View>
          <View style={[styles.statTile, { backgroundColor: '#E8DCFF' }]}>
            <Text style={styles.statTileLabel}>OPEN INVITATIONS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={[styles.statTileVal, { color: Colors.purple }]}>03</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.purple }} />
            </View>
          </View>
          <View style={[styles.statTile, { backgroundColor: Colors.bgCard, width: '100%', flex: 0, borderWidth: 1, borderColor: Colors.border, minHeight: 72, justifyContent: 'center' }]}>
            <Text style={styles.statTileLabel}>NEW PERK AVAILABLE</Text>
            <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 }}>Zero-fee investing this week</Text>
          </View>
        </View>
      </ScrollView>

      {/* Contribute modal */}
      <Modal visible={!!contributeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Invest in Club</Text>
            <Text style={styles.modalFundName}>{contributingGroup?.name}</Text>

            <Text style={styles.modalSectionLabel}>QUICK SELECT</Text>
            <View style={styles.quickAmtRow}>
              {QUICK_INVEST_AMOUNTS.map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickAmtPill, selectedQuick === amt && styles.quickAmtPillActive]}
                  onPress={() => { setSelectedQuick(amt); setContributeAmount(''); }}
                >
                  <Text style={[styles.quickAmtText, selectedQuick === amt && styles.quickAmtTextActive]}>
                    ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSectionLabel}>OR ENTER AMOUNT</Text>
            <View style={styles.amtInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amtInput}
                placeholder="0"
                value={contributeAmount}
                onChangeText={v => { setContributeAmount(v); setSelectedQuick(null); }}
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.disclaimerRow}>
              <Text style={styles.disclaimerBadge}>i</Text>
              <Text style={styles.disclaimerText}>Investments are subject to market risks. Past returns do not guarantee future performance.</Text>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setContributeModal(null); setSelectedQuick(null); setContributeAmount(''); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => contributeModal && handleContribute(contributeModal)}>
                <Text style={styles.confirmBtnText}>Confirm Investment</Text>
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
  scroll: { paddingBottom: 32 },
  pageHeader: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.lg },
  pageTitle: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  pageSub: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1, marginTop: 2 },
  createClubBtn: { backgroundColor: Colors.purple, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  createClubText: { fontSize: Typography.sm, color: Colors.textWhite, fontWeight: Typography.semibold },

  primaryCard: { marginHorizontal: Spacing.base, backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1.5, borderColor: Colors.purple, marginBottom: Spacing.base, ...Shadow.md },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  fundTag: { backgroundColor: Colors.purple + '18', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  fundTagText: { fontSize: Typography.xs, color: Colors.purple, fontWeight: Typography.bold, letterSpacing: 0.5 },
  riskTag: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, gap: 4 },
  riskDot: { width: 6, height: 6, borderRadius: 3 },
  riskText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  memberStack: { flexDirection: 'row', alignItems: 'center' },
  memberBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.bgCard },
  memberBadgeText: { fontSize: 8, color: Colors.textWhite, fontWeight: Typography.bold },
  memberBadgeExtra: { backgroundColor: Colors.textSecondary },
  memberBadgeExtraText: { fontSize: 8, color: Colors.textWhite, fontWeight: Typography.bold },
  fundNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  fundTypeChip: { backgroundColor: Colors.purple + '18', borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  fundTypeChipText: { fontSize: 10, color: Colors.purple, fontWeight: Typography.bold, letterSpacing: 0.5 },
  fundName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, flex: 1 },
  fundDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 18 },
  returnsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.green + '14', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: Spacing.md },
  returnsLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  returnsValue: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.green },
  poolStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  poolStat: { flex: 1 },
  poolStatLabel: { fontSize: Typography.xs, color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  poolStatValue: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },
  progressWrap: { marginBottom: Spacing.base },
  progressLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 6, textAlign: 'right' },
  investBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.purple, borderRadius: Radius.full, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  investBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textWhite, letterSpacing: 0.5 },
  investBtnArrow: { fontSize: Typography.lg, color: Colors.lime },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  activityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  activityText: { fontSize: Typography.sm, color: Colors.textSecondary },

  ventureCard: { marginHorizontal: Spacing.base, backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.base, ...Shadow.sm },
  ventureTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.base },
  ventureLeft: { flex: 1, marginRight: Spacing.md },
  ventureRight: { alignItems: 'flex-end', gap: Spacing.sm },
  ventureTag: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1, marginBottom: 4, fontWeight: Typography.semibold },
  ventureName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  ventureDesc: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },
  ventureReturns: { fontSize: Typography.xl, fontWeight: Typography.extrabold, color: Colors.green },
  ventureStats: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  ventureStat: { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md },
  ventureStatLabel: { fontSize: Typography.xs, color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  ventureStatValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  trendingBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.orange + '12', borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.md, gap: Spacing.sm },
  trendingIcon: { fontSize: 10, color: Colors.orange },
  trendingText: { flex: 1, fontSize: Typography.sm, color: Colors.orange, fontWeight: Typography.medium },
  ventureActions: { flexDirection: 'row', gap: Spacing.sm },
  ventureSecBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  ventureSecBtnText: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.semibold },
  venturePriBtn: { flex: 1, backgroundColor: Colors.textPrimary, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  venturePriBtnText: { fontSize: Typography.sm, color: Colors.textWhite, fontWeight: Typography.bold, letterSpacing: 0.5 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.base },
  statTile: { flex: 1, minWidth: '45%', borderRadius: Radius.xl, padding: Spacing.lg, minHeight: 110, justifyContent: 'flex-end' },
  statTileLabel: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 0.5, fontWeight: Typography.semibold, marginBottom: 4 },
  statTileVal: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  statTileSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl, paddingBottom: 44 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  modalFundName: { fontSize: Typography.base, color: Colors.purple, fontWeight: Typography.semibold, marginBottom: Spacing.lg },
  modalSectionLabel: { fontSize: Typography.xs, color: Colors.textMuted, letterSpacing: 1, fontWeight: Typography.semibold, marginBottom: Spacing.sm },
  quickAmtRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  quickAmtPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
  quickAmtPillActive: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  quickAmtText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semibold },
  quickAmtTextActive: { color: Colors.textWhite },
  amtInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  currencySymbol: { fontSize: Typography.xl, color: Colors.textSecondary, marginRight: Spacing.xs },
  amtInput: { flex: 1, fontSize: Typography.xl, color: Colors.textPrimary, fontWeight: Typography.bold, paddingVertical: Spacing.md },
  disclaimerRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.orange + '12', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.sm },
  disclaimerBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.orange, color: Colors.textWhite, fontSize: 10, fontWeight: Typography.bold, textAlign: 'center', lineHeight: 16, overflow: 'hidden' },
  disclaimerText: { flex: 1, fontSize: Typography.xs, color: Colors.orange, lineHeight: 16 },
  modalBtns: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.bg, alignItems: 'center' },
  cancelBtnText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.semibold },
  confirmBtn: { flex: 2, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.purple, alignItems: 'center' },
  confirmBtnText: { fontSize: Typography.base, color: Colors.textWhite, fontWeight: Typography.bold },
});
