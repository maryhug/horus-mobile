import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Modal, Alert, Animated, ActivityIndicator, Image, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../contexts/AuthContext';
import { useAssistant, ASSISTANT_DATA, type AssistantId } from '../hooks/useAssistant';
import { useVoice, VOICE_DATA, VOICE_IDS, PREVIEW_TEXT, type VoiceId } from '../hooks/useVoice';
import { FONT } from '../constants/fonts';
import { apiClient, getErrorMessage } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';
import { useLanguage, type Language } from '../contexts/LanguageContext';
import { registerForPushNotifications } from '../services/notificationService';

// ── SVG Icons ──────────────────────────────────────────────────────────────
const sw = { strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function Icon({ size = 18, children }: { size?: number; children: React.ReactNode }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</Svg>;
}
const ChevronLeft = ({ c, s = 18 }: { c: string; s?: number }) => <Icon size={s}><Path d="m15 18-6-6 6-6" stroke={c} {...sw} /></Icon>;
const ChevronRight = ({ c }: { c: string }) => <Icon size={16}><Path d="m9 18 6-6-6-6" stroke={c} {...sw} /></Icon>;
const SunIcon = ({ c }: { c: string }) => <Icon><Circle cx={12} cy={12} r={4} stroke={c} {...sw} /><Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke={c} {...sw} /></Icon>;
const MoonIcon = ({ c }: { c: string }) => <Icon><Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke={c} {...sw} /></Icon>;
const GlobeIcon = ({ c }: { c: string }) => <Icon><Circle cx={12} cy={12} r={10} stroke={c} {...sw} /><Path d="M12 2a14.5 14.5 0 0 0 0 20A14.5 14.5 0 0 0 12 2" stroke={c} {...sw} /><Path d="M2 12h20" stroke={c} {...sw} /></Icon>;
const BellIcon = ({ c }: { c: string }) => <Icon><Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke={c} {...sw} /><Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke={c} {...sw} /></Icon>;
const MapPinIcon = ({ c }: { c: string }) => <Icon><Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" stroke={c} {...sw} /><Circle cx={12} cy={10} r={3} stroke={c} {...sw} /></Icon>;
const HeartPulse = ({ c }: { c: string }) => <Icon><Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" stroke={c} {...sw} /><Path d="M3.22 12H9.5l.5-1 2 4 .5-1h6.28" stroke={c} {...sw} /></Icon>;
const Fingerprint = ({ c }: { c: string }) => <Icon><Path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 3" stroke={c} {...sw} /><Path d="M14 13.12c0 2.38 0 6.38-1 8.88" stroke={c} {...sw} /><Path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" stroke={c} {...sw} /><Path d="M2 12a10 10 0 0 1 18-6" stroke={c} {...sw} /><Path d="M2 17.5c0-2.04.89-3.87 2.3-5.17" stroke={c} {...sw} /><Path d="M8 14a5 5 0 0 1 10 0" stroke={c} {...sw} /><Path d="M7 17.5c0-2.07.89-3.93 2.3-5.24" stroke={c} {...sw} /><Path d="M7 17.5a7.5 7.5 0 0 1 5-7.07" stroke={c} {...sw} /></Icon>;
const Share2Icon = ({ c }: { c: string }) => <Icon><Circle cx={18} cy={5} r={3} stroke={c} {...sw} /><Circle cx={6} cy={12} r={3} stroke={c} {...sw} /><Circle cx={18} cy={19} r={3} stroke={c} {...sw} /><Line x1={8.59} y1={13.51} x2={15.42} y2={17.49} stroke={c} {...sw} /><Line x1={15.41} y1={6.51} x2={8.59} y2={10.49} stroke={c} {...sw} /></Icon>;
const KeyRoundIcon = ({ c }: { c: string }) => <Icon><Circle cx={7.5} cy={15.5} r={5.5} stroke={c} {...sw} /><Path d="m21 2-9.6 9.6" stroke={c} {...sw} /><Path d="m15.5 7.5 3 3L22 7l-3-3" stroke={c} {...sw} /></Icon>;
const CpuIcon = ({ c }: { c: string }) => <Icon><Rect x={4} y={4} width={16} height={16} rx={2} stroke={c} {...sw} /><Rect x={9} y={9} width={6} height={6} stroke={c} {...sw} /><Path d="M15 2v2M9 2v2M2 15h2M2 9h2M15 20v2M9 20v2M20 15h2M20 9h2" stroke={c} {...sw} /></Icon>;
const RefreshIcon = ({ c }: { c: string }) => <Icon><Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke={c} {...sw} /><Path d="M21 3v5h-5" stroke={c} {...sw} /><Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke={c} {...sw} /><Path d="M8 16H3v5" stroke={c} {...sw} /></Icon>;
const Trash2Icon = ({ c }: { c: string }) => <Icon><Path d="M3 6h18" stroke={c} {...sw} /><Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" stroke={c} {...sw} /><Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke={c} {...sw} /><Line x1={10} y1={11} x2={10} y2={17} stroke={c} {...sw} /><Line x1={14} y1={11} x2={14} y2={17} stroke={c} {...sw} /></Icon>;
const CheckIcon = ({ c }: { c: string }) => <Icon size={14}><Path d="M20 6 9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Icon>;
const XIcon = ({ c }: { c: string }) => <Icon size={16}><Path d="M18 6 6 18M6 6l12 12" stroke={c} {...sw} /></Icon>;
const QrCodeIcon = ({ c }: { c: string }) => <Icon><Rect x={3} y={3} width={5} height={5} rx={1} stroke={c} {...sw} /><Rect x={16} y={3} width={5} height={5} rx={1} stroke={c} {...sw} /><Rect x={3} y={16} width={5} height={5} rx={1} stroke={c} {...sw} /><Path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1" stroke={c} {...sw} /></Icon>;
const SpeakerIcon = ({ c }: { c: string }) => <Icon size={16}><Path d="M11 5 6 9H2v6h4l5 4V5Z" stroke={c} {...sw} /><Path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke={c} {...sw} /></Icon>;
const MicVoiceIcon = ({ c }: { c: string }) => <Icon><Path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" stroke={c} {...sw} /><Path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={c} {...sw} /><Line x1={12} y1={19} x2={12} y2={22} stroke={c} {...sw} /></Icon>;
const WatchIcon = ({ c }: { c: string }) => <Icon size={64}><Rect x={5} y={2} width={14} height={20} rx={7} stroke={c} {...sw} /><Path d="M16 2h-2l-1-2h-2l-1 2H8M16 22h-2l-1 2h-2l-1-2H8M12 12v-4M12 12h3" stroke={c} {...sw} /></Icon>;

// ── Custom Toggle ──────────────────────────────────────────────────────────
function Toggle({ value, onToggle, green, mutedBg }: { value: boolean; onToggle: () => void; green: string; mutedBg: string }) {
  const anim = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  const handle = () => {
    Animated.timing(anim, { toValue: value ? 0 : 1, duration: 180, useNativeDriver: true }).start();
    onToggle();
  };
  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  return (
    <TouchableOpacity onPress={handle} activeOpacity={0.85}
      style={[ts.track, { backgroundColor: value ? green : mutedBg }]}>
      <Animated.View style={[ts.thumb, { transform: [{ translateX: tx }] }]} />
    </TouchableOpacity>
  );
}
const ts = StyleSheet.create({
  track: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center' },
  thumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF',
    shadowColor: '#000', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 2
  },
});

// ── Assistants ─────────────────────────────────────────────────────────────
const ASSISTANTS = Object.entries(ASSISTANT_DATA).map(([id, data]) => ({ id: id as AssistantId, ...data }));

// ── Reusable Row ───────────────────────────────────────────────────────────
type SType = ReturnType<typeof makeStyles>;
function Row({ icon, label, right, s }: { icon: React.ReactNode; label: string; right: React.ReactNode; s: SType }) {
  return (
    <View style={s.row}>
      <View style={s.rowIcon}>{icon}</View>
      <Text style={s.rowLabel}>{label}</Text>
      {right}
    </View>
  );
}

// ── Time Picker ────────────────────────────────────────────────────────────
function TimePickerInline({ hour, minute, onConfirm, onCancel, PRIMARY, MUTED, MUTED_BG, GREEN }: {
  hour: number; minute: number;
  onConfirm: (h: number, m: number) => void;
  onCancel: () => void;
  PRIMARY: string; MUTED: string; MUTED_BG: string; GREEN: string;
}) {
  const [h, setH] = React.useState(hour);
  const [m, setM] = React.useState(minute);
  const label = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
  return (
    <View style={{ gap: 20 }}>
      <Text style={{ fontSize: 32, fontFamily: FONT.sansBold, color: PRIMARY, textAlign: 'center' }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center' }}>
        {/* Hour column */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 11, color: MUTED, fontFamily: FONT.sansRegular }}>Hora</Text>
          <TouchableOpacity onPress={() => setH(p => (p + 1) % 24)} style={{ padding: 10, backgroundColor: MUTED_BG, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, color: PRIMARY }}>▲</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontFamily: FONT.sansBold, color: PRIMARY, width: 40, textAlign: 'center' }}>{String(h).padStart(2,'0')}</Text>
          <TouchableOpacity onPress={() => setH(p => (p + 23) % 24)} style={{ padding: 10, backgroundColor: MUTED_BG, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, color: PRIMARY }}>▼</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 28, color: PRIMARY, alignSelf: 'center', fontFamily: FONT.sansBold }}>:</Text>
        {/* Minute column */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 11, color: MUTED, fontFamily: FONT.sansRegular }}>Minutos</Text>
          <TouchableOpacity onPress={() => setM(p => (p + 5) % 60)} style={{ padding: 10, backgroundColor: MUTED_BG, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, color: PRIMARY }}>▲</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontFamily: FONT.sansBold, color: PRIMARY, width: 40, textAlign: 'center' }}>{String(m).padStart(2,'0')}</Text>
          <TouchableOpacity onPress={() => setM(p => (p + 55) % 60)} style={{ padding: 10, backgroundColor: MUTED_BG, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, color: PRIMARY }}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        <TouchableOpacity onPress={onCancel} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: MUTED_BG, alignItems: 'center' }}>
          <Text style={{ fontFamily: FONT.sansBold, color: MUTED }}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onConfirm(h, m)} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: GREEN, alignItems: 'center' }}>
          <Text style={{ fontFamily: FONT.sansBold, color: '#FFF' }}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { logout, user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, BLUE, BLUE_FG, RED, RED_BG, isDark, toggleTheme } = useAppTheme();

  const theme = isDark ? 'dark' : 'light';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const s = React.useMemo(() => makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, BLUE, BLUE_FG, RED, RED_BG), [isDark]);
  const { language, setLanguage, t } = useLanguage();
  const { assistantId, setAssistantId } = useAssistant();
  const { voiceId, setVoiceId } = useVoice();
  const [pendingAssistant, setPendingAssistant] = useState<AssistantId | null>(null);
  const [previewingVoice, setPreviewingVoice] = useState<VoiceId | null>(null);
  const previewSound = useRef<Audio.Sound | null>(null);
  const [notifs, setNotifs] = useState({ push: false, health: true });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifHour, setNotifHour] = useState(8);
  const [notifMinute, setNotifMinute] = useState(0);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [privacy, setPrivacy] = useState({ bio: false });
  const [langOpen, setLangOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const flipP = (k: keyof typeof privacy) => setPrivacy(p => ({ ...p, [k]: !p[k] }));

  // ── Push toggle ───────────────────────────────────────────────────────────
  const handleTogglePush = async () => {
    if (notifLoading) return;
    setNotifLoading(true);
    try {
      if (!notifs.push) {
        // Pedir permisos y registrar token (con projectId correcto)
        const token = await registerForPushNotifications();
        if (!token) {
          Alert.alert('Permisos', 'Activa las notificaciones en la configuración del dispositivo.');
          return;
        }
        // Usar el mismo endpoint que AuthContext para consistencia
        await apiClient.post('/profile/push-token', { pushToken: token });
        updateUser({ pushNotificationsEnabled: true });
        setNotifs(p => ({ ...p, push: true }));
      } else {
        // Eliminar token del servidor
        await apiClient.delete('/notifications/token');
        updateUser({ pushNotificationsEnabled: false });
        setNotifs(p => ({ ...p, push: false }));
      }
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setNotifLoading(false);
    }
  };

  // ── Health report toggle ──────────────────────────────────────────────────
  const handleToggleHealth = async () => {
    const next = !notifs.health;
    setNotifs(p => ({ ...p, health: next }));
    try {
      await apiClient.patch('/notifications/health-report', { enabled: next });
    } catch {
      setNotifs(p => ({ ...p, health: !next })); // revert on error
    }
  };

  const previewVoice = async (id: VoiceId) => {
    if (previewingVoice === id) return;
    // Stop previous
    if (previewSound.current) {
      try { await previewSound.current.stopAsync(); await previewSound.current.unloadAsync(); } catch {}
      previewSound.current = null;
    }
    setPreviewingVoice(id);
    try {
      const res = await apiClient.post<{ audioBase64: string }>('/chat/tts', {
        text: PREVIEW_TEXT,
        voiceId: id,
      });
      const tmpPath = `${FileSystem.cacheDirectory}voice_preview_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(tmpPath, res.data.audioBase64, { encoding: 'base64' as any });
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: tmpPath });
      previewSound.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          await sound.unloadAsync();
          previewSound.current = null;
          FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});
          setPreviewingVoice(null);
        }
      });
    } catch (err) {
      setPreviewingVoice(null);
      Alert.alert('Error', 'No se pudo reproducir la muestra de voz');
    }
  };

  const handleGenerateDeviceCode = async () => {
    setCodeLoading(true);
    try {
      const res = await apiClient.post('/auth/device-code/generate');
      setDeviceCode(res.data.code);
      setTimeLeft(120);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setCodeLoading(false);
    }
  };

  // Inicializar push desde estado del servidor (no desde permisos del SO)
  useEffect(() => {
    setNotifs(p => ({ ...p, push: user?.pushNotificationsEnabled ?? false }));
    apiClient.get<{ hour: number; minute: number }>('/notifications/health-report-time')
      .then(r => { setNotifHour(r.data.hour); setNotifMinute(r.data.minute); })
      .catch(() => {});
  }, [user?.pushNotificationsEnabled]);

  const handleSaveNotifTime = async (h: number, m: number) => {
    setNotifHour(h);
    setNotifMinute(m);
    setTimePickerOpen(false);
    try {
      await apiClient.patch('/notifications/health-report-time', { hour: h, minute: m });
    } catch { /* silently ignore */ }
  };

  useEffect(() => {
    if (!deviceCode || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setDeviceCode(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [deviceCode, timeLeft]);

  const handleCloseCodeModal = () => {
    setDeviceCode(null);
    setTimeLeft(0);
    setCodeOpen(false);
  };

  const handleChangePassword = async () => {
    if (!pwCurrent.trim()) { Alert.alert('Error', 'Ingresa tu contraseña actual.'); return; }
    if (pwNew.length < 8) { Alert.alert('Error', 'La contraseña nueva debe tener al menos 8 caracteres.'); return; }
    if (pwNew !== pwConfirm) { Alert.alert('Error', 'Las contraseñas nuevas no coinciden.'); return; }
    setPwSaving(true);
    try {
      await apiClient.put('/auth/change-password', { currentPassword: pwCurrent, newPassword: pwNew });
      Alert.alert('Contraseña actualizada', 'Tu contraseña ha sido cambiada exitosamente.');
      setPwOpen(false);
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setPwSaving(false);
    }
  };

  const handleDelete = () => { setDeleteOpen(false); logout(); router.replace('/login'); };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} activeOpacity={0.75}>
            <ChevronLeft c={PRIMARY} s={20} />
          </TouchableOpacity>
          <Text style={s.title}>{t.settingsTitle}</Text>
        </View>

        {/* ── Apariencia ──────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>{t.settingsAppearance}</Text>
        <View style={s.list}>
          <Row s={s}
            icon={theme === 'dark' ? <MoonIcon c={MUTED} /> : <SunIcon c={MUTED} />}
            label={t.settingsTheme}
            right={
              <View style={s.segment}>
                <TouchableOpacity style={[s.segBtn, theme === 'light' && s.segBtnActiveLight]} onPress={() => isDark && toggleTheme()} activeOpacity={0.75}>
                  <Text style={[s.segText, theme === 'light' && s.segTextActiveLight]}>{t.settingsLight}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.segBtn, theme === 'dark' && s.segBtnActiveDark]} onPress={() => !isDark && toggleTheme()} activeOpacity={0.75}>
                  <Text style={[s.segText, theme === 'dark' && s.segTextActiveDark]}>{t.settingsDark}</Text>
                </TouchableOpacity>
              </View>
            }
          />
          <TouchableOpacity onPress={() => setLangOpen(true)} activeOpacity={0.75}>
            <Row s={s} icon={<GlobeIcon c={MUTED} />} label={t.settingsLanguage}
              right={<Text style={s.rowMuted}>{t[`lang${language.charAt(0).toUpperCase() + language.slice(1)}` as 'langEs'|'langEn'|'langPt']}</Text>} />
          </TouchableOpacity>
        </View>

        {/* ── Tu asistente ────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>{t.settingsAssistant}</Text>
        <Text style={s.sectionSub}>{t.settingsAssistantSub}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.carouselContent}
        >
          {ASSISTANTS.map(a => {
            const active = a.id === assistantId;
            return (
              <TouchableOpacity
                key={a.id}
                style={[s.assistCard, active && s.assistCardActive]}
                onPress={() => { if (!active) setPendingAssistant(a.id); }}
                activeOpacity={0.85}
              >
                {/* Check badge */}
                {active && (
                  <View style={s.assistBadge}>
                    <CheckIcon c={PRIMARY} />
                  </View>
                )}
                {/* Image */}
                <Image source={a.image} style={s.assistCardImg} resizeMode="contain" />
                {/* Text */}
                <Text style={[s.assistName, active && s.assistNameActive]} numberOfLines={1}>{a.name}</Text>
                <Text style={[s.assistTag, active && s.assistTagActive]} numberOfLines={2}>{a.tagline}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Voz del asistente ───────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Voz del asistente</Text>
        <Text style={s.sectionSub}>Toca el botón de audio para escuchar una muestra antes de elegir.</Text>
        <View style={s.list}>
          {VOICE_IDS.map(id => {
            const v = VOICE_DATA[id];
            const active = voiceId === id;
            const isPreviewing = previewingVoice === id;
            return (
              <TouchableOpacity
                key={id}
                style={[s.voiceRow, active && s.voiceRowActive]}
                onPress={() => setVoiceId(id)}
                activeOpacity={0.8}
              >
                {/* Left: radio dot */}
                <View style={[s.voiceRadio, active && s.voiceRadioActive]}>
                  {active && <View style={s.voiceRadioDot} />}
                </View>
                {/* Center: name + desc */}
                <View style={s.voiceTexts}>
                  <Text style={[s.voiceName, active && s.voiceNameActive]}>{v.name}</Text>
                  <Text style={[s.voiceDesc, active && s.voiceDescActive]}>{v.desc}</Text>
                </View>
                {/* Right: preview button */}
                <TouchableOpacity
                  style={[s.voicePlayBtn, active && s.voicePlayBtnActive]}
                  onPress={(e) => { e.stopPropagation(); previewVoice(id); }}
                  disabled={isPreviewing}
                  activeOpacity={0.75}
                >
                  {isPreviewing
                    ? <ActivityIndicator size="small" color={active ? BG : PRIMARY} />
                    : <SpeakerIcon c={active ? BG : PRIMARY} />
                  }
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Notificaciones ──────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>{t.settingsNotifications}</Text>
        <View style={s.list}>
          <Row s={s}
            icon={notifLoading ? <ActivityIndicator size="small" color={MUTED} /> : <BellIcon c={MUTED} />}
            label={t.settingsPush}
            right={<Toggle green={GREEN} mutedBg={MUTED_BG} value={notifs.push} onToggle={handleTogglePush} />}
          />
          <Row s={s}
            icon={<HeartPulse c={MUTED} />}
            label="Reporte de salud diario"
            right={<Toggle green={GREEN} mutedBg={MUTED_BG} value={notifs.health} onToggle={handleToggleHealth} />}
          />
          {notifs.health && (
            <TouchableOpacity style={s.row} onPress={() => setTimePickerOpen(true)} activeOpacity={0.75}>
              <View style={s.rowIcon}><BellIcon c={MUTED} /></View>
              <Text style={s.rowLabel}>Hora del reporte</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY }}>
                  {`${notifHour % 12 || 12}:${String(notifMinute).padStart(2, '0')} ${notifHour >= 12 ? 'pm' : 'am'}`}
                </Text>
                <ChevronRight c={MUTED} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Privacidad y seguridad ───────────────────────────────────── */}
        <Text style={s.sectionTitle}>{t.settingsPrivacy}</Text>
        <View style={s.list}>
          <Row s={s} icon={<Fingerprint c={MUTED} />} label={t.settingsBiometric} right={<Toggle green={GREEN} mutedBg={MUTED_BG} value={privacy.bio} onToggle={() => {
            flipP('bio');
            if (!privacy.bio) Alert.alert(t.settingsBiometric, 'La autenticación biométrica se activará la próxima vez que inicies sesión.');
          }} />} />
          <TouchableOpacity activeOpacity={0.75} onPress={() => setPwOpen(true)}>
            <Row s={s} icon={<KeyRoundIcon c={MUTED} />} label={t.settingsChangePassword} right={<ChevronRight c={MUTED} />} />
          </TouchableOpacity>
        </View>

        {/* ── Dispositivo ─────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>{t.settingsDevice}</Text>
        <View style={s.list}>
          <Row s={s} icon={<CpuIcon c={MUTED} />} label={t.settingsFirmware} right={<Text style={s.rowMuted}>v2.4.1</Text>} />
          <TouchableOpacity activeOpacity={0.75} onPress={() => { setDeviceCode(null); setCodeOpen(true); }}>
            <Row s={s} icon={<QrCodeIcon c={MUTED} />} label={t.settingsGenerateCode}
              right={<ChevronRight c={MUTED} />}
            />
          </TouchableOpacity>
        </View>

        {/* ── Zona de peligro ─────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>{t.settingsDanger}</Text>
        <TouchableOpacity style={s.dangerRow} onPress={() => setDeleteOpen(true)} activeOpacity={0.75}>
          <Trash2Icon c={RED} />
          <Text style={s.dangerText}>{t.settingsDeleteAccount}</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Código de manilla modal ─────────────────────────────────── */}
      <Modal visible={codeOpen} animationType="slide" transparent onRequestClose={handleCloseCodeModal}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={handleCloseCodeModal}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 20 }]} activeOpacity={1}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>{t.settingsLinkSmartwatch}</Text>
              <TouchableOpacity style={s.sheetX} onPress={handleCloseCodeModal}>
                <XIcon c={PRIMARY} />
              </TouchableOpacity>
            </View>
            <Text style={s.codeDesc}>{t.settingsSmartwatchDesc}</Text>

            {deviceCode ? (
              <>
                <View style={s.codePill}>
                  <Text style={s.codeText}>{deviceCode}</Text>
                </View>
                <Text style={s.codeTimer}>
                  {t.settingsCodeExpires} {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} min
                </Text>
              </>
            ) : (
              <View style={s.watchPlaceholder}>
                <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
                  <Rect x={5} y={2} width={14} height={20} rx={7} stroke={MUTED_BG} strokeWidth={2} />
                  <Path d="M9 2h6M9 22h6" stroke={MUTED_BG} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
            )}

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnGrey} onPress={handleCloseCodeModal} activeOpacity={0.85}>
                <Text style={s.btnGreyText}>{t.settingsCancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnRed, { backgroundColor: PRIMARY }]}
                onPress={handleGenerateDeviceCode}
                disabled={codeLoading}
                activeOpacity={0.85}
              >
                {codeLoading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={s.btnPrimaryText}>{deviceCode ? t.settingsNewCode : t.settingsGenerateCodeBtn}</Text>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Change password modal ────────────────────────────────────── */}
      <Modal visible={pwOpen} animationType="slide" transparent onRequestClose={() => !pwSaving && setPwOpen(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => !pwSaving && setPwOpen(false)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 20 }]} activeOpacity={1}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>{t.settingsChangePassword}</Text>
              <TouchableOpacity style={s.sheetX} onPress={() => !pwSaving && setPwOpen(false)}>
                <XIcon c={PRIMARY} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <View style={[s.pwField]}>
                <Text style={s.pwLabel}>Contraseña actual</Text>
                <TextInput
                  style={s.pwInput}
                  value={pwCurrent}
                  onChangeText={setPwCurrent}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={MUTED + '80'}
                  editable={!pwSaving}
                  autoCapitalize="none"
                />
              </View>
              <View style={s.pwField}>
                <Text style={s.pwLabel}>Nueva contraseña</Text>
                <TextInput
                  style={s.pwInput}
                  value={pwNew}
                  onChangeText={setPwNew}
                  secureTextEntry
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={MUTED + '80'}
                  editable={!pwSaving}
                  autoCapitalize="none"
                />
              </View>
              <View style={s.pwField}>
                <Text style={s.pwLabel}>Confirmar nueva contraseña</Text>
                <TextInput
                  style={s.pwInput}
                  value={pwConfirm}
                  onChangeText={setPwConfirm}
                  secureTextEntry
                  placeholder="Repite la contraseña"
                  placeholderTextColor={MUTED + '80'}
                  editable={!pwSaving}
                  autoCapitalize="none"
                />
              </View>
            </View>
            <View style={[s.modalBtns, { marginTop: 20 }]}>
              <TouchableOpacity style={s.btnGrey} onPress={() => setPwOpen(false)} disabled={pwSaving} activeOpacity={0.85}>
                <Text style={s.btnGreyText}>{t.settingsCancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnRed, { backgroundColor: PRIMARY, opacity: pwSaving ? 0.7 : 1 }]}
                onPress={handleChangePassword}
                disabled={pwSaving}
                activeOpacity={0.85}
              >
                {pwSaving
                  ? <ActivityIndicator size="small" color={BG} />
                  : <Text style={s.btnPrimaryText}>Cambiar</Text>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Language sheet ───────────────────────────────────────────── */}
      <Modal visible={langOpen} animationType="slide" transparent onRequestClose={() => setLangOpen(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setLangOpen(false)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>{t.settingsLanguageTitle}</Text>
              <TouchableOpacity style={s.sheetX} onPress={() => setLangOpen(false)}>
                <XIcon c={PRIMARY} />
              </TouchableOpacity>
            </View>
            {([
              { id: 'es' as Language, label: '🇨🇴  Español' },
              { id: 'en' as Language, label: '🇺🇸  English' },
              { id: 'pt' as Language, label: '🇧🇷  Português' },
            ]).map(l => (
              <TouchableOpacity key={l.id} style={[s.langRow, language === l.id && s.langRowActive]}
                onPress={() => { setLanguage(l.id); setLangOpen(false); }} activeOpacity={0.8}>
                <Text style={[s.langText, language === l.id && s.langTextActive]}>{l.label}</Text>
                {language === l.id && <CheckIcon c={BG} />}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Confirmar cambio de asistente ───────────────────────────── */}
      <Modal visible={pendingAssistant !== null} animationType="fade" transparent onRequestClose={() => setPendingAssistant(null)}>
        <TouchableOpacity style={[s.overlay, { justifyContent: 'center', paddingHorizontal: 24 }]}
          activeOpacity={1} onPress={() => setPendingAssistant(null)}>
          <TouchableOpacity style={s.deleteModal} activeOpacity={1}>
            {pendingAssistant && (
              <Image
                source={ASSISTANT_DATA[pendingAssistant].image}
                style={{ width: 100, height: 100, marginBottom: 8 }}
                resizeMode="contain"
              />
            )}
            <Text style={s.deleteTitle}>{t.settingsConfirmAssistant}</Text>
            <Text style={s.deleteSub}>
              {pendingAssistant
                ? `${t.settingsConfirmAssistantSub} ${ASSISTANT_DATA[pendingAssistant].name} ${t.settingsConfirmAssistantSub2}`
                : ''}
            </Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnGrey} onPress={() => setPendingAssistant(null)} activeOpacity={0.85}>
                <Text style={s.btnGreyText}>{t.settingsCancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnRed, { backgroundColor: PRIMARY }]}
                onPress={() => { if (pendingAssistant) { setAssistantId(pendingAssistant); } setPendingAssistant(null); }}
                activeOpacity={0.85}>
                <Text style={s.btnPrimaryText}>{t.settingsChangeBtn}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Delete confirm ───────────────────────────────────────────── */}
      {/* ── Time picker modal ─────────────────────────────────────────── */}
      <Modal visible={timePickerOpen} animationType="slide" transparent onRequestClose={() => setTimePickerOpen(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setTimePickerOpen(false)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            <Text style={s.sheetTitle}>Hora del reporte diario</Text>
            <TimePickerInline hour={notifHour} minute={notifMinute} onConfirm={handleSaveNotifTime} onCancel={() => setTimePickerOpen(false)} PRIMARY={PRIMARY} MUTED={MUTED} MUTED_BG={MUTED_BG} GREEN={GREEN} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={deleteOpen} animationType="fade" transparent onRequestClose={() => setDeleteOpen(false)}>
        <TouchableOpacity style={[s.overlay, { justifyContent: 'center', paddingHorizontal: 24 }]}
          activeOpacity={1} onPress={() => setDeleteOpen(false)}>
          <TouchableOpacity style={s.deleteModal} activeOpacity={1}>
            <View style={s.deleteIconWrap}><Trash2Icon c={RED} /></View>
            <Text style={s.deleteTitle}>{t.settingsDeleteTitle}</Text>
            <Text style={s.deleteSub}>{t.settingsDeleteSub}</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnGrey} onPress={() => setDeleteOpen(false)} activeOpacity={0.85}>
                <Text style={s.btnGreyText}>{t.settingsCancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnRed} onPress={handleDelete} activeOpacity={0.85}>
                <Text style={s.btnRedText}>{t.settingsDeleteConfirm}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

// ── Styles (generated dynamically per theme) ───────────────────────────────
function makeStyles(BG: string, CARD: string, PRIMARY: string, MUTED: string, MUTED_BG: string, BLUE: string, BLUE_FG: string, RED: string, RED_BG: string) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 12 },

    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, marginBottom: 4 },
    backBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: CARD,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2
    },
    title: { fontSize: 22, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.44 },

    sectionTitle: { fontSize: 17, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.34, marginTop: 4 },
    sectionSub: { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED, marginTop: -8 },

    list: { gap: 8 },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CARD, borderRadius: 20, padding: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1
    },
    rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    rowLabel: { flex: 1, fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY },
    rowMuted: { fontSize: 13, fontFamily: FONT.sansMedium, color: MUTED },

    segment: { flexDirection: 'row', backgroundColor: MUTED_BG, borderRadius: 20, padding: 3 },
    segBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16 },
    segBtnActiveLight: { backgroundColor: CARD, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    segBtnActiveDark: { backgroundColor: PRIMARY },
    segText: { fontSize: 12, fontFamily: FONT.sansBold, color: MUTED },
    segTextActiveLight: { color: PRIMARY },
    segTextActiveDark: { color: BG },

    carouselContent: { flexDirection: 'row', gap: 12, paddingVertical: 4, paddingHorizontal: 2 },
    assistCard: {
      width: 130, backgroundColor: CARD, borderRadius: 24, padding: 14,
      alignItems: 'center', gap: 6,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
    },
    assistCardActive: { backgroundColor: PRIMARY },
    assistCardImg: { width: 90, height: 90 },
    assistBadge: {
      position: 'absolute', top: 10, right: 10,
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
    },
    assistName: { fontSize: 14, fontFamily: FONT.displayBold, color: PRIMARY, textAlign: 'center' },
    assistNameActive: { color: BG },
    assistTag: { fontSize: 11, fontFamily: FONT.sansRegular, color: MUTED, marginTop: 2, textAlign: 'center' },
    assistTagActive: { color: BG + 'BB' },
    checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: MUTED + '60', alignItems: 'center', justifyContent: 'center' },
    checkActive: { backgroundColor: BG, borderColor: BG },

    voiceRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: CARD, borderRadius: 20, padding: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    voiceRowActive: { backgroundColor: PRIMARY },
    voiceRadio: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: MUTED + '80',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    voiceRadioActive: { borderColor: BG },
    voiceRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BG },
    voiceTexts: { flex: 1 },
    voiceName: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY },
    voiceNameActive: { color: BG },
    voiceDesc: { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED, marginTop: 1 },
    voiceDescActive: { color: BG + 'BB' },
    voicePlayBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: MUTED_BG,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    voicePlayBtnActive: { backgroundColor: BG + '33' },

    syncBadge: { backgroundColor: BLUE, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
    syncText: { fontSize: 12, fontFamily: FONT.sansBold, color: BLUE_FG },

    dangerRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: RED_BG, borderRadius: 20, padding: 16,
      borderWidth: 1, borderColor: RED + '30'
    },
    dangerText: { fontSize: 14, fontFamily: FONT.sansBold, color: RED },

    overlay: { flex: 1, backgroundColor: 'rgba(26,21,18,0.6)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: BG, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 8 },
    sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    sheetTitle: { fontSize: 18, fontFamily: FONT.displayBold, color: PRIMARY },
    sheetX: { width: 32, height: 32, borderRadius: 16, backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center' },
    langRow: {
      backgroundColor: CARD, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1
    },
    langRowActive: { backgroundColor: PRIMARY },
    langText: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY },
    langTextActive: { color: BG },

    deleteModal: { backgroundColor: BG, borderRadius: 28, padding: 24, alignItems: 'center' },
    deleteIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: RED_BG, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    deleteTitle: { fontSize: 18, fontFamily: FONT.displayBold, color: PRIMARY },
    deleteSub: { fontSize: 13, fontFamily: FONT.sansRegular, color: MUTED, textAlign: 'center', marginTop: 4 },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
    btnGrey: { flex: 1, backgroundColor: MUTED_BG, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
    btnGreyText: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY },
    btnRed: { flex: 1, backgroundColor: RED, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
    btnRedText: { fontSize: 14, fontFamily: FONT.sansBold, color: '#FFFFFF' },
    btnPrimaryText: { fontSize: 14, fontFamily: FONT.sansBold, color: BG },

    pwField: { backgroundColor: CARD, borderRadius: 16, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
    pwLabel: { fontSize: 11, fontFamily: FONT.sansMedium, color: MUTED, marginBottom: 4 },
    pwInput: { fontSize: 15, fontFamily: FONT.sansMedium, color: PRIMARY },

    codeDesc: { fontSize: 13, fontFamily: FONT.sansRegular, color: MUTED, lineHeight: 18, marginBottom: 8 },
    codePill: { backgroundColor: MUTED_BG, borderRadius: 16, paddingVertical: 20, alignItems: 'center', marginVertical: 8 },
    codeText: { fontSize: 42, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: 10 },
    codeTimer: { fontSize: 13, fontFamily: FONT.sansMedium, color: RED, textAlign: 'center', marginBottom: 8 },
    watchPlaceholder: { alignItems: 'center', paddingVertical: 28 },
  });
}
