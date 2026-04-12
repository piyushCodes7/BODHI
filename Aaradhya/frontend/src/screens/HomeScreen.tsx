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
  { label: 'SAVINGS', title: 'You saved\n₹2,300', color: Colors.lime, textColor: Colors.textPrimary },
  { label: 'ALERT', title: 'Unused\nSub', color: '#FF5C87', textColor: Colors.textWhite },
  { label: 'MARKET', title: 'Market\nHigh', color: Colors.purple, textColor: Colors.textWhite, border: true },
  { label: 'GOAL', title: 'Budget\nSet', color: Colors.border, textColor: Colors.textSecondary },
];

const QUICK_ACTIONS = [
  { icon: '📤', label: 'Pay', sub: 'FAST CHECKOUT', color: Colors.lime, onPress: () => {} },
  { icon: '📈', label: 'Invest', sub: 'YIELD POOLS', color: '#E8E0FF', onPress: () => {} },
  { icon: '💸', label: 'Split', sub: 'GROUP BILLS', color: '#FFD6E8', onPress: () => {} },
  { icon: '🎤', label: 'Voice', sub: 'AI COMMAND', color: Colors.lime, onPress: () => {} },
];

const ACTIVITY = [
  { icon: '🔴', label: 'Netflix Subscription', sub: 'Recurring payment', amount: '-₹799', amountColor: Colors.red, time: 'TODAY' },
  { icon: '🟢', label: 'Stake Reward', sub: 'Solana Pool 04', amount: '+₹1,240', amountColor: Colors.green, time: 'YESTERDAY', accent: Colors.lime },
];

export const HomeScreen: React.FC<Props> = ({
  onNavigate, activeTab, onInsurancePress, onSocialPress, onTripPress, onPayPress,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  return (
    <View style={styles.container}>
      <BodhiHeader onInsurancePress={onInsurancePress} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingName}>Hello, James</Text>
          <Text style={styles.greetingSub}>YOUR DAILY FINANCIAL PULSE</Text>
        </View>

        {/* Vault balance card */}
        <GradientCard style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TOTAL VAULT BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>₹4,82,930</Text>
            <Text style={styles.balanceCents}>.45</Text>
            <View style={styles.balanceIcon}><Text style={{ color: Colors.textWhite, fontSize: 16 }}>▣</Text></View>
          </View>
          <View style={styles.balanceFooter}>
            <View style={styles.cryptoPills}>
              {['BTC', 'ETH', 'USDT'].map((c, i) => (
                <View key={c} style={[styles.cryptoPill, { marginLeft: i > 0 ? -8 : 0 }]}>
                  <Text style={styles.cryptoPillText}>{c}</Text>
                </View>
              ))}
            </View>
            <View>
              <Text style={styles.changeLabel}>24H CHANGE</Text>
              <Text style={styles.changeValue}>+8.4%</Text>
            </View>
          </View>
        </GradientCard>

        {/* AI Insights */}
        <View style={styles.section}>
          <SectionHeader title="AI Insights" action="VIEW ALL" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.insightsRow}>
            {INSIGHTS.map((ins) => (
              <TouchableOpacity key={ins.label} style={styles.insightItemWrap}>
                <View style={[
                  styles.insightCircle,
                  { backgroundColor: ins.color },
                  ins.border && { borderWidth: 2, borderColor: Colors.purple },
                ]}>
                  <Text style={[styles.insightText, { color: ins.textColor }]}>{ins.title}</Text>
                </View>
                <Text style={styles.insightLabel}>{ins.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionCard}
              onPress={a.label === 'Split' ? onTripPress : a.label === 'Pay' ? onPayPress : a.onPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color }]}>
                <Text style={{ fontSize: 22 }}>{a.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <SectionHeader title="Recent Activity" />
          {ACTIVITY.map((a) => (
            <View key={a.label} style={styles.activityItem}>
              {a.accent && <View style={[styles.activityAccent, { backgroundColor: a.accent }]} />}
              <View style={[styles.activityAvatar, { backgroundColor: a.icon === '🔴' ? '#1A1A1A' : Colors.bg }]}>
                <Text style={{ fontSize: 20 }}>{a.icon}</Text>
              </View>
              <View style={styles.activityContent}>
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

  greeting: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  greetingName: { fontSize: Typography['2xl'], fontWeight: Typography.extrabold, color: Colors.textPrimary },
  greetingSub: { fontSize: Typography.xs, color: Colors.textSecondary, letterSpacing: 1, marginTop: 2 },

  balanceCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.xl },
  balanceLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.75)', letterSpacing: 1, marginBottom: Spacing.xs },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.lg },
  balanceAmount: { fontSize: Typography['4xl'], fontWeight: Typography.extrabold, color: Colors.textWhite },
  balanceCents: { fontSize: Typography.xl, fontWeight: Typography.bold, color: 'rgba(255,255,255,0.75)', marginBottom: 6, marginLeft: 2 },
  balanceIcon: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cryptoPills: { flexDirection: 'row' },
  cryptoPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cryptoPillText: { fontSize: Typography.xs, color: Colors.textWhite, fontWeight: Typography.semibold },
  changeLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  changeValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.lime },

  section: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },
  insightsRow: { marginHorizontal: -Spacing.base },
  insightItemWrap: { alignItems: 'center', marginLeft: Spacing.base, width: 80 },
  insightCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  insightText: { fontSize: Typography.xs, fontWeight: Typography.bold, textAlign: 'center' },
  insightLabel: { fontSize: 9, fontWeight: Typography.semibold, color: Colors.textSecondary, letterSpacing: 0.5 },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  actionSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2, letterSpacing: 0.5 },

  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  activityAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  activityAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityContent: { flex: 1 },
  activityLabel: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  activitySub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  activityRight: { alignItems: 'flex-end' },
  activityAmount: { fontSize: Typography.base, fontWeight: Typography.bold },
  activityTime: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2, letterSpacing: 0.5 },
});
