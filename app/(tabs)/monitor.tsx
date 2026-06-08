import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, Modal, RefreshControl, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import type { DashboardData } from '../../types/api';
import { EmotionShape } from '../../components/EmotionShape';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONT } from '../../constants/fonts';

// ── Fixed accent colors (no cambian con el tema) ───────────────────────────
const BLUE    = '#A5CCF4';
const BLUE_FG = '#1A3A5C';
const GREEN_FG = '#2D5016';

const ORBIT_WRAP = 210;

// ── NFC icon ───────────────────────────────────────────────────────────────
function NfcIcon({ size = 20, color = GREEN_FG }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 8.32a7.43 7.43 0 0 1 0 7.36"  stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8"  stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M16.37 2a20.16 20.16 0 0 1 0 20"  stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// ── Ripple ─────────────────────────────────────────────────────────────────
function Ripple({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1, duration: 3000,
          easing: t => 1 - Math.pow(1 - t, 3),
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1.9] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0]   });
  const SIZE = 190;
  return (
    <Animated.View style={{
      position: 'absolute',
      width: SIZE, height: SIZE, borderRadius: SIZE / 2,
      top:  (ORBIT_WRAP - SIZE) / 2,
      left: (ORBIT_WRAP - SIZE) / 2,
      backgroundColor: `${BLUE_FG}18`,
      transform: [{ scale }], opacity,
    }} />
  );
}

// ── Orbiting dot ───────────────────────────────────────────────────────────
function OrbitDot({ orbitSize, dotSize, duration, reverse }: {
  orbitSize: number; dotSize: number; duration: number; reverse?: boolean;
}) {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rot, { toValue: 1, duration, easing: t => t, useNativeDriver: true })
    ).start();
  }, []);
  const rotate = rot.interpolate({
    inputRange:  [0, 1],
    outputRange: reverse ? ['0deg', '-360deg'] : ['0deg', '360deg'],
  });
  const offset = (ORBIT_WRAP - orbitSize) / 2;
  return (
    <Animated.View style={{
      position: 'absolute', width: orbitSize, height: orbitSize,
      top: offset, left: offset, transform: [{ rotate }],
    }}>
      <View style={{
        position: 'absolute',
        top: -(dotSize / 2), left: orbitSize / 2 - dotSize / 2,
        width: dotSize, height: dotSize, borderRadius: dotSize / 2,
        backgroundColor: reverse ? `${BLUE_FG}80` : BLUE_FG,
        shadowColor: BLUE_FG, shadowOpacity: 0.6,
        shadowOffset: { width: 0, height: 0 }, shadowRadius: 4, elevation: 5,
      }} />
    </Animated.View>
  );
}

// ── Products ───────────────────────────────────────────────────────────────
const INITIAL_PRODUCTS = [
  { id: 'bracelet',   name: 'Brazalete Horus Pro',      desc: 'Sensor principal · NFC + GPS',     active: true  },
  { id: 'smartwatch', name: 'Smartwatch Horus Watch X', desc: 'Pantalla AMOLED · ritmo cardíaco', active: false },
  { id: 'card',       name: 'Tarjeta NFC Card v2',       desc: 'Tarjeta de respaldo · 13.56 MHz', active: true  },
];

// ── Screen ─────────────────────────────────────────────────────────────────
export default function MonitorScreen() {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, isDark } = useAppTheme();
  const s = React.useMemo(
    () => makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN),
    [isDark]
  );

  const { width: screenW } = useWindowDimensions();
  const [products, setProducts]         = useState(INITIAL_PRODUCTS);
  const [modalProduct, setModalProduct] = useState<typeof INITIAL_PRODUCTS[0] | null>(null);
  const blobFloat = useRef(new Animated.Value(0)).current;
  const pinBob    = useRef(new Animated.Value(0)).current;

  const { data, loading, refetch } = useApi<DashboardData>(
    () => apiClient.get<DashboardData>('/dashboard/info').then(r => r.data)
  );
  const syncTime = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '10:41';

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(blobFloat, { toValue: -8, duration: 1500, useNativeDriver: true }),
      Animated.timing(blobFloat, { toValue:  0, duration: 1500, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pinBob, { toValue: -7, duration: 1200, easing: t => Math.sin(t * Math.PI / 2), useNativeDriver: true }),
      Animated.timing(pinBob, { toValue:  0, duration: 1200, easing: t => 1 - Math.cos(t * Math.PI / 2), useNativeDriver: true }),
    ])).start();
  }, []);

  const confirmToggle = () => {
    if (!modalProduct) return;
    setProducts(prev => prev.map(p => p.id === modalProduct.id ? { ...p, active: !p.active } : p));
    setModalProduct(null);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={GREEN} />}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={{ gap: 2 }}>
          <Text style={s.title}>Monitor</Text>
          <Text style={s.subtitle}>Ubicación y conectividad en tiempo real</Text>
        </View>

        {/* ── Live location card ───────────────────────────────────────── */}
        <View style={[s.mapCard, { width: screenW - 40 }]}>
          {Array.from({ length: Math.ceil((screenW - 40) / 28) }).map((_, i) => (
            <View key={`v${i}`} style={[s.gridLineV, { left: i * 28 }]} />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <View key={`h${i}`} style={[s.gridLineH, { top: i * 28 }]} />
          ))}

          <View style={s.mapTopRow}>
            <View style={s.livePill}>
              <Text style={s.livePillText}>Ubicación en vivo</Text>
            </View>
            <View style={s.timePill}>
              <Ionicons name="time-outline" size={13} color={BLUE_FG} />
              <Text style={s.timePillText}>{syncTime}</Text>
            </View>
          </View>

          <View style={s.orbitWrap}>
            <Ripple delay={0} />
            <Ripple delay={1000} />
            <Ripple delay={2000} />
            {[{ size: 190 }, { size: 140 }].map(({ size }) => (
              <View key={size} style={[s.dashedRing, {
                width: size, height: size, borderRadius: size / 2,
                top:  (ORBIT_WRAP - size) / 2,
                left: (ORBIT_WRAP - size) / 2,
              }]} />
            ))}
            <OrbitDot orbitSize={190} dotSize={13} duration={7000} />
            <OrbitDot orbitSize={140} dotSize={9}  duration={11000} reverse />
            <Animated.View style={{ transform: [{ translateY: pinBob }] }}>
              <View style={s.pinOuter}>
                <Ionicons name="location" size={26} color={BLUE} style={s.pinIcon} />
              </View>
            </Animated.View>
          </View>

          <Text style={s.mapCity}>Medellín, Antioquia</Text>
          <Text style={s.mapGps}>Esperando coordenadas GPS del dispositivo</Text>
        </View>

        {/* ── Estado NFC ──────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.nfcRow}>
            <View style={s.nfcIconBox}>
              <NfcIcon size={20} color={GREEN_FG} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Estado NFC</Text>
              <Text style={s.cardSub}>Tag registrado y activo</Text>
            </View>
            <View style={s.activoBadge}>
              <Text style={s.activoBadgeText}>Activo</Text>
            </View>
          </View>
          <View style={s.chipGrid}>
            {[
              { label: 'Protocolo',  value: 'ISO 14443'         },
              { label: 'Frecuencia', value: '13.56 MHz'          },
              { label: 'Rango',      value: '≤ 10 cm'            },
              { label: 'ID del tag', value: '04:A2:6B:9C:1D:80' },
            ].map(c => (
              <View key={c.label} style={s.chip}>
                <Text style={s.chipLabel}>{c.label}</Text>
                <Text style={s.chipValue}>{c.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Notificaciones recientes ─────────────────────────────────── */}
        <Text style={s.sectionTitle}>Notificaciones recientes</Text>
        <View style={[s.card, s.emptyCard]}>
          <Animated.View style={{ transform: [{ translateY: blobFloat }] }}>
            <EmotionShape kind="flower" color="pink" size={60} eyes />
          </Animated.View>
          <Text style={s.emptyTitle}>Sin notificaciones</Text>
          <Text style={s.emptySub}>No hay alertas del dispositivo</Text>
        </View>

        {/* ── Productos activos ────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Productos activos</Text>
        <View style={{ gap: 8 }}>
          {products.map(p => (
            <TouchableOpacity
              key={p.id} style={s.productCard}
              onPress={() => setModalProduct(p)} activeOpacity={0.78}
            >
              <View style={s.productIconWrap}>
                <Ionicons name="radio-outline" size={20} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.productName}>{p.name}</Text>
                <Text style={s.productDesc}>{p.desc}</Text>
              </View>
              {p.active ? (
                <View style={s.checkCircle}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              ) : (
                <View style={s.emptyCircle} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      <Modal visible={!!modalProduct} transparent animationType="fade" onRequestClose={() => setModalProduct(null)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setModalProduct(null)}>
          <TouchableOpacity activeOpacity={1} style={s.modalBox} onPress={() => {}}>
            <View style={s.modalIconWrap}>
              <Ionicons name="radio-outline" size={28} color={PRIMARY} />
            </View>
            <Text style={s.modalTitle}>{modalProduct?.name}</Text>
            <Text style={s.modalSub}>
              {modalProduct?.active ? '¿Deseas desactivar este dispositivo?' : '¿Deseas activar este dispositivo?'}
            </Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnCancel} onPress={() => setModalProduct(null)}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnConfirm, { backgroundColor: modalProduct?.active ? '#EF4444' : GREEN }]}
                onPress={confirmToggle}
              >
                <Text style={s.btnConfirmText}>{modalProduct?.active ? 'Desactivar' : 'Activar'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
function makeStyles(
  BG: string, CARD: string, PRIMARY: string, MUTED: string, MUTED_BG: string, GREEN: string,
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    scroll:    { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120, gap: 16 },

    title:    { fontSize: 26, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, fontFamily: FONT.sansMedium, color: MUTED },

    // Map card — fondo BLUE fijo (acento, no cambia con tema)
    mapCard: {
      backgroundColor: BLUE, borderRadius: 28, overflow: 'hidden',
      paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, alignItems: 'center',
    },
    gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: `${BLUE_FG}25` },
    gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: `${BLUE_FG}25` },
    mapTopRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      width: '100%', marginBottom: 20, zIndex: 1,
    },
    livePill: {
      backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 999,
      paddingHorizontal: 12, paddingVertical: 5,
    },
    livePillText: { fontSize: 12, fontWeight: '700', color: BLUE_FG },
    timePill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 999,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    timePillText: { fontSize: 12, fontWeight: '600', color: BLUE_FG },
    orbitWrap:  { width: ORBIT_WRAP, height: ORBIT_WRAP, alignItems: 'center', justifyContent: 'center' },
    dashedRing: { position: 'absolute', borderWidth: 1.5, borderColor: `${BLUE_FG}45`, borderStyle: 'dashed' },
    pinOuter: {
      width: 56, height: 56, borderRadius: 28, borderBottomLeftRadius: 0,
      backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
      transform: [{ rotate: '45deg' }],
      shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
    },
    pinIcon:  { transform: [{ rotate: '-45deg' }] },
    mapCity:  { fontSize: 20, fontWeight: '700', color: BLUE_FG, textAlign: 'center', marginTop: 20, zIndex: 1 },
    mapGps:   { fontSize: 12, color: `${BLUE_FG}99`, textAlign: 'center', marginTop: 2, zIndex: 1 },

    // NFC card
    card: {
      backgroundColor: CARD, borderRadius: 28, padding: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    nfcRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    nfcIconBox: {
      width: 40, height: 40, borderRadius: 14,
      backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
    },
    cardTitle: { fontSize: 15, fontFamily: FONT.displayBold, color: PRIMARY },
    cardSub:   { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED, marginTop: 1 },
    activoBadge: {
      backgroundColor: `${GREEN}30`, borderRadius: 999,
      paddingHorizontal: 12, paddingVertical: 5,
    },
    activoBadgeText: { fontSize: 12, fontWeight: '700', color: GREEN_FG },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      flexBasis: '47%', flexGrow: 1,
      backgroundColor: MUTED_BG, borderRadius: 16,
      paddingHorizontal: 14, paddingVertical: 10,
    },
    chipLabel: { fontSize: 11, fontFamily: FONT.sansRegular, color: MUTED, marginBottom: 3 },
    chipValue: { fontSize: 13, fontFamily: FONT.displayBold, color: PRIMARY },

    sectionTitle: { fontSize: 17, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.3 },
    emptyCard:  { alignItems: 'center', paddingVertical: 32, gap: 10 },
    emptyTitle: { fontSize: 14, fontFamily: FONT.displayBold, color: PRIMARY },
    emptySub:   { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED },

    // Products
    productCard: {
      backgroundColor: CARD, borderRadius: 20, padding: 16,
      flexDirection: 'row', alignItems: 'center', gap: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    productIconWrap: {
      width: 40, height: 40, borderRadius: 14,
      backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center',
    },
    productName: { fontSize: 14, fontFamily: FONT.displayBold, color: PRIMARY },
    productDesc: { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED, marginTop: 1 },
    checkCircle: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
    },
    emptyCircle: {
      width: 26, height: 26, borderRadius: 13,
      borderWidth: 2, borderColor: MUTED_BG,
    },

    // Modal
    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
    },
    modalBox: {
      backgroundColor: CARD, borderRadius: 28, padding: 28,
      width: '100%', alignItems: 'center', gap: 8,
    },
    modalIconWrap: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    modalTitle: { fontSize: 16, fontFamily: FONT.displayBold, color: PRIMARY, textAlign: 'center' },
    modalSub:   { fontSize: 14, fontFamily: FONT.sansRegular, color: MUTED, textAlign: 'center', lineHeight: 20 },
    modalBtns:  { flexDirection: 'row', gap: 12, marginTop: 12, width: '100%' },
    btnCancel: {
      flex: 1, height: 48, borderRadius: 16,
      backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center',
    },
    btnCancelText:  { fontSize: 14, fontFamily: FONT.sansBold, color: MUTED },
    btnConfirm: {
      flex: 1, height: 48, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    btnConfirmText: { fontSize: 14, fontFamily: FONT.sansBold, color: '#FFFFFF' },
  });
}
