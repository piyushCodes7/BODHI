import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {
  Send,
  Sparkles,
  TrendingUp,
  Calendar,
  PiggyBank,
  Mic,
  Bell,
  StopCircle,
} from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../theme/tokens';

const NUM_BARS = 5;
const BAR_MIN_HEIGHT = 8;
const BAR_MAX_HEIGHT = 64;
const idleHeights = [24, 40, 56, 32, 20];

export function AIVoiceScreen() {
  const insets = useSafeAreaInsets();
  
  const [inputText, setInputText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDemoFallback, setIsDemoFallback] = useState(false);

  const audioPlayerRef = useRef<AudioRecorderPlayer | null>(null);

  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const barAnims = useRef(idleHeights.map(h => new Animated.Value(h))).current;
  const isRecordingRef = useRef(false);

  useEffect(() => {
    audioPlayerRef.current = new AudioRecorderPlayer();

    const startPulse = (val: Animated.Value) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1.3, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    };
    startPulse(pulse1);
    const timer = setTimeout(() => startPulse(pulse2), 1000); 
    return () => {
      clearTimeout(timer);
      pulse1.stopAnimation();
      pulse2.stopAnimation();
    };
  }, []);

  useEffect(() => {
    isRecordingRef.current = isRecording;
    const animateBar = (anim: Animated.Value) => {
      if (!isRecordingRef.current) return; 
      Animated.timing(anim, {
        toValue: BAR_MIN_HEIGHT + Math.random() * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT),
        duration: 150 + Math.random() * 100, 
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && isRecordingRef.current) {
          animateBar(anim);
        }
      });
    };

    if (isRecording) {
      barAnims.forEach(anim => animateBar(anim));
    } else {
      barAnims.forEach((anim, i) => {
        Animated.timing(anim, { 
          toValue: idleHeights[i], duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: false 
        }).start();
      });
    }
  }, [isRecording, barAnims]);

  // Make sure this is async
  const startRecording = async () => {
    setIsRecording(true);
    setTranscription('Listening...');
    setIsDemoFallback(false);

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);
        if (granted['android.permission.RECORD_AUDIO'] !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Microphone permission denied');
          setIsDemoFallback(true);
          return;
        }
      }
      
      const uri = await audioPlayerRef.current?.startRecorder();
      console.log('Recording successfully started at:', uri);
      
    } catch (err) {
      console.log('Native Mic Failed - Engaging Demo Fallback!', err);
      setIsDemoFallback(true);
    }
  };

  // Make sure this is async
  const stopRecordingAndTranscribe = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    setTranscription('Processing Bodhi intent...');

    let uri = null;
    try {
      if (audioPlayerRef.current) {
        uri = await audioPlayerRef.current.stopRecorder();
        audioPlayerRef.current.removeRecordBackListener();
      }
    } catch (e) {
      console.log("Failed to stop recorder cleanly.", e);
    }

    if (isDemoFallback || !uri) {
      console.log("Using Demo Fallback.");
      setTimeout(() => {
        const demoText = "Your portfolio is up 4% today. Should I analyze your tech stocks?";
        setTranscription(demoText);
        setInputText(demoText);
        setIsProcessing(false);
      }, 1500);
      return;
    }

    try {
      console.log('Sending real audio to Sarvam. URI:', uri);
      
      // 🚨 PASTE YOUR ACTUAL KEY HERE
      const SARVAM_API_KEY = "paste_your_actual_key_here";
      
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
        name: Platform.OS === 'ios' ? 'audio.m4a' : 'audio.mp4',
      } as any);
      
      formData.append('model', 'saaras:v1');

      // The await works here because stopRecordingAndTranscribe is async!
      const response = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': SARVAM_API_KEY },
        body: formData,
      });
      
      const data = await response.json();
      console.log('Sarvam Response:', data);
      
      if (data.transcript) {
        setTranscription(data.transcript);
        setInputText(data.transcript); 
      } else {
        setTranscription("Could not understand audio. Try speaking closer.");
      }
    } catch (error) {
      console.error("Sarvam STT Error:", error);
      setTranscription("Failed to connect to Bodhi Brain.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecordingAndTranscribe();
    else startRecording();
  };

  const handleSendText = () => {
    if (!inputText) return;
    setIsProcessing(true);
    setTranscription(''); 
    setTimeout(() => {
      setTranscription(inputText);
      setIsProcessing(false);
      setInputText('');
    }, 800);
  };

  const handleChipPress = (text: string) => {
    setInputText(text);
    setTranscription(text); 
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#05001F', '#1A0033', '#4A0033']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>G</Text></View>
            <View style={styles.onlineDot} />
          </View>
          <Image source={require('../../assets/images/bodhi-logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell size={22} color="#FFF" />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={toggleRecording} style={styles.orbContainer}>
          <Animated.View style={[styles.pulseRing, styles.ring1, { transform: [{ scale: pulse1 }] }, isRecording && { borderColor: Colors.neonLime }]} />
          <Animated.View style={[styles.pulseRing, styles.ring2, { transform: [{ scale: pulse2 }] }, isRecording && { borderColor: Colors.neonLime }]} />

          <View style={styles.orbShadowWrapper}>
            <LinearGradient colors={isRecording ? [Colors.neonLime, '#00A3FF'] : ['#4A00E0', '#FF007F']} style={styles.orb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.orbInner}>
                <View style={styles.waveform}>
                  {barAnims.map((anim, i) => (
                    <Animated.View key={i} style={[styles.waveBar, { height: anim, backgroundColor: i === 2 ? Colors.neonLime : 'rgba(255,255,255,0.8)' }]} />
                  ))}
                </View>
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        <View style={styles.textBlock}>
          <Text style={styles.greeting}>Hi Govind! 👋</Text>
          <Text style={styles.headline}>Ask anything about</Text>
          <Text style={styles.headlineAccent}>your money</Text>
          <Text style={styles.subtitle}>
            {isRecording ? "Listening..." : isProcessing ? "Processing intent..." : "Tap the orb to speak..."}
          </Text>
        </View>

        {(transcription !== '' || isProcessing) && (
          <View style={styles.transcriptionContainer}>
            <View style={styles.transcriptionBadge}>
              <Sparkles size={12} color={Colors.neonLime} />
              <Text style={styles.transcriptionLabel}>LIVE TRANSCRIBE</Text>
            </View>
            {isProcessing ? (
              <ActivityIndicator size="small" color={Colors.neonLime} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
              <Text style={styles.transcriptionText}>"{transcription}"</Text>
            )}
          </View>
        )}

        <View style={styles.trySayingSection}>
          <View style={styles.trySayingHeader}>
            <Sparkles size={16} color="#A855F7" />
            <Text style={styles.trySayingText}>Try saying</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            <TouchableOpacity style={styles.chip} onPress={() => handleChipPress('How is my portfolio doing?')}>
              <TrendingUp size={16} color={Colors.neonLime} /><Text style={styles.chipText}>How is my{'\n'}portfolio doing?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handleChipPress('How much can I save this month?')}>
              <PiggyBank size={16} color="#FF3366" /><Text style={styles.chipText}>How much can{'\n'}I save this month?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handleChipPress('Upcoming payments?')}>
              <Calendar size={16} color="#A855F7" /><Text style={styles.chipText}>Upcoming{'\n'}payments?</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.chatContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.chatInputWrapper}>
          <TextInput style={styles.chatInput} placeholder="Type your message..." placeholderTextColor="rgba(255,255,255,0.4)" value={inputText} onChangeText={setInputText} />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: inputText.length > 0 ? Colors.neonLime : isRecording ? '#FF3366' : 'rgba(255,255,255,0.1)' }]} onPress={inputText.length > 0 ? handleSendText : toggleRecording}>
            {inputText.length > 0 ? <Send size={16} color="#000" /> : isRecording ? <StopCircle size={16} color="#FFF" /> : <Mic size={16} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </View>
      
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05001F' },
  scrollContent: { paddingBottom: 160 }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  avatarContainer: { position: 'relative' },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#000' },
  onlineDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.neonLime, borderWidth: 2, borderColor: '#05001F' },
  logo: { height: 35, width: 150, tintColor: '#FFF' },
  headerIcons: { flexDirection: 'row', gap: 10 },
  iconBtn: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3366', borderWidth: 1.5, borderColor: '#05001F' },
  orbContainer: { alignItems: 'center', justifyContent: 'center', height: 220, marginTop: 10 },
  pulseRing: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  ring1: { width: 180, height: 180, opacity: 0.5 },
  ring2: { width: 260, height: 260, opacity: 0.2 },
  orbShadowWrapper: { borderRadius: 70, shadowColor: '#A855F7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 16 },
  orb: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  orbInner: { width: 124, height: 124, borderRadius: 62, backgroundColor: '#1A0033', alignItems: 'center', justifyContent: 'center' },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  waveBar: { width: 6, borderRadius: 3 },
  textBlock: { alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: 15 },
  greeting: { fontSize: 20, fontWeight: '500', color: '#FFF', marginBottom: 8 },
  headline: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  headlineAccent: { fontSize: 32, fontWeight: '800', color: Colors.neonLime, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.6)' },
  transcriptionContainer: { backgroundColor: 'rgba(212,255,0,0.05)', marginHorizontal: 20, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,255,0,0.3)', borderStyle: 'dashed', marginBottom: 40 },
  transcriptionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  transcriptionLabel: { color: Colors.neonLime, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  transcriptionText: { color: '#FFF', fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  trySayingSection: { paddingLeft: 20, marginTop: 20 },
  trySayingHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  trySayingText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  chipsScroll: { paddingRight: 40, gap: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  chipText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500', lineHeight: 16 },
  chatContainer: { position: 'absolute', bottom: 90, width: '100%', backgroundColor: '#05001F', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', zIndex: 10, elevation: 10 },
  chatInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.full, paddingLeft: 20, paddingRight: 6, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chatInput: { flex: 1, color: '#FFF', fontSize: 15, minHeight: 40 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});

export default AIVoiceScreen;