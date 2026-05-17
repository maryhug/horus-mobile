import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import { AppColors } from '../../constants/colors';
import type { DashboardData, ProfileData } from '../../types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 220;
const GLOBE_SIZE = 160;

const PRODUCTS = [
  { id: 'bracelet', label: 'Brazalete', icon: 'watch-outline', desc: 'Horus Pro · Negro' },
  { id: 'smartwatch', label: 'Smartwatch', icon: 'time-outline', desc: 'Horus Watch X' },
  { id: 'card', label: 'Tarjeta NFC', icon: 'card-outline', desc: 'Horus Card v2' },
];

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: c.textPrimary },
    themeBtn: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1, borderColor: c.border,
      justifyContent: 'center', alignItems: 'center',
    },
    scroll: { paddingBottom: 32 },

    locationCard: {
      backgroundColor: c.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    locationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    locationHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    locationHeaderTitle: { fontSize: 13, fontWeight: '800', color: c.textPrimary, letterSpacing: 0.5 },
    locationHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    locationHeaderTime: { fontSize: 12, color: c.textMuted },

    globeWrap: {
      height: MAP_HEIGHT,
      backgroundColor: '#050508',
      justifyContent: 'center',
      alignItems: 'center',
    },
    ring: { position: 'absolute', borderRadius: 999, borderWidth: 1 },
    pin: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.accent,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9, shadowRadius: 18, elevation: 12,
    },
    locationInfoCard: {
      position: 'absolute', bottom: 16, left: 20, right: 20,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    locationInfoCardDark: { backgroundColor: 'rgba(30,32,50,0.95)' },
    locationName: { fontSize: 14, fontWeight: '700', color: '#2B2D42' },
    locationNameDark: { color: '#EDF2F4' },
    locationCoords: { fontSize: 11, color: '#8D99AE', marginTop: 2 },
    gpsBadge: {
      backgroundColor: 'rgba(76, 175, 80, 0.15)',
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    },
    gpsBadgeText: { fontSize: 11, fontWeight: '700', color: '#4CAF50' },

    cardsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 14 },
    infoCard: {
      flex: 1, backgroundColor: c.surface,
      borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: c.border,
    },
    infoCardLabel: { fontSize: 11, color: c.textMuted, marginBottom: 6 },
    infoCardValue: { fontSize: 18, fontWeight: '800', color: c.textPrimary },
    infoCardSub: { fontSize: 11, color: c.textSecondary, marginTop: 3 },
    infoCardIcon: {
      width: 32, height: 32, borderRadius: 9,
      justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    },

    nfcCard: {
      backgroundColor: c.surface,
      marginHorizontal: 16, marginTop: 14,
      borderRadius: 20, borderWidth: 1, borderColor: c.border,
      padding: 16,
    },
    nfcHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    nfcTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
    nfcActiveBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(76, 175, 80, 0.12)',
      borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
    },
    nfcActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
    nfcActiveText: { fontSize: 12, color: '#4CAF50', fontWeight: '700' },
    nfcGrid: { flexDirection: 'row', gap: 10 },
    nfcCell: {
      flex: 1, backgroundColor: c.surfaceElevated,
      borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: c.border,
    },
    nfcCellLabel: { fontSize: 10, color: c.textMuted, marginBottom: 4 },
    nfcCellValue: { fontSize: 14, fontWeight: '700', color: c.textPrimary },

    alertsCard: {
      backgroundColor: c.surface,
      marginHorizontal: 16, marginTop: 14,
      borderRadius: 20, borderWidth: 1, borderColor: c.border,
      overflow: 'hidden',
    },
    alertsHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    alertsTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
    alertsBadge: {
      backgroundColor: c.accent,
      width: 20, height: 20, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center',
    },
    alertsBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
    alertRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 13,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    alertIconWrap: {
      width: 38, height: 38, borderRadius: 11,
      justifyContent: 'center', alignItems: 'center',
    },
    alertText: { flex: 1 },
    alertTitle: { fontSize: 13, fontWeight: '500', color: c.textPrimary, lineHeight: 18 },
    alertTime: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent },

    productCard: {
      backgroundColor: c.surface,
      marginHorizontal: 16, marginTop: 14,
      borderRadius: 20, borderWidth: 1, borderColor: c.border,
      overflow: 'hidden',
    },
    productHeader: {
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    productTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
    productSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    productList: { paddingHorizontal: 16 },
    productRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    productRowLast: { borderBottomWidth: 0 },
    productIconWrap: {
      width: 44, height: 44, borderRadius: 13,
      justifyContent: 'center', alignItems: 'center',
    },
    productInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
    productDesc: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    radioOuter: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: c.border,
      justifyContent: 'center', alignItems: 'center',
    },
    radioOuterActive: { borderColor: c.accent },
    radioInner: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: c.accent },

    userInfoBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: c.accent10, borderRadius: 8,
      paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4,
    },
    userInfoBadgeText: { fontSize: 11, color: c.accent, fontWeight: '600' },
  });
}


export default function MonitorScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const [activeProduct, setActiveProduct] = React.useState('bracelet');

  const { data: dashboardData, loading, refetch } = useApi<DashboardData>(
    () => apiClient.get<DashboardData>('/dashboard/info').then(r => r.data)
  );

  const lastSyncTime = dashboardData?.timestamp
    ? new Date(dashboardData.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—';

  // Pulse animation
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.25, duration: 1400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ])
      ).start();
    animate(pulse1, 0);
    animate(pulse2, 700);
  }, []);

  const G = GLOBE_SIZE;

  // Display location from profile if available
  // TODO: ajustar según la respuesta real de la API — usar coordenadas GPS reales del dispositivo
  const locationDisplay = user?.location ?? 'Comuna 14 - El Poblado, Colombia';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monitor</Text>
        <TouchableOpacity style={styles.themeBtn} onPress={toggleTheme}>
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />
        }
      >
        {/* ── Live Location ── */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={styles.locationHeaderLeft}>
              <Ionicons name="location" size={16} color={colors.accent} />
              <Text style={styles.locationHeaderTitle}>UBICACIÓN EN VIVO</Text>
            </View>
            <View style={styles.locationHeaderRight}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.locationHeaderTime}>{lastSyncTime}</Text>
            </View>
          </View>

          <View style={styles.globeWrap}>
            {[G * 1.35, G * 1.1, G * 0.88, G * 0.66].map((size, i) => (
              <View
                key={i}
                style={[
                  styles.ring,
                  {
                    width: size, height: size,
                    borderColor: `rgba(239,35,60,${0.08 + i * 0.06})`,
                    backgroundColor: `rgba(239,35,60,${0.02 + i * 0.02})`,
                  },
                ]}
              />
            ))}
            <Animated.View
              style={[styles.ring, {
                width: G * 0.5, height: G * 0.5,
                borderColor: 'rgba(239,35,60,0.4)',
                backgroundColor: 'rgba(239,35,60,0.06)',
                transform: [{ scale: pulse1 }],
              }]}
            />
            <Animated.View
              style={[styles.ring, {
                width: G * 0.32, height: G * 0.32,
                borderColor: 'rgba(239,35,60,0.6)',
                backgroundColor: 'rgba(239,35,60,0.10)',
                transform: [{ scale: pulse2 }],
              }]}
            />
            <View style={styles.pin}>
              <Ionicons name="location" size={18} color="#FFFFFF" />
            </View>

            <View style={[styles.locationInfoCard, isDark && styles.locationInfoCardDark]}>
              <View>
                <Text style={[styles.locationName, isDark && styles.locationNameDark]}>
                  {locationDisplay}
                </Text>
                <Text style={styles.locationCoords}>Sin coordenadas GPS</Text>
              </View>
              <View style={styles.gpsBadge}>
                <Text style={styles.gpsBadgeText}>GPS</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Last scan + NFC row ── */}
        <View style={styles.cardsRow}>
          <View style={styles.infoCard}>
            <View style={[styles.infoCardIcon, { backgroundColor: colors.accent10 }]}>
              <Ionicons name="scan-outline" size={18} color={colors.accent} />
            </View>
            <Text style={styles.infoCardLabel}>Último escaneo</Text>
            <Text style={styles.infoCardValue}>{lastSyncTime}</Text>
            {dashboardData?.timestamp && (
              <Text style={styles.infoCardSub}>
                {new Date(dashboardData.timestamp).toLocaleDateString('es-MX')}
              </Text>
            )}
          </View>
          <View style={styles.infoCard}>
            <View style={[styles.infoCardIcon, { backgroundColor: 'rgba(76,175,80,0.12)' }]}>
              <Ionicons name="wifi-outline" size={18} color={colors.success} />
            </View>
            <Text style={styles.infoCardLabel}>Estado NFC</Text>
            <Text style={[styles.infoCardValue, { color: colors.success }]}>
              {user?.nfcTagId ? 'Activo' : 'Sin NFC'}
            </Text>
            <Text style={styles.infoCardSub}>
              {user?.nfcTagId ? 'Lectura OK' : 'No registrado'}
            </Text>
          </View>
        </View>

        {/* ── NFC detail ── */}
        <View style={styles.nfcCard}>
          <View style={styles.nfcHeader}>
            <Text style={styles.nfcTitle}>Detalles NFC</Text>
            <View style={styles.nfcActiveBadge}>
              <View style={styles.nfcActiveDot} />
              <Text style={styles.nfcActiveText}>
                {user?.nfcTagId ? 'Conectado' : 'Sin registrar'}
              </Text>
            </View>
          </View>
          {/* TODO: ajustar según la respuesta real de la API — estos datos deben venir del dispositivo NFC */}
          <View style={styles.nfcGrid}>
            {[
              { label: 'Protocolo', value: 'ISO 14443' },
              { label: 'Frecuencia', value: '13.56 MHz' },
              { label: 'Rango', value: '≤ 10 cm' },
              { label: 'ID Tag', value: user?.nfcTagId ? user.nfcTagId.slice(0, 8) + '…' : '—' },
            ].map((item, i) => (
              <View key={i} style={styles.nfcCell}>
                <Text style={styles.nfcCellLabel}>{item.label}</Text>
                <Text style={styles.nfcCellValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Recent alerts ── */}
        <View style={styles.alertsCard}>
          <View style={styles.alertsHeader}>
            <Text style={styles.alertsTitle}>Últimas notificaciones</Text>
          </View>
          <View style={{ paddingVertical: 28, alignItems: 'center', gap: 8 }}>
            <Ionicons name="notifications-off-outline" size={32} color="#8D99AE" />
            <Text style={{ fontSize: 13, color: '#8D99AE' }}>Sin notificaciones recientes</Text>
          </View>
        </View>

        {/* ── Active product ── */}
        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <Text style={styles.productTitle}>Producto activo</Text>
            <Text style={styles.productSub}>Selecciona el dispositivo Horus conectado</Text>
          </View>
          <View style={styles.productList}>
            {PRODUCTS.map((p, i) => {
              const isActive = activeProduct === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.productRow, i === PRODUCTS.length - 1 && styles.productRowLast]}
                  onPress={() => setActiveProduct(p.id)}
                  activeOpacity={0.75}
                >
                  <View style={[
                    styles.productIconWrap,
                    { backgroundColor: isActive ? colors.accent10 : colors.surfaceElevated },
                  ]}>
                    <Ionicons
                      name={p.icon as any}
                      size={22}
                      color={isActive ? colors.accent : colors.textMuted}
                    />
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, isActive && { color: colors.accent }]}>
                      {p.label}
                    </Text>
                    <Text style={styles.productDesc}>{p.desc}</Text>
                  </View>
                  <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                    {isActive && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
