import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  AppState,
  Modal,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  TextInput,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Tv, Gamepad2, Briefcase, Music, BookOpen,
  ChevronRight, X, ChevronLeft, Search, Zap, Star,
  DollarSign, Flame,
} from 'lucide-react-native';
import { SubscriptionsAPI } from '../api/client';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 168;

const FILTER_CHIPS = ['All', 'Entertainment', 'Productivity', 'Music', 'Gaming', 'Finance'];

const BADGES: Record<string, { label: string; color: string }> = {
  netflix:    { label: '🔥 Popular',   color: '#E50914' },
  prime:      { label: '⭐ Best Value', color: '#00A8E1' },
  spotify:    { label: '🎵 Top Pick',  color: '#1DB954' },
  chatgpt:    { label: '⚡ Trending',  color: '#10A37F' },
  m365:       { label: '💼 Essentials',color: '#D83B01' },
  youtube:    { label: '📺 Popular',   color: '#FF0000' },
  hotstar:    { label: '🏏 Live Sport',color: '#0061FF' },
};

const getCategoryIcon = (iconName: string) => {
  const props = { color: '#C6FF00', size: 18 };
  switch (iconName) {
    case 'Tv':        return <Tv {...props} />;
    case 'Briefcase': return <Briefcase {...props} />;
    case 'Gamepad2':  return <Gamepad2 {...props} />;
    case 'Music':     return <Music {...props} />;
    case 'BookOpen':  return <BookOpen {...props} />;
    default:          return <Zap {...props} />;
  }
};

export const SubscriptionHubScreen = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [pendingSub, setPendingSub]   = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadCatalog();
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active' && pendingSub) {
        setShowConfirmModal(true);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [pendingSub]);

  const loadCatalog = async () => {
    try {
      const data = await SubscriptionsAPI.fetchCatalog();
      setCategories(data);
    } catch (e) {
      console.error('Failed to load catalog', e);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: any) => setSelectedService(service);

  const handlePlanSelect = (plan: any) => {
    const subToTrack = {
      id: selectedService.id,
      name: `${selectedService.name} (${plan.name})`,
      price: plan.price,
      actionUrl: plan.url,
    };
    setPendingSub(subToTrack);
    Linking.openURL(plan.url).catch(err => console.error('Redirect error', err));
  };

  const confirmAndLogToVault = async () => {
    if (!pendingSub) return;
    try {
      await SubscriptionsAPI.addToVault({
        platform_id: pendingSub.id,
        platform_name: pendingSub.name,
        expected_monthly_cost: parseFloat(pendingSub.price),
      });
    } catch (e) {
      console.error('Failed to add to vault', e);
    } finally {
      setShowConfirmModal(false);
      setPendingSub(null);
    }
  };

  const cancelLog = () => { setShowConfirmModal(false); setPendingSub(null); };

  const filteredCategories = categories
    .map(cat => ({
      ...cat,
      subscriptions: cat.subscriptions.filter((s: any) => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'All' || cat.categoryName.includes(activeFilter);
        return matchesSearch && matchesFilter;
      }),
    }))
    .filter(cat => cat.subscriptions.length > 0);

  // ─────────────────────────────────────────
  // SUBSCRIPTION CARD
  // ─────────────────────────────────────────
  const renderSubscriptionCard = ({ item }: { item: any }) => {
    const badge = BADGES[item.id];
    const startPrice = item.availablePlans?.[0]?.price ?? '—';

    return (
      <TouchableOpacity
        style={[styles.card, { borderColor: `${item.borderColor}55` }]}
        onPress={() => handleServiceSelect(item)}
        activeOpacity={0.82}
      >
        {/* Ambient glow */}
        <View style={[styles.cardAmbient, { backgroundColor: `${item.borderColor}18` }]} />

        {/* Badge — absolutely positioned top-right so it never shifts content */}
        {badge && (
          <View style={[styles.badge, { backgroundColor: `${badge.color}22`, borderColor: `${badge.color}55` }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        )}

        {/* Logo — always at top, unaffected by badge */}
        <View style={[styles.logoWrapper, { borderColor: `${item.borderColor}44` }]}>
          <Image
            key={item.logoUrl}
            source={{ uri: item.logoUrl }}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.appName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.planText} numberOfLines={1}>{item.plansSummary}</Text>

        {/* Starting price */}
        <View style={styles.priceRow}>
          <Text style={styles.priceFrom}>from </Text>
          <Text style={styles.priceNeon}>₹{startPrice}</Text>
          <Text style={styles.priceMo}>/mo</Text>
        </View>

        {/* CTA */}
        <LinearGradient
          colors={['#C6FF00', '#9AE600']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={styles.ctaText}>View Plans</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // ─────────────────────────────────────────
  // CATEGORY ROW
  // ─────────────────────────────────────────
  const renderCategory = ({ item }: { item: any }) => (
    <View style={styles.categoryContainer}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryHeaderLeft}>
          <View style={styles.catIconBadge}>{getCategoryIcon(item.icon)}</View>
          <Text style={styles.categoryTitle}>{item.categoryName}</Text>
        </View>
        <TouchableOpacity style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>View All</Text>
          <ChevronRight color="#7C3AED" size={15} />
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={item.subscriptions}
        keyExtractor={(sub: any) => sub.id}
        renderItem={renderSubscriptionCard}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
      />
    </View>
  );

  // ─────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#C6FF00" size="large" />
        <Text style={{ color: '#555', marginTop: 12, fontSize: 13 }}>Loading marketplace…</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────
  // SUB-SCREEN: PLAN SELECTION
  // ─────────────────────────────────────────
  if (selectedService) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Background orbs */}
        <View style={[styles.orb, { top: -60, left: -60, backgroundColor: `${selectedService.borderColor}18`, width: 220, height: 220 }]} />
        <View style={[styles.orb, { bottom: 100, right: -80, backgroundColor: '#7C3AED18', width: 180, height: 180 }]} />

        {/* Header */}
        <View style={styles.planHeader}>
          <TouchableOpacity onPress={() => setSelectedService(null)} style={styles.backBtn}>
            <ChevronLeft color="#FFF" size={22} />
          </TouchableOpacity>
          <View style={styles.planHeaderMid}>
            <View style={[styles.planLogoWrapper, { borderColor: `${selectedService.borderColor}66` }]}>
              <Image source={{ uri: selectedService.logoUrl }} style={styles.planHeaderLogo} resizeMode="contain" />
            </View>
            <Text style={styles.planHeaderTitle}>{selectedService.name}</Text>
            <Text style={styles.planHeaderSub}>Select a plan to continue</Text>
          </View>
        </View>

        {/* Plans */}
        <FlatList
          data={selectedService.availablePlans}
          keyExtractor={(p: any) => p.name}
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.planCard, { borderColor: `${selectedService.borderColor}55` }]}
              onPress={() => handlePlanSelect(item)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#12101A', '#0A080F']}
                style={StyleSheet.absoluteFill}
              />
              {/* Left: plan name + features */}
              <View style={{ flex: 1, paddingRight: 12 }}>
                {index === 0 && (
                  <View style={styles.popularBadge}>
                    <Star color="#C6FF00" size={10} fill="#C6FF00" />
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                <Text style={styles.planCardName}>{item.name}</Text>
                <Text style={styles.planCardFeatures}>{item.features || 'Full access'}</Text>
              </View>
              {/* Right: price + select — clean column, no badge overlap */}
              <View style={styles.planCardRight}>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPriceSym}>₹</Text>
                  <Text style={styles.planPriceVal}>{item.price}</Text>
                </View>
                <Text style={styles.planPriceMo}>/month</Text>
                <View style={styles.selectBtn}>
                  <Text style={styles.selectBtnText}>Select →</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────
  // MAIN SCREEN
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background ambient orbs */}
      <View style={[styles.orb, { top: -100, right: -80, backgroundColor: '#7C3AED22', width: 260, height: 260 }]} />
      <View style={[styles.orb, { top: 180, left: -100, backgroundColor: '#C6FF0010', width: 200, height: 200 }]} />

      <FlatList
        data={filteredCategories}
        keyExtractor={(item: any) => item.categoryId}
        renderItem={renderCategory}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <View>
            {/* ── HERO HEADER ── */}
            <LinearGradient
              colors={['#0D0820', '#05030A']}
              style={styles.heroGradient}
            >
              <View style={styles.heroRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.heroPill}>
                    <Zap color="#C6FF00" size={11} fill="#C6FF00" />
                    <Text style={styles.heroPillText}>BODHI Marketplace</Text>
                  </View>
                  <Text style={styles.heroTitle}>Discover{'\n'}Plans</Text>
                  <Text style={styles.heroSubtitle}>All your subscriptions,{'\n'}one intelligent hub.</Text>
                </View>
                <View style={styles.heroGraphic}>
                  <LinearGradient
                    colors={['#7C3AED33', '#C6FF0018']}
                    style={styles.heroGraphicInner}
                  >
                    <Flame color="#C6FF00" size={30} />
                  </LinearGradient>
                  <View style={[styles.orbDot, { top: -6, right: -6, backgroundColor: '#C6FF00' }]} />
                  <View style={[styles.orbDot, { bottom: -4, left: -4, backgroundColor: '#7C3AED' }]} />
                </View>
              </View>

              {/* Stats strip */}
              <View style={styles.statsRow}>
                {[
                  { val: '50+', label: 'Services' },
                  { val: '4',   label: 'Categories' },
                  { val: '₹99', label: 'Starts at' },
                ].map((s, i) => (
                  <View key={i} style={styles.statItem}>
                    <Text style={styles.statVal}>{s.val}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* ── SEARCH BAR ── */}
            <View style={styles.searchWrapper}>
              <Search color="#555" size={17} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Netflix, Spotify…"
                placeholderTextColor="#444"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X color="#555" size={16} />
                </TouchableOpacity>
              )}
            </View>

            {/* ── FILTER CHIPS ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {FILTER_CHIPS.map(chip => (
                <TouchableOpacity
                  key={chip}
                  onPress={() => setActiveFilter(chip)}
                  style={[styles.chip, activeFilter === chip && styles.chipActive]}
                >
                  <Text style={[styles.chipText, activeFilter === chip && styles.chipTextActive]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>Browse Categories</Text>
          </View>
        }
      />

      {/* ── VAULT CONFIRMATION MODAL ── */}
      <Modal visible={showConfirmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalPill} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Did you subscribe?</Text>
                <Text style={styles.modalSub}>We'll track it for you automatically.</Text>
              </View>
              <TouchableOpacity onPress={cancelLog} style={styles.modalClose}>
                <X color="#888" size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBody}>
              Add <Text style={{ color: '#C6FF00', fontWeight: '700' }}>{pendingSub?.name}</Text> to your Vault to monitor this recurring expense?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelLog}>
                <Text style={styles.cancelBtnText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAndLogToVault} style={{ flex: 1.6 }}>
                <LinearGradient colors={['#C6FF00', '#9AE600']} style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>Add to Vault</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#05030A' },
  centered:    { justifyContent: 'center', alignItems: 'center' },

  // Ambient orbs
  orb: { position: 'absolute', borderRadius: 999 },
  orbDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },

  // ── HERO ──
  heroGradient: { paddingHorizontal: 22, paddingTop: 52, paddingBottom: 24 },
  heroRow:      { flexDirection: 'row', alignItems: 'flex-start' },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#C6FF0015', borderRadius: 20, borderWidth: 1,
    borderColor: '#C6FF0033', paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 14,
  },
  heroPillText: { color: '#C6FF00', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#FFF', fontSize: 42, fontWeight: '800', lineHeight: 48, letterSpacing: -0.5 },
  heroSubtitle: { color: '#666', fontSize: 13, marginTop: 8, lineHeight: 19 },
  heroGraphic: {
    width: 76, height: 76, marginLeft: 16, position: 'relative',
    justifyContent: 'center', alignItems: 'center',
  },
  heroGraphicInner: {
    width: 72, height: 72, borderRadius: 22, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: '#7C3AED44',
  },
  statsRow: {
    flexDirection: 'row', marginTop: 24, gap: 0,
    borderTopWidth: 1, borderTopColor: '#1A1A2E', paddingTop: 18,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal:  { color: '#C6FF00', fontSize: 20, fontWeight: '800' },
  statLabel:{ color: '#444', fontSize: 11, marginTop: 2 },

  // ── SEARCH ──
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F0D18', borderRadius: 18,
    borderWidth: 1, borderColor: '#1E1B2E',
    marginHorizontal: 20, marginTop: 20, paddingHorizontal: 16, paddingVertical: 13,
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 14, padding: 0 },

  // ── FILTER CHIPS ──
  chipsRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#0F0D18',
    borderWidth: 1, borderColor: '#1E1B2E',
  },
  chipActive: { backgroundColor: '#C6FF0018', borderColor: '#C6FF0055' },
  chipText:       { color: '#555', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#C6FF00' },

  // Section label
  sectionLabel: {
    color: '#333', fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', paddingHorizontal: 22, marginBottom: 10,
  },

  // ── CATEGORY ──
  categoryContainer: { marginBottom: 32 },
  categoryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, marginBottom: 14,
  },
  categoryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIconBadge: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#C6FF0012', borderWidth: 1, borderColor: '#C6FF0030',
    justifyContent: 'center', alignItems: 'center',
  },
  categoryTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText:{ color: '#7C3AED', fontSize: 13, fontWeight: '600' },

  // ── SUBSCRIPTION CARD ──
  card: {
    width: CARD_WIDTH, minHeight: 210,
    backgroundColor: '#0D0A14', borderRadius: 24, borderWidth: 1.5,
    padding: 16, marginRight: 14, overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardAmbient: {
    position: 'absolute', top: -30, right: -30,
    width: 100, height: 100, borderRadius: 50,
    opacity: 0.6,
  },
  badge: {
    position: 'absolute', top: 12, right: 12,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
    zIndex: 10,
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
  logoWrapper: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#FFFFFF', borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  brandLogo: { width: 36, height: 36 },
  appName: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  planText: { color: '#555', fontSize: 11, marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  priceFrom: { color: '#444', fontSize: 10 },
  priceNeon: { color: '#C6FF00', fontSize: 17, fontWeight: '800' },
  priceMo:   { color: '#444', fontSize: 10 },
  ctaGradient: { borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  ctaText: { color: '#000', fontWeight: '800', fontSize: 13 },

  // ── PLAN SELECTION ──
  planHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: '#1A1628', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  planHeaderMid: { alignItems: 'center', paddingBottom: 16 },
  planLogoWrapper: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: '#FFF',
    borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  planHeaderLogo: { width: 50, height: 50 },
  planHeaderTitle: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  planHeaderSub:   { color: '#555', fontSize: 13, marginTop: 4 },

  planCard: {
    borderRadius: 22, borderWidth: 1.5, padding: 20, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden', position: 'relative',
  },
  popularBadge: {
    position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#C6FF0015', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#C6FF0040',
  },
  popularBadgeText: { color: '#C6FF00', fontSize: 10, fontWeight: '700' },
  planCardName: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  planCardFeatures: { color: '#555', fontSize: 13, marginTop: 4 },
  planCardRight: { alignItems: 'flex-end', gap: 4 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  planPriceSym: { color: '#C6FF00', fontSize: 13, fontWeight: '700' },
  planPriceVal: { color: '#C6FF00', fontSize: 26, fontWeight: '900' },
  planPriceMo:  { color: '#444', fontSize: 11 },
  selectBtn: {
    backgroundColor: '#1A1628', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: '#2A2040',
  },
  selectBtnText: { color: '#C6FF00', fontWeight: '700', fontSize: 12 },

  // ── MODAL ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0F0D18', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 48, borderTopWidth: 1, borderTopColor: '#1E1B2E',
  },
  modalPill: {
    width: 40, height: 4, backgroundColor: '#2A2A3A', borderRadius: 2,
    alignSelf: 'center', marginBottom: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalTitle:  { color: '#FFF', fontSize: 22, fontWeight: '800' },
  modalSub:    { color: '#555', fontSize: 13, marginTop: 3 },
  modalClose: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#1A1628',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBody: { color: '#888', fontSize: 16, lineHeight: 24, marginBottom: 28 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    backgroundColor: '#1A1628', alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2040',
  },
  cancelBtnText: { color: '#888', fontWeight: '700', fontSize: 15 },
  confirmBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  confirmBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },
});