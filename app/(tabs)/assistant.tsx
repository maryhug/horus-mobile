import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient, getErrorMessage } from '../../services/api';
import { AppColors } from '../../constants/colors';
import { HorusIcon } from '../../assets/icons';
import { AppHeader } from '../../components/AppHeader';
import type { ChatResponse } from '../../types/api';

type Message = { id: string; role: 'bot' | 'user'; text: string; error?: boolean };

const INITIAL_MESSAGES: Message[] = [
  { id: '1', role: 'bot', text: 'Hola. Soy tu asistente Horus. Pregúntame sobre tu actividad, sensores o alertas recientes.' },
];

const SUGGESTIONS = [
  '¿Cómo va mi actividad esta semana?',
  'Resumen de alertas de seguridad',
  'Estado de la batería y sincronización',
];

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: c.background,
    },
    headerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.accent10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
    headerAccent: { color: c.accent },
    headerActions: { flexDirection: 'row', gap: 8 },
    themeBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.success },
    onlineText: { fontSize: 11, color: c.textSecondary },
    msgList: { paddingHorizontal: 16, paddingVertical: 16 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
    msgRowBot: { justifyContent: 'flex-start' },
    msgRowUser: { justifyContent: 'flex-end' },
    botIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.accent10,
      borderWidth: 1,
      borderColor: c.accent20,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    bubble: { maxWidth: '78%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11 },
    bubbleBot: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    bubbleUser: { backgroundColor: c.accent, borderTopRightRadius: 6 },
    bubbleError: { borderColor: 'rgba(245, 86, 66,0.35)', backgroundColor: 'rgba(245, 86, 66,0.08)' },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    bubbleTextBot: { color: c.textPrimary },
    bubbleTextUser: { color: '#FFFFFF', fontWeight: '500' },
    bubbleTextError: { color: '#F55642' },
    typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },
    typingDots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
    typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.textSecondary },
    suggestionsWrap: { backgroundColor: c.background },
    chipsList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    chip: {
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 2,
    },
    chipText: { fontSize: 12, color: c.textSecondary },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
      backgroundColor: c.background,
      paddingBottom: 16,
    },
    input: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: c.textPrimary,
      fontSize: 14,
      maxHeight: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 2,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtnActive: {
      backgroundColor: c.accent,
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
  });
}

// TODO: ajustar según la respuesta real de la API — extraer el texto del mensaje de la respuesta del chat
function extractResponseText(data: ChatResponse): string {
  return data.message ?? data.response ?? data.content ?? 'Respuesta recibida.';
}

export default function AssistantScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const { data } = await apiClient.post<ChatResponse>('/chat', { message: trimmed });
      const botText = extractResponseText(data);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: botText,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: getErrorMessage(err),
        error: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping]);

  const renderMessage: ListRenderItem<Message> = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && (
          <View style={styles.botIcon}>
            <HorusIcon name="assistant-active" size={16} color={colors.accent} />
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
          item.error && styles.bubbleError,
        ]}>
          <Text style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextBot,
            item.error && styles.bubbleTextError,
          ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      {/* Status bar del asistente — compacto, útil */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 20, paddingVertical: 8,
        backgroundColor: colors.background,
      }}>
        <View style={{
          width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success,
        }} />
        <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>
          Horus AI · En línea · responde en tiempo real
        </Text>
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.msgRow, styles.msgRowBot]}>
                <View style={styles.botIcon}>
                  <HorusIcon name="assistant-active" size={16} color={colors.accent} />
                </View>
                <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, { opacity: 1 }]} />
                    <View style={[styles.typingDot, { opacity: 0.6 }]} />
                    <View style={[styles.typingDot, { opacity: 0.3 }]} />
                  </View>
                </View>
              </View>
            ) : null
          }
        />

        {messages.length === 1 && (
          <View style={styles.suggestionsWrap}>
            <FlatList
              horizontal
              data={SUGGESTIONS}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.chip} onPress={() => sendMessage(item)} activeOpacity={0.75}>
                  <Text style={styles.chipText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.chipsList}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Pregunta sobre los datos de tu manilla..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isTyping}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (inputText.trim() && !isTyping) ? styles.sendBtnActive : null]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
          >
            <HorusIcon
              name="send"
              size={16}
              color={(inputText.trim() && !isTyping) ? '#FFFFFF' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

