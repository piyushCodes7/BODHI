import React, { useState, useEffect, useCallback } from 'react';
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
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import { BASE_URL } from '../api/client';
import { BlurView } from '@react-native-community/blur';
import {
  Bell,
  ShieldCheck,
  EyeOff,
  Eye,
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
  Calculator,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react-native';

import { Colors, Spacing, Radius } from '../theme/tokens';
import { InsuranceScreen } from './InsuranceScreen';
import { MOCK_TRANSACTIONS } from '../data/mockTransactions';
import { NotificationAPI, UsersAPI } from '../api/client';
import { useCalculator } from '../context/CalculatorContext';

const { width: W } = Dimensions.get('window');

// ─── DATA WITH NAVIGATION ROUTES ───
const QUICK_SERVICES = [
  { id: '1', label: 'Split Money', icon: Users, color: '#8A5CFF', route: 'TripWallet' },
  { id: '2', label: 'Insurance Stories', icon: ShieldCheck, color: '#FF3366', route: 'InsuranceStories' },
  { id: '3', label: 'Calculator', icon: Calculator, color: '#FF9900' },
  { id: '4', label: 'History', icon: FileText, color: '#00E676', route: 'TransactionHistory' },
  { id: '5', label: 'Mobile Recharge', icon: Smartphone, color: '#3399FF' },
  { id: '6', label: 'Utility Bills', icon: FileText, color: '#FFD700' },
  { id: '7', label: 'Travel Booking', icon: Plane, color: '#B366FF', route: 'TravelBooking' },
  { id: '8', label: 'Subscriptions', icon: CreditCard, color: '#FF66B2', route: 'SubscriptionHub' },
];

// Constants removed, logic moved dynamically inside the component!

export function VaultScreen() {
  const navigation = useNavigation<any>();
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState('User');
  const [userInitial, setUserInitial] = useState('U');
  const [hasPassword, setHasPassword] = useState(true);

  // Razorpay / Balance State
  const [balance, setBalance] = useState('0.00');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Password Modal State
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [uPin, setUPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { toggleCalculator } = useCalculator();

  // Fetch user data from storage
  const fetchUserData = useCallback(async () => {
    try {
      const storedName = await AsyncStorage.getItem('user_full_name');
      if (storedName) {
        setUserName(storedName.split(' ')[0]); // Use first name
        setUserInitial(storedName.charAt(0).toUpperCase());
      }
      // Also fetch from backend to get live security status
      const profile = await UsersAPI.fetchProfile();
      setHasPassword(profile.has_password);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }, []);

  // Fetch balance from backend
  const fetchBalance = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('bodhi_access_token');
      const res = await fetch(`${BASE_URL}/transfers/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance.toFixed(2));
        setUserName(data.full_name.split(' ')[0] || 'User');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const notifications = await NotificationAPI.fetchNotifications();
      const unread = notifications.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  useEffect(() => {
    // Vault Screen Mounted
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      fetchUserData();
      fetchBalance();
    }, [fetchUnreadCount, fetchUserData, fetchBalance])
  );

  // ─── DYNAMIC INSIGHTS MATH ───
  // Scans the entire Mock Database (3-month average calculation)
  const sourceTransactions = MOCK_TRANSACTIONS;

  const foodSpending = sourceTransactions
    .filter(t => t.category === 'Food' || t.category === 'Groceries')
    .reduce((acc, t) => acc + t.amount, 0);

  const entertainmentSpending = sourceTransactions
    .filter(t => t.category === 'Entertainment')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalIncome = sourceTransactions.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = sourceTransactions.filter(t => t.type === 'DEBIT').reduce((acc, t) => acc + t.amount, 0);
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : '0';

  const dynamicInsights = [
    { id: '1', type: 'FOOD', title: 'Food & Groceries', value: `₹${foodSpending.toLocaleString('en-IN')}`, sub: 'spent closely over 90 days', icon: TrendingUp, bg: ['#4A00E0', '#8E2DE2'] },
    { id: '2', type: 'SUBS', title: 'You can save', value: `₹${entertainmentSpending.toLocaleString('en-IN')}`, sub: 'annually cutting subscriptions', icon: PiggyBank, bg: ['#8E2DE2', '#FF007F'] },
    { id: '3', type: 'SAVE', title: 'Savings Rate', value: `${savingsRate}%`, sub: 'of income kept over 90 days', icon: TrendingUp, bg: ['#0052D4', '#4364F7'] },
  ];

  const renderInsightDetails = () => {
    if (!activeInsight) return null;
    let filtered: any[] = [];
    let title = '';

    if (activeInsight === 'FOOD') {
      title = "Food & Groceries Breakdown";
      filtered = sourceTransactions.filter(t => t.category === 'Food' || t.category === 'Groceries');
    } else if (activeInsight === 'SUBS') {
      title = "Entertainment Breakdown";
      filtered = sourceTransactions.filter(t => t.category === 'Entertainment');
    } else {
      title = "Quarterly Cash Flow";
      filtered = sourceTransactions;
    }

    return (
      <View style={styles.modalBg}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setActiveInsight(null)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(t) => t.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isCredit = item.type === 'CREDIT';
              return (
                <View style={styles.insightRow}>
                  <View style={styles.insightRowLeft}>
                    <View style={[styles.insightIconWrap, { backgroundColor: isCredit ? 'rgba(200,255,0,0.1)' : 'rgba(255,255,255,0.05)' }]}>
                      {isCredit ? (
                        <ArrowDownRight size={18} color="#C8FF00" />
                      ) : (
                        <ArrowUpRight size={18} color="#FFF" />
                      )}
                    </View>
                    <View style={styles.insightTextWrap}>
                      <Text style={styles.insightRowMerchant} numberOfLines={1}>{item.merchant}</Text>
                      <Text style={styles.insightRowCategory} numberOfLines={1}>
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {item.category}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.insightRowRight}>
                    <Text style={[styles.insightRowAmount, { color: isCredit ? '#C8FF00' : '#FFF' }]} numberOfLines={1}>
                      {isCredit ? '+' : '-'}₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>
    );
  };

  const handleToggleBalance = () => {
    if (balanceVisible) {
      setBalanceVisible(false);
    } else {
      setUPin('');
      setIsPasswordModalVisible(true);
    }
  };

  const verifyBalanceUpin = async () => {
    if (!uPin) {
      Alert.alert("Required", "Please enter your U-PIN to view the balance.");
      return;
    }
    setIsVerifying(true);
    try {
      await UsersAPI.verifyUpin(uPin);
      setBalanceVisible(true);
      setIsPasswordModalVisible(false);
    } catch (error: any) {
      Alert.alert("Verification Failed", error.response?.data?.detail || "Incorrect U-PIN.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddMoney = async () => {
    if (!amountToAdd || parseFloat(amountToAdd) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const token = await AsyncStorage.getItem('bodhi_access_token');
      // 1. Create order
      const res = await fetch(`${BASE_URL}/transfers/razorpay/create-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amountToAdd),
          currency: 'INR',
          description: 'BODHI Wallet Top-up'
        })
      });
      
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.detail || 'Failed to create order');

      // 2. Open Razorpay
      const options = {
        description: 'BODHI Wallet Top-up',
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: orderData.currency,
        key: orderData.key_id,
        amount: orderData.amount,
        name: 'BODHI',
        order_id: orderData.order_id,
        theme: { color: '#8A5CFF' }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        // 3. Verify on success
        const verifyRes = await fetch(`${BASE_URL}/transfers/razorpay/verify-and-credit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
            amount: parseFloat(amountToAdd)
          })
        });
        
        const verifyData = await verifyRes.json();
        if (verifyRes.ok) {
          Alert.alert('Success', verifyData.message);
          setAmountToAdd('');
          setShowAddMoney(false);
          fetchBalance(); // Refresh balance
        } else {
          Alert.alert('Verification Failed', verifyData.detail || 'Payment was not credited.');
        }
      }).catch((error: any) => {
        Alert.alert('Payment Failed', error.description || 'Payment was cancelled or failed.');
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* ── HERO SECTION (GRADIENT) ── */}
        <LinearGradient
          colors={['#A855F7', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarContainer}
            >
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
              <View style={styles.onlineDot} />
            </TouchableOpacity>

            <Image
              source={require('../../assets/images/bodhi-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <BlurView blurType="light" blurAmount={10} style={styles.glassCircle}>
                <Bell size={20} color="#FFF" />
                {unreadCount > 0 && <View style={styles.notifBadge} />}
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Balance Cockpit */}
          <View style={styles.balanceArea}>
            <Text style={styles.greeting}>{getGreeting()}, {userName} 👋</Text>
            
            <View style={styles.netWorthHeader}>
              <Text style={styles.netWorthLabel}>TOTAL NET WORTH</Text>
              <TouchableOpacity onPress={handleToggleBalance} style={styles.revealBtn}>
                {balanceVisible ? <Eye size={14} color="#FFF" /> : <EyeOff size={14} color="#FFF" />}
              </TouchableOpacity>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.balanceMain}>{balanceVisible ? balance.split('.')[0] : '••••••'}</Text>
              <Text style={styles.balanceDecimals}>{balanceVisible ? `.${balance.split('.')[1] || '00'}` : ''}</Text>
            </View>

            <View style={styles.growthRow}>
              <TrendingUp size={14} color={Colors.neonLime} />
              <Text style={styles.growthTxt}>+₹4,532 today</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── PARALLEL ACTIONS (PREMIUM GLASS) ── */}
        <View style={styles.parallelActions}>
          {/* Left: Scan & Pay */}
          <TouchableOpacity 
            style={styles.scanBtnContainer}
            onPress={() => navigation.navigate('ScanPay')}
            activeOpacity={0.9}
          >
            <View style={styles.scanGlassRing}>
              <LinearGradient colors={[Colors.neonLime, '#A3D900']} style={styles.scanBtn}>
                <ScanLine size={30} color="#000" strokeWidth={2.5} />
              </LinearGradient>
            </View>
            <Text style={styles.scanLabel}>Scan & Pay</Text>
          </TouchableOpacity>

          {/* Right: Pill Container */}
          <BlurView blurType="dark" blurAmount={32} style={styles.actionPill}>
            <TouchableOpacity style={styles.pillItem} onPress={() => navigation.navigate('SendMoney')}>
              <View style={styles.pillIconGlass}>
                <Send size={18} color="#FFF" />
              </View>
              <Text style={styles.pillLabel}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.pillItem} onPress={() => setShowAddMoney(true)}>
              <View style={styles.pillIconGlass}>
                <Plus size={18} color="#FFF" />
              </View>
              <Text style={styles.pillLabel}>Add</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.pillItem} onPress={() => navigation.navigate('RequestMoney')}>
              <View style={styles.pillIconGlass}>
                <ArrowDownToLine size={18} color="#FFF" />
              </View>
              <Text style={styles.pillLabel}>Request</Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* ── LIVE WATCHLIST TICKER ── */}
        <View style={styles.tickerSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tickerScroll}>
            {[
              { name: 'Reliance', val: '+2.4%', up: true },
              { name: 'TCS', val: '-0.8%', up: false },
              { name: 'BTC', val: '+5.2%', up: true },
              { name: 'Nifty 50', val: '+1.1%', up: true },
            ].map((t, i) => (
              <TouchableOpacity key={i} style={styles.tickerChip}>
                <View style={[styles.liveDot, { backgroundColor: t.up ? Colors.neonLime : '#FF4B4B' }]} />
                <Text style={styles.tickerName}>{t.name}</Text>
                <Text style={[styles.tickerVal, { color: t.up ? Colors.neonLime : '#FF4B4B' }]}>{t.val}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addTickerBtn}>
              <Plus size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.addTickerTxt}>Edit</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>



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
                  if (item.label === 'Calculator' || item.id === '3') {
                    toggleCalculator();
                    return;
                  }
                  
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
            {dynamicInsights.map((insight) => (
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

                <TouchableOpacity style={styles.insightLinkRow} onPress={() => setActiveInsight(insight.type)}>
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

      {/* ── DYNAMIC INSIGHTS MODAL ── */}
      <Modal visible={!!activeInsight} animationType="slide" transparent>
        {renderInsightDetails()}
      </Modal>

      {/* ── ADD MONEY MODAL ── */}
      <Modal visible={showAddMoney} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money to Wallet</Text>
              <TouchableOpacity onPress={() => setShowAddMoney(false)}>
                <Text style={{ color: '#FFF', fontSize: 24 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>AMOUNT (₹)</Text>
            <TextInput
              style={styles.input}
              value={amountToAdd}
              onChangeText={setAmountToAdd}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoFocus
            />

            <TouchableOpacity
              onPress={handleAddMoney}
              disabled={isProcessing || !amountToAdd}
              style={{ opacity: isProcessing || !amountToAdd ? 0.6 : 1, marginTop: 16 }}
            >
              <LinearGradient
                colors={['#8E2DE2', '#4A00E0']}
                style={styles.payBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.payBtnText, { color: '#FFF' }]}>
                    PROCEED TO PAY
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Security Password Modal ─── */}
      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="fade"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <BlurView blurType="dark" blurAmount={30} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ShieldCheck size={24} color={Colors.neonLime} />
              <Text style={styles.modalTitle}>Enter U-PIN</Text>
              <Text style={styles.modalSub}>
                Enter your secret 6-digit transaction PIN to reveal your balance.
              </Text>
            </View>

              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={[styles.modalInput, { letterSpacing: 10, fontWeight: '800' }]}
                  placeholder="••••••"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry
                  value={uPin}
                  onChangeText={setUPin}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setIsPasswordModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirm} 
                onPress={verifyBalanceUpin}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    Verify
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05001F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  modalSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalInputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  modalInput: {
    height: 56,
    paddingHorizontal: 20,
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 1.5,
    height: 50,
    backgroundColor: Colors.neonLime,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },

  heroSection: {
    paddingTop: 60,
    paddingBottom: 82,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: { position: 'relative' },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.neonLime, borderWidth: 2, borderColor: '#A855F7',
  },
  logo: { height: 30, width: 120, tintColor: '#FFF' },
  iconBtn: { overflow: 'hidden', borderRadius: 22 },
  glassCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  notifBadge: {
    position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.neonLime,
  },

  balanceArea: { marginBottom: 0 },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600', marginBottom: 16 },
  netWorthHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  netWorthLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  revealBtn: { marginLeft: 10, opacity: 0.6 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 2 },
  currencySymbol: { color: '#FFF', fontSize: 22, fontWeight: '400', marginRight: 6 },
  balanceMain: { color: '#FFF', fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  balanceDecimals: { color: 'rgba(255,255,255,0.7)', fontSize: 22, fontWeight: '700' },
  growthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  growthTxt: { color: Colors.neonLime, fontSize: 12, fontWeight: '800' },

  parallelActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -42, paddingHorizontal: 20, zIndex: 20 },
  scanBtnContainer: { alignItems: 'center', gap: 6 },
  scanGlassRing: { padding: 4, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  scanBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.neonLime, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  scanLabel: { color: Colors.neonLime, fontSize: 10, fontWeight: '800', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  actionPill: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 84, 
    borderRadius: 42, 
    marginLeft: 16, 
    paddingHorizontal: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.18)', 
    overflow: 'hidden', 
    backgroundColor: 'rgba(5, 5, 15, 0.4)' 
  },
  pillItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  pillIconGlass: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  pillLabel: { color: '#FFF', fontSize: 11, fontWeight: '700', opacity: 0.95 },

  tickerSection: { marginTop: 42 },
  tickerScroll: { paddingHorizontal: 20, gap: 10 },
  tickerChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  liveDot: { width: 4, height: 4, borderRadius: 2 },
  tickerName: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  tickerVal: { fontSize: 11, fontWeight: '800' },
  addTickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  addTickerTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },

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

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: '#0F0A20', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  inputLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16,
    color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  payBtn: { borderRadius: 30, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  payBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  // Insight Details Modal Specs
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0A0A14', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  modalCloseBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16 },
  modalCloseText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  insightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  insightRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  insightIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  insightTextWrap: { flex: 1 },
  insightRowMerchant: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  insightRowCategory: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  insightRowRight: { alignItems: 'flex-end', flexShrink: 0 },
  insightRowAmount: { fontSize: 16, fontWeight: '800' }
});