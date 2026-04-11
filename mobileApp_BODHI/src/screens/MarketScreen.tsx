// ─────────────────────────────────────────────────────────────
//  MarketScreen.tsx — Time Warp Simulator + Live Paper Trading
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Dimensions, ActivityIndicator,
  Modal, FlatList, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';

import { apiClient } from '../api/client';
import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';
import { BodhiHeader, useHeaderHeight } from '../components/BodhiHeader';

const { width: W } = Dimensions.get('window');

type Mode = 'Historical' | 'Predictive';
type TradeSide = 'BUY' | 'SELL';

interface CrashEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  lesson: string;
  nifty_fall_pct: number;
}

interface StockOption {
  symbol: string;
  name: string;
  exchange: string;
}

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%';

function thinChartData(data: any[], maxPoints = 120) {
  if (!data || data.length <= maxPoints) return data || [];
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0 || i === data.length - 1);
}

export function MarketScreen() {
  const headerH = useHeaderHeight();

  // ── Input state ──
  const [amountText, setAmountText] = useState('10000');
  const [mode, setMode]             = useState<Mode>('Historical');
  const [selectedStock, setSelectedStock] = useState<StockOption>({
    symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE',
  });
  const [selectedEvent, setSelectedEvent] = useState<CrashEvent | null>(null);
  const [customStartDate, setCustomStartDate] = useState('');

  // ── Remote data ──
  const [crashEvents, setCrashEvents] = useState<CrashEvent[]>([]);
  const [simResult, setSimResult]     = useState<any | null>(null);

  // ── UI state ──
  const [loading, setLoading]               = useState(false);
  const [loadingEvents, setLoadingEvents]   = useState(true);
  const [showStockPicker, setShowStockPicker] = useState(false);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState<StockOption[]>([]);
  const [searchLoading, setSearchLoading]   = useState(false);

  // ── Live Trading State ──
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeSide, setTradeSide]           = useState<TradeSide>('BUY');
  const [tradeInput, setTradeInput]         = useState('');
  const [livePrice, setLivePrice]           = useState<number | null>(null);
  const [isTrading, setIsTrading]           = useState(false);

  // ── Fetch crash events on mount ──
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('/simulate/events');
        setCrashEvents(res.data.events || []);
        if (res.data.events?.length) setSelectedEvent(res.data.events[0]);
      } catch (e) {
        console.error('Events fetch failed:', e);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // ── Stock search ──
  const searchStocks = useCallback(async (q: string) => {
    setSearchLoading(true);
    try {
      const res = await apiClient.get(`/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchStocks(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchStocks]);

  // ── Run simulation ──
  const simulate = async () => {
    const amount = parseFloat(amountText.replace(/[₹, ]/g, ''));
    if (!amount || amount < 100) {
      Alert.alert('Amount too low', 'Enter at least ₹100 to simulate.');
      return;
    }

    setLoading(true);
    setSimResult(null);

    try {
      if (mode === 'Historical') {
        if (!selectedEvent) return;
        const res = await apiClient.post('/simulate/crash', {
          symbol:         selectedStock.symbol,
          crash_event_id: selectedEvent.id,
          investment_inr: amount,
        });
        setSimResult({ mode: 'crash', ...res.data });
      } else {
        const start = customStartDate || '2022-01-01';
        const res = await apiClient.post('/simulate/replay', {
          symbol:         selectedStock.symbol,
          start_date:     start,
          investment_inr: amount,
        });
        setSimResult({ mode: 'replay', ...res.data });
      }
    } catch (e: any) {
      Alert.alert('Simulation Error', e.response?.data?.detail || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Live Trading Functions ──
  const openTradeModal = async () => {
    setShowTradeModal(true);
    setLivePrice(null);
    setTradeInput('');
    try {
      const res = await apiClient.get(`/price/live?symbol=${selectedStock.symbol}`);
      setLivePrice(res.data.price);
    } catch (e) {
      Alert.alert('Price Fetch Failed', 'Could not fetch live market data right now.');
      setShowTradeModal(false);
    }
  };

  const executeTrade = async () => {
    const val = parseFloat(tradeInput);
    if (!val || val <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid amount.');
      return;
    }

    setIsTrading(true);
    try {
      if (tradeSide === 'BUY') {
        await apiClient.post('/trade/buy', {
          symbol: selectedStock.symbol,
          amount_inr: val,
        });
        Alert.alert('Trade Successful! 🎉', `You successfully bought ₹${val} of ${selectedStock.symbol}. Check your Vault!`);
      } else {
        await apiClient.post('/trade/sell', {
          symbol: selectedStock.symbol,
          quantity: val, 
        });
        Alert.alert('Trade Successful! 💸', `You sold ${val} shares of ${selectedStock.symbol}. Check your Vault!`);
      }
      setShowTradeModal(false);
    } catch (e: any) {
      Alert.alert('Trade Failed', e.response?.data?.detail || 'Could not execute trade.');
    } finally {
      setIsTrading(false);
    }
  };

  // ── Derived display values ──
  const sim = simResult?.simulation ?? simResult?.primary ?? null;
  const chartData = sim ? thinChartData(sim.chart_data) : [];
  const isGain = sim ? sim.gain_pct >= 0 : true;

  return (
    <View style={styles.root}>
      <BodhiHeader />

      {/* ─── LIVE TRADING MODAL ──────────────────────────── */}
      <Modal visible={showTradeModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Live Trade</Text>
            <TouchableOpacity onPress={() => setShowTradeModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: Spacing.xxl, gap: Spacing.xl }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={styles.assetTicker}>{selectedStock.name} ({selectedStock.symbol})</Text>
              {livePrice ? (
                <Text style={[styles.pageTitle, { marginTop: 4 }]}>{fmt(livePrice)}</Text>
              ) : (
                <ActivityIndicator color={Colors.electricViolet} style={{ marginTop: 10 }} />
              )}
              <Text style={styles.inputLabel}>LIVE MARKET PRICE</Text>
            </View>

            <View style={styles.toggle}>
              {(['BUY', 'SELL'] as TradeSide[]).map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setTradeSide(s)}
                  style={[styles.toggleBtn, tradeSide === s && (s === 'BUY' ? styles.toggleActiveBuy : styles.toggleActiveSell)]}
                >
                  <Text style={[styles.toggleText, tradeSide === s && { color: s === 'BUY' ? Colors.neonLimeDark : '#fff' }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>
                {tradeSide === 'BUY' ? 'INVESTMENT AMOUNT (₹)' : 'QUANTITY TO SELL (SHARES)'}
              </Text>
              <View style={styles.inputRow}>
                {tradeSide === 'BUY' && <Text style={styles.currencyPrefix}>₹</Text>}
                <TextInput
                  value={tradeInput}
                  onChangeText={setTradeInput}
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder={tradeSide === 'BUY' ? "10000" : "5"}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.ctaBtn, 
                { backgroundColor: tradeSide === 'BUY' ? Colors.neonLime : Colors.errorRed },
                (!livePrice || isTrading) && { opacity: 0.6 }
              ]}
              onPress={executeTrade}
              disabled={!livePrice || isTrading}
            >
              {isTrading ? (
                <ActivityIndicator color={tradeSide === 'BUY' ? Colors.neonLimeDark : '#fff'} />
              ) : (
                <Text style={[styles.ctaText, { color: tradeSide === 'BUY' ? Colors.neonLimeDark : '#fff' }]}>
                  CONFIRM {tradeSide} ORDER
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── STOCK PICKER MODAL ──────────────────────────── */}
      <Modal visible={showStockPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Asset</Text>
            <TouchableOpacity onPress={() => setShowStockPicker(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search NSE / BSE…"
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchLoading && <ActivityIndicator style={{ marginTop: 16 }} />}
          <FlatList
            data={searchResults}
            keyExtractor={i => i.symbol}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchRow}
                onPress={() => {
                  setSelectedStock(item);
                  setShowStockPicker(false);
                  setSearchQuery('');
                }}
              >
                <View style={styles.assetIconSmall}>
                  <Text style={{ fontSize: 14 }}>📈</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchRowName}>{item.name}</Text>
                  <Text style={styles.searchRowMeta}>{item.symbol} • {item.exchange}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* ─── EVENT PICKER MODAL ──────────────────────────── */}
      <Modal visible={showEventPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pick a Crash Event</Text>
            <TouchableOpacity onPress={() => setShowEventPicker(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={crashEvents}
            keyExtractor={i => i.id}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.eventRow,
                  selectedEvent?.id === item.id && styles.eventRowSelected,
                ]}
                onPress={() => {
                  setSelectedEvent(item);
                  setShowEventPicker(false);
                }}
              >
                <Text style={styles.eventEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{item.name}</Text>
                  <Text style={styles.eventDesc}>{item.description}</Text>
                  <Text style={[styles.eventFall, { color: Colors.errorRed }]}>
                    Nifty fell {item.nifty_fall_pct}%
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* ─── MAIN SCROLL ──────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerH + 16 }]}
      >
        <Text style={styles.pageTitle}>
          Time <Text style={styles.pageTitleItalic}>Warp</Text>
        </Text>

        {/* Asset picker with Trade button */}
        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>ASSET OF CHOICE</Text>
          <View style={styles.assetRow}>
            <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => setShowStockPicker(true)}>
              <View style={styles.assetIcon}>
                <Text style={{ fontSize: 18 }}>📈</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.assetName}>{selectedStock.name}</Text>
                <Text style={styles.assetTicker}>{selectedStock.symbol} • {selectedStock.exchange}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.liveTradeBtn} onPress={openTradeModal}>
              <Text style={styles.liveTradeBtnText}>TRADE LIVE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>SIMULATION PRINCIPAL</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              value={amountText}
              onChangeText={t => setAmountText(t.replace(/[^0-9.]/g, ''))}
              style={styles.input}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        {/* Mode toggle */}
        <View style={styles.inputBlock}>
          <View style={styles.modeHeader}>
            <Text style={styles.inputLabel}>SIMULATION MODE</Text>
          </View>
          <View style={styles.toggle}>
            {(['Historical', 'Predictive'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[styles.toggleBtn, mode === m && styles.toggleActive]}
              >
                <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Crash event picker */}
        {mode === 'Historical' && (
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>CRASH EVENT</Text>
            {loadingEvents ? (
              <ActivityIndicator color={Colors.electricViolet} />
            ) : (
              <TouchableOpacity style={styles.eventPickerRow} onPress={() => setShowEventPicker(true)}>
                <Text style={styles.eventPickerEmoji}>{selectedEvent?.emoji ?? '📉'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assetName}>{selectedEvent?.name ?? 'Select event'}</Text>
                  <Text style={styles.assetTicker}>{selectedEvent?.description ?? ''}</Text>
                </View>
                <Text style={styles.changeBtn}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Custom start date */}
        {mode === 'Predictive' && (
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>START DATE (YYYY-MM-DD)</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={customStartDate}
                onChangeText={setCustomStartDate}
                style={styles.input}
                placeholder="2020-01-01"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={simulate}
          activeOpacity={0.88}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.neonLimeDark} />
            : <Text style={styles.ctaText}>CALCULATE ALPHA</Text>
          }
        </TouchableOpacity>

        {/* ─── Results ─────────────────────────────────────── */}
        {sim && (
          <>
            <LinearGradient
              colors={[Colors.electricViolet, Colors.magenta, Colors.hotPink]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.impactCard}
            >
              <Text style={styles.impactLabel}>PORTFOLIO IMPACT</Text>
              <Text style={styles.impactTitle}>
                {isGain
                  ? 'Your hypothetical\nwealth is growing.'
                  : 'A tough window — but\nknowledge is alpha.'}
              </Text>
              <Text style={styles.impactDesc}>
                {simResult?.narrative ?? (
                  isGain
                    ? `Holding ${sim.display_name} outperformed ${simResult?.outperformed_pct ?? 0}% of traditional savings.`
                    : `Volatility is the price of long-term returns.`
                )}
              </Text>
            </LinearGradient>

            <View style={styles.resultCard}>
              <View style={styles.resultTop}>
                <Text style={styles.resultLabel}>SIMULATED VALUE TODAY</Text>
                <Text style={styles.resultPeriod}>{Math.round(sim.calendar_days / 30)}M</Text>
              </View>
              <View style={styles.resultAmtRow}>
                <Text style={styles.resultAmt}>{fmt(sim.value_now)}</Text>
                <View style={[styles.resultBadge, { backgroundColor: isGain ? '#dcfce7' : '#fee2e2' }]}>
                  <Text style={[styles.resultBadgeText, { color: isGain ? '#16a34a' : Colors.errorRed }]}>
                    {fmtPct(sim.gain_pct)}
                  </Text>
                </View>
              </View>

              <View style={styles.chartArea}>
                <LineChart
                  data={chartData.map((d: any) => ({ value: d.value }))}
                  width={W - S.xxl * 2 - 40}
                  height={120}
                  thickness={2}
                  color={isGain ? '#16a34a' : Colors.errorRed}
                  startFillColor={isGain ? '#16a34a' : Colors.errorRed}
                  endFillColor={isGain ? '#16a34a' : Colors.errorRed}
                  startOpacity={0.2}
                  endOpacity={0.0}
                  initialSpacing={0}
                  hideDataPoints
                  hideRules
                  hideYAxisText
                  hideAxesAndRules
                  adjustToWidth
                />

                <View style={styles.chartLabels}>
                  <Text style={styles.chartLabelText}>{sim.start_date}</Text>
                  <Text style={[styles.chartLabelText, { color: Colors.neonLimeDark }]}>TODAY</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { flex: 1 }]}>
                <Text style={styles.statLabel}>WORST DROP</Text>
                <Text style={[styles.statVal, { fontSize: 22, color: Colors.errorRed }]}>
                  {fmtPct(sim.loss_at_trough_pct)}
                </Text>
                <Text style={styles.statSub}>at lowest point</Text>
              </View>
              <View style={{ width: Spacing.md }} />
              <View style={[styles.statCard, { flex: 1 }]}>
                <Text style={styles.statLabel}>VOLATILITY</Text>
                <Text style={styles.statVal}>{sim.volatility_pct.toFixed(1)}%</Text>
                <Text style={[styles.statSub, {
                  color: sim.volatility_pct > 30 ? Colors.errorRed :
                         sim.volatility_pct > 20 ? Colors.amber : '#16a34a',
                }]}>
                  {sim.volatility_pct > 30 ? 'Very High Risk' : sim.volatility_pct > 20 ? 'High Risk' : 'Moderate'}
                </Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ALPHA SCORE</Text>
              <View style={styles.statRow}>
                <Text style={styles.statVal}>{sim.alpha_score}/100</Text>
                <View style={[styles.alphaBar, { width: '50%' }]}>
                  <View style={[styles.alphaFill, { width: `${sim.alpha_score}%` }]} />
                </View>
              </View>
            </View>

            {simResult?.lesson && (
              <View style={styles.lessonCard}>
                <Text style={styles.lessonIcon}>💡</Text>
                <Text style={styles.lessonText}>{simResult.lesson}</Text>
              </View>
            )}

            <Text style={styles.deepTitle}>Deep Dive Analysis</Text>
            <View style={styles.deepCard}>
              <Text style={styles.deepCardTitle}>Max Drawdown</Text>
              <Text style={[styles.drawdownVal, { color: Colors.errorRed }]}>
                {fmtPct(sim.max_drawdown_pct)}
              </Text>
              <Text style={styles.deepCardBody}>
                The deepest peak-to-trough decline during this period.
                {sim.max_drawdown_pct < -30
                  ? ' This was a severe drawdown — patience was heavily tested.'
                  : sim.max_drawdown_pct < -15
                  ? ' Significant but survivable for a long-term investor.'
                  : ' A relatively mild drawdown by market standards.'}
              </Text>
            </View>

            {simResult?.fd_benchmark && (
              <View style={styles.deepCard}>
                <Text style={styles.deepCardTitle}>Vs. Fixed Deposit (7% p.a.)</Text>
                <Text style={styles.deepCardBody}>
                  Same ₹{parseFloat(amountText).toLocaleString('en-IN')} in FD would be worth{' '}
                  <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>
                    {fmt(simResult.fd_benchmark.value)}
                  </Text>
                  {' '}(+{simResult.fd_benchmark.gain_pct.toFixed(1)}%).{'\n'}
                  {simResult.outperformed_savings_pct >= 0
                    ? `${sim.display_name} beat the FD by ${simResult.outperformed_savings_pct.toFixed(1)}%.`
                    : `FD outperformed by ${Math.abs(simResult.outperformed_savings_pct).toFixed(1)}% in this window.`}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const S = Spacing;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: {
    paddingTop: 16, paddingBottom: 120,
    paddingHorizontal: S.xxl, gap: S.xl,
  },

  pageTitle: {
    fontFamily: Fonts.headline, fontSize: 32,
    fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5,
  },
  pageTitleItalic: { fontStyle: 'italic', color: Colors.electricViolet },

  inputBlock: { gap: 8 },
  inputLabel: {
    fontFamily: Fonts.label, fontSize: 10, fontWeight: '700',
    color: Colors.textSecondary, letterSpacing: 1.4, textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceWhite,
    borderRadius: Radius.md, paddingHorizontal: S.lg, paddingVertical: S.lg,
  },
  currencyPrefix: {
    fontFamily: Fonts.headline, fontSize: 22, fontWeight: '700',
    color: Colors.textPrimary, marginRight: 4,
  },
  input: {
    flex: 1, fontFamily: Fonts.headline, fontSize: 22,
    fontWeight: '700', color: Colors.textPrimary,
  },

  assetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.md, padding: S.lg,
  },
  assetIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  assetIconSmall: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceHighest,
    alignItems: 'center', justifyContent: 'center',
  },
  assetName: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  assetTicker: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textSecondary },
  changeBtn: { fontFamily: Fonts.label, fontSize: 12, fontWeight: '700', color: Colors.electricViolet },

  liveTradeBtn: {
    backgroundColor: Colors.electricViolet + '20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  liveTradeBtnText: {
    fontFamily: Fonts.label,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.electricViolet,
  },

  eventPickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.md, padding: S.lg,
  },
  eventPickerEmoji: { fontSize: 24 },

  modeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: {
    flexDirection: 'row', backgroundColor: Colors.surfaceHighest,
    borderRadius: Radius.full, padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.full },
  toggleActive: {
    backgroundColor: Colors.surfaceWhite,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  toggleActiveBuy: { backgroundColor: Colors.neonLime },
  toggleActiveSell: { backgroundColor: Colors.errorRed },
  toggleText: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.textPrimary, fontWeight: '700' },

  ctaBtn: {
    backgroundColor: Colors.neonLime, borderRadius: Radius.md,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: Colors.neonLime, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  ctaText: {
    fontFamily: Fonts.headline, fontSize: 16, fontWeight: '900',
    color: Colors.neonLimeDark, letterSpacing: 1.2,
  },

  modal: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: S.xl, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontFamily: Fonts.headline, fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontFamily: Fonts.label, fontSize: 14, fontWeight: '700', color: Colors.electricViolet },
  searchInput: {
    margin: S.xl, backgroundColor: Colors.surfaceWhite,
    borderRadius: Radius.md, padding: S.lg,
    fontFamily: Fonts.body, fontSize: 16, color: Colors.textPrimary,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingVertical: S.lg, paddingHorizontal: S.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceHighest,
  },
  searchRowName: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  searchRowMeta: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textSecondary },

  eventRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: S.md,
    paddingVertical: S.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceHighest,
  },
  eventRowSelected: {
    backgroundColor: Colors.electricViolet + '10',
    borderRadius: Radius.md, paddingHorizontal: S.md,
  },
  eventEmoji: { fontSize: 28, marginTop: 2 },
  eventName: { fontFamily: Fonts.body, fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  eventDesc: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  eventFall: { fontFamily: Fonts.label, fontSize: 11, fontWeight: '700', marginTop: 4 },

  impactCard: { borderRadius: Radius.lg, padding: S.xxl, gap: 8 },
  impactLabel: {
    fontFamily: Fonts.label, fontSize: 10, fontWeight: '700',
    color: 'rgba(255,255,255,0.7)', letterSpacing: 1.6, textTransform: 'uppercase',
  },
  impactTitle: {
    fontFamily: Fonts.headline, fontSize: 22, fontWeight: '700',
    color: '#fff', lineHeight: 30,
  },
  impactDesc: { fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },

  resultCard: { backgroundColor: Colors.surfaceWhite, borderRadius: Radius.lg, padding: S.xxl },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resultLabel: {
    fontFamily: Fonts.label, fontSize: 10, fontWeight: '700',
    color: Colors.textSecondary, letterSpacing: 1.2,
  },
  resultPeriod: { fontFamily: Fonts.label, fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  resultAmtRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: S.lg },
  resultAmt: {
    fontFamily: Fonts.headline, fontSize: 32, fontWeight: '900',
    color: Colors.textPrimary, letterSpacing: -1,
  },
  resultBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  resultBadgeText: { fontFamily: Fonts.label, fontSize: 11, fontWeight: '700' },

  chartArea: { marginTop: 8 },
  chartLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 4, paddingHorizontal: 2,
  },
  chartLabelText: { fontFamily: Fonts.label, fontSize: 10, color: Colors.textMuted },

  statsRow: { flexDirection: 'row' },
  statCard: { backgroundColor: Colors.surfaceWhite, borderRadius: Radius.lg, padding: S.xxl, gap: 4, marginBottom: S.md },
  statLabel: {
    fontFamily: Fonts.label, fontSize: 10, fontWeight: '700',
    color: Colors.textSecondary, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  statVal: { fontFamily: Fonts.headline, fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  statSub: { fontFamily: Fonts.label, fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alphaBar: {
    height: 6, backgroundColor: Colors.surfaceHighest,
    borderRadius: 3, overflow: 'hidden',
  },
  alphaFill: { height: '100%', backgroundColor: Colors.neonLime, borderRadius: 3 },

  lessonCard: {
    backgroundColor: Colors.electricViolet + '15',
    borderRadius: Radius.lg, padding: S.xl,
    flexDirection: 'row', gap: S.md, alignItems: 'flex-start',
    borderWidth: 1, borderColor: Colors.electricViolet + '30',
    marginBottom: S.md,
  },
  lessonIcon: { fontSize: 18 },
  lessonText: {
    flex: 1, fontFamily: Fonts.body, fontSize: 13,
    color: Colors.textPrimary, lineHeight: 20,
  },

  deepTitle: { fontFamily: Fonts.headline, fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: S.md, marginBottom: S.md },
  deepCard: { backgroundColor: Colors.surfaceWhite, borderRadius: Radius.lg, padding: S.xxl, gap: S.md, marginBottom: S.md },
  deepCardTitle: { fontFamily: Fonts.headline, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  deepCardBody: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  drawdownVal: { fontFamily: Fonts.headline, fontSize: 28, fontWeight: '700' },
});