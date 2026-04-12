// ─────────────────────────────────────────────────────────────
//  SocialScreen.tsx — Social Clubs (fully wired)
//  Real backend: clubs, contributions, invites, comments,
//  venture bets. Matches BODHI design tokens exactly.
// ─────────────────────────────────────────────────────────────

import React, {
  useState, useEffect, useCallback, useRef,
} from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  TextInput, StyleSheet, Dimensions, ActivityIndicator,
  Modal, Alert, RefreshControl, Share, Animated,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '../theme/tokens';
import { BodhiHeader, useHeaderHeight } from '../components/BodhiHeader';
import { apiClient } from '../api/client';

const { width: W } = Dimensions.get('window');
const S = Spacing;

// ─── Types ───────────────────────────────────────────────────
type ClubType = 'trip' | 'venture' | 'savings' | 'challenge';

interface LatestComment {
  id: number; user_id: number; username: string;
  body: string; created_at: string;
}

interface Club {
  id: number; name: string; description: string;
  emoji: string; club_type: ClubType;
  goal_amount: number; currency: string;
  total_pooled: number; member_count: number;
  progress_pct: number; invite_code: string;
  deadline: string | null; created_by: number;
  latest_comment: LatestComment | null;
  is_public: boolean;
}

interface Invitation {
  id: number; club_id: number; club_name: string;
  club_emoji: string; invited_by: number;
  token: string; expires_at: string;
}

interface Contribution {
  id: number; user_id: number; amount: number;
  note: string; status: string; created_at: string;
}

interface Comment {
  id: number; user_id: number; username: string;
  body: string; created_at: string;
}

interface VentureBet {
  id: number; title: string; description: string;
  target_amount: number; total_committed: number;
  deadline: string | null; status: string;
  outcome_note: string; positions: any[];
}

interface ClubDetail extends Club {
  contributions: Contribution[];
  comments: Comment[];
  venture_bets: VentureBet[];
}

interface Dashboard {
  my_clubs: Club[];
  open_invitations: Invitation[];
  social_net_value: number;
  total_clubs: number;
  total_contributed: number;
}

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (n: number, cur = 'INR') => {
  if (cur === 'INR') return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const fmtK = (n: number) =>
  n >= 100_000 ? `${(n / 100_000).toFixed(1)}L`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k`
  : String(Math.round(n));

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const CLUB_TYPE_META: Record<ClubType, { label: string; color: string; bg: string }> = {
  trip:      { label: 'TRIP FUND',    color: Colors.electricViolet, bg: Colors.electricViolet + '18' },
  venture:   { label: 'VENTURE CLUB', color: '#d97706',             bg: '#fef3c7' },
  savings:   { label: 'SAVINGS CLUB', color: '#16a34a',             bg: '#dcfce7' },
  challenge: { label: 'CHALLENGE',    color: '#db2777',             bg: '#fce7f3' },
};

// ─── Member avatars ───────────────────────────────────────────
const EMOJI_AVATARS = ['🧑','👩','🧔','👱','🧕','👨','👴','👵'];
function MemberAvatars({ count }: { count: number }) {
  const shown = Math.min(3, count);
  const extra = count - shown;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {Array.from({ length: shown }).map((_, i) => (
        <View key={i} style={[styles.avatar, { marginLeft: i > 0 ? -10 : 0 }]}>
          <Text style={{ fontSize: 14 }}>{EMOJI_AVATARS[i % EMOJI_AVATARS.length]}</Text>
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.avatar, styles.avatarCount, { marginLeft: -10 }]}>
          <Text style={styles.avatarCountText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Progress bar ─────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  return (
    <View style={styles.progressBg}>
      <LinearGradient
        colors={[Colors.electricViolet, Colors.magenta]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.progressFill, { width: `${Math.min(100, pct)}%` as any }]}
      />
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export function SocialScreen() {
  const headerH = useHeaderHeight();

  // ── Data state ───────────────────────────────────────────
  const [dashboard, setDashboard]     = useState<Dashboard | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  // ── Modals ───────────────────────────────────────────────
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [inviteModal, setInviteModal] = useState(false);
  const [contribModal, setContribModal] = useState(false);
  const [contribClub, setContribClub] = useState<Club | null>(null);

  // ── Create club form ─────────────────────────────────────
  const [newName, setNewName]           = useState('');
  const [newDesc, setNewDesc]           = useState('');
  const [newEmoji, setNewEmoji]         = useState('🏖️');
  const [newType, setNewType]           = useState<ClubType>('trip');
  const [newGoal, setNewGoal]           = useState('');
  const [newPublic, setNewPublic]       = useState(false);
  const [creating, setCreating]         = useState(false);

  // ── Contribute form ──────────────────────────────────────
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote]     = useState('');
  const [contributing, setContributing]   = useState(false);

  // ── Comment form ─────────────────────────────────────────
  const [commentBody, setCommentBody]   = useState('');
  const [postingComment, setPosting]    = useState(false);

  // ── Invite accept ─────────────────────────────────────────
  const [inviteToken, setInviteToken]   = useState('');
  const [acceptingInvite, setAccepting] = useState(false);

  // ─── Fetch dashboard ─────────────────────────────────────
  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiClient.get('/social/dashboard');
      setDashboard(res.data);
    } catch (e: any) {
      if (!silent) Alert.alert('Error', 'Could not load social clubs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ─── Open club detail ─────────────────────────────────────
  const openClub = async (club: Club) => {
    setLoadingDetail(true);
    setDetailModal(true);
    try {
      const res = await apiClient.get(`/social/clubs/${club.id}`);
      setSelectedClub(res.data);
    } catch {
      Alert.alert('Error', 'Could not load club details.');
      setDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ─── Create club ──────────────────────────────────────────
  const createClub = async () => {
    if (!newName.trim()) { Alert.alert('Enter a club name'); return; }
    setCreating(true);
    try {
      await apiClient.post('/social/clubs', {
        name:        newName.trim(),
        description: newDesc.trim(),
        emoji:       newEmoji,
        club_type:   newType,
        goal_amount: parseFloat(newGoal) || 0,
        is_public:   newPublic,
        currency:    'INR',
      });
      setCreateModal(false);
      setNewName(''); setNewDesc(''); setNewGoal('');
      fetchDashboard(true);
      Alert.alert('Club created! 🎉', `"${newName}" is ready. Share your invite code with friends.`);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Could not create club.');
    } finally {
      setCreating(false);
    }
  };

  // ─── Contribute ───────────────────────────────────────────
  const contribute = async () => {
    if (!contribClub) return;
    const amount = parseFloat(contribAmount);
    if (!amount || amount <= 0) { Alert.alert('Enter a valid amount'); return; }
    setContributing(true);
    try {
      await apiClient.post('/social/contribute', {
        club_id: contribClub.id,
        amount,
        note: contribNote.trim(),
      });
      setContribModal(false);
      setContribAmount(''); setContribNote('');
      fetchDashboard(true);
      if (selectedClub?.id === contribClub.id) {
        const res = await apiClient.get(`/social/clubs/${contribClub.id}`);
        setSelectedClub(res.data);
      }
      Alert.alert('✅ Contributed!', `₹${amount.toLocaleString('en-IN')} added to ${contribClub.name}`);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Could not contribute.');
    } finally {
      setContributing(false);
    }
  };

  // ─── Post comment ─────────────────────────────────────────
  const postComment = async () => {
    if (!selectedClub || !commentBody.trim()) return;
    setPosting(true);
    try {
      await apiClient.post('/social/comments', {
        club_id: selectedClub.id,
        body: commentBody.trim(),
      });
      setCommentBody('');
      const res = await apiClient.get(`/social/clubs/${selectedClub.id}`);
      setSelectedClub(res.data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Could not post comment.');
    } finally {
      setPosting(false);
    }
  };

  // ─── Share invite ─────────────────────────────────────────
  const shareInvite = async (club: Club) => {
    try {
      const res = await apiClient.post('/social/invite', { club_id: club.id });
      const token = res.data.token;
      const link  = `https://bodhi.app/join/${token}`;
      await Share.share({
        message: `Join "${club.name}" on BODHI!\n\n${link}\n\nOr use invite code: ${club.invite_code}`,
        title:   `Join ${club.name}`,
      });
    } catch (e: any) {
      Alert.alert('Error', 'Could not generate invite link.');
    }
  };

  // ─── Accept invite ────────────────────────────────────────
  const acceptInvite = async (token: string) => {
    setAccepting(true);
    try {
      const res = await apiClient.post('/social/invite/accept', { token });
      setInviteModal(false);
      setInviteToken('');
      fetchDashboard(true);
      Alert.alert('🎉 Joined!', `You joined "${res.data.club_name}"`);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Invalid or expired invite.');
    } finally {
      setAccepting(false);
    }
  };

  // ─── Quick accept from notification ──────────────────────
  const quickAcceptInvitation = (inv: Invitation) => {
    Alert.alert(
      `Join ${inv.club_emoji} ${inv.club_name}?`,
      'You were invited to join this club.',
      [
        { text: 'Decline', style: 'destructive', onPress: async () => {
          try { await apiClient.post('/social/invite/accept', { token: inv.token }); }
          catch {}
          fetchDashboard(true);
        }},
        { text: 'Join', onPress: () => acceptInvite(inv.token) },
      ]
    );
  };

  // ─── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <BodhiHeader showSearch />
        <ActivityIndicator size="large" color={Colors.electricViolet} />
        <Text style={styles.mutedText}>Loading your clubs…</Text>
      </View>
    );
  }

  // 1. Add this safety check!
  if (!dashboard) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' }}>
        <ActivityIndicator size="large" color="#E5FF00" />
        <Text style={{ color: 'white', marginTop: 10 }}>Loading Social...</Text>
      </View>
    );
  }

  // 2. Now it's safe to read the data (remove the '!' since we know it's not null)
  const d = dashboard;
  const activeFund  = d.my_clubs.find(c => c.club_type === 'trip');
  const ventureClub = d.my_clubs.find(c => c.club_type === 'venture');
  const otherClubs  = d.my_clubs.filter(c => c.id !== activeFund?.id && c.id !== ventureClub?.id);

  // ─── Render ───────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <BodhiHeader showSearch />

      {/* ── Create club modal ──────────────────────────── */}
      <Modal visible={createModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Club</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: S.xl, gap: S.xl }} keyboardShouldPersistTaps="handled">

              {/* Type picker */}
              <View style={{ gap: 8 }}>
                <Text style={styles.inputLabel}>CLUB TYPE</Text>
                <View style={styles.typeRow}>
                  {(['trip', 'venture', 'savings', 'challenge'] as ClubType[]).map(t => {
                    const meta = CLUB_TYPE_META[t];
                    const active = newType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeChip, active && { backgroundColor: meta.bg, borderColor: meta.color }]}
                        onPress={() => setNewType(t)}
                      >
                        <Text style={[styles.typeChipText, active && { color: meta.color }]}>
                          {t === 'trip' ? '✈️' : t === 'venture' ? '🚀' : t === 'savings' ? '💰' : '🔥'}
                          {' '}{t.charAt(0).toUpperCase() + t.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Emoji */}
              <View style={{ gap: 8 }}>
                <Text style={styles.inputLabel}>EMOJI</Text>
                <View style={styles.emojiRow}>
                  {['🏖️','🌴','🚀','🏔️','🍕','💰','🎯','🏠','🎉','🌊'].map(e => (
                    <TouchableOpacity
                      key={e}
                      style={[styles.emojiChip, newEmoji === e && { backgroundColor: Colors.electricViolet + '20', borderColor: Colors.electricViolet }]}
                      onPress={() => setNewEmoji(e)}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Name */}
              <View style={{ gap: 8 }}>
                <Text style={styles.inputLabel}>CLUB NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g. Goa Trip Fund 🌴"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={120}
                />
              </View>

              {/* Description */}
              <View style={{ gap: 8 }}>
                <Text style={styles.inputLabel}>DESCRIPTION (OPTIONAL)</Text>
                <TextInput
                  style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                  value={newDesc}
                  onChangeText={setNewDesc}
                  placeholder="What are you saving for?"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  maxLength={500}
                />
              </View>

              {/* Goal */}
              <View style={{ gap: 8 }}>
                <Text style={styles.inputLabel}>GOAL AMOUNT (₹) — OPTIONAL</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.currencyPfx}>₹</Text>
                  <TextInput
                    style={styles.inputField}
                    value={newGoal}
                    onChangeText={setNewGoal}
                    keyboardType="numeric"
                    placeholder="20000"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              {/* Public toggle */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setNewPublic(!newPublic)}
              >
                <View>
                  <Text style={styles.toggleLabel}>Make club public</Text>
                  <Text style={styles.toggleSub}>Anyone can discover and join via invite code</Text>
                </View>
                <View style={[styles.toggleTrack, newPublic && { backgroundColor: Colors.electricViolet }]}>
                  <View style={[styles.toggleThumb, newPublic && { transform: [{ translateX: 14 }] }]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.createBtn, creating && { opacity: 0.7 }]}
                onPress={createClub}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color={Colors.neonLimeDark} />
                  : <Text style={styles.createBtnText}>CREATE CLUB</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Contribute modal ───────────────────────────── */}
      <Modal visible={contribModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {contribClub?.emoji} Contribute
              </Text>
              <TouchableOpacity onPress={() => setContribModal(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: S.xl, gap: S.xl }} keyboardShouldPersistTaps="handled">

              {contribClub && (
                <View style={styles.contribClubInfo}>
                  <Text style={styles.contribClubName}>{contribClub.name}</Text>
                  <Text style={styles.contribClubProgress}>
                    ₹{fmtK(contribClub.total_pooled)} pooled
                    {contribClub.goal_amount > 0 ? ` · ${contribClub.progress_pct.toFixed(0)}% of ₹${fmtK(contribClub.goal_amount)}` : ''}
                  </Text>
                  {contribClub.goal_amount > 0 && <ProgressBar pct={contribClub.progress_pct} />}
                </View>
              )}

              <View style={{ gap: 8 }}>
                <Text style={styles.inputLabel}>AMOUNT (₹)</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.currencyPfx}>₹</Text>
                  <TextInput
                    style={styles.inputField}
                    value={contribAmount}
                    onChangeText={setContribAmount}
                    keyboardType="numeric"
                    placeholder="1000"
                    placeholderTextColor={Colors.textMuted}
                    autoFocus
                  />
                </View>
                <View style={styles.chipRow}>
                  {['500', '1000', '2500', '5000'].map(v => (
                    <TouchableOpacity key={v} style={styles.chip} onPress={() => setContribAmount(v)}>
                      <Text style={styles.chipText}>₹{parseInt(v).toLocaleString('en-IN')}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text style={styles.inputLabel}>NOTE (OPTIONAL)</Text>
                <TextInput
                  style={styles.textInput}
                  value={contribNote}
                  onChangeText={setContribNote}
                  placeholder="e.g. for the villa deposit 🌊"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={300}
                />
              </View>

              <TouchableOpacity
                style={[styles.contribBtn, contributing && { opacity: 0.7 }]}
                onPress={contribute}
                disabled={contributing}
              >
                {contributing
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.contribBtnText}>
                      ADD{contribAmount ? ` ₹${parseInt(contribAmount || '0').toLocaleString('en-IN')}` : ''} TO POOL
                    </Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Accept invite modal ─────────────────────────── */}
      <Modal visible={inviteModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Join a Club</Text>
            <TouchableOpacity onPress={() => setInviteModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: S.xl, gap: S.xl }}>
            <Text style={styles.inputLabel}>ENTER INVITE CODE OR TOKEN</Text>
            <TextInput
              style={styles.textInput}
              value={inviteToken}
              onChangeText={setInviteToken}
              placeholder="e.g. GOATRIP1 or paste invite link"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.contribBtn, acceptingInvite && { opacity: 0.7 }]}
              onPress={() => acceptInvite(inviteToken.trim())}
              disabled={acceptingInvite || !inviteToken.trim()}
            >
              {acceptingInvite
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.contribBtnText}>JOIN CLUB</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Club detail modal ───────────────────────────── */}
      <Modal visible={detailModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedClub?.emoji} {selectedClub?.name}
            </Text>
            <TouchableOpacity onPress={() => setDetailModal(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>

          {loadingDetail ? (
            <ActivityIndicator style={{ margin: 40 }} color={Colors.electricViolet} />
          ) : selectedClub ? (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ padding: S.xl, gap: S.xl }} keyboardShouldPersistTaps="handled">

                {/* Stats */}
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>POOLED</Text>
                    <Text style={styles.detailStatVal}>₹{fmtK(selectedClub.total_pooled)}</Text>
                  </View>
                  <View style={styles.detailStatDivider} />
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>GOAL</Text>
                    <Text style={styles.detailStatVal}>
                      {selectedClub.goal_amount > 0 ? `₹${fmtK(selectedClub.goal_amount)}` : '—'}
                    </Text>
                  </View>
                  <View style={styles.detailStatDivider} />
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>MEMBERS</Text>
                    <Text style={styles.detailStatVal}>{selectedClub.member_count}</Text>
                  </View>
                </View>

                {selectedClub.goal_amount > 0 && (
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.mutedText}>{selectedClub.progress_pct.toFixed(0)}% funded</Text>
                      {selectedClub.deadline && (
                        <Text style={styles.mutedText}>
                          Deadline: {new Date(selectedClub.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      )}
                    </View>
                    <ProgressBar pct={selectedClub.progress_pct} />
                  </View>
                )}

                {/* Actions */}
                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.detailActionBtn, { backgroundColor: Colors.electricViolet }]}
                    onPress={() => {
                      setContribClub(selectedClub);
                      setContribModal(true);
                    }}
                  >
                    <Text style={[styles.detailActionText, { color: '#fff' }]}>+ Contribute</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.detailActionBtn, { backgroundColor: Colors.surfaceHighest }]}
                    onPress={() => shareInvite(selectedClub)}
                  >
                    <Text style={styles.detailActionText}>Share Invite</Text>
                  </TouchableOpacity>
                </View>

                {/* Invite code pill */}
                <View style={styles.inviteCodePill}>
                  <Text style={styles.inviteCodeLabel}>INVITE CODE</Text>
                  <Text style={styles.inviteCodeValue}>{selectedClub.invite_code}</Text>
                </View>

                {/* Contributions ledger */}
                {selectedClub.contributions.length > 0 && (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.sectionTitle}>Contributions</Text>
                    {selectedClub.contributions.slice(0, 8).map(c => (
                      <View key={c.id} style={styles.ledgerRow}>
                        <View style={styles.ledgerAvatar}>
                          <Text style={{ fontSize: 14 }}>{EMOJI_AVATARS[c.user_id % EMOJI_AVATARS.length]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ledgerUser}>Member #{c.user_id}</Text>
                          {c.note ? <Text style={styles.ledgerNote}>{c.note}</Text> : null}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.ledgerAmount}>+₹{c.amount.toLocaleString('en-IN')}</Text>
                          <Text style={styles.ledgerTime}>{timeAgo(c.created_at)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Venture bets */}
                {selectedClub.club_type === 'venture' && selectedClub.venture_bets.length > 0 && (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.sectionTitle}>Active Bets</Text>
                    {selectedClub.venture_bets.map(bet => (
                      <View key={bet.id} style={styles.betCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text style={styles.betTitle}>{bet.title}</Text>
                          <View style={[styles.betStatusBadge, { backgroundColor: bet.status === 'open' ? '#dcfce7' : '#f3f4f6' }]}>
                            <Text style={[styles.betStatusText, { color: bet.status === 'open' ? '#16a34a' : Colors.textSecondary }]}>
                              {bet.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        {bet.description ? <Text style={styles.betDesc}>{bet.description}</Text> : null}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                          <Text style={styles.betMeta}>
                            ₹{fmtK(bet.total_committed)} committed · {bet.positions.length} investors
                          </Text>
                          {bet.target_amount > 0 && (
                            <Text style={styles.betMeta}>Target ₹{fmtK(bet.target_amount)}</Text>
                          )}
                        </View>
                        {bet.deadline && (
                          <Text style={[styles.betMeta, { color: Colors.errorRed }]}>
                            Closes: {new Date(bet.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Comments */}
                <View style={{ gap: 10 }}>
                  <Text style={styles.sectionTitle}>Club Chat</Text>
                  {selectedClub.comments.length === 0 ? (
                    <Text style={styles.mutedText}>No messages yet. Say something!</Text>
                  ) : (
                    selectedClub.comments.slice(0, 10).map(c => (
                      <View key={c.id} style={styles.commentBubble}>
                        <View style={styles.commentAvatar}>
                          <Text style={{ fontSize: 14 }}>{EMOJI_AVATARS[c.user_id % EMOJI_AVATARS.length]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.commentUser}>{c.username}</Text>
                            <Text style={styles.commentTime}>{timeAgo(c.created_at)}</Text>
                          </View>
                          <Text style={styles.commentBody}>{c.body}</Text>
                        </View>
                      </View>
                    ))
                  )}

                  {/* Comment input */}
                  <View style={styles.commentInputRow}>
                    <TextInput
                      style={styles.commentInput}
                      value={commentBody}
                      onChangeText={setCommentBody}
                      placeholder="Say something…"
                      placeholderTextColor={Colors.textMuted}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.commentSendBtn, (!commentBody.trim() || postingComment) && { opacity: 0.4 }]}
                      onPress={postComment}
                      disabled={!commentBody.trim() || postingComment}
                    >
                      {postingComment
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.commentSendText}>→</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>

              </ScrollView>
            </KeyboardAvoidingView>
          ) : null}
        </View>
      </Modal>

      {/* ── Main scroll ────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: headerH + 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchDashboard(); }}
            tintColor={Colors.electricViolet}
          />
        }
      >
        {/* Title */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={styles.pageTitle}>Social Clubs</Text>
            <Text style={styles.pageSub}>INVESTING IS BETTER WITH FRIENDS</Text>
          </View>
          <TouchableOpacity style={styles.joinBtn} onPress={() => setInviteModal(true)}>
            <Text style={styles.joinBtnText}>+ Join</Text>
          </TouchableOpacity>
        </View>

        {/* ── Active fund card (first trip club) ─────────── */}
        {activeFund ? (
          <TouchableOpacity onPress={() => openClub(activeFund)} activeOpacity={0.92}>
            <LinearGradient
              colors={[Colors.electricViolet, Colors.magenta, Colors.hotPink]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.fundBorder}
            >
              <View style={styles.fundCard}>
                <View style={styles.fundTop}>
                  <View>
                    <Text style={styles.fundTag}>
                      {CLUB_TYPE_META[activeFund.club_type].label}
                    </Text>
                    <Text style={styles.fundName}>{activeFund.name}</Text>
                  </View>
                  <MemberAvatars count={activeFund.member_count} />
                </View>

                <View style={styles.fundAmountRow}>
                  <View>
                    <Text style={styles.fundAmountLabel}>POOLED AMOUNT</Text>
                    <Text style={styles.fundAmount}>
                      ₹{activeFund.total_pooled.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  {activeFund.goal_amount > 0 && (
                    <Text style={styles.fundPct}>
                      {activeFund.progress_pct.toFixed(0)}% of ₹{fmtK(activeFund.goal_amount)}
                    </Text>
                  )}
                </View>

                {activeFund.goal_amount > 0 && <ProgressBar pct={activeFund.progress_pct} />}

                <TouchableOpacity
                  style={styles.swipeRow}
                  onPress={() => {
                    setContribClub(activeFund);
                    setContribModal(true);
                  }}
                >
                  <View style={styles.swipeArrow}>
                    <Text style={{ fontSize: 18, color: Colors.neonLimeDark }}>»</Text>
                  </View>
                  <Text style={styles.swipeLabel}>SWIPE TO INVEST TOGETHER</Text>
                </TouchableOpacity>

                {activeFund.latest_comment && (
                  <View style={styles.commentRow}>
                    <Text style={styles.commentIcon}>💬</Text>
                    <Text style={styles.commentText}>
                      <Text style={{ fontWeight: '700' }}>
                        {activeFund.latest_comment.username}:{' '}
                      </Text>
                      "{activeFund.latest_comment.body}"
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          // Empty state — create first club
          <TouchableOpacity style={styles.emptyFundCard} onPress={() => setCreateModal(true)}>
            <Text style={styles.emptyFundEmoji}>✈️</Text>
            <Text style={styles.emptyFundTitle}>Start a Trip Fund</Text>
            <Text style={styles.emptyFundSub}>Pool money with friends for your next adventure</Text>
            <View style={styles.emptyFundBtn}>
              <Text style={styles.emptyFundBtnText}>CREATE FUND</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Venture club card ──────────────────────────── */}
        {ventureClub ? (
          <TouchableOpacity style={styles.ventureCard} onPress={() => openClub(ventureClub)} activeOpacity={0.92}>
            <View style={styles.ventureTop}>
              <View>
                <Text style={styles.ventureTag}>VENTURE CLUB</Text>
                <Text style={styles.ventureName}>{ventureClub.name}</Text>
              </View>
              <MemberAvatars count={ventureClub.member_count} />
            </View>

            <View style={styles.ventureMeta}>
              <View style={styles.ventureMetaBox}>
                <Text style={styles.ventureMetaLabel}>ACTIVE BETS</Text>
                <Text style={styles.ventureMetaVal}>
                  {String(ventureClub.member_count).padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.ventureMetaBox}>
                <Text style={styles.ventureMetaLabel}>POOL TVL</Text>
                <Text style={styles.ventureMetaVal}>₹{fmtK(ventureClub.total_pooled)}</Text>
              </View>
            </View>

            {ventureClub.latest_comment && (
              <View style={styles.trendingRow}>
                <View style={styles.trendingIcon}>
                  <Text style={{ fontSize: 14 }}>⚡</Text>
                </View>
                <Text style={styles.trendingText}>
                  <Text style={{ fontWeight: '700' }}>Latest: </Text>
                  {ventureClub.latest_comment.body}
                </Text>
              </View>
            )}

            <View style={[styles.viewBtn, { backgroundColor: Colors.textPrimary }]}>
              <Text style={styles.viewBtnText}>VIEW OPPORTUNITIES</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ventureCard, { borderWidth: 1.5, borderColor: Colors.surfaceHighest, borderStyle: 'dashed' }]}
            onPress={() => { setNewType('venture'); setCreateModal(true); }}
          >
            <Text style={styles.ventureTag}>VENTURE CLUB</Text>
            <Text style={styles.ventureName}>Startup Bets 🚀</Text>
            <Text style={[styles.mutedText, { marginTop: 4 }]}>
              Pool money on startup rounds, IPOs, and market bets with your circle.
            </Text>
            <View style={[styles.viewBtn, { backgroundColor: Colors.surfaceHighest, marginTop: S.lg }]}>
              <Text style={[styles.viewBtnText, { color: Colors.textPrimary }]}>CREATE VENTURE CLUB</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Other clubs (savings, challenges) ─────────── */}
        {otherClubs.length > 0 && (
          <View style={{ gap: S.md }}>
            <Text style={styles.sectionTitle}>My Other Clubs</Text>
            {otherClubs.map(club => {
              const meta = CLUB_TYPE_META[club.club_type];
              return (
                <TouchableOpacity key={club.id} style={styles.miniClubCard} onPress={() => openClub(club)}>
                  <View style={[styles.miniClubEmoji, { backgroundColor: meta.bg }]}>
                    <Text style={{ fontSize: 22 }}>{club.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniClubName}>{club.name}</Text>
                    <Text style={styles.miniClubMeta}>
                      {club.member_count} members · ₹{fmtK(club.total_pooled)} pooled
                    </Text>
                  </View>
                  {club.goal_amount > 0 && (
                    <Text style={[styles.miniClubPct, { color: meta.color }]}>
                      {club.progress_pct.toFixed(0)}%
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Bento grid ──────────────────────────────────── */}
        <View style={styles.bentoRow}>
          {/* Social net value */}
          <View style={[styles.bentoCard, { backgroundColor: Colors.neonLime }]}>
            <Text style={{ fontSize: 28 }}>👥</Text>
            <Text style={styles.bentoSub}>YOUR SOCIAL NET</Text>
            <Text style={styles.bentoVal}>₹{fmtK(d.social_net_value)}</Text>
          </View>

          {/* Open invitations */}
          <TouchableOpacity
            style={[styles.bentoCard, { backgroundColor: '#e9e0ff' }]}
            onPress={() => d.open_invitations.length > 0 && quickAcceptInvitation(d.open_invitations[0])}
          >
            <Text style={[styles.bentoSub, { color: Colors.electricViolet }]}>OPEN INVITATIONS</Text>
            <View style={styles.bentoInvite}>
              <Text style={[styles.bentoVal, { color: Colors.electricViolet }]}>
                {String(d.open_invitations.length).padStart(2, '0')}
              </Text>
              {d.open_invitations.length > 0 && <View style={styles.bentoDot} />}
            </View>
            {d.open_invitations[0] && (
              <Text style={[styles.bentoSub, { color: Colors.electricViolet, fontSize: 9, marginTop: 4 }]}>
                {d.open_invitations[0].club_emoji} {d.open_invitations[0].club_name}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Invitations list ────────────────────────────── */}
        {d.open_invitations.length > 0 && (
          <View style={{ gap: S.md }}>
            <Text style={styles.sectionTitle}>Pending Invitations</Text>
            {d.open_invitations.map(inv => (
              <View key={inv.id} style={styles.inviteRow}>
                <Text style={{ fontSize: 28 }}>{inv.club_emoji}</Text>
                <View style={{ flex: 1, marginLeft: S.md }}>
                  <Text style={styles.inviteClubName}>{inv.club_name}</Text>
                  <Text style={styles.inviteMeta}>
                    Expires {new Date(inv.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => quickAcceptInvitation(inv)}
                >
                  <Text style={styles.acceptBtnText}>Join</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── Create club CTA ─────────────────────────────── */}
        <TouchableOpacity style={styles.createClubRow} onPress={() => setCreateModal(true)}>
          <Text style={styles.createClubIcon}>＋</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.createClubTitle}>Start a new club</Text>
            <Text style={styles.createClubSub}>Trip fund, savings goal, venture pool…</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingTop: 16, paddingBottom: 120, paddingHorizontal: S.xxl, gap: S.xxl },
  mutedText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary },

  pageTitle: { fontFamily: Fonts.headline, fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  pageSub: { fontFamily: Fonts.label, fontSize: 11, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 1.4, marginTop: 2 },

  joinBtn: {
    backgroundColor: Colors.electricViolet, borderRadius: Radius.full,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  joinBtnText: { fontFamily: Fonts.label, fontSize: 12, fontWeight: '700', color: '#fff' },

  // Avatar stack
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceContainer, borderWidth: 2,
    borderColor: Colors.surfaceWhite, alignItems: 'center', justifyContent: 'center',
  },
  avatarCount: { backgroundColor: Colors.secondaryContainer },
  avatarCountText: { fontFamily: Fonts.label, fontSize: 9, fontWeight: '700', color: Colors.onSecondaryContainer },

  // Progress bar
  progressBg: { height: 10, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainer, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.full },

  // Active fund card
  fundBorder: { borderRadius: Radius.lg + 1, padding: 1.5 },
  fundCard: { backgroundColor: Colors.surfaceWhite, borderRadius: Radius.lg, padding: S.xxl, gap: S.lg },
  fundTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  fundTag: { fontFamily: Fonts.label, fontSize: 10, fontWeight: '700', color: Colors.electricViolet, letterSpacing: 1.4, textTransform: 'uppercase' },
  fundName: { fontFamily: Fonts.headline, fontSize: 22, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.3 },
  fundAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  fundAmountLabel: { fontFamily: Fonts.label, fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.2 },
  fundAmount: { fontFamily: Fonts.headline, fontSize: 28, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -1 },
  fundPct: { fontFamily: Fonts.label, fontSize: 13, fontWeight: '700', color: Colors.electricViolet },
  swipeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceLow, borderRadius: Radius.full, padding: 6, gap: S.md,
  },
  swipeArrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.neonLime, alignItems: 'center', justifyContent: 'center' },
  swipeLabel: { fontFamily: Fonts.label, fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  commentIcon: { fontSize: 14, marginTop: 2 },
  commentText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, flex: 1, fontStyle: 'italic' },

  // Empty fund
  emptyFundCard: {
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.lg,
    padding: S.xxl * 1.5, alignItems: 'center', gap: S.md,
    borderWidth: 1.5, borderColor: Colors.electricViolet + '30', borderStyle: 'dashed',
  },
  emptyFundEmoji: { fontSize: 40 },
  emptyFundTitle: { fontFamily: Fonts.headline, fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  emptyFundSub: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  emptyFundBtn: { backgroundColor: Colors.neonLime, borderRadius: Radius.md, paddingVertical: 12, paddingHorizontal: 24, marginTop: 4 },
  emptyFundBtnText: { fontFamily: Fonts.headline, fontSize: 13, fontWeight: '900', color: Colors.neonLimeDark, letterSpacing: 1 },

  // Venture card
  ventureCard: { backgroundColor: Colors.surfaceLow, borderRadius: Radius.lg, padding: S.xxl, gap: S.lg },
  ventureTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ventureTag: { fontFamily: Fonts.label, fontSize: 10, fontWeight: '700', color: Colors.electricViolet, letterSpacing: 1.4, textTransform: 'uppercase' },
  ventureName: { fontFamily: Fonts.headline, fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  ventureMeta: { flexDirection: 'row', gap: S.md },
  ventureMetaBox: { flex: 1, backgroundColor: Colors.surfaceWhite, borderRadius: Radius.lg, padding: S.lg },
  ventureMetaLabel: { fontFamily: Fonts.label, fontSize: 9, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  ventureMetaVal: { fontFamily: Fonts.headline, fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  trendingRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: Colors.surfaceWhite, borderRadius: Radius.md, padding: S.md },
  trendingIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.electricViolet + '22', alignItems: 'center', justifyContent: 'center' },
  trendingText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, flex: 1 },
  viewBtn: { borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center' },
  viewBtnText: { fontFamily: Fonts.headline, fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 },

  // Other clubs
  sectionTitle: { fontFamily: Fonts.headline, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  miniClubCard: {
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', padding: S.lg, gap: S.md,
  },
  miniClubEmoji: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  miniClubName: { fontFamily: Fonts.body, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  miniClubMeta: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  miniClubPct: { fontFamily: Fonts.headline, fontSize: 18, fontWeight: '800' },

  // Bento
  bentoRow: { flexDirection: 'row', gap: S.md },
  bentoCard: { flex: 1, borderRadius: Radius.xl, padding: S.xxl, minHeight: 140, justifyContent: 'space-between' },
  bentoSub: { fontFamily: Fonts.label, fontSize: 10, fontWeight: '700', color: Colors.neonLimeDark, letterSpacing: 0.8, textTransform: 'uppercase' },
  bentoVal: { fontFamily: Fonts.headline, fontSize: 28, fontWeight: '900', color: Colors.neonLimeDark, letterSpacing: -1 },
  bentoInvite: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bentoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.electricViolet },

  // Invitations list
  inviteRow: {
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.md,
    flexDirection: 'row', alignItems: 'center', padding: S.lg,
  },
  inviteClubName: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  inviteMeta: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  acceptBtn: { backgroundColor: Colors.electricViolet, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8 },
  acceptBtnText: { fontFamily: Fonts.label, fontSize: 12, fontWeight: '700', color: '#fff' },

  // Create club CTA row
  createClubRow: {
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', padding: S.xl, gap: S.lg,
  },
  createClubIcon: { fontSize: 28, color: Colors.electricViolet, width: 40, textAlign: 'center' },
  createClubTitle: { fontFamily: Fonts.body, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  createClubSub: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  // Modal shared
  modal: { flex: 1, backgroundColor: Colors.surface },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: S.xl, borderBottomWidth: 1, borderBottomColor: Colors.surfaceHighest,
  },
  modalTitle: { fontFamily: Fonts.headline, fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontFamily: Fonts.label, fontSize: 14, fontWeight: '700', color: Colors.electricViolet },

  inputLabel: { fontFamily: Fonts.label, fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.4, textTransform: 'uppercase' },
  textInput: {
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.md, padding: S.lg,
    fontFamily: Fonts.body, fontSize: 16, color: Colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.md,
    paddingHorizontal: S.lg, paddingVertical: S.md,
  },
  currencyPfx: { fontFamily: Fonts.headline, fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginRight: 4 },
  inputField: { flex: 1, fontFamily: Fonts.headline, fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  chipRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  chip: {
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.electricViolet + '40',
  },
  chipText: { fontFamily: Fonts.label, fontSize: 12, fontWeight: '700', color: Colors.electricViolet },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceWhite, borderWidth: 1.5, borderColor: Colors.surfaceHighest,
  },
  typeChipText: { fontFamily: Fonts.label, fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  emojiChip: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.surfaceWhite, borderWidth: 1.5, borderColor: Colors.surfaceHighest,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.md, padding: S.lg,
  },
  toggleLabel: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  toggleSub: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  toggleTrack: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: Colors.surfaceHighest, padding: 3, justifyContent: 'center',
  },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  createBtn: {
    backgroundColor: Colors.neonLime, borderRadius: Radius.md, paddingVertical: 18, alignItems: 'center',
    shadowColor: Colors.neonLime, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  createBtnText: { fontFamily: Fonts.headline, fontSize: 16, fontWeight: '900', color: Colors.neonLimeDark, letterSpacing: 1.2 },

  contribClubInfo: {
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.md, padding: S.lg, gap: 8,
  },
  contribClubName: { fontFamily: Fonts.headline, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  contribClubProgress: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textSecondary },
  contribBtn: {
    backgroundColor: Colors.electricViolet, borderRadius: Radius.md, paddingVertical: 18, alignItems: 'center',
    shadowColor: Colors.electricViolet, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  contribBtnText: { fontFamily: Fonts.headline, fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1.2 },

  // Detail modal
  detailStats: {
    backgroundColor: Colors.surfaceWhite, borderRadius: Radius.lg,
    flexDirection: 'row', padding: S.xl,
  },
  detailStat: { flex: 1, alignItems: 'center', gap: 4 },
  detailStatLabel: { fontFamily: Fonts.label, fontSize: 9, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.2, textTransform: 'uppercase' },
  detailStatVal: { fontFamily: Fonts.headline, fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  detailStatDivider: { width: 1, backgroundColor: Colors.surfaceHighest },
  detailActions: { flexDirection: 'row', gap: S.md },
  detailActionBtn: { flex: 1, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  detailActionText: { fontFamily: Fonts.label, fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  inviteCodePill: {
    backgroundColor: Colors.electricViolet + '10', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.electricViolet + '30',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: S.lg,
  },
  inviteCodeLabel: { fontFamily: Fonts.label, fontSize: 10, fontWeight: '700', color: Colors.electricViolet, letterSpacing: 1.2 },
  inviteCodeValue: { fontFamily: Fonts.headline, fontSize: 18, fontWeight: '900', color: Colors.electricViolet, letterSpacing: 2 },

  // Ledger
  ledgerRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  ledgerAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surfaceHighest, alignItems: 'center', justifyContent: 'center' },
  ledgerUser: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  ledgerNote: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 1 },
  ledgerAmount: { fontFamily: Fonts.headline, fontSize: 14, fontWeight: '700', color: '#16a34a' },
  ledgerTime: { fontFamily: Fonts.label, fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  // Venture bet card
  betCard: { backgroundColor: Colors.surfaceWhite, borderRadius: Radius.md, padding: S.lg },
  betTitle: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  betDesc: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  betMeta: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textSecondary },
  betStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  betStatusText: { fontFamily: Fonts.label, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  // Comments
  commentBubble: { flexDirection: 'row', gap: S.md, alignItems: 'flex-start' },
  commentAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.surfaceHighest, alignItems: 'center', justifyContent: 'center' },
  commentUser: { fontFamily: Fonts.label, fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
  commentTime: { fontFamily: Fonts.label, fontSize: 10, color: Colors.textMuted },
  commentBody: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', gap: S.md, alignItems: 'flex-end' },
  commentInput: {
    flex: 1, backgroundColor: Colors.surfaceWhite, borderRadius: Radius.md,
    padding: S.lg, fontFamily: Fonts.body, fontSize: 14, color: Colors.textPrimary,
    maxHeight: 100,
  },
  commentSendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.electricViolet, alignItems: 'center', justifyContent: 'center',
  },
  commentSendText: { fontFamily: Fonts.headline, fontSize: 18, color: '#fff' },
});
