/**
 * SocialScreen.tsx
 * Social Hub — Shared Investments & Trip Wallets
 * React Native (Expo) · TypeScript · lucide-react-native
 */
import { useEffect } from 'react';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from 'react-native';
import {
  Plane,
  TrendingUp,
  Plus,
  MoreVertical,
  ChevronRight,
  Users,
  Vote,
  Wallet,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../api/client';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: W } = Dimensions.get('window');

// ── Design Tokens ────────────────────────────────────────────

const C = {
  bg:           '#07051A',
  cardBg:       '#0E0C24',
  neonLime:     '#C8FF00',
  purple:       '#A855F7',
  red:          '#F43F5E',
  white:        '#FFFFFF',
  whiteMid:     'rgba(255,255,255,0.65)',
  whiteDim:     'rgba(255,255,255,0.35)',
  border:       'rgba(255,255,255,0.06)',
  limeBg:       'rgba(200,255,0,0.08)',
  limeBorder:   'rgba(200,255,0,0.22)',
  purpleBg:     'rgba(168,85,247,0.10)',
  purpleBorder: 'rgba(168,85,247,0.25)',
};

// ── Types ────────────────────────────────────────────────────

interface InvestmentClub {
  id: string;
  name: string;
  members: number;
  pendingVotes: number;
  totalValue: string;
  totalReturns: string;
  returnsPct: string;
  yourShare: string;
}

interface TripWallet {
  id: string;
  name: string;
  members: number;
  status: string;
  totalBalance: string;
  youSpent: string;
  youOwe: string;
  owes: boolean; // true = you owe money
}

// ── Mock Data ─────────────────────────────────────────────────

const INIT_VENTURES: InvestmentClub[] = [
  {
    id: 'v1',
    name: 'Growth Alphas',
    members: 5,
    pendingVotes: 1,
    totalValue: '₹2,45,680.50',
    totalReturns: '+₹18,750.30',
    returnsPct: '+8.25%',
    yourShare: '₹49,136.10',
  },
];

const INIT_TRIPS: TripWallet[] = [
  {
    id: 't1',
    name: 'Thailand Trip',
    members: 4,
    status: 'Just started',
    totalBalance: '₹62,340.00',
    youSpent: '₹8,120.00',
    youOwe: '₹2,430.00',
    owes: true,
  },
];

// ── Sub-Components ────────────────────────────────────────────

function StatDivider() {
  return <View style={styles.statDivider} />;
}

function ActiveBadge() {
  return (
    <View style={styles.activeBadge}>
      <View style={styles.activeDot} />
      <Text style={styles.activeBadgeText}>Active</Text>
    </View>
  );
}

function InvestmentCard({
  club,
  onOptions,
  onViewPortfolio,
}: {
  club: InvestmentClub;
  onOptions: () => void;
  onViewPortfolio: () => void;
}) {
  return (
    <View style={styles.card}>
      {/* Subtle top accent line */}
      <LinearGradient
        colors={[C.purple, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardAccentLine}
      />

      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBox, { backgroundColor: C.purpleBg, borderColor: C.purple }]}>
            <TrendingUp size={22} color={C.purple} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{club.name}</Text>
            <View style={styles.metaRow}>
              <Users size={11} color={C.whiteDim} />
              <Text style={styles.cardMeta}>{club.members} Members</Text>
              {club.pendingVotes > 0 && (
                <>
                  <Text style={styles.metaDot}>·</Text>
                  <Vote size={11} color={C.neonLime} />
                  <Text style={[styles.cardMeta, { color: C.neonLime }]}>
                    {club.pendingVotes} Vote Pending
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          <ActiveBadge />
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={onOptions}
          >
            <MoreVertical size={18} color={C.whiteDim} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.cardInternalDivider} />

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>Total Value</Text>
          <Text style={[styles.statValue, { color: C.neonLime }]}>{club.totalValue}</Text>
        </View>
        <StatDivider />
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>Total Returns</Text>
          <Text style={[styles.statValue, { color: C.neonLime }]}>{club.totalReturns}</Text>
          <Text style={styles.statSubGreen}>{club.returnsPct}</Text>
        </View>
        <StatDivider />
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>Your Share</Text>
          <Text style={styles.statValue}>{club.yourShare}</Text>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.cardActionBtn, { borderColor: C.purpleBorder }]}
        onPress={onViewPortfolio}
        activeOpacity={0.7}
      >
        <Text style={[styles.cardActionText, { color: C.purple }]}>View Portfolio</Text>
        <ChevronRight size={15} color={C.purple} />
      </TouchableOpacity>
    </View>
  );
}

function TripCard({
  trip,
  onOptions,
  onSettle,
}: {
  trip: TripWallet;
  onOptions: () => void;
  onSettle: () => void;
}) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[C.neonLime, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardAccentLine}
      />

      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBox, { backgroundColor: C.limeBg, borderColor: C.neonLime }]}>
            <Plane size={22} color={C.neonLime} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{trip.name}</Text>
            <View style={styles.metaRow}>
              <Users size={11} color={C.whiteDim} />
              <Text style={styles.cardMeta}>{trip.members} Members</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.cardMeta}>{trip.status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          <ActiveBadge />
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={onOptions}
          >
            <MoreVertical size={18} color={C.whiteDim} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardInternalDivider} />

      <View style={styles.statsGrid}>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>Total Balance</Text>
          <Text style={[styles.statValue, { color: C.neonLime }]}>{trip.totalBalance}</Text>
        </View>
        <StatDivider />
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>You Spent</Text>
          <Text style={styles.statValue}>{trip.youSpent}</Text>
        </View>
        <StatDivider />
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>You Owe</Text>
          <Text style={[styles.statValue, trip.owes && { color: C.red }]}>{trip.youOwe}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.cardActionBtn, { borderColor: C.purpleBorder }]}
        onPress={onSettle}
        activeOpacity={0.7}
      >
        <Text style={[styles.cardActionText, { color: C.purple }]}>Settle Up</Text>
        <ChevronRight size={15} color={C.purple} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────

export function SocialScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const [ventures, setVentures] = useState<InvestmentClub[]>([]);
  const [trips, setTrips] = useState<TripWallet[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Handlers ──────────────────────────────────────────────

  const fetchSocialData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/social/dashboard'); 
      
      // If backend returns empty lists, fall back to our beautiful mock data so the UI looks alive!
      if (response.data?.investments?.length > 0) {
        setVentures(response.data.investments);
      } else {
        setVentures(INIT_VENTURES);
      }

      if (response.data?.trips?.length > 0) {
        setTrips(response.data.trips);
      } else {
        setTrips(INIT_TRIPS);
      }

    } catch (error) {
      console.error("Error fetching social data:", error);
      // Fallback on network/auth errors as well to keep the demo alive
      setVentures(INIT_VENTURES);
      setTrips(INIT_TRIPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialData();
  }, []);

  const handleAddVenture = () => {
    Alert.prompt(
      'New Investment Club',
      'Give your club a name',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (name) => {
            if (!name?.trim()) return;
            try {
              // Hit your new backend endpoint
              await apiClient.post('/social/investments', { name: name.trim() });
              // Refresh the dashboard to pull the new live data
              await fetchSocialData(); 
            } catch (e) {
              Alert.alert("Error", "Failed to create investment club.");
            }
          },
        },
      ],
    );
  };

  const handleAddTrip = () => {
    Alert.prompt(
      'New Trip Wallet',
      'Where are you headed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (name) => {
            if (!name?.trim()) return;
            try {
              await apiClient.post('/social/trips', { name: name.trim() });
              await fetchSocialData();
            } catch (e) {
              Alert.alert("Error", "Failed to create trip wallet.");
            }
          },
        },
      ],
    );
  };

  const ventureOptions = (id: string) => {
    Alert.alert('Manage Club', 'Are you sure you want to disband this club?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disband',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            // 1. Tell the database to delete it
            await apiClient.delete(`/social/investments/${id}`);
            // 2. Refresh the screen with the live database data
            await fetchSocialData(); 
          } catch (e) {
            console.error("Delete error:", e);
            Alert.alert("Error", "Failed to delete the investment club.");
            setLoading(false);
          }
        },
      },
    ]);
  };

  const tripOptions = (id: string) => {
    Alert.alert('Manage Trip', 'Are you sure you want to delete this trip wallet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await apiClient.delete(`/social/trips/${id}`);
            await fetchSocialData();
          } catch (e) {
            console.error("Delete error:", e);
            Alert.alert("Error", "Failed to delete the trip wallet.");
            setLoading(false);
          }
        },
      },
    ]);
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0A0322', '#07051A', '#07051A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Math.max(insets.top, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO HEADER ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Social <Text style={{ color: C.neonLime }}>Hub</Text>
            </Text>
            <Text style={styles.subtitle}>Shared wealth & group adventures</Text>
          </View>

          {/* Concentric glow orb */}
          <View style={styles.orbContainer}>
            <View style={styles.orbOuter} />
            <View style={styles.orbInner} />
            <View style={styles.orbIcons}>
              <View style={[styles.miniIconBox, { backgroundColor: C.limeBg, borderColor: C.limeBorder }]}>
                <TrendingUp size={14} color={C.neonLime} strokeWidth={2.5} />
              </View>
              <Users size={36} color={C.purple} strokeWidth={1.5} style={{ marginHorizontal: 4 }} />
              <View style={[styles.miniIconBox, { backgroundColor: 'rgba(244,63,94,0.12)', borderColor: 'rgba(244,63,94,0.3)' }]}>
                <Plane size={14} color={C.red} strokeWidth={2.5} />
              </View>
            </View>
          </View>
        </View>

        {/* ── SHARED INVESTMENTS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Shared Investments</Text>
              <Text style={styles.sectionSub}>Invest together. Grow together.</Text>
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={handleAddVenture} activeOpacity={0.75}>
              <Plus size={14} color={C.neonLime} strokeWidth={2.5} />
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>

          {ventures.length === 0 ? (
            <View style={styles.emptyCard}>
              <TrendingUp size={32} color={C.whiteDim} />
              <Text style={styles.emptyText}>No investment clubs yet.</Text>
              <Text style={styles.emptyHint}>Create one and start growing together.</Text>
            </View>
          ) : (
            ventures.map((v) => (
              <InvestmentCard
                key={v.id}
                club={v}
                onOptions={() => ventureOptions(v.id)}
                onViewPortfolio={() =>
                  navigation.navigate('VentureClub', { clubId: v.id, clubName: v.name })
                }
              />
            ))
          )}
        </View>

        {/* ── SHARED TRIP WALLETS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Shared Trip Wallets</Text>
              <Text style={styles.sectionSub}>Travel together. Spend together.</Text>
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={handleAddTrip} activeOpacity={0.75}>
              <Plus size={14} color={C.neonLime} strokeWidth={2.5} />
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>

          {trips.length === 0 ? (
            <View style={styles.emptyCard}>
              <Plane size={32} color={C.whiteDim} />
              <Text style={styles.emptyText}>No active trips yet.</Text>
              <Text style={styles.emptyHint}>Plan your next adventure together.</Text>
            </View>
          ) : (
            trips.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                onOptions={() => tripOptions(t.id)}
                onSettle={() =>
                  navigation.navigate('TripWallet', { tripId: t.id, tripName: t.name })
                }
              />
            ))
          )}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // HEADER
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 8,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: C.white,
    letterSpacing: -1.2,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 13,
    color: C.whiteMid,
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  // ORB
  orbContainer: {
    width: 128,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbOuter: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.28)',
  },
  orbInner: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.15)',
    backgroundColor: 'rgba(168,85,247,0.04)',
  },
  orbIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  miniIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // SECTION
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.5,
  },
  sectionSub: {
    fontSize: 12,
    color: C.whiteDim,
    marginTop: 3,
    fontWeight: '500',
  },

  // CREATE BUTTON
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: C.limeBg,
    borderWidth: 1,
    borderColor: C.limeBorder,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.neonLime,
    letterSpacing: 0.2,
  },

  // EMPTY STATE
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  emptyText: {
    color: C.whiteMid,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyHint: {
    color: C.whiteDim,
    fontSize: 12,
  },

  // CARD
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  cardAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
    marginTop: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  cardMeta: {
    fontSize: 12,
    color: C.whiteDim,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 12,
    color: C.whiteDim,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },

  // ACTIVE BADGE
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: C.limeBg,
    borderWidth: 1,
    borderColor: C.limeBorder,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.neonLime,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.neonLime,
    letterSpacing: 0.5,
  },

  // INTERNAL DIVIDER
  cardInternalDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 18,
  },

  // STATS
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  statColumn: {
    flex: 1,
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 10,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: C.whiteDim,
    fontWeight: '500',
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.3,
  },
  statSubGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: C.neonLime,
    marginTop: 2,
  },

  // CARD ACTION
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: C.purpleBg,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});