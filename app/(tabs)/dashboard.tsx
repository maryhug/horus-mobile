import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import type { DashboardData } from '../../types/api';
import { HealthRing, MetricChips } from '../../components/HealthRing';
import type { HealthMetric } from '../../components/HealthRing';
import { EmotionShape } from '../../components/EmotionShape';
import { useAppTheme } from '../../hooks/useAppTheme';

const ASSIST_BG = '#FAECEA';

const STATIC_METRICS: HealthMetric[] = [
  { key: 'heart',     label: 'Frecuencia cardíaca', value: '—', unit: 'bpm',   icon: 'heart',      color: 'pink'   },
  { key: 'steps',     label: 'Pasos',               value: '—', unit: 'pasos', icon: 'footprints', color: 'blue'   },
  { key: 'calories',  label: 'Calorías',             value: '—', unit: 'kcal',  icon: 'flame',      color: 'yellow' },
  { key: 'activity',  label: 'Actividad',            value: '—', unit: 'min',   icon: 'activity',   color: 'green'  },
];

// Ring + chips with shared selected state
function RingCard() {
  const { CARD, PRIMARY } = useAppTheme();
  const cardStyle = {
    backgroundColor: CARD, borderRadius: 32,
    padding: 16, paddingBottom: 20,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 3,
  };
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  return (
    <View style={cardStyle}>
      <HealthRing
        metrics={STATIC_METRICS}
        score="—"
        selectedKey={selectedKey}
        onSelectKey={setSelectedKey}
      />
      <MetricChips metrics={STATIC_METRICS} selectedKey={selectedKey} />
    </View>
  );
}

// Stable bar heights for the 24h chart
const BAR_HEIGHTS = Array.from({ length: 24 }, (_, i) => 8 + ((i * 37 + 19) % 60));

export default function DashboardScreen() {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, BLUE, PINK, RED, RED_BG, isDark, toggleTheme } = useAppTheme();
  const s = React.useMemo(() => makeStyles(BG, CARD, PRIMARY, MUTED, GREEN, PINK, YELLOW, BLUE, ASSIST_BG), [isDark]);

  const { user } = useAuth();
  const livePulse  = useRef(new Animated.Value(1)).current;
  const blobFloat  = useRef(new Animated.Value(0)).current;

  const { data, loading, refetch } = useApi<DashboardData>(
    () => apiClient.get<DashboardData>('/dashboard/info').then(r => r.data)
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Blob float: sube y baja 8px cada 3s (igual que animate-float-soft del diseño original)
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobFloat, { toValue: -8, duration: 1500, useNativeDriver: true }),
        Animated.timing(blobFloat, { toValue:  0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const syncTime = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '10:42';

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.firstName ?? 'usuario';

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={GREEN} />}
      >

        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting},</Text>
            <Text style={s.name}>{firstName}</Text>
          </View>
          <View style={s.headerRight}>
            <View style={s.livePill}>
              <Animated.View style={[s.liveDot, { transform: [{ scale: livePulse }] }]} />
              <Text style={s.liveText}>En vivo</Text>
            </View>
            <TouchableOpacity style={s.themeBtn} onPress={toggleTheme}>
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={MUTED} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Assistant strip ──────────────────────────────────────────── */}
        <TouchableOpacity
          style={s.assistantStrip}
          onPress={() => router.push('/(tabs)/assistant')}
          activeOpacity={0.85}
        >
          <View style={s.assistantAvatarWrap}>
            <EmotionShape kind="blob" color="pink" size={44} eyes />
          </View>
          <View style={s.assistantText}>
            <Text style={s.assistantName}>Hola, soy Zarita</Text>
            <Text style={s.assistantTagline} numberOfLines={1}>
              Siempre alegre, curiosa y valiente.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={MUTED} />
        </TouchableOpacity>

        {/* ── Metrics ring ────────────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Tus métricas</Text>
          <View style={s.sensorPill}>
            <Text style={s.sensorText}>Esperando sensor</Text>
          </View>
        </View>

        <RingCard />

        {/* ── Device status row ────────────────────────────────────────── */}
        <View style={s.statusRow}>
          {[
            { icon: 'hardware-chip-outline', label: 'Dispositivo', value: loading ? '...' : 'Online', sub: 'v2.4.1',    color: GREEN },
            { icon: 'battery-half-outline',  label: 'Batería',     value: '—',                        sub: 'sin datos', color: PINK  },
            { icon: 'time-outline',          label: 'Última sync', value: syncTime,                   sub: 'hoy',       color: BLUE  },
          ].map(item => (
            <View key={item.label} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: item.color + '55' }]}>
                <Ionicons name={item.icon as any} size={20} color={PRIMARY} />
              </View>
              <Text style={s.statLabel}>{item.label}</Text>
              <Text style={s.statValue}>{item.value}</Text>
              <Text style={s.statSub}>{item.sub}</Text>
            </View>
          ))}
        </View>

        {/* ── Activity 24h ─────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.chartHeader}>
            <Text style={s.sectionTitle}>Actividad 24h</Text>
            <View style={s.sensorPill}>
              <Text style={s.sensorText}>Sin datos</Text>
            </View>
          </View>
          <View style={s.bars}>
            {BAR_HEIGHTS.map((h, i) => (
              <View key={i} style={[s.bar, { height: h }]} />
            ))}
          </View>
          <View style={s.chartLabels}>
            {['00h', '06h', '12h', '18h', '24h'].map(t => (
              <Text key={t} style={s.chartLabel}>{t}</Text>
            ))}
          </View>
        </View>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <Text style={[s.sectionTitle, { marginBottom: 14 }]}>Acciones rápidas</Text>
        <View style={s.quickRow}>
          {[
            { icon: 'qr-code-outline',     label: 'ID Médico', color: PINK,   route: '/(tabs)/qr-medico' },
            { icon: 'chatbubble-outline',  label: 'IA',        color: BLUE,   route: '/(tabs)/assistant' },
            { icon: 'folder-open-outline', label: 'Archivos',  color: YELLOW, route: '/(tabs)/files'     },
            { icon: 'person-outline',      label: 'Perfil',    color: GREEN,  route: '/(tabs)/profile'   },
          ].map(item => (
            <TouchableOpacity
              key={item.label}
              style={s.quickItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.82}
            >
              <View style={[s.quickIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={22} color={PRIMARY} />
              </View>
              <Text style={s.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Alerts ───────────────────────────────────────────────────── */}
        <Text style={[s.sectionTitle, { marginBottom: 12 }]}>Alertas recientes</Text>
        <View style={[s.card, s.alertEmpty]}>
          <Animated.View style={{ transform: [{ translateY: blobFloat }] }}>
            <EmotionShape kind="blob" color="green" size={64} eyes />
          </Animated.View>
          <Text style={s.alertTitle}>Todo en orden</Text>
          <Text style={s.alertSub}>No hay alertas del sistema</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(
  BG: string, CARD: string, PRIMARY: string, MUTED: string,
  GREEN: string, PINK: string, YELLOW: string, BLUE: string, ASSIST_BG: string,
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 16 },

    // Header
    header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    greeting:    { fontSize: 14, fontWeight: '500', color: MUTED },
    name:        { fontSize: 26, fontWeight: '800', color: PRIMARY, letterSpacing: -0.5 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    livePill: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: CARD, borderRadius: 999,
      paddingHorizontal: 12, paddingVertical: 7,
      shadowColor: PRIMARY, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    },
    liveDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
    liveText: { fontSize: 12, fontWeight: '700', color: PRIMARY },
    themeBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: CARD, alignItems: 'center', justifyContent: 'center',
      shadowColor: PRIMARY, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    },

    // Assistant strip
    assistantStrip: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: ASSIST_BG, borderRadius: 24,
      padding: 12, paddingRight: 16,
      shadowColor: PRIMARY, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    },
    assistantAvatarWrap: {
      width: 52, height: 52,
      borderRadius: 26,
      backgroundColor: PINK + '30',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    assistantText:    { flex: 1, minWidth: 0 },
    assistantName:    { fontSize: 15, fontWeight: '700', color: PRIMARY },
    assistantTagline: { fontSize: 12, color: MUTED, marginTop: 1 },

    // Section header
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle:  { fontSize: 17, fontWeight: '700', color: PRIMARY, letterSpacing: -0.3 },
    sensorPill: {
      backgroundColor: 'rgba(136,130,110,0.12)',
      borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    },
    sensorText: { fontSize: 11, fontWeight: '600', color: MUTED },

    // Card
    card: {
      backgroundColor: CARD, borderRadius: 32,
      padding: 16, paddingBottom: 20,
      shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 16, elevation: 3,
    },

    // Device status
    statusRow: { flexDirection: 'row', gap: 10 },
    statCard: {
      flex: 1, backgroundColor: CARD, borderRadius: 24, padding: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    statIcon: {
      width: 40, height: 40, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    statLabel: { fontSize: 11, color: MUTED, fontWeight: '500', marginBottom: 2 },
    statValue: { fontSize: 16, fontWeight: '800', color: PRIMARY, lineHeight: 20 },
    statSub:   { fontSize: 10, color: MUTED, marginTop: 2 },

    // Chart
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    bars: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 2 },
    bar:  { flex: 1, backgroundColor: 'rgba(136,130,110,0.2)', borderRadius: 4 },
    chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    chartLabel:  { fontSize: 10, color: MUTED, fontWeight: '500' },

    // Quick actions
    quickRow:  { flexDirection: 'row', gap: 10 },
    quickItem: { flex: 1, alignItems: 'center', gap: 8 },
    quickIcon: {
      width: '100%',
      height: 58,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickLabel: { fontSize: 11, fontWeight: '600', color: PRIMARY, textAlign: 'center' },

    // Alerts
    alertEmpty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    alertTitle: { fontSize: 14, fontWeight: '600', color: PRIMARY },
    alertSub:   { fontSize: 12, color: MUTED },
  });
}
