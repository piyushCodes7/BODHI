// src/screens/VaultScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, FlatList, ActivityIndicator, RefreshControl
} from 'react-native';

// Professional Vector Icons
import { 
  PiggyBank, 
  BellRing, 
  TrendingUp, 
  Target, 
  CreditCard, 
  Users, 
  Activity, 
  TrendingDown 
} from 'lucide-react-native';

import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { apiClient } from '../api/client'; 
import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';
import { GradientCard } from '../components/GradientCard';
import { BodhiHeader, useHeaderHeight } from '../components/BodhiHeader';

import { InsuranceScreen } from './InsuranceScreen';

const { width: W } = Dimensions.get('window');
const S = Spacing;

// Professional AI Insights Array
const INSIGHTS = [
  { id: '1', title: 'SAVINGS', desc: 'You saved ₹2,300', Icon: PiggyBank, border: Colors.neonLime,       bg: ['#d1fc00','#dcc9ff'], iconColor: '#0A0A14' },
  { id: '2', title: 'ALERT',   desc: 'Unused Sub',       Icon: BellRing,  border: Colors.hotPink,        bg: ['#f74b6d','#ff81f5'], iconColor: '#FFFFFF' },
  { id: '3', title: 'MARKET',  desc: 'Market High',      Icon: TrendingUp,border: Colors.electricViolet, bg: ['#dcc9ff','#d1fc00'], iconColor: '#0A0A14' },
  { id: '4', title: 'GOAL',    desc: 'Budget Set',       Icon: Target,    border: Colors.textMuted,      bg: ['#dbdde3','#e7e8ee'], iconColor: '#0A0A14' },
];

// Professional Quick Actions
const ACTIONS = [
  { id: 'pay',   label: 'Pay',   sub: 'FAST CHECKOUT', Icon: CreditCard, bg: 'rgba(212, 255, 0, 0.1)', color: Colors.neonLime },
  { id: 'split', label: 'Split', sub: 'TRIPS & WALLETS', Icon: Users,      bg: 'rgba(123, 47, 190, 0.1)', color: Colors.electricViolet },
];

const fmt = (n: number | undefined) => 
  n !== undefined ? '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '₹0.00';

export function VaultScreen({ navigation }: any) {
  const headerH = useHeaderHeight();
  
  const [showInsurance, setShowInsurance] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPortfolio = async () => {
    try {
      const res = await apiClient.get('/trade/portfolio');
      setPortfolio(res.data);
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPortfolio();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPortfolio();
  };

  if (loading && !portfolio) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.electricViolet} />
      </View>
    );
  }

  // Formatting Math
  const totalValueRaw = portfolio?.total_value || 100000;
  const totalValueParts = totalValueRaw.toFixed(2).split('.');
  const wholeValue = Number(totalValueParts[0]).toLocaleString('en-IN');
  const decimalValue = totalValueParts[1];

  const totalPnl = portfolio?.total_pnl || 0;
  const pnlIsPositive = totalPnl >= 0;

  return (
    <View style={styles.root}>
      {/* Header with dynamic username routing for the initials */}
      <BodhiHeader 
        onInsurancePress={() => setShowInsurance(true)} 
        username={portfolio?.username} 
      />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerH + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.electricViolet} />}
      >
        <View style={styles.greet}>
          <Text style={styles.greetName}>Hello, {portfolio?.username || 'Investor'}</Text>
          <Text style={styles.greetSub}>YOUR LIVE PAPER PORTFOLIO</Text>
        </View>

        {/* ── BALANCE CARD ── */}
        <GradientCard style={styles.balanceCard}>
          <View style={styles.balanceInner}>
            <View style={styles.balanceTop}>
              <Text style={styles.balanceLabel}>TOTAL VAULT BALANCE</Text>
              <View style={styles.walletIconWrap}>
                <Activity size={22} color={Colors.textPrimary} strokeWidth={2.5} />
              </View>
            </View>
            
            <Text style={styles.balanceAmount}>
              ₹{wholeValue}<Text style={styles.balanceCents}>.{decimalValue}</Text>
            </Text>
            
            <View style={styles.balanceBottom}>
              <View style={styles.tokenRow}>
                <View style={[styles.tokenPill, { width: 'auto', paddingHorizontal: 12 }]}>
                  <Text style={styles.tokenText}>CASH: {fmt(portfolio?.cash)}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.changeLabel}>TOTAL RETURN</Text>
                <Text style={[styles.changeValue, { color: pnlIsPositive ? Colors.neonLime : Colors.hotPink }]}>
                  {pnlIsPositive ? '+' : ''}{fmt(totalPnl)}
                </Text>
              </View>
            </View>
          </View>
        </GradientCard>

        {/* ── AI INSIGHTS ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <TouchableOpacity><Text style={styles.viewAll}>VIEW ALL</Text></TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={INSIGHTS}
          keyExtractor={i => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.insightList}
          scrollEnabled
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.8} style={styles.insightItem}>
              <LinearGradient
                colors={item.bg}
                style={[styles.insightCircle, { borderColor: item.border }]}
                start={{ x:0, y:0 }} end={{ x:1, y:1 }}
              >
                <item.Icon size={30} color={item.iconColor} strokeWidth={2} />
              </LinearGradient>
              <Text style={styles.insightTag}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.actionsGrid}>
          {ACTIONS.map(a => (
            <TouchableOpacity 
              key={a.id} 
              activeOpacity={0.8} 
              style={styles.actionCard}
              onPress={() => {
                if (a.id === 'pay') {
                  navigation.navigate('PaymentScreen');
                } else if (a.id === 'split') {
                  navigation.navigate('TripWallet');
                }
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                <a.Icon size={24} color={a.color} strokeWidth={2} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── YOUR HOLDINGS ── */}
        <Text style={[styles.sectionTitle, { marginBottom: S.lg }]}>Your Holdings</Text>
        <View style={styles.activityList}>
          {portfolio?.holdings?.length === 0 ? (
            <Text style={{ fontFamily: Fonts.body, color: Colors.textMuted, textAlign: 'center', marginTop: 20 }}>
              Your portfolio is empty. Go to the Market to buy some stocks!
            </Text>
          ) : (
            portfolio?.holdings?.map((holding: any, index: number) => {
              const isProfit = holding.pnl >= 0;
              return (
                <View key={index} style={styles.activityRow}>
                  <View style={styles.activityLogo}>
                    {isProfit ? (
                      <TrendingUp size={22} color="#16a34a" strokeWidth={2.5} />
                    ) : (
                      <TrendingDown size={22} color={Colors.errorRed} strokeWidth={2.5} />
                    )}
                  </View>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityName}>{holding.symbol}</Text>
                    <Text style={styles.activitySub}>{holding.qty} shares @ ₹{holding.avg_price}</Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={styles.activityAmount}>{fmt(holding.current_value)}</Text>
                    <Text style={[styles.activityDate, { color: isProfit ? '#16a34a' : Colors.errorRed, fontSize: 11 }]}>
                      {isProfit ? '+' : ''}{fmt(holding.pnl)} ({holding.pnl_pct}%)
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Insurance Modal Overlay */}
      <InsuranceScreen 
        visible={showInsurance} 
        onClose={() => setShowInsurance(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex:1, backgroundColor: Colors.surface },
  scroll: { paddingBottom:120, paddingHorizontal: S.xxl },

  greet:     { marginBottom: S.xxl },
  greetName: { fontFamily: Fonts.headline, fontSize:28, fontWeight:'700', color: Colors.textPrimary, letterSpacing:-0.5 },
  greetSub:  { fontFamily: Fonts.label, fontSize:11, fontWeight:'700', color: Colors.textSecondary, letterSpacing:1.6, marginTop:2 },

  balanceCard:    { marginBottom: S.xxl },
  balanceInner:   { padding: S.xxl + 4 },
  balanceTop:     { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 },
  balanceLabel:   { fontFamily: Fonts.label, fontSize:10, fontWeight:'700', color:'rgba(255,255,255,0.8)', letterSpacing:2 },
  walletIconWrap: { width:44, height:44, borderRadius:22, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center' },
  balanceAmount:  { fontFamily: Fonts.headline, fontSize:44, fontWeight:'900', color:'#fff', letterSpacing:-2, marginBottom:16 },
  balanceCents:   { fontSize:20, fontWeight:'500', letterSpacing:0 },
  balanceBottom:  { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end' },
  tokenRow:       { flexDirection:'row' },
  tokenPill:      { height:38, borderRadius:19, borderWidth:2, borderColor: Colors.electricViolet, backgroundColor: Colors.surfaceHighest, alignItems:'center', justifyContent:'center', marginRight:-8 },
  tokenText:      { fontFamily: Fonts.label, fontSize:9, fontWeight:'700', color: Colors.electricViolet },
  changeLabel:    { fontFamily: Fonts.label, fontSize:9, fontWeight:'700', color:'rgba(255,255,255,0.7)', letterSpacing:1.2, textAlign:'right' },
  changeValue:    { fontFamily: Fonts.headline, fontSize:20, fontWeight:'700' },

  sectionHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: S.lg },
  sectionTitle:   { fontFamily: Fonts.headline, fontSize:20, fontWeight:'700', color: Colors.textPrimary },
  viewAll:        { fontFamily: Fonts.label, fontSize:11, fontWeight:'700', color: Colors.electricViolet, letterSpacing:0.8 },

  insightList:    { gap:16, paddingRight: S.lg, marginBottom: S.xxl },
  insightItem:    { alignItems:'center', gap:8 },
  insightCircle:  { width:64, height:64, borderRadius:32, borderWidth:2, alignItems:'center', justifyContent:'center' },
  insightTag:     { fontFamily: Fonts.label, fontSize:10, fontWeight:'700', color: Colors.textSecondary, letterSpacing:0.8, textTransform:'uppercase' },

  actionsGrid:    { flexDirection:'row', flexWrap:'wrap', gap: S.md, marginBottom: S.xxl },
  actionCard:     { width:(W - S.xxl*2 - S.md)/2, backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: S.xl, gap:8 },
  actionIcon:     { width:44, height:44, borderRadius: Radius.full, alignItems:'center', justifyContent:'center' },
  actionLabel:    { fontFamily: Fonts.headline, fontSize:16, fontWeight:'700', color: Colors.textPrimary },
  actionSub:      { fontFamily: Fonts.label, fontSize:10, fontWeight:'700', color: Colors.textSecondary, letterSpacing:0.8 },

  activityList:   { gap: S.xl },
  activityRow:    { flexDirection:'row', alignItems:'center', gap: S.lg },
  activityLogo:   { width:46, height:46, borderRadius:23, backgroundColor: Colors.surfaceContainer, alignItems:'center', justifyContent:'center' },
  activityMeta:   { flex:1 },
  activityName:   { fontFamily: Fonts.body, fontSize:14, fontWeight:'600', color: Colors.textPrimary },
  activitySub:    { fontFamily: Fonts.label, fontSize:11, color: Colors.textSecondary, marginTop:2 },
  activityRight:  { alignItems:'flex-end' },
  activityAmount: { fontFamily: Fonts.headline, fontSize:15, fontWeight:'700', color: Colors.textPrimary },
  activityDate:   { fontFamily: Fonts.label, fontSize:9, fontWeight:'700', color: Colors.textSecondary, letterSpacing:0.8, marginTop:2 },
});