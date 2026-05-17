import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import { AppColors } from '../../constants/colors';
import type { DashboardData } from '../../types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 20;
const CARD_GAP = 12;
const METRIC_W = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2;
const CHART_H = 140;

// Static bar data — TODO: reemplazar con datos reales de sensor si el API los expone
const BAR_DATA = [30, 52, 44, 68, 38, 76, 58, 88, 72, 84, 62, 92, 68, 85, 70, 90, 66, 83, 75, 94, 78, 91, 86, 95];
const BAR_HOURS = ['00:00', '06:00', '12:00', '18:00', '24:00'];

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: H_PAD,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    brandIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.accent10,
      borderWidth: 1,
      borderColor: c.accent20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    brandName: { color: c.accent, fontSize: 14, fontWeight: '800', letterSpacing: 1.5, lineHeight: 17 },
    brandSub: { color: c.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 2, lineHeight: 12 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surfaceElevated,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.accentDark,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

    scroll: { paddingHorizontal: H_PAD, paddingBottom: 28 },

    titleSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingTop: 20,
      marginBottom: 20,
    },
    titleLeft: { flex: 1 },
    pageTitle: { fontSize: 30, fontWeight: '800', color: c.textPrimary, lineHeight: 36, marginBottom: 6 },
    pageTitleAccent: { color: c.accent },
    pageSubtitle: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },
    syncPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.accent10,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 6,
      marginLeft: 12,
    },
    syncDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.accent },
    syncLabel: { color: c.accent, fontSize: 11, fontWeight: '700' },

    statusRow: { flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP },
    statusCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
    },
    statusCardHalf: { flex: 1 },
    statusCardFull: { marginBottom: CARD_GAP },
    statusCardHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    statusCardLabel: { fontSize: 12, color: c.textSecondary, fontWeight: '500', flex: 1 },
    smallBadge: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
    onlineDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: c.success },
    statusValue: { fontSize: 22, fontWeight: '700', color: c.textPrimary },
    statusValueLg: { fontSize: 26, fontWeight: '800', color: c.textPrimary },
    statusSub: { fontSize: 11, color: c.textSecondary, marginTop: 4 },
    batteryTrack: { height: 5, backgroundColor: c.border, borderRadius: 3, marginVertical: 10, overflow: 'hidden' },
    batteryFill: { height: '100%', backgroundColor: c.accent, borderRadius: 3 },
    syncRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
    syncOkBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(76, 175, 80, 0.12)',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    syncOkText: { fontSize: 11, color: c.success, fontWeight: '600' },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 12 },

    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, marginBottom: 20 },
    metricCard: {
      width: METRIC_W,
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
    },
    metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    metricIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    changeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: 'rgba(76, 175, 80, 0.12)',
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    changeText: { fontSize: 11, color: c.success, fontWeight: '700' },
    metricLabel: { fontSize: 12, color: c.textSecondary, marginBottom: 8, lineHeight: 16 },
    metricBottom: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    metricValue: { fontSize: 26, fontWeight: '800', color: c.textPrimary },
    metricUnit: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },

    chartCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 20,
    },
    chartHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    chartTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
    chartSub: { fontSize: 12, color: c.textSecondary, marginTop: 3 },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.accent10,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 5,
      gap: 5,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
    liveLabel: { fontSize: 11, color: c.accent, fontWeight: '700' },
    barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, flex: 1 },
    barCol: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', height: CHART_H },
    bar: { width: '100%', backgroundColor: c.accent, borderRadius: 3, opacity: 0.7, minHeight: 4 },
    xLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    xLabel: { fontSize: 10, color: c.textMuted },

    alertsCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
    },
    alertsHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    alertsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    alertsTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
    seeAll: { fontSize: 13, color: c.accent, fontWeight: '600' },
    alertRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    alertDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
    alertBody: { flex: 1 },
    alertTitle: { fontSize: 14, color: c.textPrimary, fontWeight: '500', lineHeight: 20, marginBottom: 3 },
    alertTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    alertTime: { fontSize: 12, color: c.textMuted },

    // Loading skeleton
    skeletonBlock: { backgroundColor: c.surfaceElevated, borderRadius: 8 },
    errorCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      gap: 10,
      marginBottom: CARD_GAP,
    },
    errorText: { color: c.textSecondary, fontSize: 14, textAlign: 'center' },
  });
}

type MetricProps = { icon: string; iconColor: string; label: string; value: string; unit: string; change: string };
type AlertProps = { dotColor: string; title: string; time: string; isLocation?: boolean };

export default function DashboardScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const maxBar = Math.max(...BAR_DATA);

  const { data, loading, error, refetch } = useApi<DashboardData>(
    () => apiClient.get<DashboardData>('/dashboard/info').then(r => r.data)
  );

  const avatarInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'HB'
    : 'HB';

  const syncTime = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—';

  function MetricCard({ icon, iconColor, label, value, unit, change }: MetricProps) {
    return (
      <View style={styles.metricCard}>
        <View style={styles.metricTop}>
          <View style={[styles.metricIcon, { backgroundColor: iconColor + '28' }]}>
            <Ionicons name={icon as any} size={20} color={iconColor} />
          </View>
          <View style={styles.changeBadge}>
            <Ionicons name="trending-up" size={11} color={colors.success} />
            <Text style={styles.changeText}>{change}</Text>
          </View>
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={styles.metricBottom}>
          <Text style={styles.metricValue}>{value}</Text>
          <Text style={styles.metricUnit}>{unit}</Text>
        </View>
      </View>
    );
  }

  function AlertRow({ dotColor, title, time, isLocation }: AlertProps) {
    return (
      <View style={styles.alertRow}>
        <View style={[styles.alertDot, { backgroundColor: dotColor }]} />
        <View style={styles.alertBody}>
          <Text style={styles.alertTitle}>{title}</Text>
          <View style={styles.alertTimeRow}>
            {isLocation && <Ionicons name="location-outline" size={12} color={colors.textMuted} />}
            <Text style={styles.alertTime}>{time}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.brandIcon}>
            <Ionicons name="watch-outline" size={18} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.brandName}>HORUS</Text>
            <Text style={styles.brandSub}>BRASLET</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleTheme}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />
        }
      >
        <View style={styles.titleSection}>
          <View style={styles.titleLeft}>
            <Text style={styles.pageTitle}>
              Panel de{'\n'}<Text style={styles.pageTitleAccent}>control</Text>
            </Text>
            <Text style={styles.pageSubtitle}>
              {user
                ? `Bienvenido/a, ${user.firstName ?? user.email}`
                : 'Información en tiempo real de tu manilla Horus'}
            </Text>
          </View>
          <View style={styles.syncPill}>
            <View style={styles.syncDot} />
            <Text style={styles.syncLabel}>En vivo</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refetch}>
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statusRow}>
          <View style={[styles.statusCard, styles.statusCardHalf]}>
            <View style={styles.statusCardHead}>
              <Text style={styles.statusCardLabel}>Dispositivo</Text>
              <View style={[styles.smallBadge, { backgroundColor: colors.accent10 }]}>
                <Ionicons name="wifi" size={14} color={colors.accent} />
              </View>
            </View>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusValue}>{loading ? '...' : data ? 'Online' : 'Sin datos'}</Text>
            </View>
            {/* TODO: ajustar según la respuesta real de la API — mostrar nfcTagId o device info */}
            <Text style={styles.statusSub}>
              {user?.nfcTagId ? `ID: ${user.nfcTagId}` : 'HRS-BR · v2.4.1'}
            </Text>
          </View>

          <View style={[styles.statusCard, styles.statusCardHalf]}>
            <View style={styles.statusCardHead}>
              <Text style={styles.statusCardLabel}>Batería</Text>
              <View style={[styles.smallBadge, { backgroundColor: colors.accent10 }]}>
                <Ionicons name="battery-charging" size={14} color={colors.accent} />
              </View>
            </View>
            {/* TODO: ajustar según la respuesta real de la API — reemplazar con dato real */}
            <Text style={styles.statusValue}>82%</Text>
            <View style={styles.batteryTrack}>
              <View style={[styles.batteryFill, { width: '82%' }]} />
            </View>
            <Text style={styles.statusSub}>~18 h restantes</Text>
          </View>
        </View>

        <View style={[styles.statusCard, styles.statusCardFull]}>
          <View style={styles.statusCardHead}>
            <Text style={styles.statusCardLabel}>Última sincronización</Text>
            <View style={[styles.smallBadge, { backgroundColor: colors.accent10 }]}>
              <Ionicons name="time-outline" size={14} color={colors.accent} />
            </View>
          </View>
          <View style={styles.syncRow}>
            <Text style={styles.statusValueLg}>
              {loading ? <ActivityIndicator size="small" color={colors.accent} /> : syncTime}
            </Text>
            {data && (
              <View style={styles.syncOkBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.syncOkText}>Exitoso</Text>
              </View>
            )}
          </View>
          <Text style={styles.statusSub}>
            {data?.timestamp
              ? new Date(data.timestamp).toLocaleDateString('es-MX', { weekday: 'long' })
              : 'Hoy'}
          </Text>
        </View>

        {/* TODO: ajustar según la respuesta real de la API — estas métricas deben venir de sensores */}
        <Text style={styles.sectionTitle}>Métricas de salud</Text>
        <View style={styles.metricsGrid}>
          <MetricCard icon="heart" iconColor={colors.strawberryRed} label="Frecuencia cardíaca" value="78" unit="bpm" change="+2%" />
          <MetricCard icon="footsteps" iconColor={colors.lavenderGrey} label="Pasos hoy" value="8,432" unit="pasos" change="+12%" />
          <MetricCard icon="flame" iconColor="#FF9800" label="Calorías" value="412" unit="kcal" change="+8%" />
          <MetricCard icon="pulse" iconColor={colors.spaceIndigo} label="Actividad" value="92" unit="min" change="+5%" />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHead}>
            <View>
              <Text style={styles.chartTitle}>Actividad de las últimas 24h</Text>
              <Text style={styles.chartSub}>Datos capturados por sensores</Text>
            </View>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>En vivo</Text>
            </View>
          </View>
          <View style={{ height: CHART_H }}>
            <View style={styles.barsRow}>
              {BAR_DATA.map((v, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={[styles.bar, { height: (v / maxBar) * CHART_H * 0.9 }]} />
                </View>
              ))}
            </View>
          </View>
          <View style={styles.xLabels}>
            {BAR_HOURS.map((h, i) => <Text key={i} style={styles.xLabel}>{h}</Text>)}
          </View>
        </View>

        {/* TODO: ajustar según la respuesta real de la API — reemplazar con alertas reales */}
        <View style={styles.alertsCard}>
          <View style={styles.alertsHead}>
            <View style={styles.alertsTitleRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
              <Text style={styles.alertsTitle}>Alertas recientes</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <AlertRow dotColor={colors.warning} title="Geocerca traspasada" time="Hace 12 min" />
          <AlertRow dotColor={colors.strawberryRed} title="Ritmo cardíaco elevado detectado" time="Hace 1 h" />
          <AlertRow dotColor={colors.success} title="Sincronización completada" time="Hace 2 h" />
          <AlertRow dotColor={colors.lavenderGrey} title="Última ubicación registrada" time="Av. Reforma 247, CDMX" isLocation />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
