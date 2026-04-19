/**
 * VentureClubScreen.tsx
 * Isolated Group Paper Trading & Polling for BODHI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { ChevronLeft, TrendingUp, Vote, Plus, BarChart2, Wallet } from 'lucide-react-native';
import { apiClient } from '../api/client';

// ── Design Tokens ──
const C = {
  bg: '#07051A',
  cardBg: '#0E0C24',
  neonLime: '#C8FF00',
  purple: '#A855F7',
  red: '#F43F5E',
  white: '#FFFFFF',
  whiteDim: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.08)',
};

// ── Mock Data (For holdings and polls until Phase 2 & 3) ──
const GROUP_PORTFOLIO = [
  { id: '1', symbol: 'RELIANCE', qty: 15, avgPrice: 2840.50, currentPrice: 2910.00 },
  { id: '2', symbol: 'TATAMOTORS', qty: 50, avgPrice: 920.00, currentPrice: 985.20 },
];

const ACTIVE_POLLS = [
  { id: 'p1', type: 'BUY', symbol: 'ZOMATO', qty: 100, votesFor: 3, votesAgainst: 1, totalNeeded: 5 },
];

export function VentureClubScreen({ route, navigation }: any) {
  const { clubId, clubName } = route.params || {};
  const [tab, setTab] = useState<'PORTFOLIO' | 'POLLS'>('PORTFOLIO');
  
  // ── Live State ──
  const [loading, setLoading] = useState(true);
  const [clubData, setClubData] = useState<any>(null);

  const formatINR = (val: number) => `₹${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // 1. Fetch live pool data
  const fetchClubData = async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/social/investments/${clubId}`);
      setClubData(response.data);
    } catch (error) {
      console.error("Failed to fetch club data:", error);
      Alert.alert("Error", "Could not load club details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, [clubId]);

  // 2. Add Funds Handler
  const handleAddFunds = () => {
    Alert.prompt(
      'Add Funds to Pool',
      'Enter the amount you want to contribute (₹)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deposit',
          onPress: async (amountStr) => {
            const amount = parseFloat(amountStr || '0');
            if (!amount || amount <= 0) return;
            
            try {
              await apiClient.post(`/social/investments/${clubId}/contribute`, {
                amount: amount,
              });
              await fetchClubData(); // Instantly refresh the buying power
            } catch (e) {
              Alert.alert("Error", "Failed to add funds.");
            }
          },
        },
      ],
      'plain-text',
      '',
      'number-pad'
    );
  };

  if (loading || !clubData) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.neonLime} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={20}>
          <ChevronLeft color={C.white} size={28} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{clubData.name || clubName}</Text>
          <Text style={styles.headerSub}>Isolated Group Fund</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* ── TABS ── */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'PORTFOLIO' && styles.activeTab]}
          onPress={() => setTab('PORTFOLIO')}
        >
          <BarChart2 size={16} color={tab === 'PORTFOLIO' ? C.bg : C.whiteDim} />
          <Text style={[styles.tabText, tab === 'PORTFOLIO' && styles.activeTabText]}>
            Portfolio
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, tab === 'POLLS' && styles.activeTab]}
          onPress={() => setTab('POLLS')}
        >
          <Vote size={16} color={tab === 'POLLS' ? C.bg : C.whiteDim} />
          <Text style={[styles.tabText, tab === 'POLLS' && styles.activeTabText]}>
            Active Polls (1)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'PORTFOLIO' ? (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Group Buying Power</Text>
              <Text style={styles.summaryValue}>{formatINR(clubData.buying_power)}</Text>
              
              <TouchableOpacity 
                style={styles.addFundsBtn} 
                activeOpacity={0.8}
                onPress={handleAddFunds}
              >
                <Wallet size={16} color={C.purple} />
                <Text style={styles.addFundsText}>Add Funds</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Current Holdings</Text>
            {GROUP_PORTFOLIO.map((item) => {
              const profit = (item.currentPrice - item.avgPrice) * item.qty;
              const isPositive = profit >= 0;
              return (
                <View key={item.id} style={styles.holdingCard}>
                  <View>
                    <Text style={styles.symbol}>{item.symbol}</Text>
                    <Text style={styles.qty}>{item.qty} Shares @ {formatINR(item.avgPrice)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.currentPrice}>{formatINR(item.currentPrice)}</Text>
                    <Text style={[styles.profit, { color: isPositive ? C.neonLime : C.red }]}>
                      {isPositive ? '+' : ''}{formatINR(profit)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.proposeBtn} activeOpacity={0.8}>
              <Plus size={20} color={C.bg} />
              <Text style={styles.proposeBtnText}>Propose New Trade</Text>
            </TouchableOpacity>

            {ACTIVE_POLLS.map((poll) => (
              <View key={poll.id} style={styles.pollCard}>
                <View style={styles.pollHeader}>
                  <View style={[styles.badge, { backgroundColor: poll.type === 'BUY' ? 'rgba(200,255,0,0.1)' : 'rgba(244,63,94,0.1)' }]}>
                    <Text style={[styles.badgeText, { color: poll.type === 'BUY' ? C.neonLime : C.red }]}>
                      {poll.type}
                    </Text>
                  </View>
                  <Text style={styles.pollTitle}>{poll.qty}x {poll.symbol}</Text>
                </View>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>Votes For: {poll.votesFor}</Text>
                    <Text style={styles.progressText}>Needed: {poll.totalNeeded}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(poll.votesFor / poll.totalNeeded) * 100}%` }]} />
                  </View>
                </View>

                <View style={styles.voteActions}>
                  <TouchableOpacity style={[styles.voteBtn, { borderColor: C.neonLime }]}>
                    <Text style={[styles.voteBtnText, { color: C.neonLime }]}>Vote YES</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.voteBtn, { borderColor: C.red }]}>
                    <Text style={[styles.voteBtnText, { color: C.red }]}>Vote NO</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { color: C.white, fontSize: 20, fontWeight: '800' },
  headerSub: { color: C.purple, fontSize: 12, fontWeight: '600', marginTop: 2 },
  
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border, gap: 6 },
  activeTab: { backgroundColor: C.neonLime, borderColor: C.neonLime },
  tabText: { color: C.whiteDim, fontSize: 14, fontWeight: '700' },
  activeTabText: { color: C.bg },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { color: C.white, fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 10 },
  
  summaryCard: { backgroundColor: C.purple, padding: 20, borderRadius: 20, marginBottom: 24, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  summaryValue: { color: C.white, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },

  holdingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.cardBg, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  symbol: { color: C.white, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  qty: { color: C.whiteDim, fontSize: 12, fontWeight: '500' },
  currentPrice: { color: C.white, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  profit: { fontSize: 13, fontWeight: '700' },

  proposeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.neonLime, paddingVertical: 16, borderRadius: 16, marginBottom: 24, gap: 8 },
  proposeBtnText: { color: C.bg, fontSize: 15, fontWeight: '800' },

  pollCard: { backgroundColor: C.cardBg, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  pollHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  pollTitle: { color: C.white, fontSize: 18, fontWeight: '800' },
  
  progressContainer: { marginBottom: 24 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: C.whiteDim, fontSize: 12, fontWeight: '600' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: C.neonLime, borderRadius: 4 },

  voteActions: { flexDirection: 'row', gap: 12 },
  voteBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  voteBtnText: { fontSize: 14, fontWeight: '700' },

  addFundsBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: C.white, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginTop: 16, 
    gap: 6 
  },
  addFundsText: { 
    color: C.purple, 
    fontSize: 14, 
    fontWeight: '800' 
  },
});