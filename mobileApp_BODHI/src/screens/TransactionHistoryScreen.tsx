import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { MOCK_TRANSACTIONS, Transaction } from '../data/mockTransactions';

export function TransactionHistoryScreen() {
  const navigation = useNavigation();

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'CREDIT';
    
    return (
      <View style={styles.txRow}>
        <View style={styles.txLeft}>
          <View style={[styles.iconWrap, { backgroundColor: isCredit ? 'rgba(200,255,0,0.1)' : 'rgba(255,255,255,0.05)' }]}>
            {isCredit ? (
              <ArrowDownRight size={20} color="#C8FF00" />
            ) : (
              <ArrowUpRight size={20} color="#FFF" />
            )}
          </View>
          <View>
            <Text style={styles.txMerchant}>{item.merchant}</Text>
            <Text style={styles.txCategory}>
              {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {item.account_last4 || item.category}
            </Text>
          </View>
        </View>

        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isCredit ? '#C8FF00' : '#FFF' }]}>
            {isCredit ? '+' : '-'}₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{top:15, bottom:15, left:15, right:15}}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* List */}
      <FlatList
        data={MOCK_TRANSACTIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05001F' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#12121A',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txMerchant: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  txCategory: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: '800' },
});
