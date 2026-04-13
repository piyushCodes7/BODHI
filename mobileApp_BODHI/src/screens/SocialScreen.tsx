import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Plane, TrendingUp, Plus, Trash2 } from 'lucide-react-native';
import { Colors, Spacing } from '../theme/tokens';
import { BodhiHeader, useHeaderHeight } from '../components/BodhiHeader';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function SocialScreen({ navigation }: any) {
  const headerHeight = useHeaderHeight();

  const [ventures, setVentures] = useState([
    { id: 'v1', name: 'Growth Alphas', members: 5, meta: '1 Vote Pending' }
  ]);
  const [trips, setTrips] = useState([
    { id: 't1', name: 'Manali Trip 2026', members: 4, meta: 'Running Balance' }
  ]);

  const handleAddVenture = () => {
    Alert.prompt("New Venture Club", "Enter club name", [
      { text: "Cancel", style: "cancel" },
      { text: "Create", onPress: (name) => {
          if(!name) return;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setVentures([...ventures, { id: Date.now().toString(), name, members: 1, meta: 'New Club' }]);
      }}
    ]);
  };

  const handleAddTrip = () => {
    Alert.prompt("New Trip Wallet", "Where are you going?", [
      { text: "Cancel", style: "cancel" },
      { text: "Create", onPress: (name) => {
          if(!name) return;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setTrips([...trips, { id: Date.now().toString(), name, members: 1, meta: 'Just started' }]);
      }}
    ]);
  };

  const deleteVenture = (id: string) => {
    Alert.alert("Delete Club", "Disband the venture and refund all members?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setVentures(ventures.filter(v => v.id !== id));
      }}
    ]);
  };

  const deleteTrip = (id: string) => {
    Alert.alert("Delete Trip", "Remove this shared wallet?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setTrips(trips.filter(t => t.id !== id));
      }}
    ]);
  };

  return (
    <View style={styles.root}>
      <BodhiHeader dark username="Govind Jindal" />
      
      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingTop: headerHeight + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Social Hub</Text>
          <Text style={styles.subtitle}>Shared wealth & group adventures</Text>
        </View>

        {/* ── VENTURE CLUBS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Investment Ventures</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddVenture}>
              <Plus size={20} color={Colors.neonLime} />
            </TouchableOpacity>
          </View>

          {ventures.length === 0 ? (
            <Text style={styles.emptyText}>No active ventures.</Text>
          ) : (
            ventures.map(v => (
              <TouchableOpacity 
                key={v.id} 
                style={styles.card} 
                onPress={() => navigation.navigate('VentureClub', { clubName: v.name, memberCount: v.members })}
                activeOpacity={0.7}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(123, 47, 190, 0.1)' }]}>
                    <TrendingUp size={24} color={Colors.electricViolet} />
                  </View>
                  <View>
                    <Text style={styles.cardName}>{v.name}</Text>
                    <Text style={styles.cardMeta}>{v.members} Members • {v.meta}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteVenture(v.id)} style={styles.deleteAction}>
                  <Trash2 size={18} color="#606070" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── TRIP WALLETS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shared Trip Wallets</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddTrip}>
              <Plus size={20} color={Colors.neonLime} />
            </TouchableOpacity>
          </View>

          {trips.length === 0 ? (
            <Text style={styles.emptyText}>No active trips.</Text>
          ) : (
            trips.map(t => (
              <TouchableOpacity 
                key={t.id} 
                style={styles.card} 
                onPress={() => navigation.navigate('TripWallet', { tripName: t.name, memberCount: t.members })}
                activeOpacity={0.7}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 255, 0, 0.1)' }]}>
                    <Plane size={24} color={Colors.neonLime} />
                  </View>
                  <View>
                    <Text style={styles.cardName}>{t.name}</Text>
                    <Text style={styles.cardMeta}>{t.members} Members • {t.meta}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteTrip(t.id)} style={styles.deleteAction}>
                  <Trash2 size={18} color="#606070" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A14' },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },
  headerSection: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#A0A0B0', marginTop: 4 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  emptyText: { color: '#606070', fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(212, 255, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A1A24', padding: 16, borderRadius: 20, marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  cardMeta: { fontSize: 12, color: '#606070', marginTop: 2 },
  deleteAction: { padding: 8, marginRight: -4 }
});