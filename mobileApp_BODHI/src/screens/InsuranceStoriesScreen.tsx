// ─────────────────────────────────────────────────────────────
//  InsuranceStoriesScreen.tsx — Full-screen Instagram-style story
//  Dark immersive | Matches insurance_stories.html
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';

const { width: W, height: H } = Dimensions.get('window');

export function InsuranceStoriesScreen({ navigation }: any) {
  const [storyIdx, setStoryIdx] = useState(1);
  const insets = useSafeAreaInsets();

  const FEATURES = [
    { icon: '⚡', color: Colors.electricViolet, title: 'FAST SETUP',      desc: 'Full coverage in under 5 minutes.', likes: '2.4k', comments: '128' },
    { icon: '🔄', color: Colors.magenta,        title: 'CASHBACK READY',  desc: 'Earn crypto for staying healthy.',  likes: '1.1k', comments: '56' },
    { icon: '👥', color: Colors.neonLimeDark,   title: 'COMMUNITY POOL',  desc: 'Join 20k members saving together.', likes: '3.7k', comments: '200' },
  ];

  return (
    <View style={ss.root}>
      <StatusBar hidden />

      {/* BG gradient */}
      <LinearGradient
        colors={['#702ae1dd','#a400a4cc','#f74b6dee']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      />
      {/* abstract color overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(30,0,60,0.5)' }]} />

      {/* Progress bars */}
      <View style={[ss.progress, { paddingTop: insets.top + 8 }]}>
        {[0,1,2,3].map(i => (
          <View key={i} style={ss.progressBg}>
            <View style={[ss.progressFill, { width: i < storyIdx ? '100%' : i === storyIdx ? '75%' : '0%' }]} />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={ss.header}>
        <View style={ss.headerLeft}>
          <View style={ss.avatarRing}>
            <Text style={{ fontSize: 20 }}>💡</Text>
          </View>
          <View>
            <Text style={ss.channelName}>BODHI Vault</Text>
            <Text style={ss.channelSub}>INSURETECH SERIES</Text>
          </View>
        </View>
        <View style={ss.headerRight}>
          <TouchableOpacity><Text style={ss.iconWhite}>⋯</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Text style={ss.iconWhite}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <View style={ss.content}>
        {/* Shield icon */}
        <View style={ss.shieldWrap}>
          <Text style={{ fontSize: 42 }}>🛡</Text>
        </View>

        <Text style={ss.headline}>Health Insurance</Text>
        <Text style={ss.headlineSub}>Explained in 30 sec</Text>
        <Text style={ss.bodyText}>
          Your health is your primary asset. Here's why you need to protect it today.
        </Text>

        {/* Feature list */}
        <View style={ss.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={ss.featureRow}>
              <View style={[ss.featureIcon, { backgroundColor: f.color }]}>
                <Text style={{ fontSize: 18 }}>{f.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ss.featureTitle}>{f.title}</Text>
                <Text style={ss.featureDesc}>{f.desc}</Text>
              </View>
              {/* Social actions */}
              <View style={ss.socialCol}>
                <TouchableOpacity style={ss.socialBtn}>
                  <Text style={{ fontSize: 18 }}>♥</Text>
                </TouchableOpacity>
                <Text style={ss.socialCount}>{f.likes}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Side tap zones */}
      <TouchableOpacity
        style={ss.tapLeft}
        onPress={() => setStoryIdx(Math.max(0, storyIdx - 1))}
      />
      <TouchableOpacity
        style={ss.tapRight}
        onPress={() => setStoryIdx(Math.min(3, storyIdx + 1))}
      />

      {/* Side nav arrows */}
      <View style={ss.arrowLeft}><Text style={ss.arrowText}>‹</Text></View>
      <View style={ss.arrowRight}><Text style={ss.arrowText}>›</Text></View>

      {/* Bottom CTA */}
      <View style={ss.bottom}>
        <TouchableOpacity style={ss.ctaBtn} activeOpacity={0.88}>
          <Text style={ss.ctaText}>GET PROTECTED NOW</Text>
        </TouchableOpacity>
        <View style={ss.swipeHint}>
          <Text style={ss.swipeHintText}>↑  SWIPE UP TO BROWSE PLANS</Text>
        </View>
      </View>

      {/* Social sidebar */}
      <View style={ss.socialSidebar}>
        <View style={ss.socialItem}>
          <TouchableOpacity style={ss.socialCircle}><Text style={{ fontSize: 20 }}>♥</Text></TouchableOpacity>
          <Text style={ss.socialSideCount}>2.4k</Text>
        </View>
        <View style={ss.socialItem}>
          <TouchableOpacity style={ss.socialCircle}><Text style={{ fontSize: 20 }}>💬</Text></TouchableOpacity>
          <Text style={ss.socialSideCount}>128</Text>
        </View>
        <View style={ss.socialItem}>
          <TouchableOpacity style={ss.socialCircle}><Text style={{ fontSize: 20 }}>➤</Text></TouchableOpacity>
          <Text style={ss.socialSideCount}>Share</Text>
        </View>
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a0030' },

  // Progress
  progress: {
    flexDirection:     'row',
    gap:               4,
    paddingHorizontal: Spacing.lg,
    zIndex:            20,
  },
  progressBg: {
    flex:          1,
    height:        3,
    borderRadius:  2,
    backgroundColor: 'rgba(255,255,255,0.30)',
    overflow:      'hidden',
  },
  progressFill: {
    height:          '100%',
    backgroundColor: '#fff',
    borderRadius:    2,
  },

  // Header
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop:        Spacing.lg,
    zIndex:            20,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarRing: {
    width:        42,
    height:       42,
    borderRadius: 21,
    backgroundColor: '#2d1060',
    borderWidth:  2,
    borderColor:  Colors.neonLime,
    alignItems:   'center',
    justifyContent: 'center',
  },
  channelName: {
    fontFamily:  Fonts.headline,
    fontSize:    14,
    fontWeight:  '700',
    color:       '#fff',
  },
  channelSub: {
    fontFamily:  Fonts.label,
    fontSize:    9,
    fontWeight:  '700',
    color:       'rgba(255,255,255,0.6)',
    letterSpacing: 2,
  },
  iconWhite:  { fontSize: 22, color: '#fff' },

  // Content
  content: {
    flex:              1,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: Spacing.xxl + 8,
    paddingTop:        Spacing.xl,
    zIndex:            10,
  },
  shieldWrap: {
    width:        80,
    height:       80,
    borderRadius: 40,
    backgroundColor: Colors.neonLime,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom:   Spacing.xxl,
    shadowColor:  Colors.neonLime,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation:    12,
  },
  headline: {
    fontFamily:  Fonts.headline,
    fontSize:    34,
    fontWeight:  '900',
    color:       '#fff',
    textAlign:   'center',
    lineHeight:  40,
  },
  headlineSub: {
    fontFamily:  Fonts.headline,
    fontSize:    28,
    fontWeight:  '700',
    fontStyle:   'italic',
    color:       Colors.neonLime,
    textAlign:   'center',
    marginBottom: Spacing.lg,
  },
  bodyText: {
    fontFamily:  Fonts.body,
    fontSize:    16,
    fontWeight:  '500',
    color:       'rgba(255,255,255,0.85)',
    textAlign:   'center',
    lineHeight:  24,
    marginBottom: Spacing.xxl,
  },

  featureList: { width: '100%', gap: Spacing.md },
  featureRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius:    Radius.md,
    padding:         Spacing.lg,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.10)',
  },
  featureIcon: {
    width:        40,
    height:       40,
    borderRadius: 20,
    alignItems:   'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontFamily:  Fonts.label,
    fontSize:    12,
    fontWeight:  '700',
    color:       '#fff',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  featureDesc: {
    fontFamily:  Fonts.body,
    fontSize:    11,
    color:       'rgba(255,255,255,0.6)',
    marginTop:   2,
  },
  socialCol:  { alignItems: 'center', gap: 2 },
  socialBtn: {
    width:        40,
    height:       40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems:   'center',
    justifyContent: 'center',
  },
  socialCount: {
    fontFamily:  Fonts.label,
    fontSize:    9,
    fontWeight:  '700',
    color:       '#fff',
  },

  // Tap zones (left/right half for story navigation)
  tapLeft: {
    position: 'absolute',
    left:     0,
    top:      100,
    bottom:   200,
    width:    W * 0.4,
    zIndex:   30,
  },
  tapRight: {
    position: 'absolute',
    right:    0,
    top:      100,
    bottom:   200,
    width:    W * 0.4,
    zIndex:   30,
  },

  // Arrow buttons
  arrowLeft: {
    position:        'absolute',
    left:            0,
    top:             H / 2 - 64,
    height:          128,
    width:           44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderTopRightRadius:    24,
    borderBottomRightRadius: 24,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          40,
  },
  arrowRight: {
    position:        'absolute',
    right:           0,
    top:             H / 2 - 64,
    height:          128,
    width:           44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderTopLeftRadius:    24,
    borderBottomLeftRadius: 24,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          40,
  },
  arrowText: { fontSize: 28, color: 'rgba(255,255,255,0.7)' },

  // Bottom
  bottom: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom:     Platform.OS === 'ios' ? 40 : 20,
    gap:               Spacing.md,
    zIndex:            20,
  },
  ctaBtn: {
    backgroundColor: Colors.neonLime,
    borderRadius:    Radius.lg,
    paddingVertical: 18,
    alignItems:      'center',
    shadowColor:     Colors.neonLime,
    shadowOpacity:   0.35,
    shadowRadius:    20,
    elevation:       10,
  },
  ctaText: {
    fontFamily:  Fonts.headline,
    fontSize:    16,
    fontWeight:  '900',
    color:       Colors.neonLimeDark,
    letterSpacing: 1.2,
  },
  swipeHint: { alignItems: 'center' },
  swipeHintText: {
    fontFamily:  Fonts.label,
    fontSize:    9,
    fontWeight:  '700',
    color:       'rgba(255,255,255,0.5)',
    letterSpacing: 2,
  },

  // Social sidebar
  socialSidebar: {
    position:  'absolute',
    right:     Spacing.lg,
    bottom:    160,
    gap:       Spacing.xxl,
    zIndex:    30,
  },
  socialItem:   { alignItems: 'center', gap: 4 },
  socialCircle: {
    width:        44,
    height:       44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth:  1,
    borderColor:  'rgba(255,255,255,0.20)',
    alignItems:   'center',
    justifyContent: 'center',
  },
  socialSideCount: {
    fontFamily:  Fonts.label,
    fontSize:    10,
    fontWeight:  '700',
    color:       '#fff',
  },
});
