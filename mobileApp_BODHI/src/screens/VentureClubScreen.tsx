import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, FlatList 
} from 'react-native';
import { 
  Check, X, Users, TrendingUp, TrendingDown, Plus, Trash2, Search, MessageSquare 
} from 'lucide-react-native';
import { Colors, Spacing, Radius, Shadow } from '../theme/tokens';
import { BodhiHeader, useHeaderHeight } from '../components/BodhiHeader';

// --- 1. MOCK API DATA (Replace with your actual Axios calls) ---
const MOCK_API_STOCKS = [
  { id: '1', symbol: 'TATA MOTORS', price: 984.30, change: '+2.5%', isUp: true },
  { id: '2', symbol: 'RELIANCE',    price: 2945.10,change: '+1.2%', isUp: true },
  { id: '3', symbol: 'ZOMATO',      price: 164.50, change: '-0.8%', isUp: false },
  { id: '4', symbol: 'JIO FIN',     price: 354.20, change: '+4.5%', isUp: true },
  { id: '5', symbol: 'HDFC BANK',   price: 1450.00,change: '-1.1%', isUp: false },
];

export function VentureClubScreen({ route, navigation }: any) {
  const headerHeight = useHeaderHeight();
  const { clubName } = route.params || { clubName: 'Venture Club' };

  // --- STATE ---
  const [members, setMembers] = useState([
    { id: '1', name: 'Govind J.', initials: 'GJ' },
    { id: '2', name: 'Piyush',    initials: 'P' },
    { id: '3', name: 'Manan',     initials: 'M' }
  ]);

  const [activeProposal, setActiveProposal] = useState<any>(null);
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [votes, setVotes] = useState({ yes: 0, no: 0 });
  const [hasVoted, setHasVoted] = useState(false);

  // --- MEMBER LOGIC ---
  const handleAddMember = () => {
    Alert.prompt("Add Member", "Enter member's name:", [
      { text: "Cancel", style: "cancel" },
      { text: "Add", onPress: (name) => {
          if (!name) return;
          const initials = name.substring(0, 2).toUpperCase();
          setMembers(prev => [...prev, { id: Date.now().toString(), name, initials }]);
        }
      }
    ]);
  };

  const handleRemoveMember = (id: string, name: string) => {
    Alert.alert("Remove", `Remove ${name} from this club?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
          setMembers(prev => prev.filter(m => m.id !== id));
      }}
    ]);
  };

  // --- STOCK PROPOSAL LOGIC ---
  const handleSelectStock = (stock: any) => {
    setActiveProposal(stock);
    setIsStockModalVisible(false);
    // Reset votes for the new proposal
    setVotes({ yes: 0, no: 0 });
    setHasVoted(false);
  };

  // --- VOTING LOGIC ---
  const handleVote = (decision: 'YES' | 'NO') => {
    setHasVoted(true);
    const newVotes = decision === 'YES' ? { ...votes, yes: votes.yes + 1 } : { ...votes, no: votes.no + 1 };
    setVotes(newVotes);

    // Dynamic Math: Needs > 50% of current members to pass
    const majorityThreshold = Math.floor(members.length / 2) + 1;

    if (newVotes.yes >= majorityThreshold) {
      Alert.alert("Proposal Passed! 🚀", `The club reached consensus. Purchasing ₹5,000 of ${activeProposal.symbol} from the shared vault.`);
    } else if (newVotes.no >= majorityThreshold) {
      Alert.alert("Proposal Rejected ❌", "The club voted against this investment.");
    }
  };

  return (
    <View style={styles.root}>
      <BodhiHeader dark showBack onBack={() => navigation.goBack()} username="Govind" />
      
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: headerHeight + 16 }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.clubTitle}>{clubName}</Text>
          <Text style={styles.clubMeta}>{members.length} Members • Shared Vault: ₹1.2L</Text>
        </View>

        {/* ── ACTIVE PROPOSAL CARD ── */}
        <View style={styles.assetCard}>
          {!activeProposal ? (
            // Empty State: Create a Proposal
            <View style={styles.emptyProposal}>
              <TrendingUp size={48} color="#333" style={{ marginBottom: 16 }} />
              <Text style={styles.assetName}>No Active Proposal</Text>
              <Text style={styles.proposalText}>Select a stock from the market to start a group vote.</Text>
              <TouchableOpacity style={styles.selectStockBtn} onPress={() => setIsStockModalVisible(true)}>
                <Search size={18} color="#000" />
                <Text style={styles.selectStockBtnText}>Search Market</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Active State: Votable Asset
            <>
              <TouchableOpacity 
                style={styles.changeAssetBtn} 
                onPress={() => setIsStockModalVisible(true)}
              >
                <Text style={styles.changeAssetText}>Change</Text>
              </TouchableOpacity>

              {activeProposal.isUp ? (
                <TrendingUp size={40} color={Colors.neonLime} />
              ) : (
                <TrendingDown size={40} color={Colors.hotPink} />
              )}
              <Text style={styles.assetName}>{activeProposal.symbol}</Text>
              <Text style={styles.assetPrice}>
                ₹{activeProposal.price} <Text style={{ color: activeProposal.isUp ? Colors.neonLime : Colors.hotPink, fontSize: 14 }}>{activeProposal.change}</Text>
              </Text>
              <Text style={styles.proposalText}>Proposal: Invest ₹5,000 from Pool</Text>

              <View style={styles.statusBox}>
                <Users size={20} color="#A0A0B0" />
                <Text style={styles.statusText}>Votes Cast: {votes.yes + votes.no} / {members.length}</Text>
              </View>

              {!hasVoted ? (
                <View style={styles.voteRow}>
                  <TouchableOpacity style={[styles.btn, styles.noBtn]} onPress={() => handleVote('NO')}>
                    <X color="#FFF" />
                    <Text style={styles.btnText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.yesBtn]} onPress={() => handleVote('YES')}>
                    <Check color="#000" />
                    <Text style={[styles.btnText, { color: '#000' }]}>Invest</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.votedContainer}>
                   <Text style={styles.votedText}>Vote Recorded: {votes.yes} YES | {votes.no} NO</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── MEMBERS LIST ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Club Members</Text>
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
            <TouchableOpacity onPress={() => handleRemoveMember(m.id, m.name)} style={{ padding: 8 }}>
              <Trash2 size={18} color="#606070" />
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 24 }} />

        {/* ── DISCUSSION / CHAT BUTTON ── */}
        <TouchableOpacity 
          style={styles.chatBtn} 
          onPress={() => Alert.alert("Club Chat", "Opening group discussion...")}
        >
          <MessageSquare size={20} color={Colors.electricViolet} />
          <Text style={styles.chatBtnText}>Discuss with Club</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── STOCK PICKER MODAL (Mock API Fetch) ── */}
      <Modal visible={isStockModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Market Assets</Text>
              <TouchableOpacity onPress={() => setIsStockModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={MOCK_API_STOCKS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.stockItem} onPress={() => handleSelectStock(item)}>
                  <View>
                    <Text style={styles.stockSymbol}>{item.symbol}</Text>
                    <Text style={styles.stockPrice}>₹{item.price.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.stockBadge, { backgroundColor: item.isUp ? 'rgba(212, 255, 0, 0.1)' : 'rgba(255, 42, 95, 0.1)' }]}>
                     <Text style={[styles.stockChange, { color: item.isUp ? Colors.neonLime : Colors.hotPink }]}>{item.change}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A14' },
  content: { padding: Spacing.xl, paddingBottom: 100 },
  header: { marginBottom: 24, alignItems: 'center' },
  clubTitle: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  clubMeta: { fontSize: 14, color: '#A0A0B0', marginTop: 4, fontWeight: '600' },
  
  assetCard: { backgroundColor: '#1A1A24', width: '100%', padding: 32, borderRadius: 32, alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', ...Shadow.md },
  changeAssetBtn: { position: 'absolute', top: 20, right: 20, padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.full },
  changeAssetText: { color: '#A0A0B0', fontSize: 12, fontWeight: '700' },
  emptyProposal: { alignItems: 'center' },
  assetName: { fontSize: 24, fontWeight: '800', color: '#FFF', marginTop: 16, textAlign: 'center' },
  assetPrice: { fontSize: 18, fontWeight: '700', color: '#FFF', marginTop: 4 },
  proposalText: { color: '#A0A0B0', marginTop: 8, textAlign: 'center', marginBottom: 24 },
  
  selectStockBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.neonLime, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.full },
  selectStockBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },

  statusBox: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statusText: { color: '#A0A0B0', fontWeight: '600' },
  voteRow: { flexDirection: 'row', gap: 16, width: '100%' },
  btn: { flex: 1, flexDirection: 'row', height: 54, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', gap: 8 },
  noBtn: { backgroundColor: '#FF2A5F' },
  yesBtn: { backgroundColor: Colors.neonLime },
  btnText: { fontWeight: '800', color: '#FFF', fontSize: 16 },
  votedContainer: { backgroundColor: '#11111A', padding: 16, borderRadius: 16, width: '100%', alignItems: 'center' },
  votedText: { color: Colors.neonLime, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(212, 255, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },

  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#11111A', padding: 16, borderRadius: 20, marginBottom: 12 },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.electricViolet, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#FFF' },

  chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#1A1A24', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(123, 47, 190, 0.3)' },
  chatBtnText: { fontSize: 16, fontWeight: '700', color: Colors.electricViolet },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1A1A24', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: Spacing.xl, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  closeBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.full },
  stockItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  stockSymbol: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  stockPrice: { fontSize: 14, color: '#A0A0B0', marginTop: 4 },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  stockChange: { fontSize: 12, fontWeight: '800' }
});