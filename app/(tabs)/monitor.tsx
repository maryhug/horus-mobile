import React, { useMemo, useEffect, useRef, useState } from 'react';
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
import type { DashboardData } from '../../types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const V = {
  coral:    '#FF6B9D',
  ocean:    '#4B8EF0',
  tangerine:'#FF8C42',
  mint:     '#34D399',
  grape:    '#A78BFA',
  sunshine: '#FCD34D',
};

const GLOBE_SIZE = 152;
const MAP_HEIGHT  = 230;

const PRODUCTS = [
  { id: 'bracelet',   label: 'Brazalete',   icon: 'watch-outline', desc: 'Horus Pro · Negro', color: V.coral  },
  { id: 'smartwatch', label: 'Smartwatch',  icon: 'time-outline',  desc: 'Horus Watch X',    color: V.ocean  },
  { id: 'card',       label: 'Tarjeta NFC', icon: 'card-outline',  desc: 'Horus Card v2',    color: V.grape  },
];

// Multi-color ring config for location globe
const RINGS = [
  { scale: 2.1,  color: V.coral,    opacity: 0.06 },
  { scale: 1.75, color: V.grape,    opacity: 0.09 },
  { scale: 1.45, color: V.ocean,    opacity: 0.13 },
  { scale: 1.18, color: V.mint,     opacity: 0.18 },
];

export default function MonitorScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [activeProducts, setActiveProducts] = useState<string[]>(['bracelet']);
  const [activeTab, setActiveTab] = useState<'ubicacion' | 'nfc' | 'alertas'>('ubicacion');

  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;

  const { data: dashData, loading, refetch } = useApi<DashboardData>(
    () => apiClient.get<DashboardData>('/dashboard/info').then(r => r.data)
  );

  const lastSync = dashData?.timestamp
    ? new Date(dashData.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—';

  useEffect(() => {
    const makeLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.3, duration: 1200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1,   duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    makeLoop(pulse1, 0);
    makeLoop(pulse2, 600);
  }, []);

  function toggleProduct(id: string) {
    setActiveProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  const locationDisplay = user?.location ?? 'El Poblado, Medellín';

  // ── Theme tokens ──────────────────────────────────────────────────────
  const bg     = isDark ? '#0E0F1A' : '#F7F8FF';
  const cardBg = isDark ? '#181928' : '#FFFFFF';
  const txt1   = isDark ? '#EEF2FF' : '#1A1B30';
  const txt2   = isDark ? '#6B7299' : '#8891B8';
  const border = isDark ? '#252640' : '#E8EAF6';
  const globeBg = isDark ? '#060714' : '#0A0C1E';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: cardBg, borderBottomColor: border }]}>
        <View>
          <Text style={[s.headerSub, { color: txt2 }]}>HORUS BRASLET</Text>
          <Text style={[s.headerTitle, { color: txt1 }]}>Monitor</Text>
        </View>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[s.iconBtn, { backgroundColor: isDark ? '#20213A' : '#EEF0FF', borderColor: border }]}
        >
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={txt2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={V.coral} />}
      >

        {/* ── Live Location card ───────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, marginBottom: 14 }}>
          <View style={[s.bigCard, { backgroundColor: cardBg, borderColor: border, padding: 0, overflow: 'hidden' }]}>

            {/* Card header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.iconPill, { backgroundColor: V.coral + '25' }]}>
                  <Ionicons name="location" size={14} color={V.coral} />
                </View>
                <Text style={[s.cardTitle, { color: txt1 }]}>UBICACIÓN EN VIVO</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="time-outline" size={12} color={txt2} />
                <Text style={{ fontSize: 12, color: txt2, fontWeight: '600' }}>{lastSync}</Text>
              </View>
            </View>

            {/* Globe area */}
            <View style={[s.globeWrap, { backgroundColor: globeBg, height: MAP_HEIGHT }]}>

              {/* Multi-color rings */}
              {RINGS.map((r, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    width:  GLOBE_SIZE * r.scale,
                    height: GLOBE_SIZE * r.scale,
                    borderRadius: GLOBE_SIZE * r.scale / 2,
                    borderWidth: 1.5,
                    borderColor: r.color,
                    backgroundColor: r.color.replace('#', 'rgba(') + `,${r.opacity})`,
                    opacity: r.opacity * 8,
                  }}
                />
              ))}

              {/* Animated pulsing rings */}
              <Animated.View style={{
                position: 'absolute',
                width: GLOBE_SIZE * 0.55, height: GLOBE_SIZE * 0.55,
                borderRadius: GLOBE_SIZE * 0.275,
                borderWidth: 2, borderColor: V.coral + '80',
                backgroundColor: V.coral + '10',
                transform: [{ scale: pulse1 }],
              }} />
              <Animated.View style={{
                position: 'absolute',
                width: GLOBE_SIZE * 0.34, height: GLOBE_SIZE * 0.34,
                borderRadius: GLOBE_SIZE * 0.17,
                borderWidth: 2, borderColor: V.grape + '90',
                backgroundColor: V.grape + '15',
                transform: [{ scale: pulse2 }],
              }} />

              {/* Center pin */}
              <View style={[s.pin, { backgroundColor: V.coral, shadowColor: V.coral }]}>
                <Ionicons name="location" size={20} color="#FFF" />
              </View>

              {/* Location info overlay */}
              <View style={[
                s.locInfo,
                { backgroundColor: isDark ? 'rgba(24,25,40,0.95)' : 'rgba(255,255,255,0.95)' }
              ]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.locName, { color: txt1 }]}>{locationDisplay}</Text>
                  <Text style={{ fontSize: 10, color: txt2, marginTop: 1 }}>Sin coordenadas GPS</Text>
                </View>
                <View style={[s.gpsBadge, { backgroundColor: V.mint + '25', borderColor: V.mint + '50' }]}>
                  <Ionicons name="radio" size={11} color={V.mint} />
                  <Text style={{ fontSize: 11, color: V.mint, fontWeight: '800' }}>GPS</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Info cards row ──────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 14 }}>
          <View style={[s.miniCard, { flex: 1, backgroundColor: V.ocean + '18', borderColor: V.ocean + '35' }]}>
            <View style={[s.miniIcon, { backgroundColor: V.ocean + '28' }]}>
              <Ionicons name="scan-outline" size={16} color={V.ocean} />
            </View>
            <Text style={[s.miniLabel, { color: txt2 }]}>Último escaneo</Text>
            <Text style={[s.miniValue, { color: txt1 }]}>{lastSync}</Text>
            {dashData?.timestamp && (
              <Text style={[s.miniSub, { color: txt2 }]}>
                {new Date(dashData.timestamp).toLocaleDateString('es-MX')}
              </Text>
            )}
          </View>

          <View style={[s.miniCard, { flex: 1, backgroundColor: V.mint + '18', borderColor: V.mint + '35' }]}>
            <View style={[s.miniIcon, { backgroundColor: V.mint + '28' }]}>
              <Ionicons name="wifi-outline" size={16} color={V.mint} />
            </View>
            <Text style={[s.miniLabel, { color: txt2 }]}>Estado NFC</Text>
            <Text style={[s.miniValue, { color: user?.nfcTagId ? V.mint : txt1 }]}>
              {user?.nfcTagId ? 'Activo' : '—'}
            </Text>
            <Text style={[s.miniSub, { color: txt2 }]}>
              {user?.nfcTagId ? 'Lectura OK' : 'Sin registrar'}
            </Text>
          </View>

          <View style={[s.miniCard, { flex: 1, backgroundColor: V.grape + '18', borderColor: V.grape + '35' }]}>
            <View style={[s.miniIcon, { backgroundColor: V.grape + '28' }]}>
              <Ionicons name="pulse-outline" size={16} color={V.grape} />
            </View>
            <Text style={[s.miniLabel, { color: txt2 }]}>Estado</Text>
            <Text style={[s.miniValue, { color: V.grape }]}>Online</Text>
            <Text style={[s.miniSub, { color: txt2 }]}>Braslet</Text>
          </View>
        </View>

        {/* ── NFC Details ─────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
          <View style={[s.bigCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.miniIcon, { backgroundColor: V.tangerine + '28' }]}>
                  <Ionicons name="radio-outline" size={16} color={V.tangerine} />
                </View>
                <Text style={[s.cardTitle, { color: txt1 }]}>Detalles NFC</Text>
              </View>
              <View style={[
                s.activeBadge,
                { backgroundColor: V.mint + '20', borderColor: V.mint + '45' }
              ]}>
                <View style={[s.liveBlip, { backgroundColor: V.mint }]} />
                <Text style={{ fontSize: 11, color: V.mint, fontWeight: '800' }}>
                  {user?.nfcTagId ? 'Conectado' : 'Sin registrar'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'Protocolo', value: 'ISO 14443', color: V.coral  },
                { label: 'Frecuencia', value: '13.56 MHz', color: V.ocean  },
                { label: 'Rango', value: '≤ 10 cm', color: V.mint  },
                { label: 'ID Tag', value: user?.nfcTagId ? user.nfcTagId.slice(0, 8) + '…' : '—', color: V.grape },
              ].map((item, i) => (
                <View key={i} style={[
                  s.nfcCell,
                  { backgroundColor: item.color + '14', borderColor: item.color + '30' }
                ]}>
                  <Text style={{ fontSize: 9, color: item.color, fontWeight: '800', letterSpacing: 0.5 }}>
                    {item.label.toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: txt1, marginTop: 4 }}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Recent notifications ─────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
          <View style={[s.bigCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <View style={[s.miniIcon, { backgroundColor: V.sunshine + '28' }]}>
                <Ionicons name="notifications-outline" size={16} color={V.sunshine} />
              </View>
              <Text style={[s.cardTitle, { color: txt1 }]}>Notificaciones</Text>
            </View>
            <View style={{ alignItems: 'center', paddingVertical: 20, gap: 10 }}>
              <View style={[s.emptyCircle, { backgroundColor: V.sunshine + '20' }]}>
                <Ionicons name="checkmark-circle" size={30} color={V.sunshine} />
              </View>
              <Text style={{ color: txt2, fontSize: 13 }}>Sin notificaciones recientes</Text>
            </View>
          </View>
        </View>

        {/* ── Active products ──────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[s.bigCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ marginBottom: 16 }}>
              <Text style={[s.cardTitle, { color: txt1 }]}>Productos activos</Text>
              <Text style={{ color: txt2, fontSize: 12, marginTop: 2 }}>
                {activeProducts.length === 0
                  ? 'Ningún dispositivo'
                  : `${activeProducts.length} dispositivo${activeProducts.length > 1 ? 's' : ''} activo${activeProducts.length > 1 ? 's' : ''}`}
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              {PRODUCTS.map((p) => {
                const isActive = activeProducts.includes(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => toggleProduct(p.id)}
                    activeOpacity={0.75}
                    style={[
                      s.productRow,
                      {
                        backgroundColor: isActive ? p.color + '15' : isDark ? '#1C1E32' : '#F5F6FF',
                        borderColor: isActive ? p.color + '55' : border,
                      }
                    ]}
                  >
                    <View style={[s.productIcon, { backgroundColor: p.color + (isActive ? '30' : '18') }]}>
                      <Ionicons name={p.icon as any} size={22} color={p.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.productName, { color: isActive ? p.color : txt1 }]}>{p.label}</Text>
                      <Text style={[s.productDesc, { color: txt2 }]}>{p.desc}</Text>
                    </View>
                    <View style={[
                      s.checkbox,
                      { borderColor: isActive ? p.color : border, backgroundColor: isActive ? p.color : 'transparent' }
                    ]}>
                      {isActive && <Ionicons name="checkmark" size={13} color="#FFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1,
  },
  headerSub: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  headerTitle: { fontSize: 26, fontWeight: '900', marginTop: 1 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  bigCard: { borderRadius: 24, padding: 18, borderWidth: 1.5 },
  cardTitle: { fontSize: 15, fontWeight: '900', letterSpacing: 0.2 },
  iconPill: { width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },

  // Globe
  globeWrap: { justifyContent: 'center', alignItems: 'center' },
  pin: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 20, elevation: 14,
  },
  locInfo: {
    position: 'absolute', bottom: 14, left: 16, right: 16,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  locName: { fontSize: 13, fontWeight: '700' },
  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1,
  },

  // Mini cards
  miniCard: { borderRadius: 18, padding: 14, borderWidth: 1.5 },
  miniIcon: { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  miniLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  miniValue: { fontSize: 16, fontWeight: '900', marginTop: 3 },
  miniSub: { fontSize: 9, marginTop: 2 },

  // NFC cells
  nfcCell: {
    flex: 1, minWidth: '45%', borderRadius: 14, padding: 12, borderWidth: 1.5,
  },

  // Badges
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5,
  },
  liveBlip: { width: 7, height: 7, borderRadius: 3.5 },

  // Products
  productRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 12, borderWidth: 1.5,
  },
  productIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 14, fontWeight: '800' },
  productDesc: { fontSize: 12, marginTop: 1 },
  checkbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },

  emptyCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});
