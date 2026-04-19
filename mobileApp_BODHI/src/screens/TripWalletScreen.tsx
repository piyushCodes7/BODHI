/**
 * TripWalletScreen.tsx
 * LIVE: Connected to PostgreSQL /social/trips/{trip_id}
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
  Alert,
} from 'react-native';
import { ChevronLeft, Receipt, Users, Plus, CheckCircle2 } from 'lucide-react-native';
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

export function TripWalletScreen({ route, navigation }: any) {
  // Ensure we have fallback params just in case
  const { tripId, tripName } = route.params || {};
  const [tab, setTab] = useState<'EXPENSES' | 'MEMBERS'>('EXPENSES');
  
  // ── Live State ──
  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState<any>(null);

  const formatINR = (val: number) => `₹${Math.abs(val).toLocaleString('en-IN')}`;

  // 1. Fetch live trip details and balances from the backend
  const fetchTripData = async () => {
    if (!tripId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/social/trips/${tripId}`);
      setTripData(response.data);
    } catch (error) {
      console.error("Failed to fetch trip data:", error);
      Alert.alert("Error", "Could not load the trip wallet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, [tripId]);

  // 2. Add an expense (Hackathon shortcut: prompt for amount, use generic description)
  const handleAddExpense = () => {
    Alert.prompt(
      'Log an Expense',
      'Enter the amount you paid (₹)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async (amountStr) => {
            const amount = parseFloat(amountStr || '0');
            if (!amount || amount <= 0) return;
            
            try {
              await apiClient.post(`/social/trips/${tripId}/expenses`, {
                description: 'Group Expense', // You can build a full modal for this later!
                amount: amount,
              });
              await fetchTripData(); // Instantly refresh the screen and math
            } catch (e) {
              Alert.alert("Error", "Failed to add expense.");
            }
          },
        },
      ],
      'plain-text',
      '',
      'number-pad'
    );
  };

  // 3. Settle Up Logic
  const handleSettleUp = async () => {
    if (!tripData?.expenses || tripData.expenses.length === 0) {
      Alert.alert("Nothing to Settle", "No expenses have been logged for this trip yet!");
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get(`/social/trips/${tripId}/settle`);
      const transactions = response.data.transactions;

      if (transactions.length === 0) {
        Alert.alert("All Settled!", "Everyone's balances are perfectly even. No transfers needed.");
        return;
      }

      // Format the exact transfers into a readable string
      const settlementText = transactions.map((t: any) => {
        // Truncate IDs to 6 chars for now since we don't have user names joined yet
        const from = t.from_user.substring(0, 6);
        const to = t.to_user.substring(0, 6);
        return `• User ${from} pays ₹${t.amount} to User ${to}`;
      }).join('\n\n');

      Alert.alert(
        "Settlement Plan",
        `To make everyone even, the following transfers must be made:\n\n${settlementText}`,
        [
          { text: "Not Yet", style: "cancel" },
          { 
            text: "Request Payments", 
            onPress: () => Alert.alert("Success", "Payment requests sent to group members! (Mocked)") 
          }
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to calculate settlement plan.");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !tripData) {
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
          <Text style={styles.headerTitle}>{tripData.name || tripName}</Text>
          <Text style={styles.headerSub}>Shared Wallet</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* ── TABS ── */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'EXPENSES' && styles.activeTab]}
          onPress={() => setTab('EXPENSES')}
        >
          <Receipt size={16} color={tab === 'EXPENSES' ? C.bg : C.whiteDim} />
          <Text style={[styles.tabText, tab === 'EXPENSES' && styles.activeTabText]}>
            Expenses
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, tab === 'MEMBERS' && styles.activeTab]}
          onPress={() => setTab('MEMBERS')}
        >
          <Users size={16} color={tab === 'MEMBERS' ? C.bg : C.whiteDim} />
          <Text style={[styles.tabText, tab === 'MEMBERS' && styles.activeTabText]}>
            Members ({tripData.members?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'EXPENSES' ? (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Group Spends</Text>
              <Text style={styles.summaryValue}>{formatINR(tripData.total_expenses || 0)}</Text>
            </View>

            <TouchableOpacity style={styles.proposeBtn} activeOpacity={0.8} onPress={handleAddExpense}>
              <Plus size={20} color={C.bg} />
              <Text style={styles.proposeBtnText}>Add Expense</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Recent Spends</Text>
            {tripData.expenses?.map((exp: any) => (
              <View key={exp.id} style={styles.expenseCard}>
                <View>
                  <Text style={styles.expDesc}>{exp.desc}</Text>
                  <Text style={styles.expPaidBy}>Paid by {exp.paid_by}</Text>
                </View>
                <Text style={styles.expAmount}>{formatINR(exp.amount)}</Text>
              </View>
            ))}
            
            {(!tripData.expenses || tripData.expenses.length === 0) && (
              <Text style={{ color: C.whiteDim, textAlign: 'center', marginTop: 20 }}>
                No expenses logged yet.
              </Text>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.proposeBtn, { backgroundColor: C.purple, marginBottom: 20 }]} activeOpacity={0.8} onPress={handleSettleUp}>  
              <CheckCircle2 size={20} color={C.white} />
              <Text style={[styles.proposeBtnText, { color: C.white }]}>Settle Up Now</Text>
            </TouchableOpacity>

            {tripData.members?.map((member: any) => (
              <View key={member.user_id} style={styles.expenseCard}>
                <View>
                  {/* Truncate ID for UI until you join the users table to get real names */}
                  <Text style={styles.expDesc}>{member.user_id.substring(0, 8)}...</Text>
                  <Text style={styles.expPaidBy}>Paid: {formatINR(member.contributed)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.expAmount, { color: member.balance >= 0 ? C.neonLime : C.red }]}>
                    {member.balance >= 0 ? '+' : '-'}{formatINR(member.balance)}
                  </Text>
                  <Text style={{ color: C.whiteDim, fontSize: 10 }}>
                    {member.balance >= 0 ? 'Gets back' : 'Owes'}
                  </Text>
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
  headerSub: { color: C.neonLime, fontSize: 12, fontWeight: '600', marginTop: 2 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border, gap: 6 },
  activeTab: { backgroundColor: C.neonLime, borderColor: C.neonLime },
  tabText: { color: C.whiteDim, fontSize: 14, fontWeight: '700' },
  activeTabText: { color: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { color: C.white, fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 10 },
  summaryCard: { backgroundColor: C.cardBg, padding: 20, borderRadius: 20, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  summaryLabel: { color: C.whiteDim, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  summaryValue: { color: C.white, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  expenseCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.cardBg, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  expDesc: { color: C.white, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  expPaidBy: { color: C.whiteDim, fontSize: 12, fontWeight: '500' },
  expAmount: { color: C.white, fontSize: 16, fontWeight: '800' },
  proposeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.neonLime, paddingVertical: 16, borderRadius: 16, marginBottom: 24, gap: 8 },
  proposeBtnText: { color: C.bg, fontSize: 15, fontWeight: '800' },
});