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
import { GroupAPI, type GroupWallet, type GroupMember } from '../services/api';

const FALLBACK_USER_ID = 'user-james';
const FALLBACK_GROUP_ID = 'goa-fund';

interface Props {
  onNavigate: (tab: NavTab) => void;
  activeTab: NavTab;
  onInsurancePress: () => void;
  currentUserId?: string;
  demoGroupId?: string;
}

type SocialGroup = GroupWallet & { member_avatars: string[]; extra_count: number; last_message?: string };

const buildMockGroups = (userId: string, groupId: string): SocialGroup[] => [
  {
    id: groupId, name: 'Goa Trip Fund 🌴', description: null, currency: 'USD',
    status: 'OPEN', target_amount: 2000000, total_contributed: 1425000,
    created_by: userId, created_at: new Date().toISOString(),
    member_avatars: ['👩', '🧔', '👩‍🦰'], extra_count: 12,
    last_message: 'Alex: "Just added $500! Let\'s book the villa by Friday guys! 🛫"',
  },
  {
    id: 'startup-bets', name: 'Startup Bets 🚀', description: 'VENTURE CLUB', currency: 'USD',
    status: 'OPEN', target_amount: 0, total_contributed: 12840000,
    created_by: userId, created_at: new Date().toISOString(),
    member_avatars: ['🧔', '👩‍💼'], extra_count: 42,
  },
];

const formatMoney = (paise: number, currency = 'USD') => {
  const sym = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : '¥';
  const val = paise / 100;
  if (val >= 1000) return `${sym}${(val / 1000).toFixed(1)}k`;
  return `${sym}${val.toLocaleString()}`;
};

export const SocialScreen: React.FC<Props> = ({ onNavigate, activeTab, onInsurancePress, currentUserId, demoGroupId }) => {
  const activeUserId = currentUserId || FALLBACK_USER_ID;
  const activeGroupId = demoGroupId || FALLBACK_GROUP_ID;
  const [groups, setGroups] = useState<SocialGroup[]>(() => buildMockGroups(activeUserId, activeGroupId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [contributeModal, setContributeModal] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  useEffect(() => {
    setGroups(buildMockGroups(activeUserId, activeGroupId));
  }, [activeUserId, activeGroupId]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const liveGroup = await GroupAPI.get(activeGroupId);
      setGroups(prev => prev.map((g, i) => (i === 0
        ? {
          ...g,
          ...liveGroup,
          member_avatars: g.member_avatars,
          extra_count: g.extra_count,
          last_message: g.last_message,
        }
        : g)));
    } catch (e: any) {
      setError('Live group sync unavailable. Showing local demo data.');
    }
  }, [activeGroupId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleContribute = async (groupId: string) => {
    if (!contributeAmount) return;
    try {
      setLoading(true);
      await GroupAPI.contribute(groupId, activeUserId, Math.round(parseFloat(contributeAmount) * 100));
      await load();
      Alert.alert('Success', 'Contribution added!');
      setContributeModal(null);
      setContributeAmount('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const activeGroup = groups[0];
  const ventureGroup = groups[1];

  if (!activeGroup || !ventureGroup) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BodhiHeader
        onInsurancePress={onInsurancePress}
        rightExtra={<TouchableOpacity><Text style={{ fontSize: 22 }}>🔍</Text></TouchableOpacity>}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Social Clubs</Text>
          <Text style={styles.pageSub}>INVESTING IS BETTER WITH FRIENDS</Text>
        </View>

        <ErrorBanner message={error} />

        {/* Active fund card */}
        <View style={styles.activeFundCard}>
          {/* Header */}
          <View style={styles.fundCardHeader}>
            <View>
              <Text style={styles.activeFundLabel}>ACTIVE FUND</Text>
              <Text style={styles.fundName}>{activeGroup.name}</Text>
            </View>
            <View style={styles.avatarStack}>
              {activeGroup.member_avatars.map((a, i) => (
                <View key={i} style={[styles.stackAvatar, { marginLeft: i > 0 ? -10 : 0, zIndex: 10 - i }]}>
                  <Text style={{ fontSize: 18 }}>{a}</Text>
                </View>
              ))}
              <View style={[styles.stackAvatar, styles.extraCountBadge, { marginLeft: -10 }]}>
                <Text style={styles.extraCountText}>+{activeGroup.extra_count}</Text>
              </View>
            </View>
          </View>

          {/* Pool amount */}
          <Text style={styles.poolLabel}>POOLED AMOUNT</Text>
          <View style={styles.poolAmountRow}>
            <Text style={styles.poolAmount}>${(activeGroup.total_contributed / 100).toLocaleString('en', { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.poolPercent}>72% of $20k</Text>
          </View>
          <ProgressBar progress={0.72} color={Colors.purple} height={8} />

          {/* CTA */}
          <TouchableOpacity
            style={styles.swipeBtn}
            onPress={() => setContributeModal(activeGroup.id)}
          >
            <View style={styles.swipeArrow}><Text style={{ fontSize: 18, color: Colors.textPrimary }}>»</Text></View>
            <Text style={styles.swipeBtnText}>SWIPE TO INVEST TOGETHER</Text>
          </TouchableOpacity>

          {/* Last message */}
          {activeGroup.last_message && (
            <View style={styles.messageRow}>
              <View style={styles.messageDot} />
              <Text style={styles.messageText}>{activeGroup.last_message}</Text>
            </View>
          )}
        </View>

        {/* Venture club card */}
        <View style={styles.ventureCard}>
          <View style={styles.ventureHeader}>
            <View>
              <Text style={styles.ventureLabel}>VENTURE CLUB</Text>
              <Text style={styles.ventureName}>{ventureGroup.name}</Text>
            </View>
            <View style={styles.avatarStack}>
              {ventureGroup.member_avatars.map((a, i) => (
                <View key={i} style={[styles.stackAvatar, { marginLeft: i > 0 ? -10 : 0 }]}>
                  <Text style={{ fontSize: 18 }}>{a}</Text>
                </View>
              ))}
              <View style={[styles.stackAvatar, styles.extraCountBadge, { marginLeft: -10 }]}>
                <Text style={styles.extraCountText}>+{ventureGroup.extra_count}</Text>
              </View>
            </View>
          </View>

          <View style={styles.ventureStats}>
            <View style={styles.ventureStat}>
              <Text style={styles.ventureStatLabel}>ACTIVE BETS</Text>
              <Text style={styles.ventureStatValue}>08</Text>
            </View>
            <View style={styles.ventureStat}>
              <Text style={styles.ventureStatLabel}>POOL TVL</Text>
              <Text style={styles.ventureStatValue}>{formatMoney(ventureGroup.total_contributed)}</Text>
            </View>
          </View>

          <View style={styles.trendingRow}>
            <View style={styles.trendingIcon}><Text style={{ fontSize: 14 }}>⚡</Text></View>
            <Text style={styles.trendingText}>Trending: Neo-Bank seed round closing in 4h.</Text>
          </View>

          <TouchableOpacity style={styles.viewOppsBtn} onPress={() => setContributeModal(ventureGroup.id)}>
            <Text style={styles.viewOppsBtnText}>VIEW OPPORTUNITIES</Text>
          </TouchableOpacity>
        </View>

        {/* Mini stat tiles */}
        <View style={styles.miniTiles}>
          <View style={[styles.miniTile, styles.miniTileLime]}>
            <Text style={styles.miniTileIcon}>👥</Text>
            <Text style={styles.miniTileSub}>YOUR SOCIAL.NET</Text>
            <Text style={styles.miniTileAmount}>$2.4k</Text>
          </View>
          <View style={[styles.miniTile, styles.miniTileViolet]}>
            <Text style={styles.miniTileSub}>OPEN INVITATIONS</Text>
            <View style={styles.miniTileCountRow}>
              <Text style={styles.miniTileCount}>03</Text>
              <View style={styles.miniTileCountDot} />
            </View>
          </View>
          <View style={[styles.miniTile, styles.miniTileGray]}>
            <Text style={styles.miniTileSub}>NEW PERK</Text>
            <Text style={{ fontSize: 24, marginTop: 8 }}>🎁</Text>
          </View>
        </View>
      </ScrollView>

      {/* Contribute modal */}
      <Modal visible={!!contributeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Contribution</Text>
            <Text style={styles.modalSub}>
              {groups.find(g => g.id === contributeModal)?.name}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Amount (USD)"
              value={contributeAmount}
              onChangeText={setContributeAmount}
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setContributeModal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => contributeModal && handleContribute(contributeModal)}
              >
                <Text style={styles.confirmBtnText}>Contribute</Text>
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
  pageHeader: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.lg },
  pageTitle: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  pageSub: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1 },

  // Active fund
  activeFundCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.purple,
    marginBottom: Spacing.base,
    ...Shadow.md,
  },
  fundCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  activeFundLabel: { fontSize: Typography.xs, color: Colors.purple, fontWeight: Typography.semibold, letterSpacing: 1, marginBottom: 4 },
  fundName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  poolLabel: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1, marginBottom: 4 },
  poolAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.sm },
  poolAmount: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  poolPercent: { fontSize: Typography.base, color: Colors.purple, fontWeight: Typography.semibold },
  swipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: Radius.full,
    padding: Spacing.sm,
    marginTop: Spacing.base,
    marginBottom: Spacing.md,
  },
  swipeArrow: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.lime, alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
  },
  swipeBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary, letterSpacing: 1 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  messageDot: { width: 8, height: 8, borderRadius: Radius.full, backgroundColor: Colors.purple, marginTop: 5 },
  messageText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary, fontStyle: 'italic' },

  // Avatar stack
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  stackAvatar: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bgCard,
  },
  extraCountBadge: { backgroundColor: Colors.purple },
  extraCountText: { fontSize: 9, color: Colors.textWhite, fontWeight: Typography.bold },

  // Venture
  ventureCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadow.sm,
  },
  ventureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
  ventureLabel: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1, marginBottom: 4 },
  ventureName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  ventureStats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  ventureStat: {
    flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md,
  },
  ventureStatLabel: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  ventureStatValue: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  trendingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.base },
  trendingIcon: {
    width: 28, height: 28, borderRadius: Radius.full,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  trendingText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary },
  viewOppsBtn: {
    backgroundColor: Colors.textPrimary, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center',
  },
  viewOppsBtnText: { fontSize: Typography.sm, color: Colors.textWhite, fontWeight: Typography.bold, letterSpacing: 1 },

  // Mini tiles
  miniTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  miniTile: {
    flex: 1, minWidth: '45%', borderRadius: Radius.xl,
    padding: Spacing.lg, minHeight: 120, justifyContent: 'flex-end',
  },
  miniTileLime: { backgroundColor: Colors.lime },
  miniTileViolet: { backgroundColor: '#E8DCFF' },
  miniTileGray: { backgroundColor: Colors.border, flex: 0, width: '100%' },
  miniTileIcon: { fontSize: 24, marginBottom: Spacing.xs },
  miniTileSub: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 0.5, fontWeight: Typography.semibold },
  miniTileAmount: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary, marginTop: 4 },
  miniTileCountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  miniTileCount: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  miniTileCountDot: { width: 10, height: 10, borderRadius: Radius.full, backgroundColor: Colors.purple },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
    padding: Spacing.xl, paddingBottom: 40,
  },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: Spacing.lg },
  input: {
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    fontSize: Typography.base, color: Colors.textPrimary,
  },
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
