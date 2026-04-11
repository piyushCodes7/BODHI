// ─────────────────────────────────────────────────────────────
//  PaperTradingScreen.tsx — BODHI Live Paper Trading
//  Trades against real NSE live prices with fake ₹1,00,000
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  TextInput, StyleSheet, Dimensions, ActivityIndicator,
  Modal, Alert, RefreshControl, Animated, KeyboardAvoidingView, Platform
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';
import { useRoute, useNavigation } from '@react-navigation/native';

import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';
import { BodhiHeader, useHeaderHeight } from '../components/BodhiHeader';
import { apiClient } from '../api/client';

const { width: W } = Dimensions.get('window');
const S = Spacing;

// ─── Types ───────────────────────────────────────────────────
interface LivePrice {
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
  note?: string;
}

interface Holding {
  symbol: string;
  qty: number;
  avg_price: number;
  live_price: number;
  current_value: number;
  invested_value: number;
  pnl: number;
  pnl_pct: number;
}

interface Portfolio {
  cash: number;
  total_value: number;
  starting_capital: number;
  total_pnl: number;
  total_pnl_pct: number;
  holdings: Holding[];
  market_status: MarketStatus;
}

interface MarketStatus {
  open: boolean;
  status: string;
  message: string;
  next_open?: string;
}

interface CostsPreview {
  symbol: string;
  live_price: number;
  quantity: number;
  trade_value: number;
  net_amount: number;
  costs: {
    brokerage: number;
    stt: number;
    exchange_fee: number;
    gst: number;
    total: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (n: number) => 
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

const fmtPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

// ─── Main Screen ─────────────────────────────────────────────
export function PaperTradingScreen() {
  const headerH = useHeaderHeight();
  const route = useRoute<any>();

  // ── Portfolio & Market State ──
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

  // ── Trade Modal State ──
  const [tradeModal, setTradeModal] = useState(false);
  const [tradeSide, setTradeSide] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeSymbol, setTradeSymbol] = useState('');
  const [tradeAmount, setTradeAmount] = useState(''); 
  const [tradeQty, setTradeQty] = useState(''); 
  const [livePrice, setLivePrice] = useState<LivePrice | null>(null);
  const [costsPreview, setCostsPreview] = useState<CostsPreview | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // ── Stock Search State ──
  const [searchModal, setSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // ─── Data Fetching ───
  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await apiClient.get('/trade/portfolio');
      setPortfolio(res.data);
      setMarketStatus(res.data.market_status);
    } catch (e) {
      console.error("Portfolio fetch failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle deep-link from Market Screen
  useEffect(() => {
    if (route.params?.symbol) {
      const { symbol, openBuy } = route.params;
      handleOpenTrade(openBuy ? 'BUY' : 'SELL', symbol);
    }
  }, [route.params]);

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const handleOpenTrade = async (side: 'BUY' | 'SELL', symbol: string) => {
    setTradeSide(side);
    setTradeSymbol(symbol);
    setTradeAmount('');
    setTradeQty('');
    setTradeModal(true);
    
    try {
      const res = await apiClient.get(`/price/live?symbol=${symbol}`);
      setLivePrice(res.data);
    } catch (e) {
      Alert.alert("Price Error", "Could not fetch live price.");
    }
  };

  const fetchCosts = async () => {
    if (!tradeSymbol || !livePrice) return;
    const amount = tradeSide === 'BUY' ? parseFloat(tradeAmount) : (parseFloat(tradeQty) * livePrice.price);
    if (!amount || amount <= 0) return;

    try {
      const res = await apiClient.get(`/trade/costs-preview?symbol=${tradeSymbol}&amount_inr=${amount}&side=${tradeSide}`);
      setCostsPreview(res.data);
    } catch (e) {
      setCostsPreview(null);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(fetchCosts, 500);
    return () => clearTimeout(delayDebounce);
  }, [tradeAmount, tradeQty]);

  const executeTrade = async () => {
    if (tradeSide === 'BUY' && portfolio && parseFloat(tradeAmount) > portfolio.cash) {
      Alert.alert("Insufficient Funds", "You don't have enough cash for this trade.");
      return;
    }

    setIsExecuting(true);
    try {
      if (tradeSide === 'BUY') {
        await apiClient.post('/trade/buy', { symbol: tradeSymbol, amount_inr: parseFloat(tradeAmount) });
      } else {
        await apiClient.post('/trade/sell', { symbol: tradeSymbol, quantity: parseInt(tradeQty) });
      }
      setTradeModal(false);
      fetchPortfolio();
      Alert.alert("Success", `Order executed for ${tradeSymbol}`);
    } catch (e: any) {
      Alert.alert("Trade Failed", e.response?.data?.detail || "Order could not be processed.");
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading && !portfolio) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.electricViolet} />
      </View>
    );
  }

  const isUp = (portfolio?.total_pnl ?? 0) >= 0;

  return (
    <View style={styles.root}>
      <BodhiHeader />
      
      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingTop: headerH + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPortfolio(); }} />}
      >
        {/* Title & Market Status */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Paper <Text style={{ fontStyle: 'italic', color: Colors.electricViolet }}>Trade</Text></Text>
          <View style={[styles.marketPill, { backgroundColor: marketStatus?.open ? Colors.neonLime + '20' : Colors.surfaceHighest }]}>
             <Text style={[styles.marketPillText, { color: marketStatus?.open ? Colors.neonLimeDark : Colors.textMuted }]}>
               NSE {marketStatus?.open ? 'LIVE' : 'CLOSED'}
             </Text>
          </View>
        </View>

        {/* Main Portfolio Banner */}
        <LinearGradient
          colors={isUp ? [Colors.electricViolet, Colors.magenta, Colors.hotPink] : ['#1a1a2e', '#16213e']}
          style={styles.banner}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.bannerLabel}>NET PORTFOLIO VALUE</Text>
          <Text style={styles.bannerValue}>{fmt(portfolio?.total_value || 0)}</Text>
          
          <View style={styles.bannerBottom}>
            <View>
              <Text style={styles.bannerSubLabel}>TOTAL P&L</Text>
              <Text style={[styles.bannerPnl, { color: isUp ? Colors.neonLime : '#ff6b6b' }]}>
                {isUp ? '+' : ''}{fmt(portfolio?.total_pnl || 0)} ({fmtPct(portfolio?.total_pnl_pct || 0)})
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.bannerSubLabel}>AVAILABLE CASH</Text>
              <Text style={styles.bannerCash}>{fmt(portfolio?.cash || 0)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setTradeSide('BUY'); setTradeSymbol(''); setTradeModal(true); }}>
            <Text style={styles.actionBtnIcon}>+</Text>
            <Text style={styles.actionBtnText}>Buy Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setTradeSide('SELL'); setTradeSymbol(''); setTradeModal(true); }}>
            <Text style={styles.actionBtnIcon}>−</Text>
            <Text style={styles.actionBtnText}>Sell Stock</Text>
          </TouchableOpacity>
        </View>

        {/* Holdings List */}
        <Text style={styles.sectionTitle}>Your Holdings</Text>
        {portfolio?.holdings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No stocks in your vault yet.</Text>
          </View>
        ) : (
          portfolio?.holdings.map((h, i) => (
            <TouchableOpacity key={i} style={styles.holdingRow} onPress={() => handleOpenTrade('SELL', h.symbol)}>
              <View style={styles.holdingIcon}>
                <Text style={styles.holdingIconText}>{h.symbol.substring(0,2)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.holdingSymbol}>{h.symbol}</Text>
                <Text style={styles.holdingMeta}>{h.qty} shares @ {fmt(h.avg_price)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.holdingValue}>{fmt(h.current_value)}</Text>
                <Text style={{ color: h.pnl >= 0 ? '#16a34a' : Colors.errorRed, fontSize: 12, fontWeight: '700' }}>
                  {h.pnl >= 0 ? '+' : ''}{h.pnl_pct}%
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* TRADE MODAL */}
      <Modal visible={tradeModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{tradeSide} Order</Text>
            <TouchableOpacity onPress={() => setTradeModal(false)}><Text style={styles.modalClose}>Cancel</Text></TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={{ padding: S.xl, gap: S.xl }}>
            {/* Live Price Header */}
            <View style={styles.livePriceHeader}>
              <Text style={styles.modalSubtitle}>{tradeSymbol || 'Select a stock'}</Text>
              {livePrice ? (
                <Text style={styles.livePriceMain}>{fmt(livePrice.price)}</Text>
              ) : <ActivityIndicator color={Colors.electricViolet} />}
            </View>

            {/* Input */}
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>{tradeSide === 'BUY' ? 'INVESTMENT AMOUNT' : 'QUANTITY'}</Text>
              <TextInput
                style={styles.mainInput}
                keyboardType="numeric"
                placeholder={tradeSide === 'BUY' ? "₹10,000" : "10"}
                value={tradeSide === 'BUY' ? tradeAmount : tradeQty}
                onChangeText={tradeSide === 'BUY' ? setTradeAmount : setTradeQty}
                autoFocus
              />
            </View>

            {/* Order Summary / Costs Preview */}
            {costsPreview && (
              <View style={styles.costsCard}>
                <Text style={styles.costsHeader}>ORDER SUMMARY</Text>
                <View style={styles.costRow}><Text style={styles.costKey}>Quantity</Text><Text style={styles.costVal}>{costsPreview.quantity}</Text></View>
                <View style={styles.costRow}><Text style={styles.costKey}>Brokerage</Text><Text style={styles.costVal}>{fmt(costsPreview.costs.brokerage)}</Text></View>
                <View style={styles.costRow}><Text style={styles.costKey}>Taxes (STT/GST)</Text><Text style={styles.costVal}>{fmt(costsPreview.costs.stt + costsPreview.costs.gst)}</Text></View>
                <View style={[styles.costRow, { marginTop: 8, borderTopWidth: 1, borderColor: '#eee', paddingTop: 8 }]}>
                  <Text style={styles.totalLabel}>TOTAL {tradeSide === 'BUY' ? 'DEBIT' : 'CREDIT'}</Text>
                  <Text style={styles.totalValue}>{fmt(costsPreview.net_amount)}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.executeBtn, { backgroundColor: tradeSide === 'BUY' ? '#16a34a' : Colors.errorRed }]} 
              onPress={executeTrade}
              disabled={isExecuting}
            >
              {isExecuting ? <ActivityIndicator color="#fff" /> : <Text style={styles.executeText}>CONFIRM {tradeSide}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingHorizontal: S.xxl, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.xl },
  pageTitle: { fontFamily: Fonts.headline, fontSize: 32, fontWeight: '700', color: Colors.textPrimary },
  marketPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  marketPillText: { fontFamily: Fonts.label, fontSize: 10, fontWeight: '800' },
  banner: { borderRadius: Radius.lg, padding: S.xxl, marginBottom: S.xl },
  bannerLabel: { fontFamily: Fonts.label, fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.5 },
  bannerValue: { fontFamily: Fonts.headline, fontSize: 38, color: '#fff', fontWeight: '900', marginVertical: 8 },
  bannerBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  bannerSubLabel: { fontFamily: Fonts.label, fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  bannerPnl: { fontFamily: Fonts.headline, fontSize: 18, fontWeight: '700' },
  bannerCash: { fontFamily: Fonts.headline, fontSize: 18, color: '#fff', fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: S.md, marginBottom: S.xxl },
  actionBtn: { flex: 1, backgroundColor: Colors.surfaceWhite, padding: S.lg, borderRadius: Radius.md, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.surfaceHighest },
  actionBtnIcon: { fontSize: 20, color: Colors.electricViolet, fontWeight: '700' },
  actionBtnText: { fontFamily: Fonts.label, fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  sectionTitle: { fontFamily: Fonts.headline, fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: S.lg },
  holdingRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: Colors.surfaceWhite, padding: S.lg, borderRadius: Radius.md, marginBottom: S.sm },
  holdingIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.electricViolet + '20', alignItems: 'center', justifyContent: 'center' },
  holdingIconText: { color: Colors.electricViolet, fontWeight: '900', fontSize: 12 },
  holdingSymbol: { fontFamily: Fonts.body, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  holdingMeta: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textSecondary },
  holdingValue: { fontFamily: Fonts.headline, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontFamily: Fonts.body },
  modal: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: S.xl, borderBottomWidth: 1, borderColor: Colors.surfaceHighest },
  modalTitle: { fontFamily: Fonts.headline, fontSize: 20, fontWeight: '700' },
  modalClose: { color: Colors.electricViolet, fontWeight: '700' },
  livePriceHeader: { alignItems: 'center', marginVertical: S.xl },
  modalSubtitle: { fontFamily: Fonts.label, color: Colors.textSecondary, fontSize: 14 },
  livePriceMain: { fontFamily: Fonts.headline, fontSize: 40, fontWeight: '900', color: Colors.textPrimary },
  inputBox: { gap: 8 },
  inputLabel: { fontFamily: Fonts.label, fontSize: 10, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 1 },
  mainInput: { backgroundColor: Colors.surfaceWhite, padding: S.xl, borderRadius: Radius.md, fontSize: 28, fontFamily: Fonts.headline, fontWeight: '700', color: Colors.textPrimary },
  costsCard: { backgroundColor: Colors.surfaceWhite, padding: S.xl, borderRadius: Radius.md, gap: 6 },
  costsHeader: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, marginBottom: 4 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between' },
  costKey: { color: Colors.textSecondary, fontSize: 13 },
  costVal: { fontWeight: '600', color: Colors.textPrimary },
  totalLabel: { fontWeight: '800', fontSize: 14 },
  totalValue: { fontWeight: '900', fontSize: 18, color: Colors.textPrimary },
  executeBtn: { padding: 20, borderRadius: Radius.md, alignItems: 'center', marginTop: S.xl },
  executeText: { color: '#fff', fontFamily: Fonts.headline, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});