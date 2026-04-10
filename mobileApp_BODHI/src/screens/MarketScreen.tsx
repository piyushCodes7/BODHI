// ─────────────────────────────────────────────────────────────
//  MarketScreen.tsx — Time Warp Stock Simulator
//  Light mode | Matches stock_playgrund.html
//  Enter amount → see historical + predicted portfolio value
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';
import { BodhiHeader, useHeaderHeight } from '../components/BodhiHeader';

const { width: W } = Dimensions.get('window');

type Mode = 'Historical' | 'Predictive';

export function MarketScreen() {
  const headerH = useHeaderHeight();
  const [amount, setAmount]   = useState('₹5,000');
  const [mode, setMode]       = useState<Mode>('Historical');
  const [calculated, setCalc] = useState(false);

  const simulate = () => setCalc(true);

  return (
    <View style={styles.root}>
      <BodhiHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerH + 16 }]}
      >
        {/* ── Title ─────────────────────────────────────────── */}
        <Text style={styles.pageTitle}>
          Time <Text style={styles.pageTitleItalic}>Warp</Text>
        </Text>

        {/* ── Input: Principal ─────────────────────────────── */}
        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>INVESTMENT PRINCIPAL</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.editIcon}>✏️</Text>
          </View>
        </View>

        {/* ── Asset picker ─────────────────────────────────── */}
        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>ASSET OF CHOICE</Text>
          <View style={styles.assetRow}>
            <View style={styles.assetIcon}>
              <Text style={{ fontSize: 18 }}>🚗</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.assetName}>Tesla, Inc.</Text>
              <Text style={styles.assetTicker}>TSLA • NASDAQ</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.changeBtn}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Mode toggle ───────────────────────────────────── */}
        <View style={styles.inputBlock}>
          <View style={styles.modeHeader}>
            <Text style={styles.inputLabel}>SIMULATION MODE</Text>
            <Text style={styles.activeBadge}>ACTIVE</Text>
          </View>
          <View style={styles.toggle}>
            {(['Historical', 'Predictive'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[styles.toggleBtn, mode === m && styles.toggleActive]}
              >
                <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── CTA ───────────────────────────────────────────── */}
        <TouchableOpacity style={styles.ctaBtn} onPress={simulate} activeOpacity={0.88}>
          <Text style={styles.ctaText}>CALCULATE ALPHA</Text>
        </TouchableOpacity>

        {calculated && (
          <>
            {/* ── Portfolio Impact banner ─────────────────── */}
            <LinearGradient
              colors={[Colors.electricViolet, Colors.magenta, Colors.hotPink]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.impactCard}
            >
              <Text style={styles.impactLabel}>PORTFOLIO IMPACT</Text>
              <Text style={styles.impactTitle}>Your hypothetical{'\n'}wealth is growing.</Text>
              <Text style={styles.impactDesc}>
                By holding TSLA, your simulated portfolio outperformed 84% of traditional bank savings in the same period.
              </Text>
            </LinearGradient>

            {/* ── Simulated Value ──────────────────────────── */}
            <View style={styles.resultCard}>
              <View style={styles.resultTop}>
                <Text style={styles.resultLabel}>SIMULATED VALUE TODAY</Text>
                <Text style={styles.resultPeriod}>2Y</Text>
              </View>
              <View style={styles.resultAmtRow}>
                <Text style={styles.resultAmt}>₹24,812.50</Text>
                <View style={styles.resultBadge}>
                  <Text style={styles.resultBadgeText}>↑396.2%</Text>
                </View>
              </View>

              {/* Mini chart placeholder */}
              <View style={styles.chartArea}>
                <View style={styles.chartLine} />
                <View style={styles.chartDot}>
                  <Text style={styles.chartDotLabel}>TODAY</Text>
                </View>
                <Text style={styles.chartStart}>OCT 2022</Text>
                <Text style={styles.chartProjection}>PROJECTION</Text>
              </View>
            </View>

            {/* ── Stats cards ──────────────────────────────── */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MARKET VOLATILITY</Text>
              <Text style={styles.statVal}>18.4%</Text>
              <Text style={styles.statTag}>High Risk</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ALPHA SCORE</Text>
              <View style={styles.statRow}>
                <Text style={styles.statVal}>92/100</Text>
                <View style={styles.alphaDash} />
              </View>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>SOCIAL SENTIMENT</Text>
              <View style={styles.statRow}>
                <Text style={styles.statVal}>Bullish</Text>
                <Text style={{ fontSize: 22 }}>😊</Text>
              </View>
            </View>

            {/* ── Deep Dive ────────────────────────────────── */}
            <Text style={styles.deepTitle}>Deep Dive Analysis</Text>
            <View style={styles.deepCard}>
              <Text style={styles.deepCardTitle}>The "What-If" Multiplier</Text>
              <Text style={styles.deepCardBody}>
                If you had chosen <Text style={{ fontWeight: '700', color: Colors.electricViolet }}>Bitcoin</Text> instead of Tesla, your portfolio would be worth ₹31,450 (+529%). High variance assets provide exponential growth opportunities but require diamond hands.
              </Text>
              <Text style={styles.maxDrawdown}>Max Drawdown</Text>
              <Text style={styles.drawdownVal}>-12.4%</Text>
            </View>

            {/* ── Community pulse ──────────────────────────── */}
            <View style={styles.pulseBar}>
              <Text style={styles.pulseSub}>CommunityPulse</Text>
              <Text style={styles.pulseText}>4.2k others are simulating this asset today.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const S = Spacing;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: {
    paddingTop:    16,
    paddingBottom: 120,
    paddingHorizontal: S.xxl,
    gap:           S.xl,
  },

  pageTitle: {
    fontFamily:  Fonts.headline,
    fontSize:    32,
    fontWeight:  '700',
    color:       Colors.textPrimary,
    letterSpacing: -0.5,
  },
  pageTitleItalic: {
    fontStyle:  'italic',
    color:      Colors.electricViolet,
  },

  // Inputs
  inputBlock: { gap: 8 },
  inputLabel: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       Colors.textSecondary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.surfaceWhite,
    borderRadius:    Radius.md,
    paddingHorizontal: S.lg,
    paddingVertical:   S.lg,
  },
  input: {
    flex:       1,
    fontFamily: Fonts.headline,
    fontSize:   22,
    fontWeight: '700',
    color:      Colors.textPrimary,
  },
  editIcon: { fontSize: 16 },

  assetRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             S.md,
    backgroundColor: Colors.surfaceWhite,
    borderRadius:    Radius.md,
    padding:         S.lg,
  },
  assetIcon: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.textPrimary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  assetName: {
    fontFamily:  Fonts.body,
    fontSize:    14,
    fontWeight:  '700',
    color:       Colors.textPrimary,
  },
  assetTicker: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    color:       Colors.textSecondary,
  },
  changeBtn: {
    fontFamily:  Fonts.label,
    fontSize:    12,
    fontWeight:  '700',
    color:       Colors.electricViolet,
  },

  modeHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  activeBadge: {
    fontFamily:      Fonts.label,
    fontSize:        9,
    fontWeight:      '700',
    color:           Colors.neonLimeDark,
    backgroundColor: Colors.neonLime + '33',
    paddingHorizontal: 8,
    paddingVertical:   2,
    borderRadius:    Radius.full,
    letterSpacing:   0.8,
  },
  toggle: {
    flexDirection:   'row',
    backgroundColor: Colors.surfaceHighest,
    borderRadius:    Radius.full,
    padding:         4,
  },
  toggleBtn: {
    flex:        1,
    paddingVertical: 10,
    alignItems:  'center',
    borderRadius: Radius.full,
  },
  toggleActive: {
    backgroundColor: Colors.surfaceWhite,
    shadowColor:     '#000',
    shadowOpacity:   0.06,
    shadowRadius:    8,
    elevation:       2,
  },
  toggleText: {
    fontFamily:  Fonts.body,
    fontSize:    14,
    fontWeight:  '600',
    color:       Colors.textSecondary,
  },
  toggleTextActive: {
    color:      Colors.textPrimary,
    fontWeight: '700',
  },

  // CTA
  ctaBtn: {
    backgroundColor: Colors.neonLime,
    borderRadius:    Radius.md,
    paddingVertical: 18,
    alignItems:      'center',
    shadowColor:     Colors.neonLime,
    shadowOffset:    { width: 0, height: 10 },
    shadowOpacity:   0.3,
    shadowRadius:    20,
    elevation:       8,
  },
  ctaText: {
    fontFamily:  Fonts.headline,
    fontSize:    16,
    fontWeight:  '900',
    color:       Colors.neonLimeDark,
    letterSpacing: 1.2,
  },

  // Impact banner
  impactCard: {
    borderRadius: Radius.lg,
    padding:      S.xxl,
    gap:          8,
  },
  impactLabel: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       'rgba(255,255,255,0.7)',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  impactTitle: {
    fontFamily:  Fonts.headline,
    fontSize:    22,
    fontWeight:  '700',
    color:       '#fff',
    lineHeight:  30,
  },
  impactDesc: {
    fontFamily:  Fonts.body,
    fontSize:    13,
    color:       'rgba(255,255,255,0.8)',
    lineHeight:  20,
  },

  // Result card
  resultCard: {
    backgroundColor: Colors.surfaceWhite,
    borderRadius:    Radius.lg,
    padding:         S.xxl,
  },
  resultTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   8,
  },
  resultLabel: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       Colors.textSecondary,
    letterSpacing: 1.2,
  },
  resultPeriod: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    fontWeight:  '700',
    color:       Colors.textSecondary,
  },
  resultAmtRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           10,
    marginBottom:  S.lg,
  },
  resultAmt: {
    fontFamily:  Fonts.headline,
    fontSize:    32,
    fontWeight:  '900',
    color:       Colors.textPrimary,
    letterSpacing: -1,
  },
  resultBadge: {
    backgroundColor: '#dcfce7',
    borderRadius:    Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  resultBadgeText: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    fontWeight:  '700',
    color:       '#16a34a',
  },

  // Chart placeholder
  chartArea: {
    height:       100,
    position:     'relative',
    marginTop:    8,
  },
  chartLine: {
    position:   'absolute',
    bottom:     30,
    left:       0,
    right:      0,
    height:     2,
    backgroundColor: '#16a34a',
    borderRadius:    1,
  },
  chartDot: {
    position:        'absolute',
    bottom:          20,
    right:           80,
    backgroundColor: Colors.neonLime,
    borderRadius:    Radius.full,
    paddingHorizontal: 8,
    paddingVertical:   4,
  },
  chartDotLabel: {
    fontFamily:  Fonts.label,
    fontSize:    9,
    fontWeight:  '700',
    color:       Colors.neonLimeDark,
  },
  chartStart: {
    position:   'absolute',
    bottom:     0,
    left:       0,
    fontFamily: Fonts.label,
    fontSize:   10,
    color:      Colors.textMuted,
  },
  chartProjection: {
    position:   'absolute',
    top:        0,
    right:      0,
    fontFamily: Fonts.label,
    fontSize:   10,
    color:      Colors.textSecondary,
  },

  // Stat cards
  statCard: {
    backgroundColor: Colors.surfaceWhite,
    borderRadius:    Radius.lg,
    padding:         S.xxl,
    gap:             4,
  },
  statLabel: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       Colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statVal: {
    fontFamily:  Fonts.headline,
    fontSize:    28,
    fontWeight:  '700',
    color:       Colors.textPrimary,
  },
  statRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  statTag: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    fontWeight:  '700',
    color:       Colors.errorRed,
  },
  alphaDash: {
    width:           40,
    height:          3,
    backgroundColor: Colors.neonLime,
    borderRadius:    2,
  },

  deepTitle: {
    fontFamily:  Fonts.headline,
    fontSize:    20,
    fontWeight:  '700',
    color:       Colors.textPrimary,
  },
  deepCard: {
    backgroundColor: Colors.surfaceWhite,
    borderRadius:    Radius.lg,
    padding:         S.xxl,
    gap:             S.md,
  },
  deepCardTitle: {
    fontFamily:  Fonts.headline,
    fontSize:    16,
    fontWeight:  '700',
    color:       Colors.textPrimary,
  },
  deepCardBody: {
    fontFamily:  Fonts.body,
    fontSize:    13,
    color:       Colors.textSecondary,
    lineHeight:  20,
  },
  maxDrawdown: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       Colors.textSecondary,
    textTransform: 'uppercase',
    textAlign:   'center',
    marginTop:   S.lg,
  },
  drawdownVal: {
    fontFamily:  Fonts.headline,
    fontSize:    22,
    fontWeight:  '700',
    color:       Colors.errorRed,
    textAlign:   'center',
  },

  // Pulse bar
  pulseBar: {
    backgroundColor: Colors.textPrimary,
    borderRadius:    Radius.lg,
    padding:         S.xl,
    gap:             4,
  },
  pulseSub: {
    fontFamily:  Fonts.label,
    fontSize:    9,
    fontWeight:  '700',
    color:       Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pulseText: {
    fontFamily:  Fonts.body,
    fontSize:    13,
    color:       '#fff',
    fontWeight:  '500',
  },
});
