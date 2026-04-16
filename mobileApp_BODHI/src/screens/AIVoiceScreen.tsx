import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarChart2,
  Send,
  PiggyBank,
  Sparkles,
  TrendingUp,
  Calendar,
  ChevronRight,
  Mic,
  Bell,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../theme/tokens';

const { width: W } = Dimensions.get('window');

export function AIVoiceScreen() {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');

  // ─── Orb Pulse Animations ───
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const make = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1.3,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    make(pulse1, 0).start();
    make(pulse2, 800).start();
    return () => {
      pulse1.stopAnimation();
      pulse2.stopAnimation();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Deep Neon Background Gradient */}
      <LinearGradient
        colors={['#05001F', '#1A0033', '#4A0033']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* ─── Global App Header ─── */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>G</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
          
          <Image 
            source={require('../../assets/images/bodhi-logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell size={22} color="#FFF" />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Glowing Orb Section ─── */}
        <View style={styles.orbContainer}>
          <Animated.View style={[styles.pulseRing, styles.ring1, { transform: [{ scale: pulse1 }] }]} />
          <Animated.View style={[styles.pulseRing, styles.ring2, { transform: [{ scale: pulse2 }] }]} />

          <LinearGradient
            colors={['#4A00E0', '#FF007F']}
            style={styles.orb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Center Dark Circle */}
            <View style={styles.orbInner}>
              <View style={styles.waveform}>
                <View style={[styles.waveBar, { height: 24, backgroundColor: 'rgba(255,255,255,0.8)' }]} />
                <View style={[styles.waveBar, { height: 40, backgroundColor: 'rgba(255,255,255,0.8)' }]} />
                <View style={[styles.waveBar, { height: 56, backgroundColor: Colors.neonLime }]} />
                <View style={[styles.waveBar, { height: 32, backgroundColor: 'rgba(255,255,255,0.8)' }]} />
                <View style={[styles.waveBar, { height: 20, backgroundColor: 'rgba(255,255,255,0.8)' }]} />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ─── Text Headers ─── */}
        <View style={styles.textBlock}>
          <Text style={styles.greeting}>Hi Govind! 👋</Text>
          <Text style={styles.headline}>Ask anything about</Text>
          <Text style={styles.headlineAccent}>your money</Text>
          <Text style={styles.subtitle}>Listening for your command...</Text>
        </View>

        {/* ─── Main Suggestion Cards ─── */}
        <View style={styles.cardsGrid}>
          {/* Top Row: Two Cards */}
          <View style={styles.cardsRow}>
            {/* Card 1: Portfolio */}
            <TouchableOpacity style={[styles.card, styles.cardPurple]} activeOpacity={0.8}>
              <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(168,85,247,0.15)' }]}>
                <BarChart2 size={24} color="#A855F7" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Portfolio health?</Text>
                <Text style={styles.cardSub}>Get real-time insights on your portfolio</Text>
              </View>
              <View style={[styles.cardArrowWrap, { borderColor: '#A855F7' }]}>
                <ChevronRight size={16} color="#A855F7" />
              </View>
            </TouchableOpacity>

            {/* Card 2: Pay Rent */}
            <TouchableOpacity style={[styles.card, styles.cardPink]} activeOpacity={0.8}>
              <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(255,51,102,0.15)' }]}>
                <Send size={24} color="#FF3366" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Pay rent now</Text>
                <Text style={styles.cardSub}>Set reminders and make payments</Text>
              </View>
              <View style={[styles.cardArrowWrap, { borderColor: '#FF3366' }]}>
                <ChevronRight size={16} color="#FF3366" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Row: Full Width Card */}
          <TouchableOpacity style={[styles.cardFull, styles.cardLime]} activeOpacity={0.8}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(212,255,0,0.15)' }]}>
              <PiggyBank size={24} color={Colors.neonLime} />
            </View>
            <View style={styles.cardFullContent}>
              <Text style={styles.cardTitle}>Saving goals?</Text>
              <Text style={styles.cardSub}>Track, plan and achieve your financial goals</Text>
            </View>
            <View style={[styles.cardArrowWrap, { borderColor: Colors.neonLime }]}>
              <ChevronRight size={16} color={Colors.neonLime} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── "Try Saying" Chips ─── */}
        <View style={styles.trySayingSection}>
          <View style={styles.trySayingHeader}>
            <Sparkles size={16} color="#A855F7" />
            <Text style={styles.trySayingText}>Try saying</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            <TouchableOpacity style={styles.chip}>
              <TrendingUp size={16} color={Colors.neonLime} />
              <Text style={styles.chipText}>How is my{'\n'}portfolio doing?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.chip}>
              <PiggyBank size={16} color="#FF3366" />
              <Text style={styles.chipText}>How much can{'\n'}I save this month?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chip}>
              <Calendar size={16} color="#A855F7" />
              <Text style={styles.chipText}>Upcoming{'\n'}payments?</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>

      {/* -─── Bottom Chatbox Area ───- */}
      <View style={[styles.chatContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.chatInputWrapper}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type your message..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: inputText.length > 0 ? Colors.neonLime : 'rgba(255,255,255,0.1)' }]}
            disabled={inputText.length === 0}
          >
            {inputText.length > 0 ? (
              <Send size={16} color="#000" />
            ) : (
              <Mic size={16} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05001F' },
  scrollContent: { paddingBottom: 100 }, // Space for chatbox
  
  // ── HEADER ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: { position: 'relative' },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#000' },
  onlineDot: {
    position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.neonLime, borderWidth: 2, borderColor: '#05001F',
  },
  logo: { height: 35, width: 150, tintColor: '#FFF' },
  headerIcons: { flexDirection: 'row', gap: 10 },
  iconBtn: { position: 'relative' },
  notifBadge: {
    position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3366', borderWidth: 1.5, borderColor: '#05001F'
  },

  // ── ORB ──
  orbContainer: { alignItems: 'center', justifyContent: 'center', height: 220, marginTop: 10 },
  pulseRing: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  ring1: { width: 180, height: 180, opacity: 0.5 },
  ring2: { width: 260, height: 260, opacity: 0.2 },
  orb: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#A855F7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 16,
  },
  orbInner: { width: 124, height: 124, borderRadius: 62, backgroundColor: '#1A0033', alignItems: 'center', justifyContent: 'center' },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  waveBar: { width: 6, borderRadius: 3 },

  // ── TEXT ──
  textBlock: { alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  greeting: { fontSize: 20, fontWeight: '500', color: '#FFF', marginBottom: 8 },
  headline: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  headlineAccent: { fontSize: 32, fontWeight: '800', color: Colors.neonLime, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.6)' },

  // ── CARDS ──
  cardsGrid: { paddingHorizontal: 20, gap: 16, marginBottom: 30 },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  
  card: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, borderWidth: 1, position: 'relative' },
  cardPurple: { borderColor: 'rgba(168,85,247,0.4)' },
  cardPink: { borderColor: 'rgba(255,51,102,0.4)' },
  cardLime: { borderColor: 'rgba(212,255,0,0.4)' },
  
  cardFull: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  
  cardIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardContent: { flex: 1 },
  cardFullContent: { flex: 1, marginLeft: 16 },
  
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 16, paddingRight: 20 },
  
  cardArrowWrap: { position: 'absolute', bottom: 16, right: 16, width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // ── TRY SAYING CHIPS ──
  trySayingSection: { paddingLeft: 20 },
  trySayingHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  trySayingText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  
  chipsScroll: { paddingRight: 40, gap: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  chipText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500', lineHeight: 16 },

  // ── CHATBOX ──
  chatContainer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#05001F', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  chatInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.full, paddingLeft: 20, paddingRight: 6, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chatInput: { flex: 1, color: '#FFF', fontSize: 15, minHeight: 40 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});