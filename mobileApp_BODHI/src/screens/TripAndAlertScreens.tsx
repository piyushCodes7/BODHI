// ─────────────────────────────────────────────────────────────
//  GroupTripWalletScreen.tsx — Trip Contri Wallet
//  Light mode | Matches grp_trip_wallet.html
// ─────────────────────────────────────────────────────────────

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';
import { BodhiHeader } from '../components/BodhiHeader';

const { width: W } = Dimensions.get('window');

const CONTRIBUTORS = [
  { name: 'Me',    amount: '¥28,000', emoji: '🧑' },
  { name: 'Hana',  amount: '¥28,000', emoji: '👩' },
  { name: 'Kenji', amount: '¥28,000', emoji: '🧔' },
  { name: 'Invite',amount: '',        emoji: '+', isAdd: true },
];

const DEDUCTIONS = [
  { name: 'Ritz-Carlton Kyoto', cat: 'ACCOMMODATION', time: '2h ago',   amount: '-¥42,000', dot: Colors.neonLime },
  { name: 'Shinkansen Nozomi', cat: 'TRANSPORT',      time: '5h ago',   amount: '-¥14,500', dot: Colors.electricViolet },
  { name: 'Gion Dinner Split', cat: 'DINING',         time: 'Yesterday', amount: '-¥8,200', dot: Colors.magenta },
];

export function GroupTripWalletScreen() {
  return (
    <View style={styles.root}>
      <BodhiHeader showMore />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero ─────────────────────────────────────────── */}
        <View style={styles.tripMeta}>
          <View>
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>ACTIVE TRIP MODE</Text>
            </View>
            <Text style={styles.tripName}>Kyoto Retreat</Text>
          </View>
          <Text style={styles.closing}>Wallet closes in 2 days</Text>
        </View>

        {/* ── Balance card ─────────────────────────────────── */}
        <LinearGradient
          colors={[Colors.electricViolet, Colors.magenta, Colors.hotPink]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.balCard}
        >
          <View style={styles.balCardInner}>
            <View style={styles.balTop}>
              <Text style={styles.balLabel}>SHARED BALANCE</Text>
              <Text style={{ fontSize: 20, color: '#fff' }}>💳</Text>
            </View>
            <View style={styles.balAmtRow}>
              <Text style={styles.balAmt}>¥84,200</Text>
              <Text style={styles.balCurrency}> JPY</Text>
            </View>
            <View style={styles.balProgress}>
              <View style={styles.balProgressBg}>
                <LinearGradient
                  colors={[Colors.neonLime, Colors.neonLimeDim]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.balProgressFill, { width: '68%' }]}
                />
              </View>
              <Text style={styles.balPct}>68% Budget Used</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Contributors ─────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contributors</Text>
          <Text style={styles.splitLabel}>SPLIT: EQUAL</Text>
        </View>
        <View style={styles.contriGrid}>
          {CONTRIBUTORS.map((c, i) => (
            c.isAdd
              ? (
                <TouchableOpacity key={i} style={[styles.contriCard, styles.contriAddCard]} activeOpacity={0.8}>
                  <View style={styles.addCircle}>
                    <Text style={{ fontSize: 22, color: Colors.textSecondary }}>+</Text>
                  </View>
                  <Text style={styles.contriAddLabel}>INVITE</Text>
                </TouchableOpacity>
              ) : (
                <View key={i} style={styles.contriCard}>
                  <View style={styles.contriAvatar}>
                    <Text style={{ fontSize: 28 }}>{c.emoji}</Text>
                  </View>
                  <Text style={styles.contriName}>{c.name}</Text>
                  <Text style={styles.contriAmt}>{c.amount}</Text>
                </View>
              )
          ))}
        </View>

        {/* ── Auto-Deductions ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>Auto-Deductions</Text>
        <View style={styles.timeline}>
          {/* Vertical line */}
          <View style={styles.timelineLine} />
          {DEDUCTIONS.map((d, i) => (
            <View key={i} style={styles.timelineRow}>
              {/* Dot */}
              <View style={[styles.timelineDot, { backgroundColor: d.dot,
                shadowColor: d.dot, shadowOpacity: d.dot === Colors.neonLime ? 0.8 : 0 }]}
              />
              {/* Card */}
              <View style={styles.timelineCard}>
                <View style={styles.timelineCardRow}>
                  <Text style={styles.timelineCardName}>{d.name}</Text>
                  <Text style={styles.timelineCardAmt}>{d.amount}</Text>
                </View>
                <View style={styles.timelineCardMeta}>
                  <Text style={styles.timelineCardCat}>{d.cat}</Text>
                  <Text style={styles.timelineCardTime}> • {d.time}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Text style={{ fontSize: 22 }}>🛒</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  ImmuneSystemAlertScreen.tsx — Overspend warning
//  Dark mode | Matches immune_system_alert.html
// ─────────────────────────────────────────────────────────────

export function ImmuneSystemAlertScreen({ navigation }: any) {
  return (
    <View style={aStyles.root}>
      {/* Ambient glows */}
      <View style={aStyles.glowGreen} />
      <View style={aStyles.glowViolet} />

      {/* Header */}
      <View style={aStyles.header}>
        <Text style={aStyles.wordmark}>BODHI</Text>
        <View style={aStyles.avatarRing}>
          <Text style={{ fontSize: 20 }}>👤</Text>
        </View>
      </View>

      {/* AI status */}
      <View style={aStyles.statusWrap}>
        <View style={aStyles.statusCircle}>
          <Text style={{ fontSize: 32 }}>🛡</Text>
          <View style={aStyles.boltBadge}>
            <Text style={{ fontSize: 10, color: Colors.neonLimeDark }}>⚡</Text>
          </View>
        </View>
        <Text style={aStyles.statusLabel}>IMMUNE SYSTEM ACTIVE</Text>
      </View>

      {/* Alert card */}
      <View style={aStyles.alertCard}>
        <View style={aStyles.alertCardAccent} />
        <Text style={aStyles.alertTitle}>
          You're about to overspend{' '}
          <Text style={{ color: Colors.neonLime }}>₹1,200</Text>
          {' '}on Gion Dinner.
        </Text>
        <Text style={aStyles.alertBody}>
          This transaction exceeds your daily dining budget by 15%. Proceeding will impact your "Japan Trip" savings goal.
        </Text>
        <View style={aStyles.chips}>
          <View style={aStyles.chip}>
            <Text style={{ fontSize: 14 }}>📈</Text>
            <Text style={aStyles.chipText}>BUDGET LIMIT: ₹8,000</Text>
          </View>
          <View style={aStyles.chip}>
            <Text style={{ fontSize: 14 }}>🐷</Text>
            <Text style={aStyles.chipText}>GOAL RISK: HIGH</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={aStyles.actions}>
        <TouchableOpacity
          style={aStyles.cancelBtn}
          activeOpacity={0.88}
          onPress={() => navigation?.goBack()}
        >
          <Text style={aStyles.cancelBtnText}>✕  Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={aStyles.proceedBtn} activeOpacity={0.8}>
          <Text style={aStyles.proceedBtnText}>✓  Proceed</Text>
        </TouchableOpacity>
      </View>

      <Text style={aStyles.disclaimer}>
        Bodhi AI monitors your spending patterns in real-time to protect your long-term financial health.
      </Text>
    </View>
  );
}

// ── Styles — GroupTripWallet ─────────────────────────────────
const S = Spacing;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: {
    paddingTop:    104,
    paddingBottom: 120,
    paddingHorizontal: S.xxl,
    gap:           S.xxl,
  },
  tripMeta: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
  },
  modeBadge: {
    backgroundColor: Colors.surfaceLow,
    borderRadius:    Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf:       'flex-start',
    marginBottom:    6,
  },
  modeBadgeText: {
    fontFamily:  Fonts.label,
    fontSize:    9,
    fontWeight:  '700',
    color:       Colors.textSecondary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  tripName: {
    fontFamily:  Fonts.headline,
    fontSize:    28,
    fontWeight:  '700',
    color:       Colors.textPrimary,
    letterSpacing: -0.5,
  },
  closing: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    fontWeight:  '700',
    color:       Colors.errorRed,
  },

  balCard: {
    borderRadius: Radius.lg,
    overflow:     'hidden',
  },
  balCardInner: { padding: S.xxl },
  balTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   S.xl,
  },
  balLabel: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       'rgba(255,255,255,0.7)',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  balAmtRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    marginBottom:  12,
  },
  balAmt: {
    fontFamily:  Fonts.headline,
    fontSize:    44,
    fontWeight:  '900',
    color:       '#fff',
    letterSpacing: -2,
  },
  balCurrency: {
    fontFamily:  Fonts.label,
    fontSize:    14,
    fontWeight:  '700',
    color:       'rgba(255,255,255,0.8)',
  },
  balProgress: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  balProgressBg: {
    flex:         1,
    height:       6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow:     'hidden',
  },
  balProgressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  balPct: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       '#fff',
  },

  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  sectionTitle: {
    fontFamily:  Fonts.headline,
    fontSize:    20,
    fontWeight:  '700',
    color:       Colors.textPrimary,
  },
  splitLabel: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    fontWeight:  '700',
    color:       Colors.electricViolet,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  contriGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            S.md,
  },
  contriCard: {
    width:           (W - S.xxl * 2 - S.md) / 2,
    backgroundColor: Colors.surfaceLow,
    borderRadius:    Radius.lg,
    padding:         S.lg,
    alignItems:      'center',
    gap:             6,
  },
  contriAddCard: {
    borderWidth:  2,
    borderStyle:  'dashed',
    borderColor:  Colors.textMuted + '55',
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  contriAvatar: {
    width:        48,
    height:       48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainer,
    alignItems:   'center',
    justifyContent: 'center',
  },
  addCircle: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.surfaceHighest,
    alignItems:      'center',
    justifyContent:  'center',
  },
  contriName: {
    fontFamily:  Fonts.body,
    fontSize:    13,
    fontWeight:  '700',
    color:       Colors.textPrimary,
  },
  contriAmt: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    color:       Colors.textSecondary,
  },
  contriAddLabel: {
    fontFamily:  Fonts.label,
    fontSize:    9,
    fontWeight:  '700',
    color:       Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop:   4,
  },

  // Timeline
  timeline: {
    paddingLeft: 16,
    gap:         S.xxl,
    position:    'relative',
  },
  timelineLine: {
    position:        'absolute',
    left:            8,
    top:             8,
    bottom:          8,
    width:           2,
    backgroundColor: Colors.surfaceHighest,
    borderRadius:    1,
  },
  timelineRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            S.xl,
    paddingLeft:    8,
  },
  timelineDot: {
    width:           14,
    height:          14,
    borderRadius:    7,
    borderWidth:     4,
    borderColor:     Colors.surface,
    marginTop:       14,
    shadowRadius:    6,
    elevation:       4,
  },
  timelineCard: {
    flex:            1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius:    Radius.md,
    padding:         S.lg,
  },
  timelineCardRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   4,
  },
  timelineCardName: {
    fontFamily:  Fonts.body,
    fontSize:    14,
    fontWeight:  '700',
    color:       Colors.textPrimary,
  },
  timelineCardAmt: {
    fontFamily:  Fonts.headline,
    fontSize:    14,
    fontWeight:  '700',
    color:       Colors.errorRed,
  },
  timelineCardMeta: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  timelineCardCat: {
    fontFamily:  Fonts.label,
    fontSize:    9,
    fontWeight:  '700',
    color:       Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  timelineCardTime: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    color:       Colors.textMuted,
  },

  fab: {
    position:        'absolute',
    bottom:          110,
    right:           S.xxl,
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: Colors.neonLime,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     Colors.neonLime,
    shadowOpacity:   0.4,
    shadowRadius:    16,
    elevation:       12,
  },
});

// ── Styles — ImmuneSystemAlert ───────────────────────────────
const aStyles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.darkBase,
    alignItems:      'center',
    paddingHorizontal: S.xxl,
  },
  glowGreen: {
    position:      'absolute',
    top:           '30%',
    left:          '50%',
    marginLeft:    -200,
    width:         400,
    height:        400,
    borderRadius:  200,
    backgroundColor: 'rgba(209,252,0,0.05)',
  },
  glowViolet: {
    position:      'absolute',
    bottom:        '15%',
    right:         -100,
    width:         300,
    height:        300,
    borderRadius:  150,
    backgroundColor: 'rgba(112,42,225,0.08)',
  },
  header: {
    width:           '100%',
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingTop:      60,
    paddingBottom:   S.lg,
    zIndex:          10,
  },
  wordmark: {
    fontFamily:  Fonts.headline,
    fontSize:    22,
    fontWeight:  '900',
    fontStyle:   'italic',
    color:       '#a78bfa',
  },
  avatarRing: {
    width:        40,
    height:       40,
    borderRadius: 20,
    backgroundColor: '#1e2030',
    borderWidth:  2,
    borderColor:  Colors.electricViolet,
    alignItems:   'center',
    justifyContent: 'center',
  },
  statusWrap: {
    alignItems:  'center',
    gap:         S.xl,
    marginBottom: S.xxl + 8,
    zIndex:      10,
  },
  statusCircle: {
    width:           80,
    height:          80,
    borderRadius:    40,
    borderWidth:     2,
    borderColor:     Colors.neonLime + '55',
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  boltBadge: {
    position:        'absolute',
    top:             -4,
    right:           -4,
    width:           24,
    height:          24,
    borderRadius:    12,
    backgroundColor: Colors.neonLime,
    borderWidth:     4,
    borderColor:     Colors.darkBase,
    alignItems:      'center',
    justifyContent:  'center',
  },
  statusLabel: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       Colors.neonLime,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },

  alertCard: {
    width:           '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.06)',
    borderRadius:    Radius.xl,
    padding:         S.xxl + 4,
    overflow:        'hidden',
    position:        'relative',
    gap:             S.lg,
    zIndex:          10,
  },
  alertCardAccent: {
    position:        'absolute',
    top:             0,
    right:           0,
    width:           120,
    height:          120,
    backgroundColor: 'rgba(209,252,0,0.06)',
  },
  alertTitle: {
    fontFamily:  Fonts.headline,
    fontSize:    26,
    fontWeight:  '700',
    color:       '#fff',
    lineHeight:  34,
  },
  alertBody: {
    fontFamily:  Fonts.body,
    fontSize:    16,
    fontWeight:  '500',
    color:       Colors.surfaceHighest,
    lineHeight:  26,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  chip: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius:    Radius.full,
    paddingHorizontal: S.lg,
    paddingVertical:   10,
  },
  chipText: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    fontWeight:  '700',
    color:       '#e2e8f0',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  actions: {
    width:       '100%',
    marginTop:   S.xxl + 4,
    gap:         S.lg,
    zIndex:      10,
  },
  cancelBtn: {
    backgroundColor: Colors.neonLime,
    borderRadius:    Radius.lg,
    paddingVertical: 22,
    alignItems:      'center',
    shadowColor:     Colors.neonLime,
    shadowOpacity:   0.4,
    shadowRadius:    20,
    elevation:       10,
  },
  cancelBtnText: {
    fontFamily:  Fonts.headline,
    fontSize:    20,
    fontWeight:  '700',
    color:       Colors.neonLimeDark,
    letterSpacing: 0.5,
  },
  proceedBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.10)',
    borderRadius:    Radius.lg,
    paddingVertical: 22,
    alignItems:      'center',
  },
  proceedBtnText: {
    fontFamily:  Fonts.headline,
    fontSize:    20,
    fontWeight:  '700',
    color:       '#fff',
  },
  disclaimer: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    color:       '#4b5563',   // slate-600
    textAlign:   'center',
    marginTop:   S.xxl,
    lineHeight:  18,
    maxWidth:    280,
    zIndex:      10,
  },
});
