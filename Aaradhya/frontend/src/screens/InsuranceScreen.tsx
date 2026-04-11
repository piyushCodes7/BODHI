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
  PanResponder,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { InsuranceAPI, type RAGIngestResponse, type RAGQueryResponse } from '../services/api';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Phase = 'upload' | 'processing' | 'stories' | 'query';

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

const STORY_QUESTIONS = [
  { q: 'What does this policy cover?', icon: '🛡', bgColor: '#1A1033' },
  { q: 'What are the exclusions and things not covered?', icon: '⚠️', bgColor: '#0D2233' },
  { q: 'What is the claim process and timeline?', icon: '📋', bgColor: '#1A0D33' },
  { q: 'What are the premium and payment details?', icon: '💳', bgColor: '#0D1A33' },
  { q: 'Are there any hidden clauses or loopholes I should know about?', icon: '🔍', bgColor: '#330D1A' },
];

const CONFIDENCE_COLORS = {
  High: Colors.lime,
  Medium: Colors.orange,
  Low: Colors.red,
};

export const InsuranceScreen: React.FC<Props> = ({ visible, onClose }) => {
  const [phase, setPhase] = useState<Phase>('upload');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [slides, setSlides] = useState<StorySlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [queryMode, setQueryMode] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [queryResult, setQueryResult] = useState<RAGQueryResponse | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Story progress bars animation
  const progressAnims = useRef(STORY_QUESTIONS.map(() => new Animated.Value(0))).current;
  const storyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SLIDE_DURATION = 8000;

  const runProgress = useCallback((idx: number) => {
    progressAnims[idx].setValue(0);
    Animated.timing(progressAnims[idx], {
      toValue: 1,
      duration: SLIDE_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && idx < slides.length - 1) {
        setCurrentSlide(idx + 1);
      }
    });
  }, [progressAnims, slides.length]);

  useEffect(() => {
    if (phase === 'stories' && slides.length > 0) {
      progressAnims.forEach((a, i) => { if (i !== currentSlide) a.setValue(i < currentSlide ? 1 : 0); });
      runProgress(currentSlide);
    }
    return () => { storyTimer.current && clearTimeout(storyTimer.current); };
  }, [currentSlide, phase, slides.length]);

  const handleUploadMock = async () => {
    // For demo: use a mock document
    setUploading(true);
    setPhase('processing');
    try {
      // Generate story slides from backend
      const generated: StorySlide[] = [];
      for (let i = 0; i < STORY_QUESTIONS.length; i++) {
        const { q, icon, bgColor } = STORY_QUESTIONS[i];
        try {
          const res = await InsuranceAPI.query(q, documentId ?? undefined);
          generated.push({
            title: q.split(' ').slice(0, 5).join(' ') + '...',
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
            title: q.split(' ').slice(0, 5).join(' ') + '...',
            subtitle: 'INSURETECH SERIES',
            explanation: 'Unable to retrieve information from the document.',
            clause_reference: null,
            confidence_level: 'Low',
            fallback: 'Please consult your insurer directly.',
            icon,
            bgColor,
          });
        }
      }
      setSlides(generated);
      setPhase('stories');
      setCurrentSlide(0);
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setPhase('upload');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async () => {
    // In production: use expo-document-picker
    // For demo we run with mock
    await handleUploadMock();
  };

  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      progressAnims[currentSlide].setValue(1);
      setCurrentSlide(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      progressAnims[currentSlide].setValue(0);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleCustomQuery = async () => {
    if (!customQuery.trim()) return;
    setQueryLoading(true);
    try {
      const res = await InsuranceAPI.query(customQuery, documentId ?? undefined);
      setQueryResult(res);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setQueryLoading(false);
    }
  };

  const reset = () => {
    setPhase('upload');
    setSlides([]);
    setCurrentSlide(0);
    setDocumentId(null);
    setQueryResult(null);
    setCustomQuery('');
    progressAnims.forEach(a => a.setValue(0));
  };

  const currentSlideData = slides[currentSlide];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>

        {/* ── UPLOAD PHASE ─────────────────────────────────────── */}
        {phase === 'upload' && (
          <View style={styles.uploadPhase}>
            {/* Background blobs */}
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
            <View style={styles.uploadContent}>
              <View style={styles.uploadIconWrap}>
                <View style={styles.uploadShield}>
                  <Text style={{ fontSize: 32 }}>🛡</Text>
                </View>
              </View>
              <Text style={styles.uploadTitle}>Insurance{'\n'}Explained in 30 sec</Text>
              <Text style={styles.uploadSubtitle}>
                Upload your policy document. Our AI will explain it{'\n'}in plain English — no jargon, no confusion.
              </Text>

              <View style={styles.featureList}>
                {[
                  { icon: '⚡', title: 'FAST SETUP', sub: 'Full analysis in under 5 minutes.' },
                  { icon: '🔍', title: 'HIDDEN CLAUSES', sub: 'Loopholes and exclusions surfaced.' },
                  { icon: '👥', title: 'COMMUNITY POOL', sub: 'Join 20k members comparing plans.' },
                ].map((f) => (
                  <View key={f.title} style={styles.featureRow}>
                    <View style={styles.featureIcon}>
                      <Text style={{ fontSize: 18 }}>{f.icon}</Text>
                    </View>
                    <View style={styles.featureText}>
                      <Text style={styles.featureTitle}>{f.title}</Text>
                      <Text style={styles.featureSub}>{f.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* CTA */}
            <View style={styles.uploadFooter}>
              <TouchableOpacity style={styles.uploadBtn} onPress={handleFileUpload}>
                <Text style={styles.uploadBtnText}>GET PROTECTED NOW</Text>
              </TouchableOpacity>
              <View style={styles.swipeHint}>
                <Text style={styles.swipeHintText}>^ SWIPE UP TO BROWSE PLANS</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── PROCESSING PHASE ─────────────────────────────────── */}
        {phase === 'processing' && (
          <View style={[styles.uploadPhase, { justifyContent: 'center' }]}>
            <View style={[styles.blob, styles.blob1]} />
            <View style={[styles.blob, styles.blob2]} />
            <ActivityIndicator size="large" color={Colors.lime} />
            <Text style={[styles.uploadTitle, { marginTop: Spacing.xl, fontSize: Typography.xl }]}>
              Analysing your policy...
            </Text>
            <Text style={styles.uploadSubtitle}>Extracting key clauses and coverage details</Text>
          </View>
        )}

        {/* ── STORIES PHASE ─────────────────────────────────────── */}
        {phase === 'stories' && currentSlideData && (
          <View style={[styles.storySlide, { backgroundColor: currentSlideData.bgColor }]}>
            {/* Animated blobs */}
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
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
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
              <View style={styles.storyHeaderActions}>
                <TouchableOpacity style={{ marginRight: Spacing.md }}><Text style={styles.closeBtn}>⋯</Text></TouchableOpacity>
                <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
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
              <Text style={styles.slideTitle}>
                {currentSlideData.title}
              </Text>
              <Text style={styles.slideSubtitle}>
                {currentSlideData.explanation}
              </Text>

              {/* Confidence badge */}
              <View style={[styles.confidenceBadge, { borderColor: CONFIDENCE_COLORS[currentSlideData.confidence_level] }]}>
                <View style={[styles.confidenceDot, { backgroundColor: CONFIDENCE_COLORS[currentSlideData.confidence_level] }]} />
                <Text style={[styles.confidenceText, { color: CONFIDENCE_COLORS[currentSlideData.confidence_level] }]}>
                  {currentSlideData.confidence_level} confidence
                </Text>
                {currentSlideData.clause_reference && (
                  <Text style={styles.clauseRef}> · {currentSlideData.clause_reference}</Text>
                )}
              </View>

              {currentSlideData.fallback && (
                <Text style={styles.fallbackText}>{currentSlideData.fallback}</Text>
              )}
            </View>

            {/* Left / Right tap zones */}
            <TouchableOpacity style={styles.tapLeft} onPress={goPrev} />
            <TouchableOpacity style={styles.tapRight} onPress={goNext} />

            {/* Chevrons */}
            <View style={styles.chevronLeft}><Text style={styles.chevronText}>‹</Text></View>
            <View style={styles.chevronRight}><Text style={styles.chevronText}>›</Text></View>

            {/* Social rail */}
            <View style={styles.socialRail}>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={{ fontSize: 22 }}>♥</Text>
                <Text style={styles.socialCount}>2.4k</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={{ fontSize: 22 }}>💬</Text>
                <Text style={styles.socialCount}>128</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={{ fontSize: 22 }}>↗</Text>
                <Text style={styles.socialCount}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Query / ask button */}
            <View style={styles.storyFooter}>
              <TouchableOpacity style={styles.queryBtn} onPress={() => setQueryMode(true)}>
                <Text style={styles.queryBtnText}>Ask a question about this policy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.restartBtn} onPress={reset}>
                <Text style={styles.restartBtnText}>Upload Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── QUERY MODAL ──────────────────────────────────────── */}
        <Modal visible={queryMode} animationType="slide" transparent>
          <View style={styles.queryOverlay}>
            <View style={styles.querySheet}>
              <Text style={styles.queryTitle}>Ask Your Policy</Text>
              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                <View style={styles.queryInput}>
                  <Text style={styles.queryInputText}>{customQuery || 'Type your question...'}</Text>
                </View>
              </ScrollView>

              {/* Preset questions */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
                {[
                  'Is maternity covered?',
                  'Pre-existing conditions?',
                  'Network hospitals?',
                  'Claim limit?',
                ].map(q => (
                  <TouchableOpacity key={q} style={styles.presetPill} onPress={() => setCustomQuery(q)}>
                    <Text style={styles.presetPillText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Keyboard-style row for input */}
              <View style={styles.queryInputRow}>
                {['Is', 'What', 'How', 'Are', 'Does'].map(w => (
                  <TouchableOpacity key={w} style={styles.wordChip} onPress={() => setCustomQuery(prev => `${prev} ${w}`)}>
                    <Text style={styles.wordChipText}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {queryResult && (
                <View style={styles.queryResult}>
                  <View style={[styles.confidenceBadge, { borderColor: CONFIDENCE_COLORS[queryResult.confidence_level], marginBottom: Spacing.sm }]}>
                    <View style={[styles.confidenceDot, { backgroundColor: CONFIDENCE_COLORS[queryResult.confidence_level] }]} />
                    <Text style={[styles.confidenceText, { color: CONFIDENCE_COLORS[queryResult.confidence_level] }]}>
                      {queryResult.confidence_level}
                    </Text>
                    {queryResult.clause_reference && <Text style={styles.clauseRef}> · {queryResult.clause_reference}</Text>}
                  </View>
                  <Text style={styles.queryResultText}>{queryResult.simple_explanation}</Text>
                  {queryResult.fallback && <Text style={styles.fallbackText}>{queryResult.fallback}</Text>}
                </View>
              )}

              <View style={styles.queryActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setQueryMode(false); setQueryResult(null); setCustomQuery(''); }}>
                  <Text style={styles.cancelBtnText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.askBtn} onPress={handleCustomQuery} disabled={queryLoading}>
                  {queryLoading
                    ? <ActivityIndicator color={Colors.textWhite} />
                    : <Text style={styles.askBtnText}>Ask AI</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A14' },

  // Blobs
  blob: { position: 'absolute', borderRadius: 999 },
  blob1: { width: 280, height: 280, backgroundColor: '#3B1A6E', opacity: 0.6, top: -80, right: -80 },
  blob2: { width: 220, height: 220, backgroundColor: '#C0390A', opacity: 0.4, bottom: 100, left: -60 },
  blobStory1: { width: 300, height: 300, backgroundColor: '#2A1A5E', opacity: 0.7, top: -60, right: -60 },
  blobStory2: { width: 250, height: 250, backgroundColor: '#8B1A1A', opacity: 0.4, bottom: 200, left: -80 },

  // Upload phase
  uploadPhase: { flex: 1, paddingTop: 60 },
  uploadContent: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center' },
  uploadIconWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  uploadShield: {
    width: 80, height: 80, borderRadius: Radius.full,
    backgroundColor: 'rgba(123, 47, 190, 0.4)',
    borderWidth: 2, borderColor: 'rgba(123, 47, 190, 0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: Typography['3xl'], fontWeight: Typography.extrabold,
    color: Colors.textWhite, textAlign: 'center', marginBottom: Spacing.md, lineHeight: 40,
  },
  uploadSubtitle: {
    fontSize: Typography.base, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', lineHeight: 22, marginBottom: Spacing['2xl'],
  },
  featureList: { gap: Spacing.sm },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md,
  },
  featureIcon: {
    width: 44, height: 44, borderRadius: Radius.full,
    backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textWhite, letterSpacing: 1 },
  featureSub: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  uploadFooter: { padding: Spacing.xl, paddingBottom: 40 },
  uploadBtn: {
    backgroundColor: '#4A5C00',
    borderRadius: Radius.full,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  uploadBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.lime, letterSpacing: 1 },
  swipeHint: { alignItems: 'center' },
  swipeHintText: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },

  // Story header
  storyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
  },
  storyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  storyHeaderActions: { flexDirection: 'row', alignItems: 'center' },
  storyAvatar: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  storyUsername: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textWhite },
  storySeriesLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  closeBtn: { fontSize: Typography.xl, color: Colors.textWhite },

  // Progress bars
  progressBars: {
    flexDirection: 'row', paddingHorizontal: Spacing.base,
    gap: 4, paddingBottom: Spacing.sm,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  progressBarTrack: {
    flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: Radius.full, overflow: 'hidden',
  },
  progressBarFill: { height: 3, backgroundColor: Colors.textWhite, borderRadius: Radius.full },

  // Story slide
  storySlide: { flex: 1 },
  slideIconWrap: { alignItems: 'center', marginVertical: Spacing.xl },
  slideIconCircle: {
    width: 90, height: 90, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  slideContent: { flex: 1, paddingHorizontal: Spacing.xl, paddingBottom: 160 },
  slideTitle: {
    fontSize: Typography['2xl'], fontWeight: Typography.extrabold,
    color: Colors.textWhite, marginBottom: Spacing.md, lineHeight: 34,
  },
  slideSubtitle: {
    fontSize: Typography.base, color: 'rgba(255,255,255,0.8)',
    lineHeight: 24, textAlign: 'center', marginBottom: Spacing.lg,
  },
  confidenceBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    alignSelf: 'center', gap: Spacing.xs,
  },
  confidenceDot: { width: 8, height: 8, borderRadius: Radius.full },
  confidenceText: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 0.5 },
  clauseRef: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.5)' },
  fallbackText: {
    fontSize: Typography.sm, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', marginTop: Spacing.md, fontStyle: 'italic', lineHeight: 20,
  },

  // Tap zones
  tapLeft: { position: 'absolute', left: 0, top: 100, bottom: 200, width: W * 0.35 },
  tapRight: { position: 'absolute', right: 0, top: 100, bottom: 200, width: W * 0.35 },
  chevronLeft: { position: 'absolute', left: Spacing.lg, top: '45%' },
  chevronRight: { position: 'absolute', right: Spacing.lg, top: '45%' },
  chevronText: { fontSize: 32, color: 'rgba(255,255,255,0.3)' },

  // Social rail
  socialRail: {
    position: 'absolute', right: Spacing.lg, bottom: 200,
    alignItems: 'center', gap: Spacing.lg,
  },
  socialBtn: { alignItems: 'center', gap: 4 },
  socialCount: { fontSize: Typography.xs, color: Colors.textWhite },

  // Story footer
  storyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.xl, paddingBottom: 40,
    gap: Spacing.sm,
  },
  queryBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  queryBtnText: { fontSize: Typography.base, color: Colors.textWhite, fontWeight: Typography.semibold },
  restartBtn: { alignItems: 'center', padding: Spacing.sm },
  restartBtnText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.5)' },

  // Query modal
  queryOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  querySheet: {
    backgroundColor: '#1A1033',
    borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
    padding: Spacing.xl, paddingBottom: 40,
  },
  queryTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textWhite, marginBottom: Spacing.md },
  queryInput: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md, minHeight: 60,
  },
  queryInputText: { fontSize: Typography.base, color: Colors.textWhite },
  presetRow: { marginBottom: Spacing.md },
  presetPill: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    marginRight: Spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  presetPillText: { fontSize: Typography.sm, color: Colors.textWhite },
  queryInputRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  wordChip: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  wordChipText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)' },
  queryResult: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  queryResultText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  queryActions: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center',
  },
  cancelBtnText: { fontSize: Typography.base, color: Colors.textWhite, fontWeight: Typography.semibold },
  askBtn: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: Colors.purple, alignItems: 'center',
  },
  askBtnText: { fontSize: Typography.base, color: Colors.textWhite, fontWeight: Typography.bold },
});
