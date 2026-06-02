import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Dimensions, RefreshControl, Easing,
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
const MAP_H   = 240;
const RADAR_R = 90;          // radar radius in px
const PAD     = 16;
const GAP     = 12;
const TAB_H   = 72;

// ── Products definition ────────────────────────────────────────────────────
const PRODUCTS = [
  { id: 'bracelet',   label: 'Brazalete',   icon: 'watch' as const, desc: 'Horus Pro',  bg: '#DAEAF4', glow: '#4A7898', fg: '#2A5878' },
  { id: 'smartwatch', label: 'Smartwatch',  icon: 'watch' as const, desc: 'Watch X',    bg: '#DFF0CC', glow: '#6A924E', fg: '#3A6230' },
  { id: 'card',       label: 'Tarjeta NFC', icon: 'nfc'   as const, desc: 'Card v2',    bg: '#EDE0F4', glow: '#9060B8', fg: '#603080' },
];

// ── Shadow helper ──────────────────────────────────────────────────────────
function sh(op = 0.08, r = 14, y = 4) {
  return { shadowColor: '#000', shadowOffset: { width: 0, height: y }, shadowOpacity: op, shadowRadius: r, elevation: Math.round(op * 40) };
}

// ── Styles ─────────────────────────────────────────────────────────────────
function makeStyles(c: AppColors) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: TAB_H + 16 },

    // ── Radar card
    radarCard: {
      marginHorizontal: PAD, marginTop: 8,
      borderRadius: 26, overflow: 'hidden',
      backgroundColor: c.surface, ...sh(0.12, 20, 6),
    },
    radarHeaderRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    radarHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    radarHeaderTitle: { fontSize: 13, fontWeight: '800', color: c.textPrimary, letterSpacing: 0.4 },
    radarHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    radarTime:        { fontSize: 12, color: c.textMuted },
    radarLiveDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2E9E56' },
    radarLiveTxt:     { fontSize: 11, color: '#2E9E56', fontWeight: '700' },

    radarCanvas: {
      height: MAP_H, backgroundColor: '#060710',
      justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },

    // ── Location info overlay
    locationOverlay: {
      position: 'absolute', bottom: 14, left: 16, right: 16,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    locationOverlayDark: { backgroundColor: 'rgba(30,32,60,0.95)' },
    locationName:     { fontSize: 14, fontWeight: '700', color: '#14121E' },
    locationNameDark: { color: '#F0EEF8' },
    locationCoords:   { fontSize: 11, color: '#8896B2', marginTop: 1 },
    gpsBadge: {
      backgroundColor: 'rgba(46,158,86,0.14)',
      borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    },
    gpsTxt: { fontSize: 11, fontWeight: '700', color: '#2E9E56' },

    // ── Info row cards
    cardsRow: { flexDirection: 'row', gap: GAP, marginHorizontal: PAD, marginTop: 14 },
    infoCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: 22, padding: 16, ...sh(0.07, 12, 3),
    },
    infoIconBubble: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    infoLabel: { fontSize: 11, color: c.textMuted, marginBottom: 5 },
    infoValue: { fontSize: 18, fontWeight: '800', color: c.textPrimary },
    infoSub:   { fontSize: 11, color: c.textSecondary, marginTop: 3 },

    // ── NFC card
    nfcCard: {
      backgroundColor: c.surface, marginHorizontal: PAD, marginTop: 14,
      borderRadius: 26, padding: 18, ...sh(0.07, 12, 3),
    },
    nfcHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    nfcTitle:   { fontSize: 16, fontWeight: '800', color: c.textPrimary },
    nfcBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(46,158,86,0.12)', borderRadius: 12,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    nfcBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E9E56' },
    nfcBadgeTxt: { fontSize: 12, color: '#2E9E56', fontWeight: '700' },
    nfcGrid:     { flexDirection: 'row', gap: 10 },
    nfcCell:     { flex: 1, backgroundColor: c.surfaceElevated, borderRadius: 14, padding: 12 },
    nfcCellLbl:  { fontSize: 10, color: c.textMuted, marginBottom: 4 },
    nfcCellVal:  { fontSize: 14, fontWeight: '700', color: c.textPrimary },

    // ── Alerts card
    alertsCard: {
      backgroundColor: c.surface, marginHorizontal: PAD, marginTop: 14,
      borderRadius: 26, overflow: 'hidden', ...sh(0.07, 12, 3),
    },
    alertsHeaderRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    alertsTitle: { fontSize: 16, fontWeight: '800', color: c.textPrimary },

    // ── Products section
    productsWrap: { marginHorizontal: PAD, marginTop: 14 },
    productsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    productsTitle: { fontSize: 18, fontWeight: '800', color: c.textPrimary },
    productsCount: {
      fontSize: 12, fontWeight: '700',
      backgroundColor: c.accent10, color: c.accent,
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    },
    productsGrid: { flexDirection: 'row', gap: 10 },
    productTile: {
      flex: 1, borderRadius: 22, padding: 16,
      alignItems: 'center', minHeight: 130,
      justifyContent: 'space-between',
    },
    productTileActive: { /* shadow applied dynamically */ },
    productIconRing: {
      width: 56, height: 56, borderRadius: 28,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 4,
    },
    productTileName: { fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 16 },
    productTileDesc: { fontSize: 10, fontWeight: '500', textAlign: 'center', marginTop: 2 },
    productCheckBadge: {
      position: 'absolute', top: 10, right: 10,
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.9)',
      justifyContent: 'center', alignItems: 'center',
    },
  });
}

// ── RadarCanvas — the dynamic sonar/radar animation ────────────────────────
function RadarCanvas({ isDark }: { isDark: boolean }) {
  // Static concentric grid rings
  const RINGS = [RADAR_R * 1.7, RADAR_R * 1.35, RADAR_R, RADAR_R * 0.65, RADAR_R * 0.32];

  // ── 1. Rotating sweep arm ──────────────────────────────────────────────
  const sweepAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1, duration: 3200,
        easing: Easing.linear, useNativeDriver: true,
      })
    ).start();
  }, []);
  const spin = sweepAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ── 2. Sonar pings — 3 rings that expand & fade ────────────────────────
  const pings = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    const delays = [0, 1000, 2000];
    pings.forEach((p, i) => {
      const start = () => {
        p.setValue(0);
        Animated.timing(p, {
          toValue: 1, duration: 2800,
          easing: Easing.out(Easing.ease), useNativeDriver: true,
          delay: delays[i],
        }).start(({ finished }) => { if (finished) start(); });
      };
      setTimeout(start, delays[i]);
    });
  }, []);

  // ── 3. Center pin glow pulse ──────────────────────────────────────────
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={{ width: '100%', height: MAP_H, backgroundColor: '#060710', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>

      {/* Grid dots pattern */}
      {[-60, -20, 20, 60].map(row =>
        [-80, -40, 0, 40, 80].map(col => (
          <View key={`${row}-${col}`} style={{
            position: 'absolute', width: 2, height: 2, borderRadius: 1,
            backgroundColor: 'rgba(100,110,180,0.25)',
            top: MAP_H / 2 + row, left: (W - PAD * 2) / 2 + col,
          }} />
        ))
      )}

      {/* Static concentric rings */}
      {RINGS.map((r, i) => (
        <View key={i} style={{
          position: 'absolute', width: r * 2, height: r * 2, borderRadius: r,
          borderWidth: i === 2 ? 1.5 : 1,
          borderColor: i === 2
            ? 'rgba(126,200,208,0.25)'
            : 'rgba(100,110,200,0.12)',
        }} />
      ))}

      {/* ── Sweep arm (rotates around center) ── */}
      {/* Full-width 2×RADAR_R element centered → right half is the visible arm */}
      <Animated.View style={{
        position: 'absolute',
        width: RADAR_R * 2,
        height: RADAR_R * 2,
        borderRadius: RADAR_R,
        transform: [{ rotate: spin }],
        overflow: 'hidden',
      }}>
        {/* Right half: bright sweep gradient faked with layered views */}
        <View style={{ position: 'absolute', right: 0, top: RADAR_R - 1, width: RADAR_R, height: 2, backgroundColor: 'rgba(126,200,208,0.9)' }} />
        <View style={{ position: 'absolute', right: 0, top: RADAR_R - 3, width: RADAR_R * 0.8, height: 6, backgroundColor: 'rgba(126,200,208,0.18)', borderRadius: 3 }} />
        {/* Arc sweep fill — wedge approximated with transparent circle overlay */}
        <View style={{
          position: 'absolute', right: 0, top: 0,
          width: RADAR_R, height: RADAR_R * 2,
          backgroundColor: 'rgba(126,200,208,0.06)',
        }} />
      </Animated.View>

      {/* ── Sonar pings ── */}
      {pings.map((p, i) => {
        const scale = p.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1.8] });
        const opacity = p.interpolate({ inputRange: [0, 0.25, 0.7, 1], outputRange: [0, 0.7, 0.3, 0] });
        return (
          <Animated.View key={i} style={{
            position: 'absolute',
            width: RADAR_R * 1.4, height: RADAR_R * 1.4,
            borderRadius: RADAR_R * 0.7,
            borderWidth: 2,
            borderColor: 'rgba(126,200,208,0.7)',
            transform: [{ scale }],
            opacity,
          }} />
        );
      })}

      {/* ── Center pin glow halo ── */}
      <Animated.View style={{
        position: 'absolute', width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(126,200,208,0.15)', opacity: glowOpacity,
      }} />

      {/* ── Center pin ── */}
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#7EC8D0',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#7EC8D0', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, shadowRadius: 16, elevation: 12,
        zIndex: 10,
      }}>
        <HorusIcon name="location" size={18} color="#FFFFFF" />
      </View>
    </View>
  );
}

// ── ProductTile — individual selectable product card ────────────────────────
function ProductTile({
  product, isActive, onPress, colors,
}: {
  product: typeof PRODUCTS[0];
  isActive: boolean;
  onPress: () => void;
  colors: AppColors;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    onPress();
  }, [onPress]);

  const bgColor   = isActive ? product.bg   : colors.surfaceElevated;
  const textColor = isActive ? product.fg   : colors.textMuted;
  const iconColor = isActive ? product.glow : colors.textMuted;

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={[{
          flex: 1, borderRadius: 22, padding: 16,
          backgroundColor: bgColor,
          alignItems: 'center', minHeight: 130,
          justifyContent: 'center',
          shadowColor: isActive ? product.glow : '#000',
          shadowOffset: { width: 0, height: isActive ? 6 : 2 },
          shadowOpacity: isActive ? 0.28 : 0.07,
          shadowRadius: isActive ? 14 : 6,
          elevation: isActive ? 8 : 2,
        }]}
      >
        {/* Check badge */}
        {isActive && (
          <View style={{
            position: 'absolute', top: 10, right: 10,
            width: 22, height: 22, borderRadius: 11,
            backgroundColor: product.glow,
            justifyContent: 'center', alignItems: 'center',
          }}>
            <HorusIcon name="check" size={12} color="#FFF" />
          </View>
        )}

        {/* Icon ring */}
        <View style={{
          width: 54, height: 54, borderRadius: 27,
          backgroundColor: isActive ? 'rgba(255,255,255,0.45)' : colors.grey10,
          justifyContent: 'center', alignItems: 'center',
          marginBottom: 10,
        }}>
          <HorusIcon name={product.icon} size={28} color={iconColor} />
        </View>

        <Text style={{ fontSize: 13, fontWeight: '800', color: textColor, textAlign: 'center' }}>
          {product.label}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '500', color: textColor, opacity: 0.7, marginTop: 2, textAlign: 'center' }}>
          {product.desc}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function MonitorScreen() {
  const { colors, isDark } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const [activeProducts, setActiveProducts] = React.useState<string[]>(['bracelet']);

  const toggleProduct = useCallback((id: string) => {
    setActiveProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }, []);

  const { data: dashboardData, loading, refetch } = useApi<DashboardData>(
    () => apiClient.get<DashboardData>('/dashboard/info').then(r => r.data)
  );

  const lastSyncTime = dashboardData?.timestamp
    ? new Date(dashboardData.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—';

  // TODO: ajustar según la respuesta real de la API
  const locationDisplay = user?.location ?? 'Comuna 14 - El Poblado, Colombia';

  const activeCount = activeProducts.length;

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.accent} />}
      >
        {/* ── Radar / Ubicación ── */}
        <View style={s.radarCard}>
          <View style={s.radarHeaderRow}>
            <View style={s.radarHeaderLeft}>
              <HorusIcon name="location" size={15} color={colors.accent} />
              <Text style={s.radarHeaderTitle}>UBICACIÓN EN VIVO</Text>
            </View>
            <View style={s.radarHeaderRight}>
              <View style={s.radarLiveDot} />
              <Text style={s.radarLiveTxt}>LIVE</Text>
              <HorusIcon name="clock" size={12} color={colors.textMuted} />
              <Text style={s.radarTime}>{lastSyncTime}</Text>
            </View>
          </View>

          {/* Dynamic radar canvas */}
          <RadarCanvas isDark={isDark} />

          {/* Location info overlay */}
          <View style={{ position: 'relative' }}>
            <View style={[s.locationOverlay, isDark && s.locationOverlayDark]}>
              <View>
                <Text style={[s.locationName, isDark && s.locationNameDark]}>{locationDisplay}</Text>
                <Text style={s.locationCoords}>Sin coordenadas GPS activas</Text>
              </View>
              <View style={s.gpsBadge}>
                <Text style={s.gpsTxt}>GPS</Text>
              </View>
            </View>
          </View>
          <View style={{ height: 60 }} />
        </View>

        {/* ── Último escaneo + NFC ── */}
        <View style={s.cardsRow}>
          <View style={s.infoCard}>
            <View style={[s.infoIconBubble, { backgroundColor: '#EAF4FF' }]}>
              <HorusIcon name="scan" size={18} color="#3A8EF6" />
            </View>
            <Text style={s.infoLabel}>Último escaneo</Text>
            <Text style={s.infoValue}>{lastSyncTime}</Text>
            {dashboardData?.timestamp && (
              <Text style={s.infoSub}>{new Date(dashboardData.timestamp).toLocaleDateString('es-MX')}</Text>
            )}
          </View>
          <View style={s.infoCard}>
            <View style={[s.infoIconBubble, { backgroundColor: '#E8F5EB' }]}>
              <HorusIcon name="wifi" size={18} color="#2E9E56" />
            </View>
            <Text style={s.infoLabel}>Estado NFC</Text>
            <Text style={[s.infoValue, { color: colors.success }]}>
              {user?.nfcTagId ? 'Activo' : 'Sin NFC'}
            </Text>
            <Text style={s.infoSub}>{user?.nfcTagId ? 'Lectura OK' : 'No registrado'}</Text>
          </View>
        </View>

        {/* ── NFC detail ── */}
        <View style={s.nfcCard}>
          <View style={s.nfcHeader}>
            <Text style={s.nfcTitle}>Detalles NFC</Text>
            <View style={s.nfcBadge}>
              <View style={s.nfcBadgeDot} />
              <Text style={s.nfcBadgeTxt}>{user?.nfcTagId ? 'Conectado' : 'Sin registrar'}</Text>
            </View>
          </View>
          {/* TODO: datos reales del dispositivo NFC */}
          <View style={s.nfcGrid}>
            {[
              { label: 'Protocolo', value: 'ISO 14443' },
              { label: 'Frecuencia', value: '13.56 MHz' },
              { label: 'Rango', value: '≤ 10 cm' },
              { label: 'ID Tag', value: user?.nfcTagId ? user.nfcTagId.slice(0, 8) + '…' : '—' },
            ].map((item, i) => (
              <View key={i} style={s.nfcCell}>
                <Text style={s.nfcCellLbl}>{item.label}</Text>
                <Text style={s.nfcCellVal}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Notificaciones ── */}
        <View style={s.alertsCard}>
          <View style={s.alertsHeaderRow}>
            <Text style={s.alertsTitle}>Notificaciones</Text>
          </View>
          <View style={{ paddingVertical: 28, alignItems: 'center', gap: 8 }}>
            <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.grey10, justifyContent: 'center', alignItems: 'center' }}>
              <HorusIcon name="bell-off" size={26} color={colors.textMuted} />
            </View>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>Sin notificaciones recientes</Text>
          </View>
        </View>

        {/* ── Productos activos — card tiles ── */}
        <View style={s.productsWrap}>
          <View style={s.productsHeader}>
            <Text style={s.productsTitle}>Mis dispositivos</Text>
            {activeCount > 0 && (
              <Text style={s.productsCount}>
                {activeCount} activo{activeCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <View style={s.productsGrid}>
            {PRODUCTS.map(p => (
              <ProductTile
                key={p.id}
                product={p}
                isActive={activeProducts.includes(p.id)}
                onPress={() => toggleProduct(p.id)}
                colors={colors}
              />
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
