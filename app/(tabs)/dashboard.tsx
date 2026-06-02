import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import { AppColors } from '../../constants/colors';
import { HorusIcon } from '../../assets/icons';
import { AppHeader } from '../../components/AppHeader';
import type { DashboardData } from '../../types/api';

const { width: W } = Dimensions.get('window');
const PAD = 20;
const GAP = 12;
const HALF = (W - PAD * 2 - GAP) / 2;
const TAB_H = 72;
const CHART_H = 120;
const BAR_HOURS = ['00:00', '06:00', '12:00', '18:00', '24:00'];

// Metric cards — palette from the new brand colors
const METRICS = [
  { key: 'heart',  icon: 'heart'    as const, bg: '#FCE0EC', accent: '#C0507A', label: 'Frecuencia\ncardíaca', unit: 'bpm'   },
  { key: 'steps',  icon: 'steps'    as const, bg: '#DAEAF4', accent: '#4A7898', label: 'Pasos\nhoy',           unit: 'pasos' },
  { key: 'cal',    icon: 'calories' as const, bg: '#FDE8D4', accent: '#C0700A', label: 'Calorías\nquemadas',   unit: 'kcal'  },
  { key: 'pulse',  icon: 'pulse'    as const, bg: '#DFF0CC', accent: '#6A924E', label: 'Actividad\nfísica',    unit: 'min'   },
];

function sh(op = 0.10, r = 16, y = 5): object {
  return { shadowColor: '#000', shadowOffset: { width: 0, height: y }, shadowOpacity: op, shadowRadius: r, elevation: Math.round(op * 45) };
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    safe:    { flex: 1, backgroundColor: c.background },
    scroll:  { paddingHorizontal: PAD, paddingBottom: TAB_H + 8 },

    // ── Hero greeting — compact, not redundant with nav ──
    heroWrap: {
      marginBottom: 18,
      paddingTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroLeft: { flex: 1 },
    heroGreet: { fontSize: 22, fontWeight: '900', color: c.textPrimary, lineHeight: 28 },
    heroGreetAccent: { color: c.accent },
    heroSub:  { fontSize: 12, color: c.textSecondary, marginTop: 3 },
    heroPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(46,158,86,0.13)',
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    },
    heroPillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2E9E56' },
    heroPillTxt: { fontSize: 11, color: '#2E9E56', fontWeight: '700' },

    // ── Section label ──
    sectionLabel: { fontSize: 16, fontWeight: '800', color: c.textPrimary, marginBottom: 10 },

    // ── Status cards ──
    statusRow:  { flexDirection: 'row', gap: GAP, marginBottom: GAP },
    statusCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: 24, padding: 18,
      ...sh(0.08, 14, 4),
    },
    statusFull: {
      backgroundColor: c.surface, borderRadius: 24, padding: 18,
      marginBottom: GAP, ...sh(0.08, 14, 4),
    },
    statusHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    statusLabel: { fontSize: 12, color: c.textSecondary, fontWeight: '600' },
    iconBubble: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    onlineRow:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
    onlineDot:  { width: 9, height: 9, borderRadius: 5, backgroundColor: '#2E9E56' },
    statusVal:  { fontSize: 22, fontWeight: '800', color: c.textPrimary },
    statusValLg:{ fontSize: 30, fontWeight: '900', color: c.textPrimary },
    statusSub:  { fontSize: 11, color: c.textSecondary, marginTop: 3 },
    battTrack:  { height: 6, backgroundColor: c.grey10, borderRadius: 3, marginVertical: 10, overflow: 'hidden' },
    battFill:   { height: '100%', backgroundColor: c.accent, borderRadius: 3 },
    syncBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(46,158,86,0.13)', borderRadius: 10,
      paddingHorizontal: 8, paddingVertical: 3,
    },
    syncBadgeTxt: { fontSize: 11, color: '#2E9E56', fontWeight: '700' },
    syncRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },

    // ── Metric grid ──
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginBottom: GAP },
    metricCard: { width: HALF, borderRadius: 26, padding: 20, minHeight: 150, ...sh(0.12, 18, 5) },
    metricIconBubble: {
      width: 46, height: 46, borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.5)',
      justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    },
    metricLabel: { fontSize: 13, fontWeight: '600', lineHeight: 18, marginBottom: 10, color: 'rgba(20,18,40,0.65)' },
    metricValRow:{ flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    metricVal:   { fontSize: 32, fontWeight: '900' },
    metricUnit:  { fontSize: 13, fontWeight: '600', color: 'rgba(20,18,40,0.55)' },

    // ── Chart card ──
    chartCard: {
      backgroundColor: c.surface, borderRadius: 26, padding: 20,
      marginBottom: GAP, ...sh(0.08, 14, 4),
    },
    chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    chartTitle: { fontSize: 16, fontWeight: '800', color: c.textPrimary },
    chartSub:   { fontSize: 12, color: c.textSecondary, marginTop: 3 },
    livePill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.accent10, borderRadius: 12,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
    liveTxt:   { fontSize: 11, color: c.accent, fontWeight: '800' },
    chartEmpty:{ height: CHART_H, justifyContent: 'center', alignItems: 'center', gap: 8 },
    chartEmptyTxt: { color: c.textMuted, fontSize: 13 },
    xLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    xLabel:  { fontSize: 10, color: c.textMuted },

    // ── Alerts card ──
    alertsCard: {
      backgroundColor: c.surface, borderRadius: 26, padding: 20,
      ...sh(0.08, 14, 4),
    },
    alertsHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    alertsTitle: { fontSize: 18, fontWeight: '800', color: c.textPrimary },
    emptyBubble: {
      width: 58, height: 58, borderRadius: 29,
      backgroundColor: c.grey10, justifyContent: 'center', alignItems: 'center',
      marginBottom: 8,
    },
    emptyTxt: { color: c.textMuted, fontSize: 13 },

    // ── Error ──
    errCard: {
      backgroundColor: c.surface, borderRadius: 26, padding: 24,
      alignItems: 'center', gap: 10, marginBottom: GAP, ...sh(0.08, 14, 4),
    },
    errTxt: { color: c.textSecondary, fontSize: 14, textAlign: 'center' },

    // ── Decorative accent pill on metric card ──
    metricBadge: {
      position: 'absolute', top: 14, right: 14,
      backgroundColor: 'rgba(255,255,255,0.35)',
      borderRadius: 10, width: 28, height: 28,
      justifyContent: 'center', alignItems: 'center',
    },
  });
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();

  const { data, loading, error, refetch } = useApi<DashboardData>(
    () => apiClient.get<DashboardData>('/dashboard/info').then(r => r.data)
  );

  const syncTime = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
      >
        {/* ── Hero greeting — compact ── */}
        <View style={s.heroWrap}>
          <View style={s.heroLeft}>
            <Text style={s.heroGreet}>
              {user ? `Hola, ` : 'Bienvenido/a '}
              <Text style={s.heroGreetAccent}>
                {user ? (user.firstName ?? 'Usuario') : ''}
              </Text>
              {''}
            </Text>
            <Text style={s.heroSub}>Panel de control · datos en tiempo real</Text>
          </View>
          <View style={s.heroPill}>
            <View style={s.heroPillDot} />
            <Text style={s.heroPillTxt}>LIVE</Text>
          </View>
        </View>

        {/* ── Error ── */}
        {error && (
          <View style={s.errCard}>
            <HorusIcon name="cloud-offline" size={32} color={colors.textMuted} />
            <Text style={s.errTxt}>{error}</Text>
            <TouchableOpacity onPress={refetch}>
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Status: Dispositivo + Batería ── */}
        <Text style={s.sectionLabel}>Estado del dispositivo</Text>
        <View style={s.statusRow}>
          <View style={s.statusCard}>
            <View style={s.statusHead}>
              <Text style={s.statusLabel}>Dispositivo</Text>
              <View style={[s.iconBubble, { backgroundColor: '#D6E4FF' }]}>
                <HorusIcon name="wifi" size={16} color="#3B6CF7" />
              </View>
            </View>
            <View style={s.onlineRow}>
              <View style={s.onlineDot} />
              <Text style={s.statusVal}>{loading ? '...' : data ? 'Online' : '—'}</Text>
            </View>
            <Text style={s.statusSub}>{user?.nfcTagId ? `ID: ${user.nfcTagId}` : 'HRS-MBL · v2.4.1'}</Text>
          </View>

          <View style={s.statusCard}>
            <View style={s.statusHead}>
              <Text style={s.statusLabel}>Batería</Text>
              <View style={[s.iconBubble, { backgroundColor: '#C9F0D8' }]}>
                <HorusIcon name="battery-charging" size={16} color="#1E8A47" />
              </View>
            </View>
            <Text style={[s.statusVal, { color: colors.textMuted }]}>—</Text>
            <View style={s.battTrack}>
              <View style={[s.battFill, { width: '0%' }]} />
            </View>
            <Text style={s.statusSub}>Sin datos</Text>
          </View>
        </View>

        {/* ── Sincronización ── */}
        <View style={s.statusFull}>
          <View style={s.statusHead}>
            <Text style={s.statusLabel}>Última sincronización</Text>
            <View style={[s.iconBubble, { backgroundColor: '#FFECC6' }]}>
              <HorusIcon name="clock" size={16} color="#D98F00" />
            </View>
          </View>
          <View style={s.syncRow}>
            <Text style={s.statusValLg}>
              {loading ? <ActivityIndicator size="small" color={colors.accent} /> : syncTime}
            </Text>
            {data && (
              <View style={s.syncBadge}>
                <HorusIcon name="check-circle" size={14} color="#2E9E56" />
                <Text style={s.syncBadgeTxt}>Exitoso</Text>
              </View>
            )}
          </View>
          <Text style={s.statusSub}>
            {data?.timestamp
              ? new Date(data.timestamp).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
              : 'Hoy'}
          </Text>
        </View>

        {/* ── Métricas de salud ── */}
        <Text style={s.sectionLabel}>Métricas de salud</Text>
        <View style={s.metricGrid}>
          {METRICS.map(m => (
            <View key={m.key} style={[s.metricCard, { backgroundColor: m.bg }]}>
              <View style={s.metricIconBubble}>
                <HorusIcon name={m.icon} size={26} color={m.accent} />
              </View>
              <Text style={s.metricLabel}>{m.label}</Text>
              <View style={s.metricValRow}>
                <Text style={[s.metricVal, { color: m.accent }]}>—</Text>
                <Text style={s.metricUnit}>{m.unit}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Gráfica de actividad ── */}
        <Text style={s.sectionLabel}>Actividad · 24h</Text>
        <View style={s.chartCard}>
          <View style={s.chartHead}>
            <View>
              <Text style={s.chartTitle}>Actividad de las últimas 24h</Text>
              <Text style={s.chartSub}>Sin datos del sensor aún</Text>
            </View>
            <View style={s.livePill}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>LIVE</Text>
            </View>
          </View>
          <View style={s.chartEmpty}>
            <HorusIcon name="statistics" size={44} color={colors.textMuted} />
            <Text style={s.chartEmptyTxt}>Conecta tu manilla para ver datos</Text>
          </View>
          <View style={s.xLabels}>
            {BAR_HOURS.map((h, i) => <Text key={i} style={s.xLabel}>{h}</Text>)}
          </View>
        </View>

        {/* ── Alertas ── */}
        <Text style={s.sectionLabel}>Alertas recientes</Text>
        <View style={s.alertsCard}>
          <View style={s.alertsHead}>
            <HorusIcon name="shield-check" size={22} color={colors.accent} />
            <Text style={s.alertsTitle}>Sin alertas</Text>
          </View>
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <View style={s.emptyBubble}>
              <HorusIcon name="bell-off" size={28} color={colors.textMuted} />
            </View>
            <Text style={s.emptyTxt}>Todo está en orden por ahora</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
