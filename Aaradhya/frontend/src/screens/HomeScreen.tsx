// src/screens/HomeScreen.tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import {
  BodhiHeader,
  BottomNav,
  GradientCard,
  ProgressBar,
  SectionHeader,
} from '../components/shared';
import type { NavTab } from '../components/shared';

interface Props {
  onNavigate: (tab: NavTab) => void;
  activeTab: NavTab;
  onInsurancePress: () => void;
  onSocialPress: () => void;
  onTripPress: () => void;
  onPayPress: () => void;
}

const INSIGHTS = [
  { label: 'SAVINGS', title: 'You saved\n₹2,300', color: Colors.lime, textColor: Colors.textPrimary, border: false },
  { label: 'ALERT',   title: 'Unused\nSub',     color: '#FF5C87',   textColor: Colors.textWhite,   border: false },
  { label: 'MARKET',  title: 'Market\nHigh',    color: Colors.purple, textColor: Colors.textWhite,  border: true  },
  { label: 'GOAL',    title: 'Budget\nSet',     color: Colors.border, textColor: Colors.textSecondary, border: false },
];

// Text-based icons — no emojis
const QUICK_ACTIONS: { icon: string; label: string; sub: string; color: string; key: string }[] = [
  { icon: '↑',  label: 'Pay',    sub: 'FAST CHECKOUT',  color: Colors.lime,    key: 'pay'    },
  { icon: '↗',  label: 'Invest', sub: 'YIELD POOLS',    color: '#E8E0FF',       key: 'invest' },
  { icon: '÷',  label: 'Split',  sub: 'GROUP BILLS',    color: '#FFD6E8',       key: 'split'  },
  { icon: '◎',  label: 'Voice',  sub: 'AI COMMAND',     color: Colors.lime,    key: 'voice'  },
];

const ACTIVITY = [
  { key: 'netflix', initial: 'N', label: 'Netflix Subscription', sub: 'Recurring payment', amount: '-₹799',   amountColor: Colors.red,   time: 'TODAY',     accentColor: null,       bgColor: '#1A1A1A' },
  { key: 'stake',   initial: 'S', label: 'Stake Reward',          sub: 'Solana Pool 04',   amount: '+₹1,240',  amountColor: Colors.green, time: 'YESTERDAY', accentColor: Colors.lime, bgColor: Colors.bg },
];

export const HomeScreen: React.FC<Props> = ({
  onNavigate, activeTab, onInsurancePress, onSocialPress, onTripPress, onPayPress,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const handleActionPress = (key: string) => {
    if (key === 'pay')   { onPayPress();   return; }
    if (key === 'split') { onTripPress();  return; }
    if (key === 'invest') { onSocialPress(); return; }
  };

  return (
    <View style={styles.container}>
      <BodhiHeader onInsurancePress={onInsurancePress} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Greeting ── */}
        <View style={styles.greeting}>
          <Text style={styles.greetingName}>Hello, James</Text>
          <Text style={styles.greetingSub}>YOUR DAILY FINANCIAL PULSE</Text>
        </View>

        {/* ── Vault balance card ── */}
        <GradientCard style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TOTAL VAULT BALANCE</Text>
          <View style={styles.balanceAmountRow}>
            <Text style={styles.balanceAmount}>₹4,82,930</Text>
            <Text style={styles.balanceCents}>.45</Text>
            <View style={styles.balanceVaultIcon}>
              <Text style={styles.balanceVaultIconText}>▣</Text>
            </View>
          </View>
          <View style={styles.balanceFooter}>
            <View style={styles.cryptoPills}>
              {['BTC', 'ETH', 'USDT'].map((c, i) => (
                <View key={c} style={[styles.cryptoPill, { marginLeft: i > 0 ? -6 : 0 }]}>
                  <Text style={styles.cryptoPillText}>{c}</Text>
                </View>
              ))}
            </View>
            <View style={styles.changeBlock}>
              <Text style={styles.changeLabel}>24H CHANGE</Text>
              <Text style={styles.changeValue}>+8.4%</Text>
            </View>
          </View>
        </GradientCard>

        {/* ── AI Insights ── */}
        <View style={styles.insightsSection}>
          <SectionHeader title="AI Insights" action="VIEW ALL" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.insightsScroll}
          >
            {INSIGHTS.map(ins => (
              <TouchableOpacity key={ins.label} style={styles.insightItem}>
                <View style={[
                  styles.insightCircle,
                  { backgroundColor: ins.color },
                  ins.border && styles.insightCircleBorder,
                ]}>
                  <Text style={[styles.insightText, { color: ins.textColor }]}>{ins.title}</Text>
                </View>
                <Text style={styles.insightLabel}>{ins.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Quick actions ── */}
        <View style={styles.actionsSection}>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity
                key={a.key}
                style={styles.actionCard}
                onPress={() => handleActionPress(a.key)}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIconBox, { backgroundColor: a.color }]}>
                  <Text style={styles.actionIconText}>{a.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
                <Text style={styles.actionSub}>{a.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Recent activity ── */}
        <View style={styles.activitySection}>
          <SectionHeader title="Recent Activity" />
          {ACTIVITY.map(a => (
            <View key={a.key} style={styles.activityItem}>
              {a.accentColor && <View style={[styles.activityAccent, { backgroundColor: a.accentColor }]} />}
              <View style={[styles.activityAvatar, { backgroundColor: a.bgColor }]}>
                <Text style={styles.activityInitial}>{a.initial}</Text>
              </View>
              <View style={styles.activityBody}>
                <Text style={styles.activityLabel}>{a.label}</Text>
                <Text style={styles.activitySub}>{a.sub}</Text>
              </View>
              <View style={styles.activityRight}>
                <Text style={[styles.activityAmount, { color: a.amountColor }]}>{a.amount}</Text>
                <Text style={styles.activityTime}>{a.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav active={activeTab} onPress={onNavigate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 24 },

  // ── Greeting
  greeting: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  greetingName: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  greetingSub: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1, marginTop: 2 },

  // ── Balance card
  balanceCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.xl },
  balanceLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, marginBottom: Spacing.xs },
  balanceAmountRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.lg },
  balanceAmount: { fontSize: Typography['4xl'], fontWeight: Typography.extrabold, color: Colors.textWhite, lineHeight: 56 },
  balanceCents: { fontSize: Typography.xl, fontWeight: Typography.bold, color: 'rgba(255,255,255,0.7)', marginBottom: 8, marginLeft: 2 },
  balanceVaultIcon: {
    marginLeft: 'auto',
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  balanceVaultIconText: { color: Colors.textWhite, fontSize: 16 },
  balanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cryptoPills: { flexDirection: 'row' },
  cryptoPill: {
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  cryptoPillText: { fontSize: Typography.xs, color: Colors.textWhite, fontWeight: Typography.semibold },
  changeBlock: { alignItems: 'flex-end' },
  changeLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  changeValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.lime },

  // ── AI Insights
  insightsSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },
  insightsScroll: { paddingRight: Spacing.base },
  insightItem: { alignItems: 'center', width: 80, marginRight: Spacing.sm },
  insightCircle: {
    width: 72, height: 72, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  insightCircleBorder: { borderWidth: 2, borderColor: Colors.purple },
  insightText: { fontSize: Typography.xs, fontWeight: Typography.bold, textAlign: 'center', lineHeight: 14 },
  insightLabel: { fontSize: 9, fontWeight: Typography.semibold, color: Colors.textSecondary, letterSpacing: 0.5 },

  // ── Quick actions
  actionsSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionCard: {
    width: '48.2%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  actionIconBox: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  actionIconText: { fontSize: 22, fontWeight: Typography.bold, color: Colors.textPrimary },
  actionLabel: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  actionSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2, letterSpacing: 0.5 },

  // ── Recent activity
  activitySection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },
  activityItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    overflow: 'hidden', ...Shadow.sm,
  },
  activityAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  activityAvatar: {
    width: 44, height: 44, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  activityInitial: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textWhite },
  activityBody: { flex: 1 },
  activityLabel: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  activitySub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  activityRight: { alignItems: 'flex-end' },
  activityAmount: { fontSize: Typography.base, fontWeight: Typography.bold },
  activityTime: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2, letterSpacing: 0.5 },
});
