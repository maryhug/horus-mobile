import React, { useState, useRef, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { AppColors } from '../../constants/colors';

type Message = { id: string; role: 'bot' | 'user'; text: string };

const INITIAL_MESSAGES: Message[] = [
  { id: '1', role: 'bot', text: 'Hola 👋 Soy tu asistente Horus. Pregúntame sobre tu actividad, sensores o alertas recientes.' },
];

const SUGGESTIONS = [
  '¿Cómo va mi actividad esta semana?',
  'Resumen de alertas de seguridad',
  'Estado de la batería y sincronización',
];

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('actividad') || lower.includes('semana'))
    return 'Esta semana has dado un promedio de 7,820 pasos diarios, con un pico de 10,240 el miércoles. Tu actividad está un 12% por encima de la semana anterior. ¡Sigue así!';
  if (lower.includes('alerta') || lower.includes('seguridad'))
    return 'Tienes 2 alertas activas: una geocerca traspasada hace 12 min en Av. Reforma y un episodio de ritmo cardíaco elevado hace 1 hora. ¿Quieres más detalles?';
  if (lower.includes('batería') || lower.includes('sincron'))
    return 'Tu manilla tiene 82% de batería, estimado para 18 horas. La última sincronización fue hace 3 minutos a las 10:42 AM y fue exitosa.';
  return 'Recibí tu mensaje. Estoy procesando la información de tu manilla Horus. ¿Hay algo específico sobre tu actividad, sensores o alertas en lo que pueda ayudarte?';
}

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
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    headerAvatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1.5,
      borderColor: c.accent20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
    headerAccent: { color: c.accent },
    headerActions: { flexDirection: 'row', gap: 8 },
    themeBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.success },
    onlineText: { fontSize: 11, color: c.textSecondary },
    msgList: { paddingHorizontal: 16, paddingVertical: 16 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
    msgRowBot: { justifyContent: 'flex-start' },
    msgRowUser: { justifyContent: 'flex-end' },
    botIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
    bubbleBot: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    bubbleUser: { backgroundColor: c.accent, borderTopRightRadius: 4 },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    bubbleTextBot: { color: c.textPrimary },
    bubbleTextUser: { color: '#FFFFFF', fontWeight: '500' },
    typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },
    typingDots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
    typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.textSecondary },
    suggestionsWrap: { borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background },
    chipsList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    chip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    chipText: { fontSize: 12, color: c.textSecondary },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
      gap: 10,
      backgroundColor: c.background,
    },
    attachBtn: { padding: 4 },
    input: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: c.textPrimary,
      fontSize: 14,
      borderWidth: 1,
      borderColor: c.border,
      maxHeight: 100,
    },
    sendBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
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

export default function AssistantScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: trimmed }]);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: getBotResponse(trimmed) }]);
      setIsTyping(false);
    }, 900);
  };

  const renderMessage: ListRenderItem<Message> = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && (
          <View style={styles.botIcon}>
            <Ionicons name="sparkles" size={13} color={colors.accent} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={22} color={colors.accent} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              Asistente <Text style={styles.headerAccent}>Horus AI</Text>
            </Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>En línea · responde en tiempo real</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.themeBtn} onPress={toggleTheme}>
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

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
                  <Ionicons name="sparkles" size={13} color={colors.accent} />
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
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="attach" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Pregunta sobre los datos de tu manilla..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, inputText.trim() ? styles.sendBtnActive : null]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={15} color={inputText.trim() ? '#FFFFFF' : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
