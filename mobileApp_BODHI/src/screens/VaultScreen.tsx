// ─────────────────────────────────────────────────────────────
//  VaultScreen.tsx — Main Dashboard  (light mode)
// ─────────────────────────────────────────────────────────────

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';
import { GradientCard } from '../components/GradientCard';
import { BodhiHeader, useHeaderHeight } from '../components/BodhiHeader';

const { width: W } = Dimensions.get('window');
const S = Spacing;

const AI_INSIGHTS = [
  { id:'1', label:'You saved\n₹2,300', tag:'SAVINGS', border: Colors.neonLime,       bg:['#d1fc00','#dcc9ff'] },
  { id:'2', label:'Unused\nSub',        tag:'ALERT',   border: Colors.hotPink,        bg:['#f74b6d','#ff81f5'] },
  { id:'3', label:'Market\nHigh',       tag:'MARKET',  border: Colors.electricViolet, bg:['#dcc9ff','#d1fc00'] },
  { id:'4', label:'Budget\nSet',        tag:'GOAL',    border: Colors.textMuted,      bg:['#dbdde3','#e7e8ee'] },
];

const ACTIONS = [
  { id:'pay',    icon:'💸', label:'Pay',    sub:'FAST CHECKOUT', color: Colors.neonLime },
  { id:'invest', icon:'📈', label:'Invest', sub:'YIELD POOLS',   color:'#dcc9ff' },
  { id:'split',  icon:'👥', label:'Split',  sub:'GROUP BILLS',   color:'#ff81f5' },
  { id:'voice',  icon:'🎙', label:'Voice',  sub:'AI COMMAND',    color: Colors.neonLime },
];

const ACTIVITY = [
  { id:'1', logo:'🎬', name:'Netflix Subscription', sub:'Recurring payment', amount:'-₹799',  date:'TODAY',     neg:true },
  { id:'2', logo:'✨', name:'Stake Reward',          sub:'Solana Pool 04',   amount:'+₹1,240', date:'YESTERDAY', neg:false },
];

export function VaultScreen() {
  const headerH = useHeaderHeight();

  return (
    <View style={styles.root}>
      <BodhiHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerH + 16 }]}
      >
        {/* Greeting */}
        <View style={styles.greet}>
          <Text style={styles.greetName}>Hello, James</Text>
          <Text style={styles.greetSub}>YOUR DAILY FINANCIAL PULSE</Text>
        </View>

        {/* Hero balance card */}
        <GradientCard style={styles.balanceCard}>
          <View style={styles.balanceInner}>
            <View style={styles.balanceTop}>
              <Text style={styles.balanceLabel}>TOTAL VAULT BALANCE</Text>
              <View style={styles.walletIconWrap}>
                <Text style={{ fontSize: 18 }}>💳</Text>
              </View>
            </View>
            <Text style={styles.balanceAmount}>
              ₹4,82,930<Text style={styles.balanceCents}>.45</Text>
            </Text>
            <View style={styles.balanceBottom}>
              <View style={styles.tokenRow}>
                {['BTC','ETH','USDT'].map(t => (
                  <View key={t} style={styles.tokenPill}>
                    <Text style={styles.tokenText}>{t}</Text>
                  </View>
                ))}
              </View>
              <View>
                <Text style={styles.changeLabel}>24H CHANGE</Text>
                <Text style={styles.changeValue}>+8.4%</Text>
              </View>
            </View>
          </View>
        </GradientCard>

        {/* AI Insights */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <TouchableOpacity><Text style={styles.viewAll}>VIEW ALL</Text></TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={AI_INSIGHTS}
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
                <Text style={styles.insightLabel}>{item.label}</Text>
              </LinearGradient>
              <Text style={styles.insightTag}>{item.tag}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Quick Actions 2×2 */}
        <View style={styles.actionsGrid}>
          {ACTIONS.map(a => (
            <TouchableOpacity key={a.id} activeOpacity={0.8} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: a.color }]}>
                <Text style={{ fontSize: 18 }}>{a.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { marginBottom: S.lg }]}>Recent Activity</Text>
        <View style={styles.activityList}>
          {ACTIVITY.map(item => (
            <View key={item.id} style={styles.activityRow}>
              <View style={styles.activityLogo}>
                <Text style={{ fontSize: 20 }}>{item.logo}</Text>
              </View>
              <View style={styles.activityMeta}>
                <Text style={styles.activityName}>{item.name}</Text>
                <Text style={styles.activitySub}>{item.sub}</Text>
              </View>
              <View style={styles.activityRight}>
                <Text style={[styles.activityAmount, { color: item.neg ? Colors.errorRed : '#16a34a' }]}>
                  {item.amount}
                </Text>
                <Text style={styles.activityDate}>{item.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  tokenPill:      { width:38, height:38, borderRadius:19, borderWidth:2, borderColor: Colors.electricViolet, backgroundColor: Colors.surfaceHighest, alignItems:'center', justifyContent:'center', marginRight:-8 },
  tokenText:      { fontFamily: Fonts.label, fontSize:9, fontWeight:'700', color: Colors.electricViolet },
  changeLabel:    { fontFamily: Fonts.label, fontSize:9, fontWeight:'700', color:'rgba(255,255,255,0.7)', letterSpacing:1.2, textAlign:'right' },
  changeValue:    { fontFamily: Fonts.headline, fontSize:20, fontWeight:'700', color: Colors.neonLime },

  sectionHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: S.lg },
  sectionTitle:   { fontFamily: Fonts.headline, fontSize:20, fontWeight:'700', color: Colors.textPrimary },
  viewAll:        { fontFamily: Fonts.label, fontSize:11, fontWeight:'700', color: Colors.electricViolet, letterSpacing:0.8 },

  insightList:    { gap:16, paddingRight: S.lg, marginBottom: S.xxl },
  insightItem:    { alignItems:'center', gap:6 },
  insightCircle:  { width:72, height:72, borderRadius:36, borderWidth:2, alignItems:'center', justifyContent:'center', padding:8 },
  insightLabel:   { fontFamily: Fonts.label, fontSize:10, fontWeight:'700', color: Colors.textPrimary, textAlign:'center', lineHeight:13 },
  insightTag:     { fontFamily: Fonts.label, fontSize:9, fontWeight:'700', color: Colors.textSecondary, letterSpacing:0.8, textTransform:'uppercase' },

  actionsGrid:    { flexDirection:'row', flexWrap:'wrap', gap: S.md, marginBottom: S.xxl },
  actionCard:     { width:(W - S.xxl*2 - S.md)/2, backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: S.xl, gap:8 },
  actionIcon:     { width:40, height:40, borderRadius: Radius.full, alignItems:'center', justifyContent:'center' },
  actionLabel:    { fontFamily: Fonts.headline, fontSize:16, fontWeight:'700', color: Colors.textPrimary },
  actionSub:      { fontFamily: Fonts.label, fontSize:10, fontWeight:'700', color: Colors.textSecondary, letterSpacing:0.8 },

  activityList:   { gap: S.xl },
  activityRow:    { flexDirection:'row', alignItems:'center', gap: S.lg },
  activityLogo:   { width:46, height:46, borderRadius:23, backgroundColor: Colors.surfaceContainer, alignItems:'center', justifyContent:'center' },
  activityMeta:   { flex:1 },
  activityName:   { fontFamily: Fonts.body, fontSize:14, fontWeight:'600', color: Colors.textPrimary },
  activitySub:    { fontFamily: Fonts.label, fontSize:11, color: Colors.textSecondary, marginTop:2 },
  activityRight:  { alignItems:'flex-end' },
  activityAmount: { fontFamily: Fonts.headline, fontSize:15, fontWeight:'700' },
  activityDate:   { fontFamily: Fonts.label, fontSize:9, fontWeight:'700', color: Colors.textSecondary, letterSpacing:0.8, marginTop:2 },
});
