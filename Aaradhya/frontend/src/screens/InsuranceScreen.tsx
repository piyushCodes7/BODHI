// src/screens/InsuranceScreen.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { InsuranceAPI, type RAGIngestResponse, type RAGQueryResponse } from '../services/api';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Types ───────────────────────────────────────────────────────────────────
type Phase = 'upload' | 'processing' | 'stories' | 'chat';

interface StorySlide {
  title: string;
  subtitle: string;
  explanation: string;
  clause_reference: string | null;
  confidence_level: 'High' | 'Medium' | 'Low';
  fallback: string | null;
  icon: string;
  bgColor: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  confidence?: 'High' | 'Medium' | 'Low';
  clause?: string | null;
  loading?: boolean;
}

const STORY_QUESTIONS = [
  { q: 'What does this policy cover?',                                    icon: '🛡', bgColor: '#1A1033' },
  { q: 'What are the exclusions and things not covered?',                 icon: '⚠️', bgColor: '#0D2233' },
  { q: 'What is the claim process and timeline?',                         icon: '📋', bgColor: '#1A0D33' },
  { q: 'What are the premium and payment details?',                       icon: '💳', bgColor: '#0D1A33' },
  { q: 'Are there any hidden clauses or loopholes I should know about?',  icon: '🔍', bgColor: '#330D1A' },
];

const CONFIDENCE_COLORS = { High: Colors.lime, Medium: Colors.orange, Low: Colors.red };

const PRESET_QUESTIONS = [
  'Is maternity covered?',
  'Pre-existing conditions?',
  'Network hospitals?',
  'What is my claim limit?',
  'Is dental included?',
  'How to file a claim?',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2);

// Minimal file-picker shim — in production swap with expo-document-picker
async function pickPdfFile(): Promise<{ name: string; uri: string; base64: string } | null> {
  // Since expo-document-picker may not be installed, we use a mock for now.
  // Replace the body of this function with real expo-document-picker logic:
  //
  //   const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
  //   if (result.canceled) return null;
  //   const asset = result.assets[0];
  //   const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
  //   return { name: asset.name, uri: asset.uri, base64 };
  //
  // For the hackathon demo we return a stub that triggers the backend with no real PDF:
  return { name: 'demo_policy.pdf', uri: 'mock://demo', base64: '' };
}

// ─── Component ───────────────────────────────────────────────────────────────
export const InsuranceScreen: React.FC<Props> = ({ visible, onClose }) => {
  const [phase, setPhase]               = useState<Phase>('upload');
  const [documentId, setDocumentId]     = useState<string | null>(null);
  const [docName, setDocName]           = useState<string>('');
  const [slides, setSlides]             = useState<StorySlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [uploading, setUploading]       = useState(false);

  // chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]       = useState('');
  const [chatLoading, setChatLoading]   = useState(false);
  const chatScrollRef                   = useRef<ScrollView>(null);

  // story progress
  const progressAnims = useRef(STORY_QUESTIONS.map(() => new Animated.Value(0))).current;
  const SLIDE_DURATION = 9000;

  const runProgress = useCallback((idx: number) => {
    progressAnims[idx].setValue(0);
    Animated.timing(progressAnims[idx], {
      toValue: 1,
      duration: SLIDE_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && idx < slides.length - 1) setCurrentSlide(idx + 1);
    });
  }, [progressAnims, slides.length]);

  useEffect(() => {
    if (phase === 'stories' && slides.length > 0) {
      progressAnims.forEach((a, i) => {
        a.setValue(i < currentSlide ? 1 : 0);
      });
      runProgress(currentSlide);
    }
    return () => { progressAnims.forEach(a => (a as any).stop?.()); };
  }, [currentSlide, phase, slides.length]);

  // ── Upload real PDF ──────────────────────────────────────────────────────
  const handleUpload = async () => {
    let file: { name: string; uri: string; base64: string } | null = null;
    try {
      file = await pickPdfFile();
      if (!file) return; // user cancelled
    } catch {
      Alert.alert('Error', 'Could not open document picker.');
      return;
    }

    setUploading(true);
    setPhase('processing');
    setDocName(file.name);

    try {
      let ingestedDocId: string | null = null;

      // Attempt real upload — falls back to query-only mode if backend unavailable
      try {
        const ingested: RAGIngestResponse = await InsuranceAPI.ingest(file.uri, file.name);
        ingestedDocId = ingested.document_id;
        setDocumentId(ingestedDocId);
      } catch {
        // Backend not reachable in demo — continue with null docId (backend may still
        // answer generic questions from its own knowledge).
        console.warn('Ingestion failed; continuing without document context.');
      }

      // Generate story slides from backend
      const generated: StorySlide[] = [];
      for (const { q, icon, bgColor } of STORY_QUESTIONS) {
        try {
          const res = await InsuranceAPI.query(q, ingestedDocId ?? undefined);
          generated.push({
            title: q.split(' ').slice(0, 5).join(' ') + '…',
            subtitle: 'INSURETECH SERIES',
            explanation: res.simple_explanation,
            clause_reference: res.clause_reference,
            confidence_level: res.confidence_level,
            fallback: res.fallback,
            icon,
            bgColor,
          });
        } catch {
          generated.push({
            title: q.split(' ').slice(0, 5).join(' ') + '…',
            subtitle: 'INSURETECH SERIES',
            explanation: 'Unable to retrieve information. Please consult your insurer directly.',
            clause_reference: null,
            confidence_level: 'Low',
            fallback: 'Try asking in the chatbot below.',
            icon,
            bgColor,
          });
        }
      }

      setSlides(generated);
      setPhase('stories');
      setCurrentSlide(0);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong.');
      setPhase('upload');
    } finally {
      setUploading(false);
    }
  };

  // Use an already-ingested demo document (no file picker needed)
  const handleUseDemoDoc = async () => {
    setPhase('processing');
    setDocName('Demo Policy');
    try {
      // Try to fetch list of existing documents
      const docs = await InsuranceAPI.listDocuments();
      const docId = docs.length > 0 ? docs[0].document_id : null;
      setDocumentId(docId);

      const generated: StorySlide[] = [];
      for (const { q, icon, bgColor } of STORY_QUESTIONS) {
        try {
          const res = await InsuranceAPI.query(q, docId ?? undefined);
          generated.push({
            title: q.split(' ').slice(0, 5).join(' ') + '…',
            subtitle: 'INSURETECH SERIES',
            explanation: res.simple_explanation,
            clause_reference: res.clause_reference,
            confidence_level: res.confidence_level,
            fallback: res.fallback,
            icon,
            bgColor,
          });
        } catch {
          generated.push({
            title: q.split(' ').slice(0, 5).join(' ') + '…',
            subtitle: 'INSURETECH SERIES',
            explanation: 'No document uploaded yet. Upload a policy to see insights here.',
            clause_reference: null,
            confidence_level: 'Low',
            fallback: null,
            icon,
            bgColor,
          });
        }
      }
      setSlides(generated);
      setPhase('stories');
      setCurrentSlide(0);
    } catch {
      Alert.alert('Error', 'Could not load demo. Please upload a document.');
      setPhase('upload');
    }
  };

  // ── Story navigation ──────────────────────────────────────────────────────
  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      progressAnims[currentSlide].setValue(1);
      setCurrentSlide(p => p + 1);
    }
  };
  const goPrev = () => {
    if (currentSlide > 0) {
      progressAnims[currentSlide].setValue(0);
      setCurrentSlide(p => p - 1);
    }
  };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const openChat = () => {
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: genId(),
        role: 'assistant',
        text: docName
          ? `Hi! I've analysed "${docName}". Ask me anything about your policy.`
          : "Hi! I'm your policy assistant. Upload a document or ask a general insurance question.",
      }]);
    }
    setPhase('chat');
  };

  const sendMessage = async (text: string) => {
    const q = text.trim();
    if (!q) return;

    const userMsg: ChatMessage = { id: genId(), role: 'user', text: q };
    const loadingMsg: ChatMessage = { id: genId(), role: 'assistant', text: '', loading: true };
    setChatMessages(prev => [...prev, userMsg, loadingMsg]);
    setChatInput('');
    setChatLoading(true);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await InsuranceAPI.query(q, documentId ?? undefined);
      setChatMessages(prev =>
        prev.map(m =>
          m.id === loadingMsg.id
            ? {
                ...m,
                loading: false,
                text: res.simple_explanation,
                confidence: res.confidence_level,
                clause: res.clause_reference,
              }
            : m,
        ),
      );
    } catch {
      setChatMessages(prev =>
        prev.map(m =>
          m.id === loadingMsg.id
            ? { ...m, loading: false, text: "Sorry, I couldn't reach the server. Please try again." }
            : m,
        ),
      );
    } finally {
      setChatLoading(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    setPhase('upload');
    setSlides([]);
    setCurrentSlide(0);
    setDocumentId(null);
    setDocName('');
    setChatMessages([]);
    setChatInput('');
    progressAnims.forEach(a => a.setValue(0));
  };

  const currentSlideData = slides[currentSlide];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>

        {/* ═══════════════ UPLOAD PHASE ════════════════════════════════════ */}
        {phase === 'upload' && (
          <View style={styles.uploadPhase}>
            <View style={[styles.blob, styles.blob1]} />
            <View style={[styles.blob, styles.blob2]} />

            {/* Header */}
            <View style={styles.storyHeader}>
              <View style={styles.storyHeaderLeft}>
                <View style={styles.storyAvatar}><Text style={{ fontSize: 16 }}>🔒</Text></View>
                <View>
                  <Text style={styles.storyUsername}>BODHI Vault</Text>
                  <Text style={styles.storySeriesLabel}>INSURETECH SERIES</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.uploadContent} showsVerticalScrollIndicator={false}>
              <View style={styles.uploadIconWrap}>
                <View style={styles.uploadShield}>
                  <Text style={{ fontSize: 36 }}>🛡</Text>
                </View>
              </View>
              <Text style={styles.uploadTitle}>Insurance{'\n'}Explained in 30 sec</Text>
              <Text style={styles.uploadSubtitle}>
                Upload your policy document and our AI will break it down — no jargon, no confusion.
              </Text>

              <View style={styles.featureList}>
                {[
                  { icon: '⚡', title: 'FAST SETUP',     sub: 'Full analysis in under 5 minutes.'   },
                  { icon: '🔍', title: 'HIDDEN CLAUSES', sub: 'Loopholes and exclusions surfaced.'  },
                  { icon: '💬', title: 'AI CHATBOT',     sub: 'Ask follow-up questions instantly.'  },
                ].map(f => (
                  <View key={f.title} style={styles.featureRow}>
                    <View style={styles.featureIcon}>
                      <Text style={{ fontSize: 18 }}>{f.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>{f.title}</Text>
                      <Text style={styles.featureSub}>{f.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Upload actions */}
              <View style={styles.uploadActions}>
                {/* PRIMARY – upload real PDF */}
                <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
                  <Text style={{ fontSize: 20, marginRight: Spacing.sm }}>📄</Text>
                  <Text style={styles.uploadBtnText}>UPLOAD POLICY PDF</Text>
                </TouchableOpacity>

                {/* SECONDARY – try demo without uploading */}
                <TouchableOpacity style={styles.demoBtn} onPress={handleUseDemoDoc} disabled={uploading}>
                  <Text style={styles.demoBtnText}>Try with demo document</Text>
                </TouchableOpacity>

                {/* CHAT – skip to chatbot */}
                <TouchableOpacity style={styles.chatQuickBtn} onPress={openChat}>
                  <Text style={styles.chatQuickBtnText}>💬  Ask a question directly</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* ═══════════════ PROCESSING PHASE ════════════════════════════════ */}
        {phase === 'processing' && (
          <View style={[styles.uploadPhase, { justifyContent: 'center', alignItems: 'center' }]}>
            <View style={[styles.blob, styles.blob1]} />
            <View style={[styles.blob, styles.blob2]} />
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={Colors.lime} style={{ marginBottom: Spacing.lg }} />
              <Text style={styles.processingTitle}>Analysing your policy…</Text>
              <Text style={styles.processingSubtitle}>
                {docName ? `"${docName}"` : 'Extracting key clauses and coverage details'}
              </Text>
              <View style={styles.processingSteps}>
                {['Reading document', 'Extracting clauses', 'Generating insights'].map((s, i) => (
                  <View key={s} style={styles.processingStep}>
                    <Text style={{ color: Colors.lime, marginRight: 8 }}>✓</Text>
                    <Text style={styles.processingStepText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ═══════════════ STORIES PHASE ════════════════════════════════════ */}
        {phase === 'stories' && currentSlideData && (
          <View style={[styles.storySlide, { backgroundColor: currentSlideData.bgColor }]}>
            <View style={[styles.blob, styles.blobStory1]} />
            <View style={[styles.blob, styles.blobStory2]} />

            {/* Progress bars */}
            <View style={styles.progressBars}>
              {STORY_QUESTIONS.map((_, i) => (
                <View key={i} style={styles.progressBarTrack}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressAnims[i].interpolate({
                          inputRange: [0, 1], outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              ))}
            </View>

            {/* Header */}
            <View style={styles.storyHeader}>
              <View style={styles.storyHeaderLeft}>
                <View style={styles.storyAvatar}><Text style={{ fontSize: 16 }}>🔒</Text></View>
                <View>
                  <Text style={styles.storyUsername}>BODHI Vault</Text>
                  <Text style={styles.storySeriesLabel}>{currentSlideData.subtitle}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <TouchableOpacity onPress={openChat}>
                  <Text style={[styles.closeBtn, { fontSize: 22 }]}>💬</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Slide icon */}
            <View style={styles.slideIconWrap}>
              <View style={styles.slideIconCircle}>
                <Text style={{ fontSize: 36 }}>{currentSlideData.icon}</Text>
              </View>
            </View>

            {/* Slide content */}
            <View style={styles.slideContent}>
              <Text style={styles.slideTitle}>{currentSlideData.title}</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: H * 0.28 }}>
                <Text style={styles.slideSubtitle}>{currentSlideData.explanation}</Text>
              </ScrollView>

              <View style={[styles.confidenceBadge, { borderColor: CONFIDENCE_COLORS[currentSlideData.confidence_level] }]}>
                <View style={[styles.confidenceDot, { backgroundColor: CONFIDENCE_COLORS[currentSlideData.confidence_level] }]} />
                <Text style={[styles.confidenceText, { color: CONFIDENCE_COLORS[currentSlideData.confidence_level] }]}>
                  {currentSlideData.confidence_level} confidence
                </Text>
                {currentSlideData.clause_reference ? (
                  <Text style={styles.clauseRef}> · {currentSlideData.clause_reference}</Text>
                ) : null}
              </View>

              {currentSlideData.fallback ? (
                <Text style={styles.fallbackText}>{currentSlideData.fallback}</Text>
              ) : null}
            </View>

            {/* Tap zones */}
            <TouchableOpacity style={styles.tapLeft}  onPress={goPrev} />
            <TouchableOpacity style={styles.tapRight} onPress={goNext} />
            <View style={styles.chevronLeft}><Text style={styles.chevronText}>‹</Text></View>
            <View style={styles.chevronRight}><Text style={styles.chevronText}>›</Text></View>

            {/* Social rail */}
            <View style={styles.socialRail}>
              {[{ e: '♥', n: '2.4k' }, { e: '💬', n: '128' }, { e: '↗', n: 'Share' }].map(s => (
                <TouchableOpacity key={s.n} style={styles.socialBtn}>
                  <Text style={{ fontSize: 22 }}>{s.e}</Text>
                  <Text style={styles.socialCount}>{s.n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.storyFooter}>
              <TouchableOpacity style={styles.queryBtn} onPress={openChat}>
                <Text style={styles.queryBtnText}>💬  Ask a question about this policy</Text>
              </TouchableOpacity>
              <View style={styles.storyFooterRow}>
                <TouchableOpacity style={styles.restartBtn} onPress={reset}>
                  <Text style={styles.restartBtnText}>Upload Another</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.slideCountPill}>
                  <Text style={styles.slideCountText}>{currentSlide + 1} / {slides.length}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ═══════════════ CHAT PHASE ═══════════════════════════════════════ */}
        {phase === 'chat' && (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            {/* Chat header */}
            <View style={styles.chatHeader}>
              <TouchableOpacity
                style={styles.chatBackBtn}
                onPress={() => setPhase(slides.length > 0 ? 'stories' : 'upload')}
              >
                <Text style={{ fontSize: 20, color: Colors.textWhite }}>←</Text>
              </TouchableOpacity>
              <View style={styles.chatHeaderInfo}>
                <View style={styles.storyAvatar}><Text style={{ fontSize: 14 }}>🤖</Text></View>
                <View>
                  <Text style={styles.chatHeaderTitle}>Policy Assistant</Text>
                  <Text style={styles.chatHeaderSub}>
                    {docName ? `Analysing "${docName}"` : 'General insurance Q&A'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            >
              {chatMessages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.msgBubble,
                    msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleAI,
                  ]}
                >
                  {msg.loading ? (
                    <View style={styles.typingDots}>
                      <ActivityIndicator size="small" color={Colors.lime} />
                      <Text style={styles.typingText}>Thinking…</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.msgText, msg.role === 'user' && styles.msgTextUser]}>
                        {msg.text}
                      </Text>
                      {msg.confidence && (
                        <View style={[styles.msgMeta, { marginTop: 8 }]}>
                          <View style={[styles.confidenceDot, { backgroundColor: CONFIDENCE_COLORS[msg.confidence], width: 6, height: 6 }]} />
                          <Text style={[styles.msgMetaText, { color: CONFIDENCE_COLORS[msg.confidence] }]}>
                            {msg.confidence}
                          </Text>
                          {msg.clause ? (
                            <Text style={styles.msgMetaText}> · {msg.clause}</Text>
                          ) : null}
                        </View>
                      )}
                    </>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Preset pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.presetRow}
              contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}
            >
              {PRESET_QUESTIONS.map(q => (
                <TouchableOpacity
                  key={q}
                  style={styles.presetPill}
                  onPress={() => sendMessage(q)}
                  disabled={chatLoading}
                >
                  <Text style={styles.presetPillText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Input bar */}
            <View style={styles.chatInputBar}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask anything about your policy…"
                placeholderTextColor="rgba(255,255,255,0.35)"
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage(chatInput)}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!chatInput.trim() || chatLoading) && { opacity: 0.4 }]}
                onPress={() => sendMessage(chatInput)}
                disabled={!chatInput.trim() || chatLoading}
              >
                <Text style={{ fontSize: 18, color: Colors.textPrimary }}>↑</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

      </View>
    </Modal>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A14' },

  blob:       { position: 'absolute', borderRadius: 999 },
  blob1:      { width: 280, height: 280, backgroundColor: '#3B1A6E', opacity: 0.6,  top: -80,    right: -80 },
  blob2:      { width: 220, height: 220, backgroundColor: '#C0390A', opacity: 0.4,  bottom: 100, left: -60  },
  blobStory1: { width: 300, height: 300, backgroundColor: '#2A1A5E', opacity: 0.7,  top: -60,    right: -60 },
  blobStory2: { width: 250, height: 250, backgroundColor: '#8B1A1A', opacity: 0.4,  bottom: 200, left: -80  },

  // ── Upload ──
  uploadPhase:   { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 36 },
  uploadContent: { paddingHorizontal: Spacing.xl, paddingBottom: 60 },
  uploadIconWrap:{ alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing['2xl'] },
  uploadShield:  {
    width: 90, height: 90, borderRadius: Radius.full,
    backgroundColor: 'rgba(123,47,190,0.35)',
    borderWidth: 2, borderColor: 'rgba(123,47,190,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: Typography['3xl'], fontWeight: Typography.extrabold,
    color: Colors.textWhite, textAlign: 'center', marginBottom: Spacing.md, lineHeight: 42,
  },
  uploadSubtitle: {
    fontSize: Typography.base, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 22, marginBottom: Spacing['2xl'],
  },
  featureList: { gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md,
  },
  featureIcon: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textWhite, letterSpacing: 1 },
  featureSub:   { fontSize: Typography.xs, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  uploadActions: { gap: Spacing.md },
  uploadBtn: {
    flexDirection: 'row',
    backgroundColor: '#4A5C00', borderRadius: Radius.full,
    padding: Spacing.lg, alignItems: 'center', justifyContent: 'center',
  },
  uploadBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.lime, letterSpacing: 1 },
  demoBtn: {
    borderRadius: Radius.full, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  demoBtnText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.6)', fontWeight: Typography.medium },
  chatQuickBtn: {
    borderRadius: Radius.full, padding: Spacing.md,
    alignItems: 'center', backgroundColor: 'rgba(123,47,190,0.3)',
    borderWidth: 1, borderColor: 'rgba(123,47,190,0.5)',
  },
  chatQuickBtnText: { fontSize: Typography.sm, color: Colors.textWhite, fontWeight: Typography.semibold },

  // ── Processing ──
  processingCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.xl, padding: Spacing.xl,
    alignItems: 'center', width: W - Spacing.xl * 2,
  },
  processingTitle:    { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textWhite, marginBottom: Spacing.sm },
  processingSubtitle: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: Spacing.lg },
  processingSteps:    { width: '100%', gap: Spacing.sm },
  processingStep:     { flexDirection: 'row', alignItems: 'center' },
  processingStepText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)' },

  // ── Story header (shared) ──
  storyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 68 : 48,
    paddingBottom: Spacing.md,
  },
  storyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  storyAvatar: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  storyUsername:    { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textWhite },
  storySeriesLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  closeBtn:         { fontSize: Typography.xl, color: Colors.textWhite, padding: 4 },

  // ── Progress bars ──
  progressBars: {
    flexDirection: 'row', paddingHorizontal: Spacing.base, gap: 4,
    paddingBottom: Spacing.sm,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  progressBarTrack: {
    flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: Radius.full, overflow: 'hidden',
  },
  progressBarFill: { height: 3, backgroundColor: Colors.textWhite, borderRadius: Radius.full },

  // ── Story slide ──
  storySlide:    { flex: 1 },
  slideIconWrap: { alignItems: 'center', marginVertical: Spacing.xl },
  slideIconCircle: {
    width: 90, height: 90, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  slideContent:   { flex: 1, paddingHorizontal: Spacing.xl, paddingBottom: 175 },
  slideTitle: {
    fontSize: Typography['2xl'], fontWeight: Typography.extrabold,
    color: Colors.textWhite, marginBottom: Spacing.md, lineHeight: 34,
  },
  slideSubtitle: {
    fontSize: Typography.base, color: 'rgba(255,255,255,0.8)',
    lineHeight: 24, marginBottom: Spacing.lg,
  },
  confidenceBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    alignSelf: 'flex-start', gap: Spacing.xs, marginBottom: Spacing.sm,
  },
  confidenceDot: { width: 8, height: 8, borderRadius: Radius.full },
  confidenceText:{ fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 0.5 },
  clauseRef:     { fontSize: Typography.xs, color: 'rgba(255,255,255,0.5)' },
  fallbackText: {
    fontSize: Typography.sm, color: 'rgba(255,255,255,0.45)',
    fontStyle: 'italic', lineHeight: 20, marginTop: Spacing.xs,
  },

  tapLeft:  { position: 'absolute', left: 0,  top: 100, bottom: 200, width: W * 0.35 },
  tapRight: { position: 'absolute', right: 0, top: 100, bottom: 200, width: W * 0.35 },
  chevronLeft:  { position: 'absolute', left: Spacing.lg, top: '45%' },
  chevronRight: { position: 'absolute', right: Spacing.lg, top: '45%' },
  chevronText:  { fontSize: 32, color: 'rgba(255,255,255,0.3)' },

  socialRail: {
    position: 'absolute', right: Spacing.lg, bottom: 200,
    alignItems: 'center', gap: Spacing.lg,
  },
  socialBtn:  { alignItems: 'center', gap: 4 },
  socialCount:{ fontSize: Typography.xs, color: Colors.textWhite },

  storyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.xl, paddingBottom: 40, gap: Spacing.sm,
  },
  queryBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radius.full, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  queryBtnText: { fontSize: Typography.base, color: Colors.textWhite, fontWeight: Typography.semibold },
  storyFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restartBtn: { padding: Spacing.sm },
  restartBtnText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.5)' },
  slideCountPill: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
  },
  slideCountText: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', fontWeight: Typography.semibold },

  // ── Chat ──
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
    backgroundColor: '#12102A',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  chatBackBtn:    { padding: Spacing.xs },
  chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, marginLeft: Spacing.sm },
  chatHeaderTitle:{ fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textWhite },
  chatHeaderSub:  { fontSize: Typography.xs, color: 'rgba(255,255,255,0.5)' },

  chatMessages:        { flex: 1, backgroundColor: '#0D0B1E' },
  chatMessagesContent: { padding: Spacing.base, gap: Spacing.md, paddingBottom: 24 },

  msgBubble: {
    maxWidth: '85%', borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  msgBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.purple,
    borderBottomRightRadius: Radius.sm,
  },
  msgBubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderBottomLeftRadius: Radius.sm,
  },
  msgText:     { fontSize: Typography.base, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },
  msgTextUser: { color: Colors.textWhite },
  msgMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  msgMetaText: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.45)' },

  typingDots: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: 4 },
  typingText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.5)' },

  presetRow: {
    maxHeight: 52,
    backgroundColor: '#12102A',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
  },
  presetPill: {
    backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
  },
  presetPillText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)' },

  chatInputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#12102A',
    padding: Spacing.sm, paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.md,
  },
  chatInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.xl, paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm, paddingBottom: Spacing.sm,
    fontSize: Typography.base, color: Colors.textWhite,
    maxHeight: 120,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: Radius.full,
    backgroundColor: Colors.lime, alignItems: 'center', justifyContent: 'center',
  },
});
