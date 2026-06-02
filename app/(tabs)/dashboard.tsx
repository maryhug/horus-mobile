import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import type { DashboardData } from '../../types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Vibrant palette ────────────────────────────────────────────────────────
const V = {
  coral:    '#FF6B9D',
  ocean:    '#4B8EF0',
  tangerine:'#FF8C42',
  mint:     '#34D399',
  grape:    '#A78BFA',
  sunshine: '#FCD34D',
};

// ── Health Orbit constants ─────────────────────────────────────────────────
const ORBIT_R = 112;
const BUBBLE_SIZE = 70;
const CENTER_SIZE = 102;
const ORBIT_CONTAINER = ORBIT_R * 2 + BUBBLE_SIZE; // 294

const METRICS = [
  { id: 'heart',    label: 'Frec. Cardíaca', unit: 'bpm',   color: V.coral,     icon: 'heart',     angle: -90 },
  { id: 'steps',    label: 'Pasos hoy',      unit: 'pasos', color: V.ocean,     icon: 'footsteps', angle: 0   },
  { id: 'calories', label: 'Calorías',       unit: 'kcal',  color: V.tangerine, icon: 'flame',     angle: 90  },
  { id: 'activity', label: 'Actividad',      unit: 'min',   color: V.mint,      icon: 'pulse',     angle: 180 },
];

// Pre-computed random-ish bar heights (stable across renders)
const BAR_HEIGHTS = Array.from({ length: 24 }, (_, i) =>
  10 + ((i * 37 + 19) % 71)
);
const BAR_COLORS_CYCLE = [V.coral, V.grape, V.ocean, V.mint, V.tangerine, V.sunshine];

function bubblePos(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cx = ORBIT_CONTAINER / 2;
  const cy = ORBIT_CONTAINER / 2;
  return {
    left: cx + ORBIT_R * Math.cos(rad) - BUBBLE_SIZE / 2,
    top:  cy + ORBIT_R * Math.sin(rad) - BUBBLE_SIZE / 2,
  };
}

export default function DashboardScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnims = useRef(METRICS.map(() => new Animated.Value(1))).current;
  const livePulse  = useRef(new Animated.Value(1)).current;

  const { data, loading, refetch } = useApi<DashboardData>(
    () => apiClient.get<DashboardData>('/dashboard/info').then(r => r.data)
  );

  // ── Pulsing live dot ──────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Metric selection ──────────────────────────────────────────────────
  function selectMetric(idx: number) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      setSelectedIdx(idx);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
    Animated.sequence([
      Animated.timing(scaleAnims[idx], { toValue: 1.28, duration: 110, useNativeDriver: true }),
      Animated.spring(scaleAnims[idx], { toValue: 1, friction: 3.5, tension: 120, useNativeDriver: true }),
    ]).start();
  }

  const metric = METRICS[selectedIdx];
  const syncTime = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const avatarInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'H'
    : 'H';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.firstName ?? 'usuario';

  // ── Theme tokens ──────────────────────────────────────────────────────
  const bg       = isDark ? '#0E0F1A' : '#F7F8FF';
  const cardBg   = isDark ? '#181928' : '#FFFFFF';
  const txt1     = isDark ? '#EEF2FF' : '#1A1B30';
  const txt2     = isDark ? '#6B7299' : '#8891B8';
  const border   = isDark ? '#252640' : '#E8EAF6';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: cardBg, borderBottomColor: border }]}>
        <View>
          <Text style={[s.greeting, { color: txt2 }]}>{greeting} 👋</Text>
          <Text style={[s.headerName, { color: txt1 }]}>{firstName}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[s.iconBtn, { backgroundColor: isDark ? '#20213A' : '#EEF0FF', borderColor: border }]}
          >
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={txt2} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.iconBtn, { backgroundColor: isDark ? '#20213A' : '#EEF0FF', borderColor: border }]}>
            <Ionicons name="notifications-outline" size={18} color={txt2} />
          </TouchableOpacity>
          <View style={[s.avatar, { backgroundColor: metric.color }]}>
            <Text style={s.avatarTxt}>{avatarInitials}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={V.coral} />}
      >

        {/* ── Big page title ─────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 22, paddingTop: 26, marginBottom: 26 }}>
          <Text style={[s.pageTitle, { color: txt1 }]}>
            Panel de{'\n'}<Text style={{ color: metric.color }}>Salud</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <Animated.View style={[s.liveBlip, { backgroundColor: V.mint, transform: [{ scale: livePulse }] }]} />
            <Text style={{ color: txt2, fontSize: 13, fontWeight: '700' }}>
              En vivo · {syncTime}
            </Text>
          </View>
        </View>

        {/* ── Health Orbit ────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <Text style={[s.orbitLabel, { color: txt2 }]}>MÉTRICAS DE SALUD</Text>

          <View style={{ width: ORBIT_CONTAINER, height: ORBIT_CONTAINER, position: 'relative' }}>

            {/* Decorative orbit ring */}
            <View style={[
              s.orbitRing,
              {
                width:  ORBIT_CONTAINER - 4,
                height: ORBIT_CONTAINER - 4,
                left: 2, top: 2,
                borderColor: metric.color + '22',
              }
            ]} />

            {/* Center circle */}
            <View style={[
              s.orbitCenter,
              {
                left:        ORBIT_CONTAINER / 2 - CENTER_SIZE / 2,
                top:         ORBIT_CONTAINER / 2 - CENTER_SIZE / 2,
                backgroundColor: cardBg,
                borderColor: metric.color + '55',
                shadowColor: metric.color,
              }
            ]}>
              <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', gap: 2 }}>
                <View style={[s.centerIconWrap, { backgroundColor: metric.color + '25' }]}>
                  <Ionicons name={metric.icon as any} size={20} color={metric.color} />
                </View>
                <Text style={[s.centerValue, { color: txt1 }]}>—</Text>
                <Text style={[s.centerUnit, { color: txt2 }]}>{metric.unit}</Text>
              </Animated.View>
            </View>

            {/* Metric bubbles */}
            {METRICS.map((m, i) => {
              const pos = bubblePos(m.angle);
              const active = i === selectedIdx;
              return (
                <Animated.View
                  key={m.id}
                  style={[
                    s.bubble,
                    {
                      left:            pos.left,
                      top:             pos.top,
                      backgroundColor: active ? m.color : isDark ? '#1C1E32' : '#F0F2FF',
                      borderColor:     m.color + (active ? 'FF' : '55'),
                      shadowColor:     m.color,
                      shadowOpacity:   active ? 0.45 : 0.12,
                      transform:       [{ scale: scaleAnims[i] }],
                    }
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => selectMetric(i)}
                    activeOpacity={0.75}
                    style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: 3 }}
                  >
                    <Ionicons name={m.icon as any} size={22} color={active ? '#FFF' : m.color} />
                    <Text style={[s.bubbleLbl, { color: active ? '#FFF' : txt2 }]}>
                      {m.label.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Selected metric name */}
          <Animated.Text style={[s.orbitMetricName, { color: metric.color, opacity: fadeAnim }]}>
            {metric.label}
          </Animated.Text>

          {/* Dot indicators */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
            {METRICS.map((m, i) => (
              <View key={m.id} style={[
                s.dotIndicator,
                {
                  backgroundColor: i === selectedIdx ? m.color : (isDark ? '#252640' : '#E0E4FF'),
                  width: i === selectedIdx ? 20 : 8,
                }
              ]} />
            ))}
          </View>
        </View>

        {/* ── Status row (3 colorful mini-cards) ─────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 }}>
          {/* Device */}
          <View style={[s.miniCard, { flex: 1, backgroundColor: V.ocean + '1A', borderColor: V.ocean + '35' }]}>
            <View style={[s.miniIcon, { backgroundColor: V.ocean + '28' }]}>
              <Ionicons name="wifi" size={15} color={V.ocean} />
            </View>
            <Text style={[s.miniLabel, { color: txt2 }]}>Dispositivo</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <View style={[s.onlineDot, { backgroundColor: V.mint }]} />
              <Text style={[s.miniValue, { color: txt1 }]}>
                {loading ? '...' : data ? 'Online' : '—'}
              </Text>
            </View>
            <Text style={[s.miniSub, { color: txt2 }]}>v2.4.1</Text>
          </View>

          {/* Battery */}
          <View style={[s.miniCard, { flex: 1, backgroundColor: V.mint + '1A', borderColor: V.mint + '35' }]}>
            <View style={[s.miniIcon, { backgroundColor: V.mint + '28' }]}>
              <Ionicons name="battery-charging" size={15} color={V.mint} />
            </View>
            <Text style={[s.miniLabel, { color: txt2 }]}>Batería</Text>
            <Text style={[s.miniValue, { color: txt1, marginTop: 3 }]}>—</Text>
            <View style={[s.batteryTrack, { backgroundColor: isDark ? '#20213A' : '#DCFCE7' }]}>
              <View style={[s.batteryFill, { width: '0%', backgroundColor: V.mint }]} />
            </View>
          </View>

          {/* Sync */}
          <View style={[s.miniCard, { flex: 1, backgroundColor: V.grape + '1A', borderColor: V.grape + '35' }]}>
            <View style={[s.miniIcon, { backgroundColor: V.grape + '28' }]}>
              <Ionicons name="time-outline" size={15} color={V.grape} />
            </View>
            <Text style={[s.miniLabel, { color: txt2 }]}>Sync</Text>
            <Text style={[s.miniValue, { color: txt1, marginTop: 3 }]}>{syncTime}</Text>
            <Text style={[s.miniSub, { color: txt2 }]}>hoy</Text>
          </View>
        </View>

        {/* ── Activity chart ──────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={[s.bigCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <View>
                <Text style={[s.cardTitle, { color: txt1 }]}>Actividad 24h</Text>
                <Text style={[s.cardSub, { color: txt2 }]}>Conecta tu manilla para ver datos reales</Text>
              </View>
              <View style={[s.livePill, { backgroundColor: V.mint + '22', borderColor: V.mint + '44' }]}>
                <Animated.View style={[s.liveBlip, { backgroundColor: V.mint, transform: [{ scale: livePulse }] }]} />
                <Text style={{ color: V.mint, fontSize: 11, fontWeight: '800' }}>LIVE</Text>
              </View>
            </View>

            {/* Colorful bars */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 3 }}>
              {BAR_HEIGHTS.map((h, i) => {
                const c = BAR_COLORS_CYCLE[i % BAR_COLORS_CYCLE.length];
                return (
                  <View key={i} style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <View style={{
                      height: h,
                      backgroundColor: c + '40',
                      borderRadius: 5,
                      borderTopLeftRadius: 5,
                      borderTopRightRadius: 5,
                      borderTopWidth: 2.5,
                      borderTopColor: c,
                    }} />
                  </View>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              {['00h', '06h', '12h', '18h', '24h'].map(h => (
                <Text key={h} style={{ color: txt2, fontSize: 10, fontWeight: '600' }}>{h}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* ── Quick actions row ────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={[s.sectionHeading, { color: txt1 }]}>Acciones rápidas</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            {[
              { icon: 'qr-code-outline',      label: 'ID Médico', color: V.coral  },
              { icon: 'sparkles-outline',     label: 'Asistente', color: V.grape  },
              { icon: 'folder-open-outline',  label: 'Archivos',  color: V.ocean  },
              { icon: 'person-circle-outline',label: 'Perfil',    color: V.mint   },
            ].map((item, i) => (
              <View key={i} style={[
                s.quickAction,
                { backgroundColor: item.color + '1A', borderColor: item.color + '35' }
              ]}>
                <View style={[s.quickIcon, { backgroundColor: item.color + '28' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[s.quickLabel, { color: item.color }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Alerts card ─────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[s.bigCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <View style={[s.miniIcon, { backgroundColor: V.sunshine + '28' }]}>
                <Ionicons name="shield-checkmark" size={16} color={V.sunshine} />
              </View>
              <Text style={[s.cardTitle, { color: txt1 }]}>Alertas recientes</Text>
            </View>
            <View style={{ alignItems: 'center', paddingVertical: 20, gap: 10 }}>
              <View style={[s.emptyCircle, { backgroundColor: V.sunshine + '20' }]}>
                <Ionicons name="checkmark-circle" size={32} color={V.sunshine} />
              </View>
              <Text style={[s.cardSub, { color: txt2 }]}>Todo en orden, sin alertas</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1,
  },
  greeting: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  headerName: { fontSize: 22, fontWeight: '900', marginTop: 1 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  pageTitle: { fontSize: 40, fontWeight: '900', lineHeight: 48, letterSpacing: -1 },
  liveBlip: { width: 8, height: 8, borderRadius: 4 },

  // Orbit
  orbitLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 20 },
  orbitRing: { position: 'absolute', borderRadius: 999, borderWidth: 1.5, borderStyle: 'dashed' },
  orbitCenter: {
    position: 'absolute', width: CENTER_SIZE, height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10,
  },
  centerIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  centerValue: { fontSize: 20, fontWeight: '900', lineHeight: 24 },
  centerUnit: { fontSize: 10, fontWeight: '700' },
  bubble: {
    position: 'absolute', width: BUBBLE_SIZE, height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2, borderWidth: 2.5,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 8, overflow: 'hidden',
  },
  bubbleLbl: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  orbitMetricName: { fontSize: 15, fontWeight: '800', marginTop: 6 },
  dotIndicator: { height: 8, borderRadius: 4 },

  // Mini cards
  miniCard: { borderRadius: 18, padding: 13, borderWidth: 1.5 },
  miniIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 7 },
  miniLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  miniValue: { fontSize: 15, fontWeight: '900' },
  miniSub: { fontSize: 9, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  batteryTrack: { height: 4, borderRadius: 2, marginTop: 7, overflow: 'hidden' },
  batteryFill: { height: '100%', borderRadius: 2 },

  // Big card
  bigCard: { borderRadius: 24, padding: 20, borderWidth: 1.5 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  cardSub: { fontSize: 12, marginTop: 3 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1.5,
  },

  // Quick actions
  sectionHeading: { fontSize: 18, fontWeight: '900' },
  quickAction: { flex: 1, borderRadius: 18, padding: 12, alignItems: 'center', gap: 6, borderWidth: 1.5 },
  quickIcon: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4, textAlign: 'center' },

  emptyCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});
