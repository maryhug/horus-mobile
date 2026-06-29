import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Platform, Animated, Keyboard, LayoutAnimation,
  UIManager, Modal, Alert, KeyboardAvoidingView
} from 'react-native';
import { useFocusEffect } from 'expo-router';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from '../../services/api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAssistant } from '../../hooks/useAssistant';
import { useVoice } from '../../hooks/useVoice';
import { useLanguage } from '../../contexts/LanguageContext';
import { FONT } from '../../constants/fonts';
import VoiceMode from './VoiceMode';
import ConversationHistory from './ConversationHistory';
import { notificationStore } from '../../stores/notificationStore';

const HEALTH_REPORT_PROMPT = 'Genera mi reporte de salud diario. Analiza mi historial médico, alergias activas, condiciones crónicas, medicamentos y actividad registrada hoy. Dame un ranking de mi salud del día (escala 1-10 con justificación breve) y 3 recomendaciones personalizadas para mí basadas en mi perfil.';

// ── Types ──────────────────────────────────────────────────────────────────
type MediaInfo = { uri: string; type: 'image' | 'pdf' | 'docx'; name?: string };
type Msg = {
  id: string;
  role: 'user' | 'bot' | 'error';
  text: string;
  media?: MediaInfo;
};
interface InitResponse { sessionId: string; message: string }
interface SendResponse { sessionId: string; response: string }

// ── Inline Markdown renderer ───────────────────────────────────────────────
function InlineMd({ text, style }: { text: string; style: any }) {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, key = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last)
      parts.push(<Text key={key++} style={style}>{text.slice(last, m.index)}</Text>);
    parts.push(<Text key={key++} style={[style, { fontWeight: '700' }]}>{m[1]}</Text>);
    last = m.index + m[0].length;
  }
  if (last < text.length)
    parts.push(<Text key={key++} style={style}>{text.slice(last)}</Text>);
  return <>{parts.length ? parts : <Text style={style}>{text}</Text>}</>;
}

function MdText({ text, color }: { text: string; color: string }) {
  const base = { fontSize: 14, color, lineHeight: 21 };
  return (
    <View style={{ gap: 3 }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <View key={i} style={{ height: 5 }} />;
        const h3 = line.match(/^###\s+(.+)$/);
        if (h3) return <Text selectable key={i} style={[base, { fontWeight: '700', fontSize: 15, marginTop: 4 }]}><InlineMd text={h3[1]} style={[base, { fontWeight: '700', fontSize: 15 }]} /></Text>;
        const h2 = line.match(/^##\s+(.+)$/);
        if (h2) return <Text selectable key={i} style={[base, { fontWeight: '700', fontSize: 16, marginTop: 6 }]}><InlineMd text={h2[1]} style={[base, { fontWeight: '700', fontSize: 16 }]} /></Text>;
        const h1 = line.match(/^#\s+(.+)$/);
        if (h1) return <Text selectable key={i} style={[base, { fontWeight: '700', fontSize: 17, marginTop: 8 }]}><InlineMd text={h1[1]} style={[base, { fontWeight: '700', fontSize: 17 }]} /></Text>;
        const bullet = line.match(/^[\s]*[-•]\s(.+)$/);
        if (bullet) return (
          <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
            <Text selectable style={base}>•</Text>
            <Text selectable style={[base, { flex: 1 }]}><InlineMd text={bullet[1]} style={base} /></Text>
          </View>
        );
        const numbered = line.match(/^[\s]*(\d+\.)\s(.+)$/);
        if (numbered) return (
          <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
            <Text selectable style={base}>{numbered[1]}</Text>
            <Text selectable style={[base, { flex: 1 }]}><InlineMd text={numbered[2]} style={base} /></Text>
          </View>
        );
        return (
          <Text selectable key={i} style={base}><InlineMd text={line} style={base} /></Text>
        );
      })}
    </View>
  );
}

// ── Streaming text (typewriter) ────────────────────────────────────────────
function StreamText({ text, color, onDone }: { text: string; color: string; onDone: () => void }) {
  const [shown, setShown] = useState('');
  const cbRef = useRef(onDone);
  cbRef.current = onDone;

  useEffect(() => {
    setShown('');
    const len = text.length;
    const chunk = Math.max(1, Math.ceil(len / 60));
    let pos = 0;
    let finished = false;
    const t = setInterval(() => {
      pos = Math.min(pos + chunk, len);
      setShown(text.slice(0, pos));
      if (pos >= len && !finished) {
        finished = true;
        clearInterval(t);
        cbRef.current();
      }
    }, 20);
    return () => clearInterval(t);
  }, [text]);

  return <MdText text={shown || ' '} color={color} />;
}

// ── Typing dots ───────────────────────────────────────────────────────────
function TypingDots({ muted }: { muted: string }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    dots.forEach((d, i) => {
      const loop = () =>
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(d, { toValue: -6, duration: 280, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0,  duration: 280, useNativeDriver: true }),
          Animated.delay(600),
        ]).start(({ finished }) => { if (finished) loop(); });
      loop();
    });
    return () => dots.forEach(d => d.stopAnimation());
  }, []);
  return (
    <View style={td.wrap}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={[td.dot, { backgroundColor: muted, transform: [{ translateY: d }] }]} />
      ))}
    </View>
  );
}
const td = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 14 },
  dot:  { width: 8, height: 8, borderRadius: 4 },
});

// ── Floating avatar for welcome card ──────────────────────────────────────
function FloatingAvatar({ image }: { image: ReturnType<typeof require> }) {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -8, duration: 1500, useNativeDriver: true }),
      Animated.timing(float, { toValue:  0, duration: 1500, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateY: float }] }}>
      <Image source={image} style={{ width: 72, height: 72 }} resizeMode="contain" />
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────
export default function AssistantScreen() {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, BLUE, isDark } = useAppTheme();
  const s = React.useMemo(() => makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, BLUE), [isDark]);
  const { assistant } = useAssistant();
  const { voiceId } = useVoice();
  const { t } = useLanguage();

  const insets  = useSafeAreaInsets();
  const TAB_H   = 65 + Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 12);
  const BASE_BOTTOM = TAB_H + 10;

  const [messages,     setMessages]     = useState<Msg[]>([]);
  const [input,        setInput]        = useState('');
  const [typing,       setTyping]       = useState(false);
  const [sessionId,    setSessionId]    = useState<string | null>(null);
  const [ending,       setEnding]       = useState(false);
  const [showAttach,   setShowAttach]   = useState(false);
  const [streamingId,  setStreamingId]  = useState<string | null>(null);
  const [kbHeight,     setKbHeight]     = useState(0);
  const [pendingMedia, setPendingMedia] = useState<{ base64: string; mimeType: string; info: MediaInfo } | null>(null);
  const [viewImageUri, setViewImageUri] = useState<string | null>(null);
  const [voiceModeOn,  setVoiceModeOn]  = useState(false);
  const [historyOpen,  setHistoryOpen]  = useState(false);

  const listRef    = useRef<FlatList>(null);
  const idRef      = useRef(0);
  const initLock   = useRef(false);
  const pickingRef = useRef(false);

  // ── Keyboard tracking (para ajustar padding manualmente) ──
  useEffect(() => {
    const onShow = (e: any) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKbHeight(e.endCoordinates.height);
    };
    const onHide = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKbHeight(0);
    };
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(showEvent, onShow);
    const s2 = Keyboard.addListener(hideEvent, onHide);
    return () => { s1.remove(); s2.remove(); };
  }, []);

  const scrollToBottom = useCallback(() =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80), []);

  // Scroll al llegar nuevo mensaje o al aparecer/desaparecer el typing indicator
  useEffect(() => { scrollToBottom(); }, [messages.length, typing]);

  // Scroll continuo mientras se hace streaming del texto
  useEffect(() => {
    if (!streamingId) return;
    const iv = setInterval(() => listRef.current?.scrollToEnd({ animated: false }), 80);
    return () => clearInterval(iv);
  }, [streamingId]);

  const nextId = () => { idRef.current++; return `${idRef.current}`; };

  const pushMsg = useCallback((msg: Msg) =>
    setMessages(prev => [...prev, msg]), []);

  const sendRef = useRef<((text: string) => void) | null>(null);

  // ── Init session (silent — no greeting) ────────────────────────────────
  const initSession = useCallback(async (): Promise<string | null> => {
    if (initLock.current) return null;
    initLock.current = true;
    try {
      const res = await apiClient.post<InitResponse>('/chat/init');
      const sid = res.data.sessionId;
      setSessionId(sid);
      return sid;
    } catch (err) {
      console.error('[HORUS] init failed', err);
      return null;
    } finally {
      initLock.current = false;
    }
  }, []);

  // ── End session (+ cleanup temp media files) ───────────────────────────
  const endSession = useCallback(async () => {
    if (ending) return;
    setEnding(true);

    // Collect temp file URIs before clearing state (skip data: URIs — not file paths)
    const tempUris = messages
      .filter(m => m.media?.uri && !m.media.uri.startsWith('data:'))
      .map(m => m.media!.uri);

    const sid = sessionId;
    setSessionId(null);
    setMessages([]);
    setStreamingId(null);
    idRef.current = 0;

    // Delete temp files from device cache (images/PDFs are never uploaded anywhere)
    await Promise.allSettled(
      tempUris.map(uri => FileSystem.deleteAsync(uri, { idempotent: true }))
    );

    if (sid) {
      try { await apiClient.post('/chat/end', { sessionId: sid }); }
      catch (err) { console.error('[HORUS] end error', err); }
    }
    setEnding(false);
  }, [sessionId, ending, messages]);

  // ── Core send (text + optional media) ──────────────────────────────────
  const sendCore = useCallback(async (
    text: string,
    media?: { base64: string; mimeType: string; info: MediaInfo },
  ) => {
    if (typing) return;

    let sid = sessionId;
    if (!sid) {
      sid = await initSession();
      if (!sid) return;
    }

    const id = nextId();
    pushMsg({ id, role: 'user', text, media: media?.info });
    setInput('');
    setTyping(true);
    scrollToBottom();

    try {
      const defaultMsg = media
        ? media.info.type === 'image' ? 'Analiza esta imagen médica.' : 'Analiza este documento médico.'
        : '';
      const payload: Record<string, string> = {
        sessionId: sid,
        message: text || defaultMsg,
      };
      if (media) { payload.mediaBase64 = media.base64; payload.mediaType = media.mimeType; }

      const res = await apiClient.post<SendResponse>('/chat/message', payload);
      setTyping(false);
      const botId = nextId();
      setStreamingId(botId);
      pushMsg({ id: botId, role: 'bot', text: res.data.response ?? t.chatCanned });
      scrollToBottom();
    } catch {
      setTyping(false);
      pushMsg({ id: nextId(), role: 'bot', text: t.chatCanned });
      scrollToBottom();
    }
  }, [sessionId, typing, t, initSession, pushMsg]);

  const send = useCallback((text: string) => {
    const v = text.trim();
    if (!v && !pendingMedia) return;
    Keyboard.dismiss();
    const media = pendingMedia;
    setPendingMedia(null);
    sendCore(v, media ?? undefined);
  }, [sendCore, pendingMedia]);

  // Keep ref updated so useFocusEffect can call the latest version
  sendRef.current = send;

  // ── Handle health report notification tap ────────────────────────────────
  useFocusEffect(useCallback(() => {
    const pending = notificationStore.consume();
    if (pending === 'health_report') {
      setTimeout(() => sendRef.current?.(HEALTH_REPORT_PROMPT), 400);
    }
  }, []));

  // ── Image picker ────────────────────────────────────────────────────────
  const pickImage = useCallback(async (fromCamera: boolean) => {
    if (pickingRef.current) return;
    pickingRef.current = true;
    setShowAttach(false);
    // Esperar un tick para que React desmonte el Modal antes de abrir el picker nativo
    await new Promise<void>(r => setTimeout(r, 80));
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso para adjuntar fotos.');
        return;
      }
      // quality 0.3 — suficiente para análisis médico, ~70% menos peso
      const opts = { quality: 0.3 as const, base64: true as const };
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync({ ...opts, mediaTypes: ['images'] as const });
      if (result.canceled || !result.assets?.[0]?.base64) return;
      const asset = result.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      const ext = mime.includes('png') ? 'png' : 'jpg';
      setPendingMedia({
        base64: asset.base64!,
        mimeType: mime,
        info: { uri: asset.uri, type: 'image' },
      });
    } catch (err) {
      console.error('[IMG] pick error', err);
    } finally {
      pickingRef.current = false;
    }
  }, [sendCore]);

  // ── Document picker (PDF + DOCX) ────────────────────────────────────────
  const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const pickDocument = useCallback(async () => {
    if (pickingRef.current) return;
    pickingRef.current = true;
    setShowAttach(false);
    await new Promise<void>(r => setTimeout(r, 80));
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', DOCX_MIME],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      const mime = file.mimeType ?? 'application/pdf';
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64' as any,
      });
      const isPdf = mime === 'application/pdf';
      setPendingMedia({
        base64,
        mimeType: mime,
        info: { uri: file.uri, type: isPdf ? 'pdf' : 'docx', name: file.name },
      });
    } catch (err) {
      console.error('[DOC] pick error', err);
    } finally {
      pickingRef.current = false;
    }
  }, []);
  const hasSession = sessionId !== null || messages.length > 0;
  const isEmpty    = messages.length === 0 && !typing;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={s.container}>
      <View style={[s.flex, { paddingBottom: kbHeight }]}>
        <View style={s.flex}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerAvatar}>
            <Image source={assistant.image} style={{ width: 48, height: 48 }} resizeMode="contain" />
          </View>
          <View style={s.headerInfo}>
            <Text style={s.headerTitle}>{assistant.name} · {t.chatHorusAI}</Text>
            <View style={s.onlineRow}>
              <View style={s.onlineDot} />
              <Text style={s.onlineText}>{t.chatOnline}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.historyBtn} onPress={() => setHistoryOpen(true)} activeOpacity={0.7}>
            <Ionicons name="time-outline" size={20} color={MUTED} />
          </TouchableOpacity>
          {hasSession && (
            <TouchableOpacity style={s.closeBtn} onPress={endSession} activeOpacity={0.7} disabled={ending}>
              <Ionicons name="close-circle-outline" size={15} color={MUTED} />
              <Text style={s.closeBtnText}>Cerrar chat</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Messages ─────────────────────────────────────────────────── */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          style={s.flex}
          contentContainerStyle={[s.listContent, isEmpty && s.listEmpty, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListHeaderComponent={isEmpty ? (
            <View style={s.welcomeWrap}>
              <View style={s.welcomeCard}>
                <FloatingAvatar image={assistant.image} />
                <Text style={s.welcomeTitle}>{t.dashHelloIm} {assistant.name}</Text>
                <Text style={s.welcomeSub}>{t.chatWelcomeSub}</Text>
              </View>
            </View>
          ) : null}
          renderItem={({ item: m }) => {
            const isUser      = m.role === 'user';
            const isStreaming = m.id === streamingId;
            return (
              <View style={[s.msgRow, isUser ? s.msgRowRight : s.msgRowLeft]}>
                {/* 1. Imagen fuera del recuadro */}
                {m.media?.type === 'image' && (
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setViewImageUri(m.media!.uri)}>
                    <Image 
                      source={{ uri: m.media.uri }} 
                      style={[s.mediaThumb, { marginBottom: m.text ? 4 : 0 }]} 
                      resizeMode="cover" 
                    />
                  </TouchableOpacity>
                )}

                {/* 2. Recuadro para texto y documentos */}
                {(!!m.text || m.media?.type === 'pdf' || m.media?.type === 'docx') && (
                  <TouchableOpacity
                    style={[
                      s.bubble,
                      isUser          && s.bubbleUser,
                      m.role === 'bot'   && s.bubbleBot,
                      m.role === 'error' && s.bubbleError,
                    ]}
                    onLongPress={() => Keyboard.dismiss()}
                    activeOpacity={1}
                  >
                    {(m.media?.type === 'pdf' || m.media?.type === 'docx') && (
                      <View style={s.docCard}>
                        <Ionicons
                          name={m.media.type === 'docx' ? 'document-text' : 'document'}
                          size={28}
                          color={isUser ? BG : PRIMARY}
                        />
                        <View style={s.docCardTextWrap}>
                          <Text style={[s.bubbleText, isUser && s.bubbleTextUser, s.docCardTitle]} numberOfLines={1}>
                            {m.media.name ?? (m.media.type === 'docx' ? 'Documento Word' : 'Documento PDF')}
                          </Text>
                          <Text style={[s.bubbleText, isUser && s.bubbleTextUser, s.docCardSub]} numberOfLines={1}>
                            {m.media.type === 'docx' ? 'Archivo Word' : 'Archivo PDF'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Text content */}
                    {isUser ? (
                      m.text ? <Text selectable style={[s.bubbleText, s.bubbleTextUser]}>{m.text}</Text> : null
                    ) : isStreaming ? (
                      <StreamText text={m.text} color={PRIMARY} onDone={() => setStreamingId(null)} />
                    ) : (
                      m.text ? <MdText text={m.text} color={PRIMARY} /> : null
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          ListFooterComponent={typing ? (
            <View style={s.msgRowLeft}>
              <View style={s.typingBubble}>
                <TypingDots muted={MUTED} />
              </View>
            </View>
          ) : null}
        />

        {/* ── Input bar ─────────── */}
        <View style={[s.inputArea, { paddingBottom: kbHeight > 0 ? (Platform.OS === 'ios' ? 10 : 20) : BASE_BOTTOM }]}>

          {/* Preview del adjunto pendiente */}
          {pendingMedia && (
            <View style={s.pendingWrap}>
              {pendingMedia.info.type === 'image' ? (
                <Image source={{ uri: pendingMedia.info.uri }} style={s.pendingThumb} resizeMode="cover" />
              ) : (
                <View style={s.pendingPdf}>
                  <Ionicons name="document-text" size={18} color={PRIMARY} />
                  <Text style={s.pendingPdfName} numberOfLines={1}>
                    {pendingMedia.info.name ?? (pendingMedia.info.type === 'docx' ? 'Documento Word' : 'Documento PDF')}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={s.pendingRemove} onPress={() => setPendingMedia(null)} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={20} color={MUTED} />
              </TouchableOpacity>
            </View>
          )}

          <View style={s.inputRow}>
            <View style={s.inputPill}>
              <TouchableOpacity style={s.plusBtn} onPress={() => setShowAttach(true)} activeOpacity={0.7}>
                <Ionicons name="add" size={22} color={PRIMARY} />
              </TouchableOpacity>
              <TextInput
                style={s.inputField}
                value={input}
                onChangeText={setInput}
                placeholder="Escribe algo..."
                placeholderTextColor={`${MUTED}80`}
                multiline
                returnKeyType="send"
                blurOnSubmit
                onSubmitEditing={() => send(input)}
              />
            </View>
            <TouchableOpacity
              style={[s.sendCircle, (input.trim() || pendingMedia) ? s.sendCircleActive : s.sendCircleIdle]}
              onPress={() => (input.trim() || pendingMedia) ? send(input) : setVoiceModeOn(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={(input.trim() || pendingMedia) ? 'send' : 'mic-outline'}
                size={22}
                color={(input.trim() || pendingMedia) ? '#FFFFFF' : PRIMARY}
              />
            </TouchableOpacity>
          </View>
        </View>

        </View>
      </View>

      {/* ── Attach modal ─────────────────────────────────────────────────── */}
      <Modal visible={showAttach} transparent animationType="none" onRequestClose={() => setShowAttach(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowAttach(false)}>
          <View style={[s.attachSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.attachHandle} />
            <TouchableOpacity style={s.attachOpt} activeOpacity={0.75} onPress={() => pickImage(true)}>
              <View style={[s.attachIcon, { backgroundColor: BLUE + '22' }]}>
                <Ionicons name="camera-outline" size={22} color={BLUE} />
              </View>
              <Text style={s.attachLabel}>Tomar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.attachOpt} activeOpacity={0.75} onPress={() => pickImage(false)}>
              <View style={[s.attachIcon, { backgroundColor: GREEN + '22' }]}>
                <Ionicons name="image-outline" size={22} color={GREEN} />
              </View>
              <Text style={s.attachLabel}>Elegir de galería</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.attachOpt} activeOpacity={0.75} onPress={pickDocument}>
              <View style={[s.attachIcon, { backgroundColor: PRIMARY + '18' }]}>
                <Ionicons name="document-outline" size={22} color={PRIMARY} />
              </View>
              <Text style={s.attachLabel}>Adjuntar PDF o Word</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Image Viewer Modal ─────────────────────────────────────────── */}
      <Modal visible={!!viewImageUri} transparent animationType="fade" onRequestClose={() => setViewImageUri(null)}>
        <View style={s.imageViewerWrap}>
          <TouchableOpacity style={s.imageViewerClose} onPress={() => setViewImageUri(null)}>
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          {viewImageUri && (
            <Image source={{ uri: viewImageUri }} style={s.imageViewerImg} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* ── Historial ────────────────────────────────────────────────── */}
      <ConversationHistory visible={historyOpen} onClose={() => setHistoryOpen(false)} />

      {/* ── Voice Mode ────────────────────────────────────────────────── */}
      <VoiceMode
        visible={voiceModeOn}
        sessionId={sessionId}
        voiceId={voiceId}
        onClose={() => setVoiceModeOn(false)}
        onSessionInit={initSession}
        onNewMessages={(userText, botText) => {
          const uid = nextId();
          const bid = nextId();
          pushMsg({ id: uid, role: 'user', text: userText });
          pushMsg({ id: bid, role: 'bot',  text: botText });
          setStreamingId(null);
        }}
      />

    </SafeAreaView>
  );
}

function makeStyles(
  BG: string, CARD: string, PRIMARY: string, MUTED: string,
  MUTED_BG: string, GREEN: string, BLUE: string,
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    flex:      { flex: 1 },

    // Header
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    },
    headerAvatar: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: BLUE + '30',
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    headerInfo:  { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: PRIMARY, letterSpacing: -0.3 },
    onlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    onlineDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
    onlineText:  { fontSize: 13, color: GREEN, fontWeight: '600' },
    historyBtn: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center',
    },
    closeBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: MUTED_BG, borderRadius: 20,
      paddingHorizontal: 11, paddingVertical: 6,
    },
    closeBtnText: { fontSize: 12, color: MUTED, fontWeight: '600' },

    // List
    listContent: { paddingHorizontal: 20, paddingBottom: 16 },
    listEmpty:   { flexGrow: 1 },

    // Welcome
    welcomeWrap: { gap: 14, paddingTop: 10 },
    welcomeCard: {
      backgroundColor: CARD, borderRadius: 32, padding: 28,
      alignItems: 'center', gap: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    welcomeTitle: { fontSize: 17, fontWeight: '700', color: PRIMARY, marginTop: 6 },
    welcomeSub:   { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20 },
    suggestions:  { gap: 10 },
    suggestionBtn: {
      backgroundColor: CARD, borderRadius: 22,
      paddingHorizontal: 20, paddingVertical: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    suggestionText: { fontSize: 13, fontWeight: '500', color: PRIMARY },

    // Messages
    msgRow:      { marginBottom: 10 },
    msgRowRight: { alignItems: 'flex-end' },
    msgRowLeft:  { alignItems: 'flex-start' },
    bubble: {
      maxWidth: '82%', borderRadius: 24,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
      overflow: 'hidden',
    },
    bubbleUser:  { backgroundColor: PRIMARY, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 12 },
    bubbleBot:   { backgroundColor: CARD, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12 },
    bubbleError: { backgroundColor: '#EA3C3F18', borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12 },
    bubbleText:     { fontSize: 14, color: PRIMARY, lineHeight: 20 },
    bubbleTextUser: { color: BG },
    // Fully rounded typing bubble
    typingBubble: {
      backgroundColor: CARD, borderRadius: 24,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    // Media
    mediaThumb: { width: 220, height: 220, borderRadius: 16 },
    docCard: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 160, marginBottom: 4 },
    docCardTextWrap: { flexShrink: 1, paddingRight: 4 },
    docCardTitle: { fontWeight: '700', fontSize: 14 },
    docCardSub: { fontSize: 12, opacity: 0.8 },

    // Pending media preview
    pendingWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: MUTED_BG, borderRadius: 14,
      paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8,
    },
    pendingThumb: { width: 52, height: 52, borderRadius: 10 },
    pendingPdf: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    pendingPdfName: { flex: 1, fontSize: 13, color: PRIMARY, fontWeight: '500' },
    pendingRemove: { padding: 2 },

    // Input bar
    inputArea: {
      paddingHorizontal: 16, paddingTop: 10,
      backgroundColor: BG,
    },
    inputRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
    inputPill: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      backgroundColor: CARD, borderRadius: 22,
      paddingLeft: 6, paddingRight: 10, minHeight: 44,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 14, elevation: 5,
    },
    plusBtn: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: MUTED_BG,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    inputField: {
      flex: 1, fontSize: 14, color: PRIMARY,
      paddingHorizontal: 10, paddingVertical: 10,
      maxHeight: 120, lineHeight: 20,
    },
    sendCircle: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
    },
    sendCircleActive: { backgroundColor: PRIMARY },
    sendCircleIdle:   { backgroundColor: MUTED_BG },

    // Attach modal
    overlay: {
      flex: 1, backgroundColor: '#00000055',
      justifyContent: 'flex-end',
    },
    attachSheet: {
      backgroundColor: CARD, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingTop: 12, paddingHorizontal: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1, shadowRadius: 20, elevation: 20,
    },
    attachHandle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: MUTED + '60',
      alignSelf: 'center', marginBottom: 16,
    },
    attachOpt: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 14,
    },
    attachIcon: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
    },
    attachLabel: { fontSize: 15, fontWeight: '500', color: PRIMARY },

    // Image Viewer
    imageViewerWrap: {
      flex: 1, backgroundColor: '#000000EB',
      alignItems: 'center', justifyContent: 'center',
    },
    imageViewerClose: {
      position: 'absolute', top: 50, right: 20,
      width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
      zIndex: 10,
    },
    imageViewerImg: {
      width: '100%', height: '80%',
    },
  });
}
