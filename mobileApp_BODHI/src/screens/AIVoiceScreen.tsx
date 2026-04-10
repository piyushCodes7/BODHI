// ─────────────────────────────────────────────────────────────
//  AIVoiceScreen.tsx — BODHI AI Voice Agent  (dark mode)
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';

const { width: W, height: H } = Dimensions.get('window');
const S = Spacing;

const SUGGESTIONS = [
  { id:'1', icon:'📊', label:'Portfolio health?', full:false },
  { id:'2', icon:'💸', label:'Pay rent now',       full:false },
  { id:'3', icon:'🐷', label:'Saving goals?',      full:true  },
];

export function AIVoiceScreen() {
  const insets = useSafeAreaInsets();

  // Pulse rings
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const make = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue:1.25, duration:1800, easing: Easing.inOut(Easing.sin), useNativeDriver:true }),
          Animated.timing(val, { toValue:1,    duration:1800, easing: Easing.inOut(Easing.sin), useNativeDriver:true }),
        ])
      );
    make(pulse1, 0).start();
    make(pulse2, 600).start();
    return () => { pulse1.stopAnimation(); pulse2.stopAnimation(); };
  }, []);

  const GAP = S.md;
  const CHIP_W = (W - S.xxl * 2 - GAP) / 2;

  return (
    <View style={styles.root}>
      {/* Ambient glows — pure Views, no BlurView crash risk */}
      <View style={styles.glowViolet} />
      <View style={styles.glowMagenta} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarLetter}>J</Text>
            </View>
          </View>
          <Text style={styles.wordmark}>BODHI</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize:20 }}>🛡</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconMuted}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orb */}
      <View style={styles.orbContainer}>
        <Animated.View style={[styles.pulseRing, styles.ring1, { transform:[{ scale:pulse1 }] }]} />
        <Animated.View style={[styles.pulseRing, styles.ring2, { transform:[{ scale:pulse2 }] }]} />

        <LinearGradient
          colors={['#d1fc00', '#702ae1', '#a400a4']}
          start={{ x:0.3, y:0.3 }}
          end={{ x:1, y:1 }}
          style={styles.orb}
        >
          {/* semi-transparent dark overlay instead of BlurView */}
          <View style={styles.orbOverlay} />
          {/* Waveform bars */}
          <View style={styles.waveform}>
            {[48, 64, 96, 80, 56].map((h, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height: h,
                    backgroundColor: i === 2 ? Colors.neonLime : 'rgba(255,255,255,0.85)',
                  },
                ]}
              />
            ))}
          </View>
        </LinearGradient>
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={styles.headline}>Ask anything about</Text>
        <Text style={styles.headlineAccent}>your money</Text>
        <Text style={styles.subtitle}>Listening for your command...</Text>
      </View>

      {/* Suggestion chips */}
      <View style={styles.chipsGrid}>
        {SUGGESTIONS.map(s => (
          <TouchableOpacity
            key={s.id}
            activeOpacity={0.8}
            style={[styles.chip, s.full && { width:'100%' }, !s.full && { width: CHIP_W }]}
          >
            <Text style={styles.chipIcon}>{s.icon}</Text>
            <Text style={styles.chipLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor: Colors.darkBase },

  glowViolet: {
    position:'absolute', top:'28%', left:'10%',
    width:300, height:300, borderRadius:150,
    backgroundColor:'rgba(112,42,225,0.12)',
  },
  glowMagenta: {
    position:'absolute', bottom:'15%', right:'-10%',
    width:260, height:260, borderRadius:130,
    backgroundColor:'rgba(164,0,164,0.09)',
  },

  // Header
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal: S.xxl, paddingBottom: S.lg, zIndex:10 },
  headerLeft:  { flexDirection:'row', alignItems:'center', gap:12 },
  headerRight: { flexDirection:'row', alignItems:'center', gap:4 },
  avatarRing:  { width:40, height:40, borderRadius:20, borderWidth:2, borderColor: Colors.neonLime, padding:2 },
  avatarInner: { flex:1, borderRadius:16, backgroundColor:'#1e1040', alignItems:'center', justifyContent:'center' },
  avatarLetter:{ fontFamily: Fonts.headline, fontSize:14, fontWeight:'700', color: Colors.neonLime },
  wordmark:    { fontFamily: Fonts.headline, fontSize:22, fontWeight:'900', fontStyle:'italic', color:'#a78bfa', letterSpacing:-0.5 },
  iconBtn:     { padding:8 },
  iconMuted:   { fontSize:18, color:'#9ca3af' },

  // Orb
  orbContainer: { alignItems:'center', justifyContent:'center', marginTop: H*0.02, marginBottom: H*0.03 },
  pulseRing:    { position:'absolute', borderRadius:999, borderWidth:2, borderColor: Colors.neonLime },
  ring1:        { width:200, height:200, opacity:0.20 },
  ring2:        { width:260, height:260, opacity:0.10 },
  orb: {
    width:180, height:180, borderRadius:90,
    alignItems:'center', justifyContent:'center', overflow:'hidden',
    shadowColor: Colors.neonLime, shadowOffset:{width:0,height:0}, shadowOpacity:0.4, shadowRadius:30, elevation:16,
  },
  orbOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.15)' },
  waveform:     { flexDirection:'row', alignItems:'center', gap:5, zIndex:2 },
  waveBar:      { width:6, borderRadius:3 },

  // Text
  textBlock:       { alignItems:'center', paddingHorizontal: S.xxl, marginBottom: S.xxl },
  headline:        { fontFamily: Fonts.headline, fontSize:28, fontWeight:'700', color:'#fff', letterSpacing:-0.5, lineHeight:36 },
  headlineAccent:  { fontFamily: Fonts.headline, fontSize:28, fontWeight:'700', color: Colors.neonLime, letterSpacing:-0.5, marginBottom: S.lg },
  subtitle:        { fontFamily: Fonts.body, fontSize:15, fontWeight:'300', color:'#94a3b8', textAlign:'center' },

  // Chips
  chipsGrid: { flexDirection:'row', flexWrap:'wrap', gap: S.md, paddingHorizontal: S.xxl },
  chip: {
    backgroundColor:'rgba(255,255,255,0.05)',
    borderWidth:1, borderColor:'rgba(255,255,255,0.08)',
    borderRadius: Radius.md,
    padding: S.xl,
    flexDirection:'row', alignItems:'center', gap:10,
  },
  chipIcon:  { fontSize:18 },
  chipLabel: { fontFamily: Fonts.label, fontSize:13, fontWeight:'600', color:'#e2e8f0' },
});
