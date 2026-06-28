import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Platform, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from '../../services/api';
import { useAppTheme } from '../../hooks/useAppTheme';

// ── Types ──────────────────────────────────────────────────────────────────
export interface VoiceMsg { role: 'user' | 'bot'; text: string }
type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface Props {
  visible: boolean;
  sessionId: string | null;
  voiceId: string;
  onClose: () => void;
  onSessionInit: () => Promise<string | null>;
  onNewMessages: (user: string, bot: string) => void;
}

// ── Typewriter animation — para mensajes nuevos (usuario y agente) ─────────
function AnimText({ text, isUser, color, animate }: { text: string; isUser: boolean; color: string; animate: boolean }) {
  const [shown, setShown] = useState(animate ? '' : text);

  useEffect(() => {
    if (!animate) { setShown(text); return; }
    setShown('');
    const len = text.length;
    const chunk = Math.max(1, Math.ceil(len / (isUser ? 100 : 60)));
    let pos = 0;
    const iv = setInterval(() => {
      pos = Math.min(pos + chunk, len);
      setShown(text.slice(0, pos));
      if (pos >= len) clearInterval(iv);
    }, isUser ? 10 : 20);
    return () => clearInterval(iv);
  }, [text, animate]);

  if (isUser) return <Text style={[vs.msgText, { color }]}>{shown || ' '}</Text>;
  return <MdBubble text={shown || ' '} color={color} />;
}

// ── Markdown bubble — usa Text anidados para respetar el wrapping ──────────
function MdBubble({ text, color }: { text: string; color: string }) {
  const lines = text.split('\n');
  return (
    <Text style={{ fontSize: 15, lineHeight: 22, color }}>
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return <Text key={i}>{i > 0 ? '\n' : ''}</Text>;

        const isNum = /^\d+\.\s/.test(t);
        const isBullet = /^[-*•]\s/.test(t);
        const isHeader = /^#{1,3}\s/.test(t);
        const prefix = isNum ? (t.match(/^(\d+\.)/)![1] + ' ')
          : isBullet ? '• ' : '';
        const content = isNum ? t.replace(/^\d+\.\s/, '')
          : isBullet ? t.replace(/^[-*•]\s/, '')
            : isHeader ? t.replace(/^#{1,3}\s/, '')
              : t;
        const parts = content.split(/(\*\*[^*]+\*\*)/g);

        return (
          <Text key={i} style={isHeader ? { fontWeight: '700' } : {}}>
            {i > 0 ? '\n' : ''}
            {prefix}
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <Text key={j} style={{ fontWeight: '700' }}>{p.slice(2, -2)}</Text>
                : p
            )}
          </Text>
        );
      })}
    </Text>
  );
}

// ── Strip markdown so TTS no lea asteriscos ────────────────────────────────
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/\*(.+?)\*/gs, '$1')
    .replace(/__(.+?)__/gs, '$1')
    .replace(/_(.+?)_/gs, '$1')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*+•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Orb ────────────────────────────────────────────────────────────────────
function VoiceOrb({ state }: { state: VoiceState }) {
  const breathe = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dur = state === 'listening' ? 500 : state === 'speaking' ? 380 : 1200;
    const scale = state === 'listening' ? 1.08 : state === 'speaking' ? 1.12 : 1.03;
    const rAlpha = state === 'idle' ? 0 : state === 'processing' ? 0.2 : 0.4;

    const b = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: scale, duration: dur, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0.96, duration: dur, useNativeDriver: true }),
    ]));
    const r1 = Animated.loop(Animated.sequence([
      Animated.timing(ring1, { toValue: rAlpha, duration: dur * 1.2, useNativeDriver: true }),
      Animated.timing(ring1, { toValue: 0, duration: dur * 1.2, useNativeDriver: true }),
    ]));
    const r2 = Animated.loop(Animated.sequence([
      Animated.delay(dur * 0.4),
      Animated.timing(ring2, { toValue: rAlpha * 0.55, duration: dur * 1.4, useNativeDriver: true }),
      Animated.timing(ring2, { toValue: 0, duration: dur * 1.4, useNativeDriver: true }),
    ]));

    b.start(); r1.start(); r2.start();
    return () => { b.stop(); r1.stop(); r2.stop(); };
  }, [state]);

  return (
    <View style={orb.wrap}>
      <Animated.View style={[orb.ring2, { opacity: ring2 }]} />
      <Animated.View style={[orb.ring1, { opacity: ring1 }]} />
      <Animated.View style={[orb.sphere, { transform: [{ scale: breathe }] }]}>
        <View style={orb.highlight} />
        <View style={orb.midBlue} />
        <View style={orb.deepBlue} />
        <View style={orb.shine} />
      </Animated.View>
    </View>
  );
}

const ORB_SIZE = 130;

const orb = StyleSheet.create({
  wrap: { width: ORB_SIZE + 60, height: ORB_SIZE + 60, alignItems: 'center', justifyContent: 'center' },
  ring2: { position: 'absolute', width: ORB_SIZE + 80, height: ORB_SIZE + 80, borderRadius: (ORB_SIZE + 80) / 2, backgroundColor: 'rgba(74,144,226,0.10)' },
  ring1: { position: 'absolute', width: ORB_SIZE + 50, height: ORB_SIZE + 50, borderRadius: (ORB_SIZE + 50) / 2, backgroundColor: 'rgba(74,144,226,0.18)' },
  sphere: {
    width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2,
    backgroundColor: '#4a8fd6', overflow: 'hidden',
    shadowColor: '#3a7bc8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 14,
  },
  highlight: { position: 'absolute', top: -30, left: -18, width: 120, height: 95, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.58)', transform: [{ rotate: '-18deg' }] },
  midBlue: { position: 'absolute', top: 24, left: 10, width: 80, height: 55, borderRadius: 40, backgroundColor: 'rgba(140,200,255,0.55)', transform: [{ rotate: '8deg' }] },
  deepBlue: { position: 'absolute', bottom: -15, right: -15, width: 100, height: 80, borderRadius: 50, backgroundColor: 'rgba(25,85,185,0.4)' },
  shine: { position: 'absolute', top: 16, left: 22, width: 26, height: 16, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.35)', transform: [{ rotate: '-30deg' }] },
});

// ── VoiceMode ──────────────────────────────────────────────────────────────
export default function VoiceMode({ visible, sessionId, voiceId, onClose, onSessionInit, onNewMessages }: Props) {
  const { BG, PRIMARY, MUTED, CARD } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<VoiceMsg[]>([]);
  const [statusText, setStatusText] = useState('Toca para hablar');
  const [isManualMode] = useState(true);

  const recording = useRef<Audio.Recording | null>(null);
  const sound = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sidRef = useRef<string | null>(sessionId);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceStartRef = useRef<number | null>(null); // inicio de voz sostenida (debounce)
  const sendingRef = useRef(false);
  const listeningRef = useRef(false);
  const visibleRef = useRef(visible);

  useEffect(() => { sidRef.current = sessionId; }, [sessionId]);
  useEffect(() => { visibleRef.current = visible; }, [visible]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, transcript]);

  useEffect(() => {
    if (visible) {
      // Nueva sesión de voz — limpiar historial anterior
      setMessages([]);
      setTranscript('');
      setVoiceState('idle');
      setStatusText('Toca para hablar');
    } else {
      stopAll();
    }
  }, [visible]);

  const stopAll = useCallback(async () => {
    sendingRef.current = false;
    listeningRef.current = false;
    voiceStartRef.current = null;
    if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
    if (recording.current) {
      try { await recording.current.stopAndUnloadAsync(); } catch { }
      recording.current = null;
    }
    if (sound.current) {
      try { await sound.current.stopAsync(); await sound.current.unloadAsync(); } catch { }
      sound.current = null;
    }
    setVoiceState('idle');
    setTranscript('');
  }, []);

  // ── Grabar ────────────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (listeningRef.current || sendingRef.current) {
      console.log('[Voice] Already listening or sending, ignoring startListening');
      return;
    }
    listeningRef.current = true;
    setVoiceState('listening');
    setTranscript('');
    setStatusText('Escuchando...');

    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

    const { recording: rec } = await Audio.Recording.createAsync(
      {
        isMeteringEnabled: true,
        android: { extension: '.m4a', outputFormat: 2, audioEncoder: 3, sampleRate: 16000, numberOfChannels: 1, bitRate: 32000 },
        ios: { extension: '.m4a', audioQuality: 0.5, sampleRate: 16000, numberOfChannels: 1, bitRate: 32000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
        web: { mimeType: 'audio/webm', bitsPerSecond: 32000 },
      },
      (status) => {
        if (!listeningRef.current || isManualMode) return;
        const db = status.metering ?? -160;
        if (db > -25) {
          // Sonido detectado — debounce de 400ms para filtrar clicks/ruidos de fondo
          if (!voiceStartRef.current) voiceStartRef.current = Date.now();
          if (Date.now() - voiceStartRef.current >= 400) {
            if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
          }
        } else {
          // Silencio — reiniciar ventana y armar timer si no existe
          voiceStartRef.current = null;
          if (!silenceRef.current) {
            silenceRef.current = setTimeout(() => { silenceRef.current = null; sendVoice(); }, 1200);
          }
        }
      },
      80,
    );
    recording.current = rec;
  }, []);

  // ── Enviar ────────────────────────────────────────────────────────────────
  const sendVoice = useCallback(async () => {
    if (sendingRef.current || !listeningRef.current || !recording.current) return;
    sendingRef.current = true;
    listeningRef.current = false;
    voiceStartRef.current = null;
    if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }

    setVoiceState('processing');
    setStatusText('Procesando...');

    const rec = recording.current;
    recording.current = null;
    await rec.stopAndUnloadAsync();
    const uri = rec.getURI();

    if (!uri) { sendingRef.current = false; startListening(); return; }

    try {
      // STT
      const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      const sttRes = await apiClient.post<{ transcript: string }>('/chat/stt', {
        audioBase64,
        mimeType: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
      });
      let userText = sttRes.data.transcript?.trim() || '';

      // Filtrar alucinaciones comunes de Whisper en silencio/ruido
      const hallucinations = [
        'subtítulos por la comunidad de amara.org',
        'subtitles by the amara.org community',
        'gracias por ver',
        'thanks for watching',
        'amara.org',
      ];
      const lowerText = userText.toLowerCase();
      if (hallucinations.some(h => lowerText.includes(h))) {
        console.log('[Voice] Hallucination detected, ignoring:', userText);
        userText = '';
      }

      if (!userText || userText.length < 2) { 
        console.log('[Voice] Transcript too short or empty, ignoring');
        sendingRef.current = false; 
        startListening(); 
        return; 
      }

      // Agregar a messages y limpiar transcript de una vez para evitar duplicado
      setMessages(prev => [...prev, { role: 'user', text: userText }]);
      setTranscript('');

      // Asegurar sesión
      let sid = sidRef.current;
      if (!sid) sid = await onSessionInit();
      if (!sid) { sendingRef.current = false; startListening(); return; }

      // HORUS
      const chatRes = await apiClient.post<{ response: string }>('/chat/message', { sessionId: sid, message: userText });
      const botText = chatRes.data.response?.trim();
      if (!botText) { sendingRef.current = false; startListening(); return; }

      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
      onNewMessages(userText, botText);

      // TTS — strip markdown para no leer asteriscos
      setVoiceState('speaking');
      setStatusText('Hablando...');
      const ttsText = stripMarkdown(botText);
      const ttsRes = await apiClient.post<{ audioBase64: string }>('/chat/tts', { text: ttsText, voiceId });

      const tmpPath = `${FileSystem.cacheDirectory}horus_tts_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(tmpPath, ttsRes.data.audioBase64, { encoding: 'base64' as any });

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound: s } = await Audio.Sound.createAsync({ uri: tmpPath });
      sound.current = s;
      await s.playAsync();

      s.setOnPlaybackStatusUpdate(async (status) => {
        if (!status.isLoaded || !status.didJustFinish) return;
        await s.unloadAsync();
        sound.current = null;
        FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => { });
        setTranscript('');
        sendingRef.current = false;
        if (visibleRef.current) startListening(); // loop automático
      });

    } catch (err) {
      console.error('[Voice] error:', err);
      setStatusText('Error — toca para reintentar');
      setVoiceState('idle');
      sendingRef.current = false;
      listeningRef.current = false;
    }
  }, [voiceId, onSessionInit, onNewMessages, startListening]);

  const interrupt = useCallback(async () => {
    if (sound.current) {
      try { await sound.current.stopAsync(); await sound.current.unloadAsync(); } catch { }
      sound.current = null;
    }
    sendingRef.current = false;
    setVoiceState('idle');
    startListening();
  }, [startListening]);

  const handleOrbPress = useCallback(async () => {
    console.log('[Voice] handleOrbPress state:', voiceState, 'sending:', sendingRef.current, 'listening:', listeningRef.current);
    if (voiceState === 'idle') {
      if (sound.current) {
        try { await sound.current.stopAsync(); await sound.current.unloadAsync(); } catch { }
        sound.current = null;
      }
      startListening();
    }
    else if (voiceState === 'listening') sendVoice();
    else if (voiceState === 'speaking') {
      sendingRef.current = false; // Reset sendingRef just in case
      if (sound.current) {
        try { 
          await sound.current.stopAsync(); 
          await sound.current.unloadAsync(); 
        } catch (e) {
          console.log('[Voice] Error stopping sound on interrupt:', e);
        }
        sound.current = null;
      }
      // Pequeño delay para asegurar que el hardware de audio se libere
      setTimeout(() => {
        setVoiceState('idle');
        startListening();
      }, 100);
    }
  }, [voiceState, startListening, sendVoice]);

  const hasMessages = messages.length > 0 || transcript.length > 0;

  // Color para gradient: BG transparente → BG opaco
  const gradColors: [string, string] = [`${BG}00`, BG];

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <SafeAreaView style={[vs.container, { backgroundColor: BG }]} edges={['left', 'right', 'bottom']}>

        {/* Header */}
        <View style={[vs.header, { paddingTop: insets.top + 8 }]}>
          <View style={{ width: 40 }} />
          <Text style={[vs.title, { color: PRIMARY }]}>Modo voz</Text>
          <TouchableOpacity
            style={[vs.closeBtn, { backgroundColor: CARD }]}
            onPress={async () => { await stopAll(); onClose(); }}
          >
            <Ionicons name="close" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Mensajes + gradient de fade */}
        <View style={vs.messagesWrap}>
          <ScrollView
            ref={scrollRef}
            style={vs.scroll}
            contentContainerStyle={vs.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m, i) => (
              <View key={i} style={[vs.msgRow, m.role === 'user' ? vs.msgRight : vs.msgLeft]}>
                <View style={[
                  vs.msgBubble,
                  m.role === 'user'
                    ? { backgroundColor: PRIMARY, borderBottomRightRadius: 4 }
                    : { backgroundColor: CARD, borderBottomLeftRadius: 4 },
                ]}>
                  <AnimText
                    text={m.text}
                    isUser={m.role === 'user'}
                    color={m.role === 'user' ? BG : PRIMARY}
                    animate={i === messages.length - 1}
                  />
                </View>
              </View>
            ))}
            {transcript.length > 0 && (
              <View style={vs.msgRight}>
                <View style={[vs.msgBubble, { backgroundColor: PRIMARY + 'aa', borderBottomRightRadius: 4 }]}>
                  <Text style={[vs.msgText, { color: BG }]}>{transcript}</Text>
                </View>
              </View>
            )}
            {/* Espacio extra para que el gradient tape el último mensaje */}
            <View style={{ height: 60 }} />
          </ScrollView>

          {/* Gradient fade hacia la orb */}
          {hasMessages && (
            <LinearGradient
              colors={gradColors}
              style={vs.fadeGradient}
              pointerEvents="none"
            />
          )}
        </View>

        {/* Orb + estado — toque en toda esta área interrumpe cuando está hablando */}
        <TouchableOpacity
          style={vs.orbArea}
          onPress={handleOrbPress}
          activeOpacity={voiceState === 'speaking' ? 0.7 : 0.9}
        >
          <VoiceOrb state={voiceState} />
          <Text style={[vs.status, { color: MUTED }]}>{statusText}</Text>
          {voiceState === 'speaking' && (
            <View style={vs.interruptBadge}>
              <Ionicons name="stop-circle" size={14} color={MUTED} />
              <Text style={[vs.interruptLabel, { color: MUTED }]}>Toca para interrumpir</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Hint inferior */}
        <View style={vs.footer}>
          <Text style={[vs.hint, { color: MUTED }]}>
            {voiceState === 'idle' ? 'Toca la esfera para empezar a grabar' :
              voiceState === 'listening' ? 'Toca la esfera para terminar y enviar' :
                voiceState === 'speaking' ? 'Toca la esfera para interrumpir y hablar' :
                  'Procesando tu mensaje...'}
          </Text>
        </View>

      </SafeAreaView>
    </Modal>
  );
}

const vs = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 8,
  },
  title: { fontSize: 17, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  messagesWrap: { flex: 1, position: 'relative' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, gap: 10 },
  fadeGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
  },

  msgRow: { maxWidth: '82%' },
  msgRight: { alignSelf: 'flex-end' },
  msgLeft: { alignSelf: 'flex-start' },
  msgBubble: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
  },
  msgText: { fontSize: 15, lineHeight: 22 },

  orbArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 40 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  status: { marginTop: 10, fontSize: 14, fontWeight: '500' },
  interruptBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, opacity: 0.7,
  },
  interruptLabel: { fontSize: 12 },
  footer: { paddingBottom: 20, paddingHorizontal: 20, alignItems: 'center' },
  hint: { fontSize: 12, textAlign: 'center' },
});
