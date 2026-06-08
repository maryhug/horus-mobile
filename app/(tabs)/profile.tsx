import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { FONT } from '../../constants/fonts';
import { useAppTheme } from '../../hooks/useAppTheme';

// ── Foreground colors (do not change between themes) ──────────────────────
const GREEN_FG  = '#1A3D0A';
const YELLOW_FG = '#3D2C00';
const BLUE_FG   = '#1A3A5C';
const PINK_FG   = '#7A1A3A';

// ── SVG Icons (Lucide) ─────────────────────────────────────────────────────
const I = (props: { children: React.ReactNode; size?: number }) => (
  <Svg width={props.size ?? 18} height={props.size ?? 18} viewBox="0 0 24 24" fill="none">
    {props.children}
  </Svg>
);
const sw = { strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function CameraIcon({ color, size = 16 }: { color: string; size?: number }) {
  return <I size={size}><Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" stroke={color} {...sw} /><Circle cx={12} cy={13} r={3} stroke={color} {...sw} /></I>;
}
function PencilIcon({ color, size = 16 }: { color: string; size?: number }) {
  return <I size={size}><Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" stroke={color} {...sw} /></I>;
}
function MailIcon({ color, size = 18 }: { color: string; size?: number }) {
  return <I size={size}><Rect x={2} y={4} width={20} height={16} rx={2} stroke={color} {...sw} /><Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={color} {...sw} /></I>;
}
function PhoneIcon({ color, size = 18 }: { color: string; size?: number }) {
  return <I size={size}><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17z" stroke={color} {...sw} /></I>;
}
function MapPinIcon({ color, size = 18 }: { color: string; size?: number }) {
  return <I size={size}><Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" stroke={color} {...sw} /><Circle cx={12} cy={10} r={3} stroke={color} {...sw} /></I>;
}
function DropletIcon({ color, size = 18 }: { color: string; size?: number }) {
  return <I size={size}><Path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" stroke={color} {...sw} /></I>;
}
function CalendarIcon({ color, size = 18 }: { color: string; size?: number }) {
  return <I size={size}><Path d="M8 2v4M16 2v4" stroke={color} {...sw} /><Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} {...sw} /><Path d="M3 10h18" stroke={color} {...sw} /></I>;
}
function NfcIcon({ color, size = 16 }: { color: string; size?: number }) {
  return <I size={size}><Path d="M6 8.32a7.43 7.43 0 0 0 0 7.36" stroke={color} {...sw} /><Path d="M9.46 6.21a11.76 11.76 0 0 0 0 11.58" stroke={color} {...sw} /><Path d="M12.91 4.1a15.91 15.91 0 0 1 0 15.8" stroke={color} {...sw} /><Path d="M16.37 2a20.16 20.16 0 0 1 0 20" stroke={color} {...sw} /></I>;
}
function NavigationIcon({ color, size = 16 }: { color: string; size?: number }) {
  return <I size={size}><Path d="M3.707 6.293a1 1 0 0 0 0 1.414l13.586 13.586a1 1 0 0 0 1.414 0l2.586-2.586a1 1 0 0 0 0-1.414L7.707 3.707a1 1 0 0 0-1.414 0z" stroke={color} {...sw} /><Path d="m3 3 7.5 2L13 8l-5-1.5z" stroke={color} {...sw} /></I>;
}
function BatteryLowIcon({ color, size = 16 }: { color: string; size?: number }) {
  return <I size={size}><Rect x={2} y={7} width={16} height={10} rx={2} stroke={color} {...sw} /><Path d="M22 11v2" stroke={color} {...sw} /><Path d="M6 11v2" stroke={color} {...sw} /></I>;
}
function CpuIcon({ color, size = 16 }: { color: string; size?: number }) {
  return <I size={size}><Rect x={4} y={4} width={16} height={16} rx={2} stroke={color} {...sw} /><Rect x={9} y={9} width={6} height={6} stroke={color} {...sw} /><Path d="M15 2v2M9 2v2M2 15h2M2 9h2M15 20v2M9 20v2M20 15h2M20 9h2" stroke={color} {...sw} /></I>;
}
function SettingsIcon({ color, size = 18 }: { color: string; size?: number }) {
  return <I size={size}><Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke={color} {...sw} /><Circle cx={12} cy={12} r={3} stroke={color} {...sw} /></I>;
}
function LogOutIcon({ color, size = 18 }: { color: string; size?: number }) {
  return <I size={size}><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} {...sw} /><Polyline points="16 17 21 12 16 7" stroke={color} {...sw} /><Line x1={21} y1={12} x2={9} y2={12} stroke={color} {...sw} /></I>;
}
function XIcon({ color, size = 16 }: { color: string; size?: number }) {
  return <I size={size}><Path d="M18 6 6 18M6 6l12 12" stroke={color} {...sw} /></I>;
}

// ── Types ──────────────────────────────────────────────────────────────────
type UserDraft = { firstName: string; lastName: string; phone: string; location: string };
type ProfileData = {
  firstName: string; lastName: string; email: string;
  bloodType?: string; dateOfBirth?: string; nfcTagId?: string;
};

// ── Reusable sub-components ───────────────────────────────────────────────
type Styles = ReturnType<typeof makeStyles>;

function InfoRow({ icon, label, value, s }: { icon: React.ReactNode; label: string; value: string; s: Styles }) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function DeviceStat({ icon, label, value, bg, s }: { icon: React.ReactNode; label: string; value: string; bg: string; fg: string; s: Styles }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: bg }]}>{icon}</View>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

function SheetField({ label, value, onChange, s }: { label: string; value: string; onChange: (v: string) => void; s: Styles }) {
  return (
    <View style={s.sheetField}>
      <Text style={s.sheetFieldLabel}>{label}</Text>
      <TextInput style={s.sheetFieldInput} value={value} onChangeText={onChange} />
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, BLUE, PINK, RED, RED_BG, isDark } = useAppTheme();
  const s = React.useMemo(() => makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, BLUE, PINK, RED, RED_BG), [isDark]);

  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  // ── API profile data ───────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    apiClient.get<ProfileData>('/profile')
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const defaultUser: UserDraft = {
    firstName: profile?.firstName ?? user?.firstName ?? '—',
    lastName:  profile?.lastName  ?? user?.lastName  ?? '—',
    phone:     '+57 301 555 0142',
    location:  'Medellín, Colombia',
  };

  const [u, setU]               = useState(defaultUser);
  const [draft, setDraft]       = useState(defaultUser);
  const [editOpen, setEditOpen] = useState(false);
  const [logoutOpen, setLogout] = useState(false);

  // Actualiza los campos cuando llegan los datos de la API
  useEffect(() => {
    if (!profile) return;
    const updated = {
      firstName: profile.firstName || user?.firstName || '—',
      lastName:  profile.lastName  || user?.lastName  || '—',
      phone:     u.phone,
      location:  u.location,
    };
    setU(updated);
    setDraft(updated);
  }, [profile]);

  const email     = profile?.email ?? user?.email ?? '—';
  const bloodType = profile?.bloodType ?? '—';
  const nfcTagId  = profile?.nfcTagId  ?? '—';

  // Calcular edad a partir de dateOfBirth
  const dobStr    = profile?.dateOfBirth;
  const dobFormatted = (() => {
    if (!dobStr) return '—';
    const dob  = new Date(dobStr);
    const age  = new Date().getFullYear() - dob.getFullYear();
    const label = dobStr.split('T')[0] ?? dobStr;
    return `${label} · ${age} años`;
  })();

  const initials = `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();

  const handleLogout = async () => {
    setLogout(false);
    try { await logout(); } catch {}
    router.replace('/login');
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <Text style={s.title}>Perfil</Text>

        {/* ── Avatar card ─────────────────────────────────────────────── */}
        <View style={s.avatarCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              {loadingProfile
                ? <ActivityIndicator color={PINK_FG} />
                : <Text style={s.avatarText}>{initials}</Text>
              }
            </View>
            <TouchableOpacity style={s.cameraBtn} activeOpacity={0.85}>
              <CameraIcon color="#FFFFFF" size={14} />
            </TouchableOpacity>
          </View>
          <Text style={s.userName}>{u.firstName} {u.lastName}</Text>
          <Text style={s.userEmail}>{email}</Text>
          <TouchableOpacity style={s.editBtn} onPress={() => { setDraft(u); setEditOpen(true); }} activeOpacity={0.85}>
            <PencilIcon color="#FFFFFF" size={14} />
            <Text style={s.editBtnText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* ── Información personal ─────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Información personal</Text>
        <View style={s.list}>
          <InfoRow s={s} icon={<MailIcon    color={MUTED} />} label="Email"              value={email} />
          <InfoRow s={s} icon={<PhoneIcon   color={MUTED} />} label="Teléfono"           value={u.phone} />
          <InfoRow s={s} icon={<MapPinIcon  color={MUTED} />} label="Ubicación"          value={u.location} />
          <InfoRow s={s} icon={<DropletIcon color={MUTED} />} label="Tipo de sangre"     value={bloodType} />
          <InfoRow s={s} icon={<CalendarIcon color={MUTED} />} label="Fecha de nacimiento" value={dobFormatted} />
        </View>

        {/* ── Mi manilla Horus ─────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Mi manilla Horus</Text>
        <View style={s.statGrid}>
          <DeviceStat s={s} icon={<NfcIcon        color={GREEN_FG}  size={16} />} label="NFC"      value="Activo"  bg={GREEN}  fg={GREEN_FG}  />
          <DeviceStat s={s} icon={<NavigationIcon color={BLUE_FG}   size={16} />} label="GPS"      value="—"       bg={BLUE}   fg={BLUE_FG}   />
          <DeviceStat s={s} icon={<BatteryLowIcon color={PINK_FG}   size={16} />} label="Batería"  value="—"       bg={PINK}   fg={PINK_FG}   />
          <DeviceStat s={s} icon={<CpuIcon        color={YELLOW_FG} size={16} />} label="Firmware" value="v2.4.1"  bg={YELLOW} fg={YELLOW_FG} />
        </View>
        <View style={s.nfcCard}>
          <Text style={s.nfcLabel}>ID del tag NFC</Text>
          <Text style={s.nfcValue}>{nfcTagId}</Text>
        </View>

        {/* ── Acciones ─────────────────────────────────────────────────── */}
        <View style={s.list}>
          <TouchableOpacity style={s.actionRow} onPress={() => router.push('/settings')} activeOpacity={0.75}>
            <SettingsIcon color={PRIMARY} size={18} />
            <Text style={s.actionText}>Configuración</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionRow} onPress={() => setLogout(true)} activeOpacity={0.75}>
            <LogOutIcon color={RED} size={18} />
            <Text style={[s.actionText, { color: RED }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Edit bottom sheet ────────────────────────────────────────── */}
      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditOpen(false)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Editar perfil</Text>
              <TouchableOpacity style={s.sheetClose} onPress={() => setEditOpen(false)}>
                <XIcon color={PRIMARY} size={16} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <SheetField s={s} label="Nombre"   value={draft.firstName} onChange={v => setDraft({ ...draft, firstName: v })} />
              <SheetField s={s} label="Apellido" value={draft.lastName}  onChange={v => setDraft({ ...draft, lastName: v })} />
              <SheetField s={s} label="Teléfono" value={draft.phone}     onChange={v => setDraft({ ...draft, phone: v })} />
              <SheetField s={s} label="Ubicación" value={draft.location} onChange={v => setDraft({ ...draft, location: v })} />
            </View>
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetBtnGrey} onPress={() => setEditOpen(false)} activeOpacity={0.85}>
                <Text style={s.sheetBtnGreyText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.sheetBtnDark} onPress={() => { setU(draft); setEditOpen(false); }} activeOpacity={0.85}>
                <Text style={s.sheetBtnDarkText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Logout confirm modal ─────────────────────────────────────── */}
      <Modal visible={logoutOpen} animationType="fade" transparent onRequestClose={() => setLogout(false)}>
        <TouchableOpacity style={s.logoutOverlay} activeOpacity={1} onPress={() => setLogout(false)}>
          <TouchableOpacity style={s.logoutModal} activeOpacity={1}>
            <View style={s.logoutIcon}>
              <LogOutIcon color={RED} size={22} />
            </View>
            <Text style={s.logoutTitle}>¿Cerrar sesión?</Text>
            <Text style={s.logoutSub}>Tendrás que iniciar sesión de nuevo.</Text>
            <View style={s.logoutBtns}>
              <TouchableOpacity style={s.logoutBtnGrey} onPress={() => setLogout(false)} activeOpacity={0.85}>
                <Text style={s.logoutBtnGreyText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.logoutBtnRed} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={s.logoutBtnRedText}>Cerrar sesión</Text>
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
  BG: string, CARD: string, PRIMARY: string, MUTED: string, MUTED_BG: string,
  GREEN: string, YELLOW: string, BLUE: string, PINK: string, RED: string, RED_BG: string,
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    scroll:    { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 16 },

    title: { fontSize: 26, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.52, paddingTop: 8 },

    // Avatar card
    avatarCard: {
      backgroundColor: CARD, borderRadius: 28, paddingVertical: 24, paddingHorizontal: 20,
      alignItems: 'center', gap: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    avatarWrap: { position: 'relative', marginBottom: 4 },
    avatar: {
      width: 96, height: 96, borderRadius: 48,
      backgroundColor: PINK, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 32, fontFamily: FONT.displayBold, color: PINK_FG },
    cameraBtn: {
      position: 'absolute', bottom: 0, right: 0,
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: CARD,
    },
    userName:  { fontSize: 20, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.4, marginTop: 4 },
    userEmail: { fontSize: 13, fontFamily: FONT.sansRegular, color: MUTED },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#1A1512', borderRadius: 20,
      paddingHorizontal: 20, paddingVertical: 10, marginTop: 8,
    },
    editBtnText: { fontSize: 13, fontFamily: FONT.sansBold, color: '#FFFFFF' },

    // Section title
    sectionTitle: { fontSize: 17, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.34 },

    // Info rows
    list:    { gap: 8 },
    infoRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: CARD, borderRadius: 20, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    infoIcon: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    infoLabel: { fontSize: 11, fontFamily: FONT.sansMedium, color: MUTED, marginBottom: 2 },
    infoValue: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY },

    // Device stats grid
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
      flex: 1, minWidth: '44%',
      backgroundColor: CARD, borderRadius: 20, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    statIcon: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    statLabel: { fontSize: 11, fontFamily: FONT.sansRegular, color: MUTED, marginTop: 8 },
    statValue: { fontSize: 15, fontFamily: FONT.displayBold, color: PRIMARY, marginTop: 2 },

    // NFC card
    nfcCard: {
      backgroundColor: CARD, borderRadius: 20, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    nfcLabel: { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED },
    nfcValue: { fontSize: 14, fontFamily: FONT.displayBold, color: PRIMARY, marginTop: 2 },

    // Action rows
    actionRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: CARD, borderRadius: 20, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    actionText: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY, flex: 1 },

    // Modals
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(26,21,18,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: BG, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24,
    },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    sheetTitle:  { fontSize: 18, fontFamily: FONT.displayBold, color: PRIMARY },
    sheetClose: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center',
    },
    sheetField: {
      backgroundColor: CARD, borderRadius: 16,
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    sheetFieldLabel: { fontSize: 11, fontFamily: FONT.sansMedium, color: MUTED, marginBottom: 2 },
    sheetFieldInput: { fontSize: 15, fontFamily: FONT.sansMedium, color: PRIMARY },
    sheetBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
    sheetBtnGrey: {
      flex: 1, backgroundColor: MUTED_BG, borderRadius: 16,
      paddingVertical: 14, alignItems: 'center',
    },
    sheetBtnGreyText: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY },
    sheetBtnDark: {
      flex: 1, backgroundColor: PRIMARY, borderRadius: 16,
      paddingVertical: 14, alignItems: 'center',
    },
    sheetBtnDarkText: { fontSize: 14, fontFamily: FONT.sansBold, color: '#FFFFFF' },

    // Logout modal
    logoutOverlay: {
      flex: 1, backgroundColor: 'rgba(26,21,18,0.5)',
      justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
    },
    logoutModal: {
      backgroundColor: CARD, borderRadius: 28, width: '100%',
      paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24,
      alignItems: 'center', gap: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18, shadowRadius: 24, elevation: 16,
    },
    logoutIcon: {
      width: 52, height: 52, borderRadius: 16,
      backgroundColor: RED_BG, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    logoutTitle: { fontSize: 18, fontFamily: FONT.displayBold, color: PRIMARY, marginTop: 4 },
    logoutSub:   { fontSize: 13, fontFamily: FONT.sansRegular, color: MUTED, textAlign: 'center', lineHeight: 18, marginBottom: 4 },
    logoutBtns:        { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
    logoutBtnGrey:     { flex: 1, backgroundColor: MUTED_BG, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
    logoutBtnGreyText: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY },
    logoutBtnRed:      { flex: 1, backgroundColor: RED, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
    logoutBtnRedText:  { fontSize: 14, fontFamily: FONT.sansBold, color: '#FFFFFF' },
  });
}
