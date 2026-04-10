// ─────────────────────────────────────────────────────────────
//  SocialScreen.tsx — Social Clubs / Contri
//  Light mode | Matches social_club.html
// ─────────────────────────────────────────────────────────────

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';
import { BodhiHeader, useHeaderHeight } from '../components/BodhiHeader';

const { width: W } = Dimensions.get('window');

export function SocialScreen() {
  const headerH = useHeaderHeight();
  return (
    <View style={styles.root}>
      <BodhiHeader showSearch />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerH + 16 }]}
      >
        {/* ── Page title ──────────────────────────────────────── */}
        <Text style={styles.pageTitle}>Social Clubs</Text>
        <Text style={styles.pageSub}>INVESTING IS BETTER WITH FRIENDS</Text>

        {/* ── Active Fund card — gradient border ──────────────── */}
        <LinearGradient
          colors={[Colors.electricViolet, Colors.magenta, Colors.hotPink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fundBorder}
        >
          <View style={styles.fundCard}>
            {/* Header row */}
            <View style={styles.fundTop}>
              <View>
                <Text style={styles.fundTag}>ACTIVE FUND</Text>
                <Text style={styles.fundName}>Goa Trip Fund 🌴</Text>
              </View>
              {/* Member avatars */}
              <View style={styles.memberRow}>
                {['🧑','👩','🧔'].map((a, i) => (
                  <View key={i} style={[styles.memberAvatar, { marginLeft: i > 0 ? -10 : 0 }]}>
                    <Text style={{ fontSize: 16 }}>{a}</Text>
                  </View>
                ))}
                <View style={[styles.memberAvatar, styles.memberCount, { marginLeft: -10 }]}>
                  <Text style={styles.memberCountText}>+12</Text>
                </View>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.fundAmountRow}>
              <View>
                <Text style={styles.fundAmountLabel}>POOLED AMOUNT</Text>
                <Text style={styles.fundAmount}>$14,250.00</Text>
              </View>
              <Text style={styles.fundPct}>72% of $20k</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBg}>
              <LinearGradient
                colors={[Colors.electricViolet, Colors.magenta]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: '72%' }]}
              />
            </View>

            {/* Swipe CTA */}
            <View style={styles.swipeRow}>
              <View style={styles.swipeArrow}>
                <Text style={{ fontSize: 18, color: Colors.neonLimeDark }}>»</Text>
              </View>
              <Text style={styles.swipeLabel}>SWIPE TO INVEST TOGETHER</Text>
            </View>

            {/* Social comment */}
            <View style={styles.commentRow}>
              <Text style={styles.commentIcon}>💬</Text>
              <Text style={styles.commentText}>
                <Text style={{ fontWeight: '700' }}>Alex: </Text>
                "Just added $500! Let's book the villa by Friday guys! 🌊"
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Venture Club card ────────────────────────────────── */}
        <View style={styles.ventureCard}>
          <View style={styles.ventureTop}>
            <View>
              <Text style={styles.ventureTag}>VENTURE CLUB</Text>
              <Text style={styles.ventureName}>Startup Bets 🚀</Text>
            </View>
            <View style={styles.memberRow}>
              {['🧑','👩'].map((a, i) => (
                <View key={i} style={[styles.memberAvatar, { marginLeft: i > 0 ? -10 : 0 }]}>
                  <Text style={{ fontSize: 16 }}>{a}</Text>
                </View>
              ))}
              <View style={[styles.memberAvatar, styles.memberCount, { marginLeft: -10 }]}>
                <Text style={styles.memberCountText}>+42</Text>
              </View>
            </View>
          </View>

          <View style={styles.ventureMeta}>
            <View style={styles.ventureMetaBox}>
              <Text style={styles.ventureMetaLabel}>ACTIVE BETS</Text>
              <Text style={styles.ventureMetaVal}>08</Text>
            </View>
            <View style={styles.ventureMetaBox}>
              <Text style={styles.ventureMetaLabel}>POOL TVL</Text>
              <Text style={styles.ventureMetaVal}>$128.4k</Text>
            </View>
          </View>

          <View style={styles.trendingRow}>
            <View style={styles.trendingIcon}>
              <Text style={{ fontSize: 14 }}>⚡</Text>
            </View>
            <Text style={styles.trendingText}>
              <Text style={{ fontWeight: '700' }}>Trending:</Text> Neo-Bank seed round closing in 4h.
            </Text>
          </View>

          <TouchableOpacity style={styles.viewBtn} activeOpacity={0.85}>
            <Text style={styles.viewBtnText}>VIEW OPPORTUNITIES</Text>
          </TouchableOpacity>
        </View>

        {/* ── Bottom bento grid ────────────────────────────────── */}
        <View style={styles.bentoRow}>
          {/* Social Net (neon lime) */}
          <View style={[styles.bentoCard, { backgroundColor: Colors.neonLime }]}>
            <Text style={{ fontSize: 28 }}>👥</Text>
            <Text style={styles.bentoSub}>YOUR SOCIAL NET</Text>
            <Text style={styles.bentoVal}>$2.4k</Text>
          </View>

          {/* Open Invitations (violet) */}
          <View style={[styles.bentoCard, { backgroundColor: '#e9e0ff' }]}>
            <Text style={[styles.bentoSub, { color: Colors.electricViolet }]}>OPEN INVITATIONS</Text>
            <View style={styles.bentoInvite}>
              <Text style={[styles.bentoVal, { color: Colors.electricViolet }]}>03</Text>
              <View style={styles.bentoDot} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const S = Spacing;
const CARD_W = W - S.xxl * 2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: {
    paddingTop:    16,
    paddingBottom: 120,
    paddingHorizontal: S.xxl,
    gap:           S.xxl,
  },
  pageTitle: {
    fontFamily:  Fonts.headline,
    fontSize:    28,
    fontWeight:  '800',
    color:       Colors.textPrimary,
    letterSpacing: -0.5,
  },
  pageSub: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    fontWeight:  '600',
    color:       Colors.textSecondary,
    letterSpacing: 1.4,
    marginTop:   2,
  },

  // Fund card with gradient border
  fundBorder: {
    borderRadius: Radius.lg + 1,
    padding:      1.5,
  },
  fundCard: {
    backgroundColor: Colors.surfaceWhite,
    borderRadius:    Radius.lg,
    padding:         S.xxl,
    gap:             S.lg,
  },
  fundTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  fundTag: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       Colors.electricViolet,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  fundName: {
    fontFamily:  Fonts.headline,
    fontSize:    22,
    fontWeight:  '700',
    color:       Colors.textPrimary,
    letterSpacing: -0.3,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: Colors.surfaceContainer,
    borderWidth:     2,
    borderColor:     Colors.surfaceWhite,
    alignItems:      'center',
    justifyContent:  'center',
  },
  memberCount: { backgroundColor: Colors.secondaryContainer },
  memberCountText: {
    fontFamily:  Fonts.label,
    fontSize:    9,
    fontWeight:  '700',
    color:       Colors.onSecondaryContainer,
  },

  fundAmountRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
  },
  fundAmountLabel: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       Colors.textSecondary,
    letterSpacing: 1.2,
  },
  fundAmount: {
    fontFamily:  Fonts.headline,
    fontSize:    28,
    fontWeight:  '900',
    color:       Colors.textPrimary,
    letterSpacing: -1,
  },
  fundPct: {
    fontFamily:  Fonts.label,
    fontSize:    13,
    fontWeight:  '700',
    color:       Colors.electricViolet,
  },
  progressBg: {
    height:       10,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer,
    overflow:     'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  swipeRow: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: Colors.surfaceLow,
    borderRadius:    Radius.full,
    padding:         6,
    gap:             S.md,
  },
  swipeArrow: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.neonLime,
    alignItems:      'center',
    justifyContent:  'center',
  },
  swipeLabel: {
    fontFamily:  Fonts.label,
    fontSize:    11,
    fontWeight:  '700',
    color:       Colors.textSecondary,
    letterSpacing: 0.8,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           8,
  },
  commentIcon: { fontSize: 14, marginTop: 2 },
  commentText: {
    fontFamily:  Fonts.body,
    fontSize:    12,
    color:       Colors.textSecondary,
    flex:        1,
    fontStyle:   'italic',
  },

  // Venture card
  ventureCard: {
    backgroundColor: Colors.surfaceLow,
    borderRadius:    Radius.lg,
    padding:         S.xxl,
    gap:             S.lg,
  },
  ventureTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  ventureTag: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       Colors.electricViolet,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  ventureName: {
    fontFamily:  Fonts.headline,
    fontSize:    22,
    fontWeight:  '700',
    color:       Colors.textPrimary,
  },
  ventureMeta: {
    flexDirection: 'row',
    gap:           S.md,
  },
  ventureMetaBox: {
    flex:            1,
    backgroundColor: Colors.surfaceWhite,
    borderRadius:    Radius.lg,
    padding:         S.lg,
  },
  ventureMetaLabel: {
    fontFamily:  Fonts.label,
    fontSize:    9,
    fontWeight:  '700',
    color:       Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ventureMetaVal: {
    fontFamily:  Fonts.headline,
    fontSize:    22,
    fontWeight:  '800',
    color:       Colors.textPrimary,
    marginTop:   4,
  },
  trendingRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             S.md,
    backgroundColor: Colors.surfaceWhite,
    borderRadius:    Radius.md,
    padding:         S.md,
  },
  trendingIcon: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: Colors.electricViolet + '22',
    alignItems:      'center',
    justifyContent:  'center',
  },
  trendingText: {
    fontFamily: Fonts.body,
    fontSize:   12,
    color:      Colors.textSecondary,
    flex:       1,
  },
  viewBtn: {
    backgroundColor: Colors.textPrimary,
    borderRadius:    Radius.lg,
    paddingVertical: 16,
    alignItems:      'center',
  },
  viewBtnText: {
    fontFamily:  Fonts.headline,
    fontSize:    14,
    fontWeight:  '700',
    color:       '#fff',
    letterSpacing: 1,
  },

  // Bento
  bentoRow: {
    flexDirection: 'row',
    gap:           S.md,
  },
  bentoCard: {
    flex:         1,
    borderRadius: Radius.xl,
    padding:      S.xxl,
    minHeight:    140,
    justifyContent: 'space-between',
  },
  bentoSub: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       Colors.neonLimeDark,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bentoVal: {
    fontFamily:  Fonts.headline,
    fontSize:    28,
    fontWeight:  '900',
    color:       Colors.neonLimeDark,
    letterSpacing: -1,
  },
  bentoInvite: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  bentoDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: Colors.electricViolet,
  },
});
