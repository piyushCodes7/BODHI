import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  AppState,
  Modal,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { isTablet, isLandscape, responsiveFont, responsiveWidth, responsiveHeight } from '../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';
import {
  Tv, Gamepad2, Briefcase, Music, BookOpen,
  ChevronRight, X, ChevronLeft, Search, Zap, Star,
  DollarSign, Flame, ArrowLeft,
} from 'lucide-react-native';
import { Colors, Gradients } from '../theme/tokens';
import { SubscriptionsAPI } from '../api/client';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 168;

const FILTER_CHIPS = ['All', 'Entertainment', 'Productivity', 'Music', 'Finance'];

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
  const props = { color: '#FF5A00', size: 18 };
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
  const navigation = useNavigation<any>();
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
          colors={['#FF5A00', '#FFB000']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={[styles.ctaText, { color: '#FFF' }]}>View Plans</Text>
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
          <ChevronRight color="#FF5A00" size={15} />
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
        <ActivityIndicator color="#FF5A00" size="large" />
        <Text style={{ color: '#555', marginTop: 12, fontSize: responsiveFont(13) }}>Loading marketplace…</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────
  // SUB-SCREEN: PLAN SELECTION
  // ─────────────────────────────────────────
  if (selectedService) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, maxWidth: isTablet ? (isLandscape() ? 900 : 700) : '100%', alignSelf: 'center', width: '100%' }}>
        <StatusBar barStyle="light-content" />



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
                    <Star color="#FFE600" size={10} fill="#FFE600" />
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
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────
  // MAIN SCREEN
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, maxWidth: isTablet ? (isLandscape() ? 1000 : 800) : '100%', alignSelf: 'center', width: '100%' }}>
      <StatusBar barStyle="light-content" />



      <FlatList
        data={filteredCategories}
        keyExtractor={(item: any) => item.categoryId}
        renderItem={renderCategory}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <View>
            {/* ── HERO HEADER ── */}
            {/* Back button */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.mainBackBtn}>
              <ArrowLeft size={22} color="#FFF" />
            </TouchableOpacity>

            <LinearGradient
              colors={['#1A0000', '#050505']}
              style={styles.heroGradient}
            >
              <View style={styles.heroRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.heroPill}>
                    <Zap color="#FF5A00" size={11} fill="#FF5A00" />
                    <Text style={styles.heroPillText}>BODHI Marketplace</Text>
                  </View>
                  <Text style={styles.heroTitle}>Discover{'\n'}Plans</Text>
                  <Text style={styles.heroSubtitle}>All your subscriptions,{'\n'}one intelligent hub.</Text>
                </View>
                <View style={styles.heroGraphic}>
                  <LinearGradient
                    colors={['#8B000055', '#FF5A0030']}
                    style={styles.heroGraphicInner}
                  >
                    <Flame color="#FF5A00" size={30} />
                  </LinearGradient>
                  <View style={[styles.orbDot, { top: -6, right: -6, backgroundColor: '#FF5A00' }]} />
                  <View style={[styles.orbDot, { bottom: -4, left: -4, backgroundColor: '#8B0000' }]} />
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
      </View>

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
              Add <Text style={{ color: '#FF5A00', fontWeight: '700' }}>{pendingSub?.name}</Text> to your Vault to monitor this recurring expense?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelLog}>
                <Text style={styles.cancelBtnText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAndLogToVault} style={{ flex: 1.6 }}>
                <LinearGradient colors={['#FF5A00', '#FFB000']} style={styles.confirmBtn}>
                  <Text style={[styles.confirmBtnText, { color: '#FFF' }]}>Add to Vault</Text>
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
  container:   { flex: 1, backgroundColor: '#050505' },
  centered:    { justifyContent: 'center', alignItems: 'center' },

  // Ambient orbs
  orb: { position: 'absolute', borderRadius: 999 },
  orbDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },

  // ── HERO ──
  heroGradient: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 24 },
  mainBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
    marginLeft: 20, marginTop: 52, marginBottom: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  heroRow:      { flexDirection: 'row', alignItems: 'flex-start' },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FF5A0015', borderRadius: 20, borderWidth: 1,
    borderColor: '#FF5A0033', paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 14,
  },
  heroPillText: { color: '#FF5A00', fontSize: responsiveFont(10), fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#FFF', fontSize: responsiveFont(42), fontWeight: '800', lineHeight: 48, letterSpacing: -0.5 },
  heroSubtitle: { color: '#666', fontSize: responsiveFont(13), marginTop: 8, lineHeight: 19 },
  heroGraphic: {
    width: 76, height: 76, marginLeft: 16, position: 'relative',
    justifyContent: 'center', alignItems: 'center',
  },
  heroGraphicInner: {
    width: 72, height: 72, borderRadius: 22, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: '#8B000044',
  },
  statsRow: {
    flexDirection: 'row', marginTop: 24, gap: 0,
    borderTopWidth: 1, borderTopColor: '#1A0505', paddingTop: 18,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal:  { color: '#FF5A00', fontSize: responsiveFont(20), fontWeight: '800' },
  statLabel:{ color: '#444', fontSize: responsiveFont(11), marginTop: 2 },

  // ── SEARCH ──
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F0808', borderRadius: 18,
    borderWidth: 1, borderColor: '#2E1B1B',
    marginHorizontal: 20, marginTop: 20, paddingHorizontal: 16, paddingVertical: 13,
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: responsiveFont(14), padding: 0 },

  // ── FILTER CHIPS ──
  chipsRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#0F0808',
    borderWidth: 1, borderColor: '#2E1B1B',
  },
  chipActive: { backgroundColor: '#FF5A0018', borderColor: '#FF5A0055' },
  chipText:       { color: '#555', fontSize: responsiveFont(13), fontWeight: '600' },
  chipTextActive: { color: '#FF5A00' },

  // Section label
  sectionLabel: {
    color: '#333', fontSize: responsiveFont(11), fontWeight: '700', letterSpacing: 1.5,
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
    backgroundColor: '#FF5A0012', borderWidth: 1, borderColor: '#FF5A0030',
    justifyContent: 'center', alignItems: 'center',
  },
  categoryTitle: { color: '#FFF', fontSize: responsiveFont(18), fontWeight: '700' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText:{ color: '#FF5A00', fontSize: responsiveFont(13), fontWeight: '600' },

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
  badgeText: { fontSize: responsiveFont(9), fontWeight: '700' },
  logoWrapper: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#FFFFFF', borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  brandLogo: { width: 36, height: 36 },
  appName: { color: '#FFF', fontSize: responsiveFont(15), fontWeight: '700', marginBottom: 3 },
  planText: { color: '#555', fontSize: responsiveFont(11), marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  priceFrom: { color: '#444', fontSize: responsiveFont(10) },
  priceNeon: { color: '#FF5A00', fontSize: responsiveFont(17), fontWeight: '800' },
  priceMo:   { color: '#444', fontSize: responsiveFont(10) },
  ctaGradient: { borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  ctaText: { color: '#000', fontWeight: '800', fontSize: responsiveFont(13) },

  // ── PLAN SELECTION ──
  planHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: '#1A0A08', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  planHeaderMid: { alignItems: 'center', paddingBottom: 16 },
  planLogoWrapper: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: '#FFF',
    borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  planHeaderLogo: { width: 50, height: 50 },
  planHeaderTitle: { color: '#FFF', fontSize: responsiveFont(24), fontWeight: '800' },
  planHeaderSub:   { color: '#555', fontSize: responsiveFont(13), marginTop: 4 },

  planCard: {
    borderRadius: 22, borderWidth: 1.5, padding: 20, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden', position: 'relative',
  },
  popularBadge: {
    position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FF5A0015', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FF5A0040',
  },
  popularBadgeText: { color: '#FFE600', fontSize: responsiveFont(10), fontWeight: '700' },
  planCardName: { color: '#FFF', fontSize: responsiveFont(20), fontWeight: '800' },
  planCardFeatures: { color: '#555', fontSize: responsiveFont(13), marginTop: 4 },
  planCardRight: { alignItems: 'flex-end', gap: 4 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  planPriceSym: { color: '#FF5A00', fontSize: responsiveFont(13), fontWeight: '700' },
  planPriceVal: { color: '#FF5A00', fontSize: responsiveFont(26), fontWeight: '900' },
  planPriceMo:  { color: '#444', fontSize: responsiveFont(11) },
  selectBtn: {
    backgroundColor: '#1A0A08', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: '#2A1510',
  },
  selectBtnText: { color: '#FF5A00', fontWeight: '700', fontSize: responsiveFont(12) },

  // ── MODAL ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0F0808', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 48, borderTopWidth: 1, borderTopColor: '#2E1B1B',
  },
  modalPill: {
    width: 40, height: 4, backgroundColor: '#2A2A3A', borderRadius: 2,
    alignSelf: 'center', marginBottom: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalTitle:  { color: '#FFF', fontSize: responsiveFont(22), fontWeight: '800' },
  modalSub:    { color: '#555', fontSize: responsiveFont(13), marginTop: 3 },
  modalClose: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#1A1628',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBody: { color: '#888', fontSize: responsiveFont(16), lineHeight: 24, marginBottom: 28 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    backgroundColor: '#1A0A08', alignItems: 'center',
    borderWidth: 1, borderColor: '#2A1510',
  },
  cancelBtnText: { color: '#888', fontWeight: '700', fontSize: responsiveFont(15) },
  confirmBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  confirmBtnText: { color: '#000', fontWeight: '900', fontSize: responsiveFont(15) },
});