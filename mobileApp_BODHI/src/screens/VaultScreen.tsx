import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  ShieldCheck,
  EyeOff,
  Info,
  ScanLine,
  Send,
  Plus,
  ArrowDownToLine,
  Smartphone,
  FileText,
  Plane,
  CreditCard,
  TrendingUp,
  PiggyBank,
  Landmark,
  ChevronRight,
  Users,
  Calculator
} from 'lucide-react-native';

import { Colors, Spacing, Radius } from '../theme/tokens';
import { InsuranceScreen } from './InsuranceScreen';

const { width: W } = Dimensions.get('window');

// ─── DATA WITH NAVIGATION ROUTES ───
const QUICK_SERVICES = [
  { id: '1', label: 'Split Money', icon: Users, color: '#8A5CFF', route: 'TripWallet' },
  { id: '2', label: 'Insurance Stories', icon: ShieldCheck, color: '#FF3366', route: 'InsuranceStories' },
  { id: '3', label: 'Calculator', icon: Calculator, color: '#FF9900' },
  { id: '4', label: 'History', icon: FileText, color: '#00E676', route: 'TransactionHistory' },
  { id: '5', label: 'Mobile Recharge', icon: Smartphone, color: '#3399FF' },
  { id: '6', label: 'Utility Bills', icon: FileText, color: '#FFD700' },
  { id: '7', label: 'Travel Booking', icon: Plane, color: '#B366FF' },
  { id: '8', label: 'Subscriptions', icon: CreditCard, color: '#FF66B2' },
];

const INSIGHTS = [
  { id: '1', title: 'You spent', value: '₹2,540', sub: 'on Food this week', icon: TrendingUp, bg: ['#4A00E0', '#8E2DE2'] },
  { id: '2', title: 'You can save', value: '₹1,250', sub: 'by reducing subscriptions', icon: PiggyBank, bg: ['#8E2DE2', '#FF007F'] },
  { id: '3', title: 'Your net worth', value: '12%', sub: 'increased this month', icon: TrendingUp, bg: ['#0052D4', '#4364F7'] },
];

export function VaultScreen() {
  const navigation = useNavigation<any>();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showInsurance, setShowInsurance] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── HERO SECTION (GRADIENT) ── */}
        <LinearGradient
          colors={['#2A0066', '#660099', '#FF0055']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          {/* Header */}
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
              <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Notifications', 'Coming soon!')}>
                <Bell size={20} color="#FFF" />
                <View style={styles.notifBadge} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance Area */}
          <View style={styles.balanceArea}>
            <Text style={styles.greeting}>Hello, Govind 👋</Text>

            <View style={styles.rowCenter}>
              <Text style={styles.totalBalanceLabel}>TOTAL BALANCE</Text>
              <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <EyeOff size={14} color="rgba(255,255,255,0.6)" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.balanceMain}>{balanceVisible ? '1,00,000' : '******'}</Text>
              <Text style={styles.balanceDecimals}>{balanceVisible ? '.00' : ''}</Text>

              <TouchableOpacity style={styles.hideBtn} onPress={() => setBalanceVisible(!balanceVisible)}>
                <ShieldCheck size={12} color="#FFF" />
                <Text style={styles.hideBtnText}>{balanceVisible ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rowCenter}>
              <Text style={styles.includesText}>Includes Bank Balance + Wallet</Text>
              <Info size={12} color="rgba(255,255,255,0.6)" style={{ marginLeft: 4 }} />
            </View>
          </View>

          {/* Hero Actions */}
          <View style={styles.heroActionsRow}>
            {[
              { label: 'Scan & Pay', icon: ScanLine },
              { label: 'Send Money', icon: Send },
              { label: 'Add Money', icon: Plus },
              { label: 'Request', icon: ArrowDownToLine },
            ].map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.heroActionItem}
                onPress={() => Alert.alert('Action', `${action.label} feature coming soon!`)}
              >
                <View style={styles.heroActionCircle}>
                  <action.icon size={22} color="#FFF" />
                </View>
                <Text style={styles.heroActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* ── MAIN CONTENT (DARK SURFACE) ── */}
        <View style={styles.contentSection}>

          {/* Quick Services */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Services</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View All ›</Text></TouchableOpacity>
          </View>

          <View style={styles.servicesGrid}>
            {QUICK_SERVICES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.serviceItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.route === 'InsuranceStories') {
                    setShowInsurance(true);
                  } else if (item.route) {
                    navigation.navigate(item.route);
                  } else {
                    Alert.alert('Coming Soon', `${item.label} feature is under development.`);
                  }
                }}
              >
                <View style={styles.serviceIconWrap}>
                  <item.icon size={24} color={item.color} strokeWidth={2} />
                </View>
                <Text style={styles.serviceLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* AI Insights */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View All ›</Text></TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.insightsScroll}
          >
            {INSIGHTS.map((insight) => (
              <LinearGradient
                key={insight.id}
                colors={insight.bg}
                style={styles.insightCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.insightIconWrap}>
                  <insight.icon size={18} color="#FFF" />
                </View>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightValue}>{insight.value}</Text>
                <Text style={styles.insightSub}>{insight.sub}</Text>

                <TouchableOpacity style={styles.insightLinkRow}>
                  <Text style={styles.insightLink}>View Details</Text>
                  <ChevronRight size={14} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </LinearGradient>
            ))}
          </ScrollView>

          {/* Accounts */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <TouchableOpacity style={styles.addAccountBtn} onPress={() => navigation.navigate('BankAccounts')}>
              <Text style={styles.addAccountText}>+ Add Account</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.accountCard} onPress={() => navigation.navigate('PersonalDetails')}>
            <View style={styles.accountLeft}>
              <View style={styles.bankLogoWrap}>
                <Landmark size={20} color="#FF0000" />
              </View>
              <View>
                <Text style={styles.bankName}>HDFC Bank</Text>
                <View style={styles.rowCenter}>
                  <Text style={styles.bankDetail}>Savings •••• 4589</Text>
                  <View style={styles.primaryTag}>
                    <Text style={styles.primaryTagText}>Primary</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.accountRight}>
              <Text style={styles.accountBalance}>₹ ••••••</Text>
              <EyeOff size={16} color="rgba(255,255,255,0.5)" style={{ marginLeft: 8 }} />
              <ChevronRight size={20} color="rgba(255,255,255,0.5)" style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>

          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          {/* DEDICATED TRANSACTION HISTORY BUTTON */}
          <TouchableOpacity 
            style={[styles.accountCard, { marginTop: 24, justifyContent: 'center', backgroundColor: 'rgba(200, 255, 0, 0.05)', borderColor: 'rgba(200, 255, 0, 0.2)' }]} 
            onPress={() => navigation.navigate('TransactionHistory')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <FileText size={20} color="#C8FF00" />
              <Text style={{ color: '#C8FF00', fontSize: 16, fontWeight: '700' }}>View Transaction History</Text>
            </View>
            <ChevronRight size={20} color="#C8FF00" style={{ position: 'absolute', right: 20 }} />
          </TouchableOpacity>

          {/* Bottom spacer for tab bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── INSURANCE MODAL MOUNTED HERE ── */}
      <InsuranceScreen
        visible={showInsurance}
        onClose={() => setShowInsurance(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05050A' },

  heroSection: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: { position: 'relative' },
  avatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#000' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.neonLime, borderWidth: 2, borderColor: '#2A0066',
  },
  logo: { height: 35, width: 200, tintColor: '#FFF' },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { position: 'relative' },
  notifBadge: {
    position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3366',
  },

  balanceArea: { marginBottom: 30 },
  greeting: { color: '#FFF', fontSize: 16, fontWeight: '500', marginBottom: 12 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  totalBalanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 8 },
  currencySymbol: { color: '#FFF', fontSize: 32, fontWeight: '400', marginRight: 4 },
  balanceMain: { color: '#FFF', fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  balanceDecimals: { color: 'rgba(255,255,255,0.8)', fontSize: 24, fontWeight: '600' },
  hideBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  hideBtnText: { color: '#FFF', fontSize: 10, fontWeight: '600', marginLeft: 4 },
  includesText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },

  heroActionsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 40 },
  heroActionItem: { alignItems: 'center', gap: 8 },
  heroActionCircle: {
    width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroActionLabel: { color: '#FFF', fontSize: 11, fontWeight: '500' },

  contentSection: { paddingHorizontal: 20, paddingTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 24 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  viewAll: { color: '#A855F7', fontSize: 13, fontWeight: '600' },

  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 24 },
  serviceItem: { width: '23%', alignItems: 'center', gap: 8 },
  serviceIconWrap: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#12121A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  serviceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, textAlign: 'center', fontWeight: '500' },

  insightsScroll: { paddingRight: 20, gap: 16 },
  insightCard: { width: 150, height: 170, borderRadius: 20, padding: 16, justifyContent: 'space-between' },
  insightIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  insightTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 12 },
  insightValue: { color: '#FFF', fontSize: 22, fontWeight: '800', marginVertical: 4 },
  insightSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 16, height: 32 },
  insightLinkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  insightLink: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginRight: 4 },

  addAccountBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(168,85,247,0.15)' },
  addAccountText: { color: '#A855F7', fontSize: 12, fontWeight: '700' },
  accountCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#12121A', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  accountLeft: { flexDirection: 'row', alignItems: 'center' },
  bankLogoWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bankName: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  bankDetail: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  primaryTag: { backgroundColor: 'rgba(212,255,0,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  primaryTagText: { color: Colors.neonLime, fontSize: 10, fontWeight: '700' },
  accountRight: { flexDirection: 'row', alignItems: 'center' },
  accountBalance: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  paginationDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 16, backgroundColor: '#A855F7' },
});