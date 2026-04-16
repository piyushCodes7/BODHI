import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, LayoutAnimation, Platform, UIManager, Dimensions } from 'react-native';
import { Plane, TrendingUp, Plus, MoreVertical, ChevronRight, Users } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../theme/tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: W } = Dimensions.get('window');

export function SocialScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  // ── UPDATED MOCK DATA ──
  const [ventures, setVentures] = useState([
    { 
      id: 'v1', 
      name: 'Growth Alphas', 
      members: 5, 
      meta: '1 Vote Pending', 
      totalValue: '₹2,45,680.50', 
      totalReturns: '+₹18,750.30', 
      returnsPct: '+8.25%', 
      yourShare: '₹49,136.10' 
    }
  ]);
  
  const [trips, setTrips] = useState([
    { 
      id: 't1', 
      name: 'Thailand Trip', 
      members: 4, 
      meta: 'Just started', 
      totalBalance: '₹62,340.00', 
      youSpent: '₹8,120.00', 
      youOwe: '₹2,430.00' 
    },
    { 
      id: 't2', 
      name: 'Goa Getaway', 
      members: 6, 
      meta: 'Just started', 
      totalBalance: '₹28,910.00', 
      youSpent: '₹4,500.00', 
      youOwe: '₹1,250.00' 
    }
  ]);

  const handleAddVenture = () => {
    Alert.prompt("New Venture Club", "Enter club name", [
      { text: "Cancel", style: "cancel" },
      { text: "Create", onPress: (name) => {
          if(!name) return;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setVentures([...ventures, { 
            id: Date.now().toString(), 
            name, 
            members: 1, 
            meta: 'New Club',
            totalValue: '₹0.00',
            totalReturns: '+₹0.00',
            returnsPct: '0.00%',
            yourShare: '₹0.00'
          }]);
      }}
    ]);
  };

  const handleAddTrip = () => {
    Alert.prompt("New Trip Wallet", "Where are you going?", [
      { text: "Cancel", style: "cancel" },
      { text: "Create", onPress: (name) => {
          if(!name) return;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setTrips([...trips, { 
            id: Date.now().toString(), 
            name, 
            members: 1, 
            meta: 'Just started',
            totalBalance: '₹0.00',
            youSpent: '₹0.00',
            youOwe: '₹0.00'
          }]);
      }}
    ]);
  };

  const showOptions = (type: 'venture' | 'trip', id: string) => {
    const title = type === 'venture' ? 'Delete Club' : 'Delete Trip';
    const msg = type === 'venture' ? 'Disband the venture and refund all members?' : 'Remove this shared wallet?';
    
    Alert.alert(title, msg, [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          if (type === 'venture') setVentures(ventures.filter(v => v.id !== id));
          else setTrips(trips.filter(t => t.id !== id));
      }}
    ]);
  };

  return (
    <View style={styles.root}>
      {/* ── BACKGROUND GRADIENT ── */}
      <LinearGradient
        colors={['#05001F', '#0A0A14', '#0A0A14']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top, 20) }]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* ── HERO SECTION ── */}
        <View style={styles.headerSection}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Social <Text style={{color: Colors.neonLime}}>Hub</Text></Text>
            <Text style={styles.subtitle}>Shared wealth & group adventures</Text>
          </View>
          
          {/* Glowing Orb Illustration */}
          <View style={styles.heroGlowBox}>
            <View style={[styles.glowRing, { borderColor: 'rgba(168,85,247,0.3)', width: 140, height: 140, borderRadius: 70 }]} />
            <View style={[styles.glowRing, { borderColor: 'rgba(255,45,120,0.2)', width: 100, height: 100, borderRadius: 50, right: 10, top: 10 }]} />
            
            <View style={styles.heroIcons}>
               <View style={[styles.heroMiniIcon, { backgroundColor: 'rgba(212,255,0,0.15)', borderColor: 'rgba(212,255,0,0.3)' }]}>
                 <TrendingUp size={16} color={Colors.neonLime} />
               </View>
               <View style={styles.heroMainIcon}>
                 <Users size={40} color="#A855F7" />
               </View>
               <View style={[styles.heroMiniIcon, { backgroundColor: 'rgba(255,45,120,0.15)', borderColor: 'rgba(255,45,120,0.3)' }]}>
                 <Plane size={16} color={Colors.hotPink} />
               </View>
            </View>
          </View>
        </View>

        {/* ── VENTURE CLUBS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Shared Investments</Text>
              <Text style={styles.sectionSub}>Invest together. Grow together.</Text>
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={handleAddVenture} activeOpacity={0.7}>
              <Plus size={16} color={Colors.neonLime} />
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>

          {ventures.length === 0 ? (
            <Text style={styles.emptyText}>No active ventures.</Text>
          ) : (
            ventures.map(v => (
              <View key={v.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: '#A855F7' }]}>
                      <TrendingUp size={22} color="#A855F7" />
                    </View>
                    <View>
                      <Text style={styles.cardName}>{v.name}</Text>
                      <Text style={styles.cardMeta}>{v.members} Members • {v.meta}</Text>
                    </View>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <View style={[styles.activePill, { backgroundColor: 'rgba(212,255,0,0.1)' }]}>
                      <Text style={[styles.activePillText, { color: Colors.neonLime }]}>Active</Text>
                    </View>
                    <TouchableOpacity hitSlop={{top:10, bottom:10, left:10, right:10}} onPress={() => showOptions('venture', v.id)}>
                      <MoreVertical size={20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsGrid}>
                  <View style={styles.statColumn}>
                    <Text style={styles.statLabel}>Total Value</Text>
                    <Text style={[styles.statValue, { color: Colors.neonLime }]}>{v.totalValue}</Text>
                  </View>
                  <View style={[styles.statColumn, styles.statBorder]}>
                    <Text style={styles.statLabel}>Total Returns</Text>
                    <Text style={[styles.statValue, { color: Colors.neonLime }]}>{v.totalReturns}</Text>
                    <Text style={styles.statSub}>{v.returnsPct}</Text>
                  </View>
                  <View style={styles.statColumn}>
                    <Text style={styles.statLabel}>Your Share</Text>
                    <Text style={styles.statValue}>{v.yourShare}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.cardActionBtn, { backgroundColor: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.2)' }]}
                  onPress={() => navigation.navigate('VentureClub', { clubName: v.name, memberCount: v.members })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cardActionText, { color: '#A855F7' }]}>View Portfolio</Text>
                  <ChevronRight size={16} color="#A855F7" style={{ position: 'absolute', right: 16 }} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* ── TRIP WALLETS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
             <View>
              <Text style={styles.sectionTitle}>Shared Trip Wallets</Text>
              <Text style={styles.sectionSub}>Travel together. Spend together.</Text>
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={handleAddTrip} activeOpacity={0.7}>
              <Plus size={16} color={Colors.neonLime} />
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>

          {trips.length === 0 ? (
            <Text style={styles.emptyText}>No active trips.</Text>
          ) : (
            trips.map(t => (
              <View key={t.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(212,255,0,0.1)', borderColor: Colors.neonLime }]}>
                      <Plane size={22} color={Colors.neonLime} />
                    </View>
                    <View>
                      <Text style={styles.cardName}>{t.name}</Text>
                      <Text style={styles.cardMeta}>{t.members} Members • {t.meta}</Text>
                    </View>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <View style={[styles.activePill, { backgroundColor: 'rgba(212,255,0,0.1)' }]}>
                      <Text style={[styles.activePillText, { color: Colors.neonLime }]}>Active</Text>
                    </View>
                    <TouchableOpacity hitSlop={{top:10, bottom:10, left:10, right:10}} onPress={() => showOptions('trip', t.id)}>
                      <MoreVertical size={20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsGrid}>
                  <View style={styles.statColumn}>
                    <Text style={styles.statLabel}>Total Balance</Text>
                    <Text style={[styles.statValue, { color: Colors.neonLime }]}>{t.totalBalance}</Text>
                  </View>
                  <View style={[styles.statColumn, styles.statBorder]}>
                    <Text style={styles.statLabel}>You Spent</Text>
                    <Text style={styles.statValue}>{t.youSpent}</Text>
                  </View>
                  <View style={styles.statColumn}>
                    <Text style={styles.statLabel}>You Owe</Text>
                    <Text style={[styles.statValue, { color: Colors.hotPink }]}>{t.youOwe}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.cardActionBtn, { backgroundColor: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.2)' }]}
                  onPress={() => navigation.navigate('TripWallet', { tripName: t.name, memberCount: t.members })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cardActionText, { color: '#A855F7' }]}>Settle Up</Text>
                  <ChevronRight size={16} color="#A855F7" style={{ position: 'absolute', right: 16 }} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05001F' },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  
  // ── HERO SECTION ──
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 20 },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 36, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '500' },
  
  heroGlowBox: { width: 120, height: 100, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  glowRing: { position: 'absolute', borderWidth: 1 },
  heroIcons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  heroMainIcon: { marginHorizontal: 10, zIndex: 2 },
  heroMiniIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },

  // ── SECTIONS ──
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', letterSpacing: -0.5 },
  sectionSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  
  createBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(212,255,0,0.1)', borderWidth: 1, borderColor: 'rgba(212,255,0,0.3)', gap: 6 },
  createBtnText: { fontSize: 12, fontWeight: '700', color: Colors.neonLime },
  
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },

  // ── CARD ──
  card: { backgroundColor: '#0B0A1A', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activePillText: { fontSize: 10, fontWeight: '700' },

  // ── STATS GRID ──
  statsGrid: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  statColumn: { flex: 1, gap: 4 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  statSub: { fontSize: 10, color: Colors.neonLime },

  // ── CARD ACTION ──
  cardActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, position: 'relative' },
  cardActionText: { fontSize: 13, fontWeight: '700' }
});