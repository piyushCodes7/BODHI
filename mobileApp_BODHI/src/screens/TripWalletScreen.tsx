import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Plane, Trash2, CheckCircle2, Receipt, Wallet, Plus } from 'lucide-react-native';
import { Colors, Spacing, Shadow } from '../theme/tokens';
import { BodhiHeader, useHeaderHeight } from '../components/BodhiHeader'; // <-- Added hook

export function TripWalletScreen({ route, navigation }: any) {
  const headerHeight = useHeaderHeight(); // <-- Dynamic Header Height
  const { tripName } = route.params || { tripName: 'Shared Wallet' };

  // Fully dynamic member state
  const [members, setMembers] = useState([
    { id: '1', name: 'Govind', contributed: 7500, initials: 'GJ' }
  ]);

  const [totalSpent, setTotalSpent] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const totalContributions = members.reduce((sum, m) => sum + m.contributed, 0);
  const currentPoolBalance = totalContributions - totalSpent;

  // --- LOGIC: ADD & REMOVE MEMBERS ---
  const handleAddMember = () => {
    Alert.prompt("Add Member", "Enter the new member's name:", [
      { text: "Cancel", style: "cancel" },
      { text: "Next", onPress: (name) => {
          if (!name) return;
          // Chain prompt to get their contribution
          Alert.prompt("Initial Contribution", `How much is ${name} adding to the pool?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Add Member", onPress: (amt) => {
                const val = parseFloat(amt || '0');
                const initials = name.substring(0, 2).toUpperCase();
                setMembers(prev => [...prev, { id: Date.now().toString(), name, contributed: val, initials }]);
            }}
          ], "plain-text", "0", "decimal-pad");
        }
      }
    ]);
  };

  const handleRemoveMember = (id: string, name: string) => {
    Alert.alert("Remove Member", `Are you sure you want to remove ${name} from this trip?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
          setMembers(prev => prev.filter(m => m.id !== id));
      }}
    ]);
  };

  // --- LOGIC: SPEND & SETTLE ---
  const handleAddExpense = () => {
    Alert.prompt("New Expense", "Enter the amount spent", [
      { text: "Cancel", style: "cancel" },
      { text: "Deduct", onPress: (val) => {
          const amt = parseFloat(val || '0');
          if (amt > currentPoolBalance) Alert.alert("Insufficient Pool");
          else setTotalSpent(prev => prev + amt);
        }
      }
    ], "plain-text", "", "decimal-pad");
  };

  const handleSettleAndClose = () => {
    if (members.length === 0) return Alert.alert("Error", "No members in the trip.");
    if (totalSpent === 0) return Alert.alert("No Expenses", "Nothing spent yet.");

    const fairShare = totalSpent / members.length;
    let summary = `Total Spent: ₹${totalSpent}\nFair Share: ₹${fairShare.toFixed(0)} each.\n\n`;

    members.forEach(m => {
      const balance = m.contributed - fairShare;
      if (balance > 0) summary += `• ${m.name}: Receives ₹${balance.toFixed(0)} back\n`;
      else if (balance < 0) summary += `• ${m.name}: Owed ₹${Math.abs(balance).toFixed(0)}\n`;
      else summary += `• ${m.name}: Settled\n`;
    });

    Alert.alert("Settle Trip", summary, [
      { text: "Cancel", style: "cancel" },
      { text: "CLOSE TRIP", onPress: () => {
          setIsClosing(true);
          setTimeout(() => { Alert.alert("Success", "Settlements sent."); navigation.goBack(); }, 1000);
        }
      }
    ]);
  };

  return (
    <View style={styles.root}>
      <BodhiHeader dark showBack onBack={() => navigation.goBack()} username="Govind" />

      {/* Applying Dynamic Padding Here */}
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + 16 }]}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.iconBox}><Plane size={24} color={Colors.neonLime} /></View>
            <TouchableOpacity onPress={() => navigation.goBack()}><Trash2 size={24} color={Colors.hotPink} /></TouchableOpacity>
          </View>
          <Text style={styles.title}>{tripName}</Text>
          <Text style={styles.subtitle}>Shared Wallet • {members.length} Members</Text>
        </View>

        <View style={styles.treasuryCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>CURRENT POOL BALANCE</Text>
            <Wallet size={16} color={Colors.neonLime} />
          </View>
          <Text style={styles.balanceAmount}>₹{currentPoolBalance.toLocaleString()}</Text>
          <View style={styles.statsRow}>
            <View><Text style={styles.statLabel}>Pooled</Text><Text style={styles.statValue}>₹{totalContributions}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Text style={styles.statLabel}>Spent</Text><Text style={[styles.statValue, { color: Colors.hotPink }]}>₹{totalSpent}</Text></View>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressFill, { width: totalContributions > 0 ? `${(totalSpent / totalContributions) * 100}%` : '0%' }]} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Group Members</Text>
          <TouchableOpacity onPress={handleAddMember} style={styles.addBtn}>
             <Plus size={20} color={Colors.neonLime} />
          </TouchableOpacity>
        </View>

        {members.map(m => (
          <View key={m.id} style={styles.memberRow}>
            <View style={styles.memberLeft}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{m.initials}</Text></View>
              <Text style={styles.memberName}>{m.name}</Text>
            </View>
            
            <View style={styles.memberRight}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.memberCont}>₹{m.contributed}</Text>
                <Text style={styles.memberSub}>Contributed</Text>
              </View>
              {/* Trash icon to remove a specific member */}
              <TouchableOpacity onPress={() => handleRemoveMember(m.id, m.name)} style={{ padding: 4 }}>
                <Trash2 size={18} color="#606070" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 30 }} />
        <TouchableOpacity style={styles.actionBtn} onPress={handleAddExpense}>
          <Receipt size={20} color={Colors.neonLime} />
          <Text style={styles.actionBtnText}>Record Group Expense</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.settleBtn, isClosing && { opacity: 0.7 }]} onPress={handleSettleAndClose} disabled={isClosing}>
          <CheckCircle2 size={22} color="#000" strokeWidth={2.5} />
          <Text style={styles.settleBtnText}>{isClosing ? 'PROCESSING...' : 'SETTLE & CLOSE TRIP'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A14' },
  scroll: { padding: Spacing.xl, paddingBottom: 150 },
  header: { marginBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(212, 255, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#A0A0B0', marginTop: 4 },
  treasuryCard: { backgroundColor: '#1A1A24', borderRadius: 28, padding: 24, marginBottom: 32, ...Shadow.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLabel: { fontSize: 10, fontWeight: '800', color: '#A0A0B0', letterSpacing: 1.5 },
  balanceAmount: { fontSize: 48, fontWeight: '900', color: '#FFF', marginBottom: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statLabel: { fontSize: 10, color: '#606070', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  progressContainer: { height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.neonLime },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(212, 255, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },

  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#11111A', padding: 16, borderRadius: 20, marginBottom: 12 },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.electricViolet, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  
  memberRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberCont: { fontSize: 16, fontWeight: '800', color: Colors.neonLime },
  memberSub: { fontSize: 10, color: '#606070', textAlign: 'right' },
  
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#1A1A24', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: Colors.neonLime },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40, backgroundColor: '#0A0A14' },
  settleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.neonLime, paddingVertical: 20, borderRadius: 50 },
  settleBtnText: { fontSize: 16, fontWeight: '900', color: '#000' },
});