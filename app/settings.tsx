import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Modal, Alert, Animated, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useAssistant, ASSISTANT_DATA, type AssistantId } from '../hooks/useAssistant';
import { FONT } from '../constants/fonts';
import { apiClient, getErrorMessage } from '../services/api';
import { useAppTheme } from '../hooks/useAppTheme';

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

// ── Screen ─────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, BLUE, BLUE_FG, RED, RED_BG, isDark, toggleTheme } = useAppTheme();

  const theme = isDark ? 'dark' : 'light';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const s = React.useMemo(() => makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, BLUE, BLUE_FG, RED, RED_BG), [isDark]);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const { assistantId, setAssistantId } = useAssistant();
  const [pendingAssistant, setPendingAssistant] = useState<AssistantId | null>(null);
  const [notifs, setNotifs] = useState({ push: true, loc: true, health: true });
  const [privacy, setPrivacy] = useState({ bio: false, anon: false });
  const [langOpen, setLangOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const flipN = (k: keyof typeof notifs) => setNotifs(p => ({ ...p, [k]: !p[k] }));
  const flipP = (k: keyof typeof privacy) => setPrivacy(p => ({ ...p, [k]: !p[k] }));

  const handleSync = () => { setSyncing(true); setTimeout(() => setSyncing(false), 2000); };

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
  const handleDelete = () => { setDeleteOpen(false); logout(); router.replace('/login'); };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} activeOpacity={0.75}>
            <ChevronLeft c={PRIMARY} s={20} />
          </TouchableOpacity>
          <Text style={s.title}>Configuración</Text>
        </View>

        {/* ── Apariencia ──────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Apariencia</Text>
        <View style={s.list}>
          <Row s={s}
            icon={theme === 'dark' ? <MoonIcon c={MUTED} /> : <SunIcon c={MUTED} />}
            label="Tema"
            right={
              <View style={s.segment}>
                <TouchableOpacity style={[s.segBtn, theme === 'light' && s.segBtnActiveLight]} onPress={() => isDark && toggleTheme()} activeOpacity={0.75}>
                  <Text style={[s.segText, theme === 'light' && s.segTextActiveLight]}>Claro</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.segBtn, theme === 'dark' && s.segBtnActiveDark]} onPress={() => !isDark && toggleTheme()} activeOpacity={0.75}>
                  <Text style={[s.segText, theme === 'dark' && s.segTextActiveDark]}>Oscuro</Text>
                </TouchableOpacity>
              </View>
            }
          />
          <TouchableOpacity onPress={() => setLangOpen(true)} activeOpacity={0.75}>
            <Row s={s} icon={<GlobeIcon c={MUTED} />} label="Idioma"
              right={<Text style={s.rowMuted}>{lang === 'es' ? 'Español' : 'English'}</Text>} />
          </TouchableOpacity>
        </View>

        {/* ── Tu asistente ────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Tu asistente</Text>
        <Text style={s.sectionSub}>Elige tu compañero de salud. Aparecerá en el inicio y en el chat con la IA.</Text>
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

        {/* ── Notificaciones ──────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Notificaciones</Text>
        <View style={s.list}>
          <Row s={s} icon={<BellIcon c={MUTED} />} label="Push notifications" right={<Toggle green={GREEN} mutedBg={MUTED_BG} value={notifs.push} onToggle={() => flipN('push')} />} />
          <Row s={s} icon={<MapPinIcon c={MUTED} />} label="Alertas de ubicación" right={<Toggle green={GREEN} mutedBg={MUTED_BG} value={notifs.loc} onToggle={() => flipN('loc')} />} />
          <Row s={s} icon={<HeartPulse c={MUTED} />} label="Alertas de salud" right={<Toggle green={GREEN} mutedBg={MUTED_BG} value={notifs.health} onToggle={() => flipN('health')} />} />
        </View>

        {/* ── Privacidad y seguridad ───────────────────────────────────── */}
        <Text style={s.sectionTitle}>Privacidad y seguridad</Text>
        <View style={s.list}>
          <Row s={s} icon={<Fingerprint c={MUTED} />} label="Autenticación biométrica" right={<Toggle green={GREEN} mutedBg={MUTED_BG} value={privacy.bio} onToggle={() => flipP('bio')} />} />
          <Row s={s} icon={<Share2Icon c={MUTED} />} label="Compartir datos anónimos" right={<Toggle green={GREEN} mutedBg={MUTED_BG} value={privacy.anon} onToggle={() => flipP('anon')} />} />
          <TouchableOpacity activeOpacity={0.75}
            onPress={() => Alert.alert('Cambiar contraseña', 'Próximamente disponible.')}>
            <Row s={s} icon={<KeyRoundIcon c={MUTED} />} label="Cambiar contraseña" right={<ChevronRight c={MUTED} />} />
          </TouchableOpacity>
        </View>

        {/* ── Dispositivo ─────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Dispositivo</Text>
        <View style={s.list}>
          <Row s={s} icon={<CpuIcon c={MUTED} />} label="Firmware" right={<Text style={s.rowMuted}>v2.4.1</Text>} />
          <TouchableOpacity activeOpacity={0.75} onPress={handleSync}>
            <Row s={s} icon={<RefreshIcon c={MUTED} />} label="Sincronizar manilla"
              right={
                <View style={s.syncBadge}>
                  <Text style={s.syncText}>{syncing ? 'Sincronizando…' : 'Sincronizar'}</Text>
                </View>
              }
            />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.75} onPress={() => { setDeviceCode(null); setCodeOpen(true); }}>
            <Row s={s} icon={<QrCodeIcon c={MUTED} />} label="Generar código de manilla"
              right={<ChevronRight c={MUTED} />}
            />
          </TouchableOpacity>
        </View>

        {/* ── Zona de peligro ─────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Zona de peligro</Text>
        <TouchableOpacity style={s.dangerRow} onPress={() => setDeleteOpen(true)} activeOpacity={0.75}>
          <Trash2Icon c={RED} />
          <Text style={s.dangerText}>Eliminar cuenta</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Código de manilla modal ─────────────────────────────────── */}
      <Modal visible={codeOpen} animationType="slide" transparent onRequestClose={handleCloseCodeModal}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={handleCloseCodeModal}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 20 }]} activeOpacity={1}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Vincular manilla</Text>
              <TouchableOpacity style={s.sheetX} onPress={handleCloseCodeModal}>
                <XIcon c={PRIMARY} />
              </TouchableOpacity>
            </View>
            <Text style={s.codeDesc}>
              Ingresa este código en tu manilla Horus para vincularla con tu cuenta. Expira en 2 minutos.
            </Text>

            {deviceCode ? (
              <>
                <View style={s.codePill}>
                  <Text style={s.codeText}>{deviceCode}</Text>
                </View>
                <Text style={s.codeTimer}>
                  Expira en {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} min
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
                <Text style={s.btnGreyText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnRed, { backgroundColor: PRIMARY }]}
                onPress={handleGenerateDeviceCode}
                disabled={codeLoading}
                activeOpacity={0.85}
              >
                {codeLoading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={s.btnPrimaryText}>{deviceCode ? 'Nuevo código' : 'Generar código'}</Text>
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
              <Text style={s.sheetTitle}>Idioma</Text>
              <TouchableOpacity style={s.sheetX} onPress={() => setLangOpen(false)}>
                <XIcon c={PRIMARY} />
              </TouchableOpacity>
            </View>
            {(['es', 'en'] as const).map(l => (
              <TouchableOpacity key={l} style={[s.langRow, lang === l && s.langRowActive]}
                onPress={() => { setLang(l); setLangOpen(false); }} activeOpacity={0.8}>
                <Text style={[s.langText, lang === l && s.langTextActive]}>{l === 'es' ? 'Español' : 'English'}</Text>
                {lang === l && <CheckIcon c={BG} />}
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
            <Text style={s.deleteTitle}>
              ¿Cambiar asistente?
            </Text>
            <Text style={s.deleteSub}>
              {pendingAssistant
                ? `¿Estás seguro de que quieres cambiar a ${ASSISTANT_DATA[pendingAssistant].name} como tu compañero de salud?`
                : ''}
            </Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnGrey} onPress={() => setPendingAssistant(null)} activeOpacity={0.85}>
                <Text style={s.btnGreyText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnRed, { backgroundColor: PRIMARY }]}
                onPress={() => { if (pendingAssistant) { setAssistantId(pendingAssistant); } setPendingAssistant(null); }}
                activeOpacity={0.85}>
                <Text style={s.btnPrimaryText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Delete confirm ───────────────────────────────────────────── */}
      <Modal visible={deleteOpen} animationType="fade" transparent onRequestClose={() => setDeleteOpen(false)}>
        <TouchableOpacity style={[s.overlay, { justifyContent: 'center', paddingHorizontal: 24 }]}
          activeOpacity={1} onPress={() => setDeleteOpen(false)}>
          <TouchableOpacity style={s.deleteModal} activeOpacity={1}>
            <View style={s.deleteIconWrap}><Trash2Icon c={RED} /></View>
            <Text style={s.deleteTitle}>¿Eliminar cuenta?</Text>
            <Text style={s.deleteSub}>Esta acción es irreversible. Se perderán todos tus datos.</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnGrey} onPress={() => setDeleteOpen(false)} activeOpacity={0.85}>
                <Text style={s.btnGreyText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnRed} onPress={handleDelete} activeOpacity={0.85}>
                <Text style={s.btnRedText}>Eliminar</Text>
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

    codeDesc: { fontSize: 13, fontFamily: FONT.sansRegular, color: MUTED, lineHeight: 18, marginBottom: 8 },
    codePill: { backgroundColor: MUTED_BG, borderRadius: 16, paddingVertical: 20, alignItems: 'center', marginVertical: 8 },
    codeText: { fontSize: 42, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: 10 },
    codeTimer: { fontSize: 13, fontFamily: FONT.sansMedium, color: RED, textAlign: 'center', marginBottom: 8 },
    watchPlaceholder: { alignItems: 'center', paddingVertical: 28 },
  });
}
