import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { apiClient } from '../../services/api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONT } from '../../constants/fonts';

// ── SVG Icons ──────────────────────────────────────────────────────────────
const sw = { strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function Icon({ size = 18, children }: { size?: number; children: React.ReactNode }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</Svg>;
}
const CloseIcon   = ({ c }: { c: string }) => <Icon size={16}><Path d="M18 6 6 18M6 6l12 12" stroke={c} {...sw} /></Icon>;
const ClockIcon   = ({ c, s = 16 }: { c: string; s?: number }) => <Icon size={s}><Circle cx={12} cy={12} r={10} stroke={c} {...sw} /><Polyline points="12 6 12 12 16 14" stroke={c} {...sw} /></Icon>;
const AlertIcon   = ({ c }: { c: string }) => <Icon size={14}><Path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke={c} {...sw} /><Path d="M12 9v4M12 17h.01" stroke={c} {...sw} /></Icon>;
const ChatIcon    = ({ c }: { c: string }) => <Icon size={14}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={c} {...sw} /></Icon>;

// ── Types ──────────────────────────────────────────────────────────────────
interface ConvLog {
  id: string;
  started_at: { _seconds: number };
  ended_at:   { _seconds: number };
  summary: string;
  main_topics: string[];
  alert_level: number;
  message_count: number;
  requires_follow_up: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

function formatDate(seconds: number) {
  const d = new Date(seconds * 1000);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function alertColor(level: number, RED: string, YELLOW: string, GREEN: string) {
  if (level >= 3) return RED;
  if (level === 2) return YELLOW;
  return GREEN;
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function ConversationHistory({ visible, onClose }: Props) {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, RED } = useAppTheme();
  const YELLOW = '#F59E0B';
  const insets = useSafeAreaInsets();

  const [logs, setLogs]       = useState<ConvLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ logs: ConvLog[] }>('/chat/history');
      setLogs(res.data.logs ?? []);
    } catch {
      setError('No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (visible) load(); }, [visible]);

  const s = makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, RED, YELLOW);

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={[s.container]} edges={['left', 'right', 'bottom']}>

        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <ClockIcon c={PRIMARY} s={20} />
          <Text style={s.title}>Historial de conversaciones</Text>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <CloseIcon c={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={PRIMARY} /></View>
        ) : error ? (
          <View style={s.center}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={[s.retryBtn, { backgroundColor: PRIMARY }]} onPress={load}>
              <Text style={[s.retryText, { color: BG }]}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : logs.length === 0 ? (
          <View style={s.center}>
            <ClockIcon c={MUTED} s={48} />
            <Text style={s.emptyText}>No hay conversaciones guardadas aún.</Text>
            <Text style={s.emptySubText}>Las conversaciones se guardan al cerrar el chat.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
            {logs.map(log => {
              const ac = alertColor(log.alert_level, RED, YELLOW, GREEN);
              return (
                <View key={log.id} style={s.card}>
                  {/* Top row: date + alert badge */}
                  <View style={s.cardTop}>
                    <View style={s.dateRow}>
                      <ClockIcon c={MUTED} />
                      <Text style={s.dateText}>
                        {log.started_at ? formatDate(log.started_at._seconds) : '—'}
                      </Text>
                    </View>
                    <View style={[s.alertBadge, { backgroundColor: ac + '22' }]}>
                      <AlertIcon c={ac} />
                      <Text style={[s.alertText, { color: ac }]}>
                        {log.alert_level >= 3 ? 'Urgente' : log.alert_level === 2 ? 'Moderado' : 'Normal'}
                      </Text>
                    </View>
                  </View>

                  {/* Summary */}
                  {log.summary ? (
                    <Text style={s.summary}>{log.summary}</Text>
                  ) : null}

                  {/* Topics */}
                  {log.main_topics?.length > 0 && (
                    <View style={s.topicsRow}>
                      {log.main_topics.slice(0, 3).map((topic, i) => (
                        <View key={i} style={s.topicChip}>
                          <Text style={s.topicText}>{topic}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Footer: message count + follow-up */}
                  <View style={s.cardFooter}>
                    <View style={s.footerItem}>
                      <ChatIcon c={MUTED} />
                      <Text style={s.footerText}>{log.message_count ?? 0} mensajes</Text>
                    </View>
                    {log.requires_follow_up && (
                      <View style={[s.followChip, { backgroundColor: YELLOW + '22' }]}>
                        <Text style={[s.followText, { color: YELLOW }]}>Requiere seguimiento</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(BG: string, CARD: string, PRIMARY: string, MUTED: string, MUTED_BG: string, GREEN: string, RED: string, YELLOW: string) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingBottom: 12,
      borderBottomWidth: 1, borderBottomColor: MUTED_BG,
    },
    title:    { flex: 1, fontSize: 17, fontFamily: FONT.displayBold, color: PRIMARY },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center' },

    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
    errorText:   { fontSize: 14, fontFamily: FONT.sansRegular, color: RED, textAlign: 'center' },
    emptyText:   { fontSize: 15, fontFamily: FONT.sansBold, color: PRIMARY, textAlign: 'center', marginTop: 12 },
    emptySubText:{ fontSize: 13, fontFamily: FONT.sansRegular, color: MUTED, textAlign: 'center' },
    retryBtn:    { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4 },
    retryText:   { fontSize: 14, fontFamily: FONT.sansBold },

    list: { padding: 20, gap: 14, paddingBottom: 40 },
    card: {
      backgroundColor: CARD, borderRadius: 20, padding: 16, gap: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    cardTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText:   { fontSize: 12, fontFamily: FONT.sansMedium, color: MUTED },
    alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    alertText:  { fontSize: 11, fontFamily: FONT.sansBold },

    summary: { fontSize: 14, fontFamily: FONT.sansRegular, color: PRIMARY, lineHeight: 20 },

    topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    topicChip: { backgroundColor: MUTED_BG, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    topicText: { fontSize: 11, fontFamily: FONT.sansMedium, color: MUTED },

    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    footerText: { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED },
    followChip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    followText: { fontSize: 11, fontFamily: FONT.sansBold },
  });
}
