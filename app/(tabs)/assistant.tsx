import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { apiClient, getErrorMessage } from '../../services/api';
import type { ChatResponse } from '../../types/api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAssistant } from '../../hooks/useAssistant';

// ── Suggested prompts ──────────────────────────────────────────────────────
const SUGGESTIONS = [
  '¿Cómo va mi actividad esta semana?',
  'Resumen de alertas de seguridad',
  'Estado de la batería y sincronización',
];

const CANNED = 'Aún no recibo datos del sensor de tu manilla, así que no puedo mostrar métricas reales todavía. En cuanto se sincronice, podré darte un resumen detallado de tu actividad, alertas y batería.';

// ── Types ──────────────────────────────────────────────────────────────────
type Msg = { id: string; role: 'user' | 'bot' | 'error'; text: string };

// ── Typing dots ───────────────────────────────────────────────────────────
function TypingDots({ muted }: { muted: string }) {
  const d0 = useRef(new Animated.Value(0)).current;
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (d: Animated.Value, delay: number) => {
      const loop = () =>
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: -6, duration: 280, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0,  duration: 280, useNativeDriver: true }),
          Animated.delay(600),
        ]).start(({ finished }) => { if (finished) loop(); });
      loop();
    };
    bounce(d0, 0);
    bounce(d1, 160);
    bounce(d2, 320);
    return () => { d0.stopAnimation(); d1.stopAnimation(); d2.stopAnimation(); };
  }, []);

  return (
    <View style={td.wrap}>
      {[d0, d1, d2].map((d, i) => (
        <Animated.View key={i} style={[td.dot, { backgroundColor: muted, transform: [{ translateY: d }] }]} />
      ))}
    </View>
  );
}
const td = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 14 },
  dot:  { width: 8, height: 8, borderRadius: 4 },
});

// ── Animated avatar for welcome card ──────────────────────────────────────
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

export default function AssistantScreen() {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, BLUE, isDark } = useAppTheme();
  const s = React.useMemo(() => makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, BLUE), [isDark]);
  const { assistant } = useAssistant();

  const insets = useSafeAreaInsets();
  // Tab bar height: bar content ~65px + bottom safe area (min 12px Android / 16px iOS)
  const TAB_H = 65 + Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 12);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);
  const listRef  = useRef<FlatList>(null);
  const idRef    = useRef(0);

  const scrollToBottom = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  const send = useCallback((text: string) => {
    const value = text.trim();
    if (!value) return;
    idRef.current++;
    const userMsg: Msg = { id: `${idRef.current}`, role: 'user', text: value };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    scrollToBottom();

    // Try real API, fall back to canned
    apiClient.post<ChatResponse>('/assistant/chat', { message: value })
      .then(res => {
        setTyping(false);
        idRef.current++;
        setMessages(prev => [...prev, { id: `${idRef.current}`, role: 'bot', text: res.data?.reply ?? CANNED }]);
        scrollToBottom();
      })
      .catch(() => {
        setTyping(false);
        idRef.current++;
        setMessages(prev => [...prev, { id: `${idRef.current}`, role: 'bot', text: CANNED }]);
        scrollToBottom();
      });
  }, []);

  const isEmpty = messages.length === 0 && !typing;

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerAvatar}>
            <Image source={assistant.image} style={{ width: 48, height: 48 }} resizeMode="contain" />
          </View>
          <View>
            <Text style={s.headerTitle}>{assistant.name} · Horus AI</Text>
            <View style={s.onlineRow}>
              <View style={s.onlineDot} />
              <Text style={s.onlineText}>En línea</Text>
            </View>
          </View>
        </View>

        {/* ── Messages list ────────────────────────────────────────────── */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={[s.listContent, isEmpty && s.listEmpty, { paddingBottom: TAB_H + 110 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListHeaderComponent={isEmpty ? (
            <View style={s.welcomeWrap}>
              {/* Welcome card */}
              <View style={s.welcomeCard}>
                <FloatingAvatar image={assistant.image} />
                <Text style={s.welcomeTitle}>Hola, soy {assistant.name}</Text>
                <Text style={s.welcomeSub}>
                  Pregúntame sobre tu actividad, alertas o el estado de tu dispositivo.
                </Text>
              </View>

              {/* Suggestion chips */}
              <View style={s.suggestions}>
                {SUGGESTIONS.map(p => (
                  <TouchableOpacity key={p} style={s.suggestionBtn} onPress={() => send(p)} activeOpacity={0.75}>
                    <Text style={s.suggestionText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
          renderItem={({ item: m }) => (
            <View style={[s.msgRow, m.role === 'user' ? s.msgRowRight : s.msgRowLeft]}>
              <View style={[
                s.bubble,
                m.role === 'user'  && s.bubbleUser,
                m.role === 'bot'   && s.bubbleBot,
                m.role === 'error' && s.bubbleError,
              ]}>
                <Text style={[s.bubbleText, m.role === 'user' && s.bubbleTextUser]}>
                  {m.text}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={typing ? (
            <View style={s.msgRowLeft}>
              <View style={s.bubbleBot}>
                <TypingDots muted={MUTED} />
              </View>
            </View>
          ) : null}
        />

        {/* ── Input bar — flota sobre la tab bar ───────────────────────── */}
        <View style={[s.inputWrap, { bottom: TAB_H + 14 }]}>
          <View style={s.inputRow}>

            {/* Píldora: + botón + campo de texto */}
            <View style={s.inputPill}>
              <TouchableOpacity style={s.plusBtn} activeOpacity={0.7}>
                <Ionicons name="add" size={22} color={PRIMARY} />
              </TouchableOpacity>
              <TextInput
                style={s.inputField}
                value={input}
                onChangeText={t => setInput(t)}
                placeholder="Escribe un mensaje…"
                placeholderTextColor={`${MUTED}90`}
                multiline
                returnKeyType="send"
                blurOnSubmit
                onSubmitEditing={() => send(input)}
              />
            </View>

            {/* Botón circular externo */}
            <TouchableOpacity
              style={[s.sendCircle, input.trim() ? s.sendCircleActive : s.sendCircleIdle]}
              onPress={() => send(input)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={input.trim() ? 'send' : 'mic-outline'}
                size={22}
                color={input.trim() ? '#FFFFFF' : PRIMARY}
              />
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAvoidingView>
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
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    },
    headerAvatar: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: BLUE + '30',
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    headerTitle: { fontSize: 19, fontWeight: '700', color: PRIMARY, letterSpacing: -0.3 },
    onlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    onlineDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
    onlineText:  { fontSize: 13, color: GREEN, fontWeight: '600' },

    // List
    listContent: { paddingHorizontal: 20, paddingBottom: 20 },
    listEmpty:   { flex: 1 },

    // Welcome
    welcomeWrap: { gap: 16, paddingTop: 12 },
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
    },
    bubbleUser:  { backgroundColor: PRIMARY, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 12 },
    bubbleBot:   { backgroundColor: CARD, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12 },
    bubbleError: { backgroundColor: '#EA3C3F18', borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12 },
    bubbleText:     { fontSize: 14, color: PRIMARY, lineHeight: 20 },
    bubbleTextUser: { color: BG },

    // Input — position absolute sobre la tab bar
    inputWrap: {
      position: 'absolute', left: 0, right: 0,
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
      backgroundColor: BG,
    },
    inputRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    // Píldora izquierda
    inputPill: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      backgroundColor: CARD, borderRadius: 22,
      paddingLeft: 6, paddingRight: 10,
      height: 44,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 14, elevation: 5,
    },
    plusBtn: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: MUTED_BG,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    inputField: {
      flex: 1, fontSize: 14, color: PRIMARY,
      paddingHorizontal: 10, paddingVertical: 0,
      height: 44, maxHeight: 120, lineHeight: 44,
      textAlignVertical: 'center',
    },
    // Botón circular externo
    sendCircle: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
    },
    sendCircleActive: { backgroundColor: PRIMARY },
    sendCircleIdle:   { backgroundColor: MUTED_BG },
  });
}
