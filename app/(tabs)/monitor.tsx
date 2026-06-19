import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, RefreshControl, useWindowDimensions, Linking, Alert,
  Platform, Modal, ActivityIndicator, TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

let NfcManager: any = null;
let NfcTech: any = {};

try {
  if (Platform.OS !== 'web') {
    const NfcLib = require('react-native-nfc-manager');
    NfcManager = NfcLib.default || NfcLib;
    NfcTech = NfcLib.NfcTech || NfcLib.default?.NfcTech || {};
  }
} catch (error) {
  // Ignore safely when not in native build
}

import { useApi } from '../../hooks/useApi';
import { apiClient, getErrorMessage } from '../../services/api';
import type { DashboardData, AppNotification } from '../../types/api';
import { EmotionShape } from '../../components/EmotionShape';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { FONT } from '../../constants/fonts';
import { useAuth } from '../../contexts/AuthContext';


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

// ── Notification helpers ───────────────────────────────────────────────────
const NOTIF_ROW_H = 64; // height per notification row (px)
const VISIBLE     = 3;  // rows visible before scroll

function fmtTs(ts: AppNotification['timestamp']): string {
  try {
    const ms = typeof ts === 'string'
      ? new Date(ts).getTime()
      : (ts as { _seconds: number })._seconds * 1000;
    const d = new Date(ms);
    const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'pm' : 'am'}`;
  } catch { return ''; }
}

function NotifCard({ notifications, loading, PRIMARY, MUTED, CARD, blobFloat, t }: {
  notifications: AppNotification[];
  loading: boolean;
  PRIMARY: string; MUTED: string; CARD: string;
  blobFloat: Animated.Value;
  t: any;
}) {
  if (!loading && notifications.length === 0) {
    return (
      <View style={[{ backgroundColor: CARD, borderRadius: 28, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        alignItems: 'center', paddingVertical: 32, gap: 10 }]}>
        <Animated.View style={{ transform: [{ translateY: blobFloat }] }}>
          <EmotionShape kind="flower" color="pink" size={60} eyes />
        </Animated.View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: PRIMARY }}>{t.monitorNoNotifs}</Text>
        <Text style={{ fontSize: 12, color: MUTED }}>{t.monitorNoNotifsDesc}</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: CARD, borderRadius: 28, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
      maxHeight: NOTIF_ROW_H * (VISIBLE + 0.4) }}>
      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={notifications.length > VISIBLE}>
        {notifications.map((n, idx) => (
          <NotifRow key={n.id ?? idx} n={n} idx={idx} PRIMARY={PRIMARY} MUTED={MUTED} />
        ))}
      </ScrollView>
    </View>
  );
}

function NotifRow({ n, idx, PRIMARY, MUTED }: {
  n: AppNotification; idx: number; PRIMARY: string; MUTED: string;
}) {
  const isQr   = n.type === 'qr_scan';
  const iconBg = isQr ? `${BLUE}40` : '#FAB2D340';
  const icon   = isQr ? 'qr-code-outline' : 'heart-outline';
  const ts     = fmtTs(n.timestamp);
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-start', gap: 12,
      paddingHorizontal: 20, paddingVertical: 12, minHeight: NOTIF_ROW_H,
      borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(136,130,110,0.15)',
    }}>
      <View style={{ width: 36, height: 36, borderRadius: 12,
        backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ionicons name={icon as any} size={16} color={PRIMARY} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: PRIMARY, marginBottom: 2 }} numberOfLines={1}>
          {n.title}
        </Text>
        <Text style={{ fontSize: 12, color: MUTED, lineHeight: 17 }} numberOfLines={2}>
          {n.body}
        </Text>
      </View>
      {!!ts && (
        <Text style={{ fontSize: 11, color: MUTED, flexShrink: 0, marginTop: 2 }}>{ts}</Text>
      )}
    </View>
  );
}

// ── Device types ───────────────────────────────────────────────────────────
type DeviceType = 'CARD' | 'BRACELET' | 'SMARTWATCH';
type ApiDevice  = { type: DeviceType; identifier: string | null; registeredAt: string | null; active: boolean };

function deviceMeta(type: DeviceType): { name: string; desc: string; icon: any } {
  switch (type) {
    case 'CARD':       return { name: 'Tarjeta NFC Horus',    desc: 'Acceso de respaldo · 13.56 MHz', icon: 'card-outline'    };
    case 'BRACELET':   return { name: 'Brazalete Horus Pro',  desc: 'Sensor principal · NFC + GPS',   icon: 'fitness-outline' };
    case 'SMARTWATCH': return { name: 'Horus Watch',          desc: 'Señales activas en tiempo real', icon: 'watch-outline'   };
  }
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function MonitorScreen() {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, isDark } = useAppTheme();
  const s = React.useMemo(
    () => makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN),
    [isDark]
  );
  const { t } = useLanguage();
  const { updateUser } = useAuth();

  const { width: screenW } = useWindowDimensions();
  const blobFloat = useRef(new Animated.Value(0)).current;
  const pinBob    = useRef(new Animated.Value(0)).current;

  // GPS state
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLabel,  setGpsLabel]  = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);

  // Devices state
  const [devices, setDevices]         = useState<ApiDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  // NFC activation states
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcStatus, setNfcStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [nfcErrorMsg, setNfcErrorMsg] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualId, setManualId] = useState('');

  const refetchDevices = useCallback(() => {
    setDevicesLoading(true);
    apiClient.get<{ devices: ApiDevice[] }>('/monitor/devices')
      .then(r => setDevices(r.data.devices))
      .catch(() => {})
      .finally(() => setDevicesLoading(false));
  }, []);

  const handleRegisterCard = async (tagId: string) => {
    try {
      setNfcStatus('scanning');
      await apiClient.post('/monitor/activate-card', { nfcTagId: tagId });
      setNfcStatus('success');
      updateUser({ nfcTagId: tagId });
      setTimeout(() => {
        setNfcScanning(false);
        setNfcStatus('idle');
        refetchDevices();
      }, 1500);
    } catch (err: any) {
      const errMsg = getErrorMessage(err);
      setNfcStatus('error');
      setNfcErrorMsg(errMsg);
    }
  };

  const startNfcScan = async () => {
    let supported = false;
    if (Platform.OS !== 'web' && NfcManager) {
      try {
        supported = await NfcManager.isSupported();
      } catch {
        supported = false;
      }
    }

    if (!supported) {
      // Para pruebas en Expo Go: abrimos el lector real y simulamos la lectura nativa tras 3 segundos
      setNfcStatus('scanning');
      setNfcScanning(true);
      setTimeout(async () => {
        const simulatedTagId = 'HORUS-TEST-8899';
        try {
          await apiClient.post('/monitor/activate-card', { nfcTagId: simulatedTagId });
          setNfcStatus('success');
          updateUser({ nfcTagId: simulatedTagId });
          setTimeout(() => {
            setNfcScanning(false);
            setNfcStatus('idle');
            refetchDevices();
          }, 1500);
        } catch (err: any) {
          setNfcStatus('error');
          setNfcErrorMsg(getErrorMessage(err));
        }
      }, 3000);
      return;
    }

    // Validar si el NFC está encendido en Android
    if (Platform.OS === 'android' && NfcManager) {
      try {
        const enabled = await NfcManager.isEnabled();
        if (!enabled) {
          Alert.alert(
            'NFC Desactivado',
            'Por favor, activa el NFC en los ajustes de tu teléfono para vincular la tarjeta.',
            [
              { text: 'Ajustes', onPress: () => NfcManager.goToNfcSetting().catch(() => {}) },
              { text: 'Cancelar', style: 'cancel' }
            ]
          );
          return;
        }
      } catch (err) {
        console.warn('Error al verificar NFC habilitado:', err);
      }
    }

    try {
      setNfcStatus('scanning');
      setNfcScanning(true);
      await NfcManager.start();

      // Utilizar tecnologías compatibles según la plataforma
      const techList = Platform.OS === 'ios'
        ? [NfcTech.MifareIOS, NfcTech.Ndef]
        : [NfcTech.NfcA, NfcTech.Ndef];

      await NfcManager.requestTechnology(techList);
      const tag = await NfcManager.getTag();
      let rawTagId = tag?.id;

      if (!rawTagId) {
        throw new Error('No se pudo leer el ID de la tarjeta.');
      }

      // Normalizar de forma robusta el ID del tag NFC (soporta string, byte array o buffer/objeto)
      let normalizedTagId = '';
      if (typeof rawTagId === 'string') {
        normalizedTagId = rawTagId;
      } else if (Array.isArray(rawTagId)) {
        normalizedTagId = rawTagId.map((b: any) => {
          const num = Number(b);
          return (isNaN(num) ? 0 : num).toString(16).padStart(2, '0');
        }).join('');
      } else if (rawTagId && typeof rawTagId === 'object') {
        try {
          const arr = Array.from(rawTagId as any);
          normalizedTagId = arr.map((b: any) => {
            const num = Number(b);
            return (isNaN(num) ? 0 : num).toString(16).padStart(2, '0');
          }).join('');
        } catch {
          normalizedTagId = JSON.stringify(rawTagId);
        }
      } else {
        normalizedTagId = String(rawTagId);
      }

      normalizedTagId = normalizedTagId.toUpperCase().trim();

      if (normalizedTagId) {
        await handleRegisterCard(normalizedTagId);
      } else {
        throw new Error('El ID de la tarjeta quedó vacío después de la normalización.');
      }
    } catch (err: any) {
      console.warn('NFC Scan Error:', err);
      const errStr = err?.toString() || '';
      if (errStr.includes('UserCancel') || errStr.includes('cancel')) {
        setNfcScanning(false);
        setNfcStatus('idle');
        return;
      }
      setNfcStatus('error');
      setNfcErrorMsg(err?.message || 'Error al escanear tarjeta NFC');
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {}
    }
  };

  const handleManualRegister = async () => {
    const cleanId = manualId.trim();
    if (!cleanId) {
      Alert.alert('Error', 'Por favor ingresa un ID válido.');
      return;
    }
    try {
      await apiClient.post('/monitor/activate-card', { nfcTagId: cleanId });
      updateUser({ nfcTagId: cleanId });
      Alert.alert(t.nfcAlertSuccess, t.nfcAlertSuccessDesc);
      setShowManualInput(false);
      setManualId('');
      refetchDevices();
    } catch (err: any) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const { data, loading, refetch } = useApi<DashboardData>(
    () => apiClient.get<DashboardData>('/dashboard/info').then(r => r.data)
  );

  // Refetch whenever screen comes into focus
  useFocusEffect(useCallback(() => { refetch(); refetchDevices(); }, [refetch, refetchDevices]));


  const syncTime = (() => {
    if (!data?.timestamp) return '10:41';
    const d = new Date(data.timestamp);
    const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
    return `${h.toString().padStart(2, '0')}:${m}`;
  })();

  // Fetch GPS on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setGpsLoading(false); return; }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude: lat, longitude: lng } = pos.coords;
        setGpsCoords({ lat, lng });
        // Reverse geocode to get a readable label
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geo.length > 0) {
          const g = geo[0];
          const parts = [g.district ?? g.subregion ?? g.city, g.city !== (g.district ?? g.subregion) ? g.city : null, g.region].filter(Boolean);
          setGpsLabel(parts.join(', '));
        }
      } catch {
        // silently ignore — show coords if available
      } finally {
        setGpsLoading(false);
      }
    })();
  }, []);

  // Fetch user devices on mount
  useEffect(() => {
    apiClient.get<{ devices: ApiDevice[] }>('/monitor/devices')
      .then(r => setDevices(r.data.devices))
      .catch(() => {})
      .finally(() => setDevicesLoading(false));
  }, []);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(blobFloat, { toValue: -8, duration: 1500, useNativeDriver: true }),
      Animated.timing(blobFloat, { toValue:  0, duration: 1500, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pinBob, { toValue: -7, duration: 1200, easing: _t => Math.sin(_t * Math.PI / 2), useNativeDriver: true }),
      Animated.timing(pinBob, { toValue:  0, duration: 1200, easing: _t => 1 - Math.cos(_t * Math.PI / 2), useNativeDriver: true }),
    ])).start();
  }, []);

  const openMaps = () => {
    if (!gpsCoords) {
      Alert.alert('Sin ubicación', 'No se pudo obtener la ubicación del dispositivo.');
      return;
    }
    const { lat, lng } = gpsCoords;
    Alert.alert(
      'Abrir mapa',
      '¿Dónde deseas ver la ubicación?',
      [
        { text: 'Google Maps', onPress: () => Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`) },
        { text: 'Apple Maps',  onPress: () => Linking.openURL(`maps://?ll=${lat},${lng}`) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const coordsText = gpsLoading
    ? t.monitorWaitingGps
    : gpsCoords
      ? `${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`
      : t.monitorWaitingGps;

  const cardDevice = devices.find(d => d.type === 'CARD');

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={GREEN} />}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={{ gap: 2 }}>
          <Text style={s.title}>{t.monitorTitle}</Text>
          <Text style={s.subtitle}>{t.monitorSubtitle}</Text>
        </View>

        {/* ── Live location card ───────────────────────────────────────── */}
        <TouchableOpacity activeOpacity={0.9} onPress={openMaps} style={[s.mapCard, { width: screenW - 40 }]}>
          {Array.from({ length: Math.ceil((screenW - 40) / 28) }).map((_, i) => (
            <View key={`v${i}`} style={[s.gridLineV, { left: i * 28 }]} />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <View key={`h${i}`} style={[s.gridLineH, { top: i * 28 }]} />
          ))}

          <View style={s.mapTopRow}>
            <View style={s.livePill}>
              <Text style={s.livePillText}>{t.monitorLiveLocation}</Text>
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

          <Text style={s.mapCity}>{gpsLabel ?? (gpsLoading ? '...' : 'Ubicación actual')}</Text>
          <Text style={s.mapGps}>{coordsText}</Text>
          {!gpsLoading && gpsCoords && (
            <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.6 }}>
                <Ionicons name="map-outline" size={12} color={BLUE_FG} />
                <Text style={{ fontSize: 11, color: BLUE_FG, fontWeight: '600' }}>Toca para abrir en mapa</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Estado NFC ──────────────────────────────────────────────── */}
        {cardDevice && (
          <View style={s.card}>
            <View style={s.nfcRow}>
              <View style={s.nfcIconBox}>
                <NfcIcon size={20} color={GREEN_FG} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{t.monitorNfcTitle}</Text>
                <Text style={s.cardSub}>{t.monitorNfcSub}</Text>
              </View>
              <View style={s.activoBadge}>
                <Text style={s.activoBadgeText}>{t.monitorActive}</Text>
              </View>
            </View>
            <View style={s.chipGrid}>
              {[
                { label: t.monitorProtocol,  value: 'ISO 14443' },
                { label: t.monitorFrequency, value: '13.56 MHz' },
                { label: t.monitorRange,     value: '≤ 10 cm'   },
                { label: t.monitorTagId,     value: cardDevice.identifier ?? '—' },
              ].map(c => (
                <View key={c.label} style={s.chip}>
                  <Text style={s.chipLabel}>{c.label}</Text>
                  <Text style={s.chipValue}>{c.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Notificaciones recientes ─────────────────────────────────── */}
        <Text style={s.sectionTitle}>{t.monitorRecentNotifs}</Text>
        <NotifCard
          notifications={data?.notifications ?? []}
          loading={loading}
          PRIMARY={PRIMARY} MUTED={MUTED} CARD={CARD}
          blobFloat={blobFloat}
          t={t}
        />

        {/* ── Mis dispositivos ─────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>{t.monitorActiveProducts}</Text>
        {devicesLoading ? (
          <View style={[s.productCard, { justifyContent: 'center' }]}>
            <Text style={[s.productDesc, { textAlign: 'center', flex: 1 }]}>{t.monitorWaitingGps}</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {devices.map((d, idx) => {
              const meta = deviceMeta(d.type);
              return (
                <View key={`${d.type}-${idx}`} style={s.productCard}>
                  <View style={s.productIconWrap}>
                    <Ionicons name={meta.icon} size={20} color={PRIMARY} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.productName}>{meta.name}</Text>
                    <Text style={s.productDesc}>
                      {d.identifier ? d.identifier : meta.desc}
                    </Text>
                  </View>
                  <View style={s.checkCircle}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                </View>
              );
            })}

            {/* Tarjeta de vinculación si no hay tarjeta NFC activa */}
            {!devices.some(d => d.type === 'CARD') && (
              <TouchableOpacity
                style={[s.card, s.activationCard]}
                onPress={startNfcScan}
                activeOpacity={0.85}
              >
                <View style={s.activationContent}>
                  <View style={[s.productIconWrap, { backgroundColor: `${GREEN}15` }]}>
                    <Ionicons name="card-outline" size={20} color={GREEN} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.activationTitle}>{t.monitorActivateCardTitle}</Text>
                    <Text style={s.activationDesc}>{t.monitorActivateCardDesc}</Text>
                  </View>
                  <View style={[s.activationBtn, { backgroundColor: PRIMARY }]}>
                    <Text style={[s.activationBtnText, { color: BG }]}>{t.monitorActivateCardBtn}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
        {/* ── Números de emergencia Colombia ────────────────────────────── */}
        <Text style={s.sectionTitle}>Emergencias Colombia</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { num: '123', label: 'Emergencias' },
            { num: '132', label: 'Cruz Roja'   },
            { num: '119', label: 'Bomberos'    },
          ].map(({ num, label }) => (
            <TouchableOpacity
              key={num}
              onPress={() => Linking.openURL(`tel:${num}`)}
              activeOpacity={0.75}
              style={{ flex: 1, backgroundColor: CARD, borderRadius: 20, paddingVertical: 14, alignItems: 'center', gap: 4,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}
            >
              <Text style={{ fontSize: 22, fontFamily: FONT.displayBold, color: PRIMARY }}>{num}</Text>
              <Text style={{ fontSize: 11, fontFamily: FONT.sansMedium, color: MUTED }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* ── NFC Scanning Modal ── */}
      <Modal visible={nfcScanning} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: CARD }]}>
            {nfcStatus === 'scanning' && (
              <View style={s.modalInner}>
                <ActivityIndicator size="large" color={PRIMARY} style={{ marginBottom: 16 }} />
                <Text style={s.modalTitle}>{t.nfcModalScanningTitle}</Text>
                <Text style={s.modalDesc}>{t.nfcModalScanningDesc}</Text>
                <TouchableOpacity 
                  style={[s.modalBtn, { backgroundColor: MUTED_BG }]} 
                  onPress={async () => {
                    try { await NfcManager.cancelTechnologyRequest(); } catch {}
                    setNfcScanning(false);
                    setNfcStatus('idle');
                  }}
                >
                  <Text style={[s.modalBtnText, { color: PRIMARY }]}>{t.cancel}</Text>
                </TouchableOpacity>
              </View>
            )}

            {nfcStatus === 'success' && (
              <View style={s.modalInner}>
                <View style={[s.iconStatusWrap, { backgroundColor: `${GREEN}15` }]}>
                  <Ionicons name="checkmark-circle" size={56} color={GREEN} />
                </View>
                <Text style={s.modalTitle}>{t.nfcAlertSuccess}</Text>
                <Text style={s.modalDesc}>{t.nfcAlertSuccessDesc}</Text>
              </View>
            )}

            {nfcStatus === 'error' && (
              <View style={s.modalInner}>
                <View style={[s.iconStatusWrap, { backgroundColor: '#FF3B3015' }]}>
                  <Ionicons name="alert-circle" size={56} color="#FF3B30" />
                </View>
                <Text style={s.modalTitle}>Error de vinculación</Text>
                <Text style={s.modalDesc}>{nfcErrorMsg}</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' }}>
                  <TouchableOpacity 
                    style={[s.modalBtn, { backgroundColor: MUTED_BG, flex: 1 }]} 
                    onPress={() => {
                      setNfcScanning(false);
                      setNfcStatus('idle');
                    }}
                  >
                    <Text style={[s.modalBtnText, { color: PRIMARY }]}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[s.modalBtn, { backgroundColor: PRIMARY, flex: 1 }]} 
                    onPress={startNfcScan}
                  >
                    <Text style={[s.modalBtnText, { color: BG }]}>Reintentar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Manual Simulation Modal (for Web / Simulator) ── */}
      <Modal visible={showManualInput} transparent animationType="fade" onRequestClose={() => setShowManualInput(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: CARD }]}>
            <View style={s.modalInner}>
              <View style={[s.iconStatusWrap, { backgroundColor: `${PRIMARY}15` }]}>
                <Ionicons name="hardware-chip" size={40} color={PRIMARY} />
              </View>
              <Text style={s.modalTitle}>Simulador de Tarjeta NFC</Text>
              <Text style={s.modalDesc}>El NFC no está disponible en este entorno. Ingresa un ID de tag ficticio para simular la vinculación.</Text>
              
              <TextInput
                style={[s.textInput, { borderColor: `${PRIMARY}20`, color: PRIMARY, backgroundColor: MUTED_BG }]}
                placeholder="Ej: HORUS-TAG-9988"
                placeholderTextColor={MUTED}
                value={manualId}
                onChangeText={setManualId}
                autoCapitalize="characters"
              />

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' }}>
                <TouchableOpacity 
                  style={[s.modalBtn, { backgroundColor: MUTED_BG, flex: 1 }]} 
                  onPress={() => {
                    setShowManualInput(false);
                    setManualId('');
                  }}
                >
                  <Text style={[s.modalBtnText, { color: PRIMARY }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[s.modalBtn, { backgroundColor: PRIMARY, flex: 1 }]} 
                  onPress={handleManualRegister}
                >
                  <Text style={[s.modalBtnText, { color: BG }]}>Vincular</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
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
      backgroundColor: `${GREEN}25`, borderRadius: 999,
      paddingHorizontal: 12, paddingVertical: 5,
    },
    activoBadgeText: { fontSize: 12, fontWeight: '700', color: GREEN },
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
    activationCard: {
      borderWidth: 1.5,
      borderColor: `${PRIMARY}20`,
      borderStyle: 'dashed',
      padding: 16,
      borderRadius: 20,
    },
    activationContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    activationTitle: {
      fontSize: 14,
      fontFamily: FONT.displayBold,
      color: PRIMARY,
    },
    activationDesc: {
      fontSize: 12,
      fontFamily: FONT.sansRegular,
      color: MUTED,
      marginTop: 2,
    },
    activationBtn: {
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 7,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activationBtnText: {
      fontSize: 12,
      fontFamily: FONT.displayBold,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      borderRadius: 28,
      padding: 24,
      width: '100%',
      maxWidth: 340,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    modalInner: {
      width: '100%',
      alignItems: 'center',
      gap: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: FONT.displayBold,
      color: PRIMARY,
      textAlign: 'center',
    },
    modalDesc: {
      fontSize: 13,
      fontFamily: FONT.sansRegular,
      color: MUTED,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 8,
    },
    modalBtn: {
      borderRadius: 14,
      height: 46,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    modalBtnText: {
      fontSize: 14,
      fontFamily: FONT.displayBold,
    },
    iconStatusWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderRadius: 14,
      height: 48,
      width: '100%',
      paddingHorizontal: 16,
      fontSize: 14,
      fontFamily: FONT.sansMedium,
      textAlign: 'center',
      marginBottom: 8,
    },
  });
}

