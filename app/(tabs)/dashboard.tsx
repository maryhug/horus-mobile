import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import type { DashboardData } from '../../types/api';
import { HealthRing, MetricChips } from '../../components/HealthRing';
import type { HealthMetric } from '../../components/HealthRing';
import { Image } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAssistant } from '../../hooks/useAssistant';
import { useLanguage } from '../../contexts/LanguageContext';
import type { T } from '../../contexts/LanguageContext';

// ── Local UI types ─────────────────────────────────────────────────────────
type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type StatusItem = {
  icon:  IoniconsName;
  label: string;
  value: string;
  sub:   string;
  color: string;
};

type QuickAction = {
  icon:  IoniconsName;
  label: string;
  color: string;
  route: Href;
};

// ASSIST_BG se calcula dinámicamente dentro del componente

function buildMetrics(t: T, health?: DashboardData['health']): HealthMetric[] {
  return [
    { key: 'heart',    label: t.dashMetricHeart,    value: health?.heartRate       ?? '—', unit: 'bpm',                icon: 'heart',      color: 'pink'   },
    { key: 'steps',    label: t.dashMetricSteps,    value: health?.steps           ?? '—', unit: t.dashMetricStepsUnit, icon: 'footprints', color: 'blue'   },
    { key: 'calories', label: t.dashMetricCalories, value: health?.calories        ?? '—', unit: 'kcal',               icon: 'flame',      color: 'yellow' },
    { key: 'activity', label: t.dashMetricActivity, value: health?.activityMinutes ?? '—', unit: 'min',                icon: 'activity',   color: 'green'  },
  ];
}

function RingCard({ metrics, score }: { metrics: HealthMetric[]; score: string }) {
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
        metrics={metrics}
        score={score}
        selectedKey={selectedKey}
        onSelectKey={setSelectedKey}
      />
      <MetricChips metrics={metrics} selectedKey={selectedKey} />
    </View>
  );
}


export default function DashboardScreen() {
  const { BG, CARD, PRIMARY, MUTED, GREEN, YELLOW, BLUE, PINK, isDark, toggleTheme } = useAppTheme();
  const ASSIST_BG = isDark ? '#2D1520' : '#FAECEA';
  const s = React.useMemo(() => makeStyles(BG, CARD, PRIMARY, MUTED, GREEN, PINK, YELLOW, BLUE, ASSIST_BG), [isDark]);

  const { user } = useAuth();
  const { assistant } = useAssistant();
  const { t } = useLanguage();
  const livePulse  = useRef(new Animated.Value(1)).current;

  const { data, refetch } = useApi<DashboardData>(
    () => apiClient.get<DashboardData>('/dashboard/info').then(r => r.data)
  );

  // health y metrics DESPUÉS de data para que no sean siempre null
  const health  = data?.health ?? null;
  const metrics = React.useMemo(() => buildMetrics(t, health), [t, health]);

  const [mockLoading, setMockLoading] = useState(false);
  const handleMockData = useCallback(async () => {
    setMockLoading(true);
    try {
      await apiClient.post('/wearable/mock', {});
      await refetch();
    } catch { /* silently ignore */ } finally {
      setMockLoading(false);
    }
  }, [refetch]);

  // Refresh manual (muestra spinner) vs auto-poll silencioso
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const handleManualRefresh = useCallback(async () => {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }, [refetch]);

  // Auto-poll silencioso cada 15s — sin spinner
  useEffect(() => {
    const id = setInterval(refetch, 15_000);
    return () => clearInterval(id);
  }, [refetch]);

  // Barras de actividad: normalizar 24 valores a rango [8, 80]
  const barHeights = React.useMemo(() => {
    const raw = data?.hourlyActivity;
    if (!raw || raw.length < 24) return Array.from({ length: 24 }, (_, i) => 8 + ((i * 37 + 19) % 40));
    const max = Math.max(...raw, 1);
    return raw.map(v => Math.round(8 + (v / max) * 72));
  }, [data?.hourlyActivity]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const syncTime = React.useMemo(() => {
    if (!data?.timestamp) return '—';
    const d = new Date(data.timestamp);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'pm' : 'am'}`;
  }, [data?.timestamp]);

  const batteryVal = health?.battery != null ? `${health.battery}%` : '—';
  const statusItems = React.useMemo<StatusItem[]>(() => [
    { icon: 'hardware-chip-outline', label: t.dashDevice,   value: data ? 'Online' : '—', sub: 'v2.4.1', color: GREEN },
    { icon: 'battery-half-outline',  label: t.dashBattery,  value: batteryVal,                 sub: '',       color: PINK  },
    { icon: 'time-outline',          label: t.dashLastSync, value: syncTime,                   sub: t.dashToday, color: BLUE },
  ], [t, data, syncTime, batteryVal, GREEN, PINK, BLUE]);

  const quickActions = React.useMemo<QuickAction[]>(() => [
    { icon: 'qr-code-outline',     label: t.dashQrId,    color: PINK,   route: '/(tabs)/qr-medico' },
    { icon: 'chatbubble-outline',  label: t.dashAI,      color: BLUE,   route: '/(tabs)/assistant' },
    { icon: 'folder-open-outline', label: t.dashFiles,   color: YELLOW, route: '/(tabs)/files'     },
    { icon: 'person-outline',      label: t.dashProfile, color: GREEN,  route: '/(tabs)/profile'   },
  ], [t, PINK, BLUE, YELLOW, GREEN]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.greetingMorning : hour < 18 ? t.greetingAfternoon : t.greetingEvening;
  const firstName = user?.firstName ?? 'usuario';

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={handleManualRefresh} tintColor={GREEN} />}
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
              <Text style={s.liveText}>{t.dashLive}</Text>
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
            <Image source={assistant.image} style={{ width: 44, height: 44 }} resizeMode="contain" />
          </View>
          <View style={s.assistantText}>
            <Text style={s.assistantName}>{t.dashHelloIm} {assistant.name}</Text>
            <Text style={s.assistantTagline} numberOfLines={1}>
              {assistant.tagline}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={MUTED} />
        </TouchableOpacity>

        {/* ── Metrics ring ────────────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{t.dashMetrics}</Text>
          {health ? (
            <TouchableOpacity
              style={[s.sensorPill, { backgroundColor: GREEN + '33', flexDirection: 'row', alignItems: 'center' }]}
              onPress={handleMockData}
              activeOpacity={0.7}
              disabled={mockLoading}
            >
              {mockLoading ? (
                <ActivityIndicator size={10} color={GREEN} />
              ) : (
                <>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN, marginRight: 5, flexShrink: 0 }} />
                  <Text style={[s.sensorText, { color: GREEN }]} numberOfLines={1}>
                    {health.updatedAt ? (() => {
                      const d = new Date(health.updatedAt);
                      const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
                      return `${h % 12 || 12}:${m} ${h >= 12 ? 'pm' : 'am'}`;
                    })() : 'Reloj'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.sensorPill} onPress={handleMockData} activeOpacity={0.7} disabled={mockLoading}>
              {mockLoading
                ? <ActivityIndicator size={10} />
                : <Text style={s.sensorText}>{t.dashWaitingSensor}</Text>}
            </TouchableOpacity>
          )}
        </View>

        <RingCard metrics={metrics} score={health?.score != null ? String(health.score) : '—'} />

        {/* ── Device status row ────────────────────────────────────────── */}
        <View style={s.statusRow}>
          {statusItems.map(item => (
            <View key={item.label} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: item.color + '55' }]}>
                <Ionicons name={item.icon} size={20} color={PRIMARY} />
              </View>
              <Text style={s.statLabel}>{item.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                <Text style={s.statValue}>{item.value}</Text>
                {!!item.sub && <Text style={s.statSub}>{item.sub}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* ── Activity 24h ─────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.chartHeader}>
            <Text style={s.sectionTitle}>{t.dashActivity}</Text>
            {data?.hourlyActivity && data.hourlyActivity.some(v => v > 0) ? (
              <View style={[s.sensorPill, { backgroundColor: GREEN + '22' }]}>
                <Text style={[s.sensorText, { color: GREEN }]}>
                  {data.hourlyActivity.reduce((a, b) => a + b, 0).toLocaleString()} {t.dashMetricStepsUnit}
                </Text>
              </View>
            ) : (
              <View style={s.sensorPill}>
                <Text style={s.sensorText}>{t.dashNoDataSensor}</Text>
              </View>
            )}
          </View>
          <View style={s.bars}>
            {barHeights.map((h, i) => (
              <View key={i} style={[s.bar, { height: h, opacity: h <= 8 ? 0.35 : 1 }]} />
            ))}
          </View>
          <View style={s.chartLabels}>
            {['00h', '06h', '12h', '18h', '24h'].map(t => (
              <Text key={t} style={s.chartLabel}>{t}</Text>
            ))}
          </View>
        </View>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <Text style={[s.sectionTitle, { marginBottom: 14 }]}>{t.dashQuickActions}</Text>
        <View style={s.quickRow}>
          {quickActions.map(item => (
            <TouchableOpacity
              key={item.label}
              style={s.quickItem}
              onPress={() => router.push(item.route)}
              activeOpacity={0.82}
            >
              <View style={[s.quickIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={22} color="#1A1512" />
              </View>
              <Text style={s.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
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

  });
}
