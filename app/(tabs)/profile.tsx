import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, getErrorMessage } from '../../services/api';
import { FONT } from '../../constants/fonts';
import { useAppTheme } from '../../hooks/useAppTheme';

// ── Foreground colors ──────────────────────────────────────────────────────
const GREEN_FG  = '#1A3D0A';
const YELLOW_FG = '#3D2C00';
const BLUE_FG   = '#1A3A5C';
const PINK_FG   = '#7A1A3A';

// ── Blood type: Prisma enum ↔ display ──────────────────────────────────────
const BLOOD_TYPES = [
  { label: 'A+',  value: 'A_POSITIVE'  },
  { label: 'A-',  value: 'A_NEGATIVE'  },
  { label: 'B+',  value: 'B_POSITIVE'  },
  { label: 'B-',  value: 'B_NEGATIVE'  },
  { label: 'AB+', value: 'AB_POSITIVE' },
  { label: 'AB-', value: 'AB_NEGATIVE' },
  { label: 'O+',  value: 'O_POSITIVE'  },
  { label: 'O-',  value: 'O_NEGATIVE'  },
] as const;

function bloodTypeLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return BLOOD_TYPES.find(b => b.value === value)?.label ?? value;
}

// ── Date picker data ───────────────────────────────────────────────────────
const MONTHS_ES = [
  { label: 'Enero',      value: '1'  },
  { label: 'Febrero',    value: '2'  },
  { label: 'Marzo',      value: '3'  },
  { label: 'Abril',      value: '4'  },
  { label: 'Mayo',       value: '5'  },
  { label: 'Junio',      value: '6'  },
  { label: 'Julio',      value: '7'  },
  { label: 'Agosto',     value: '8'  },
  { label: 'Septiembre', value: '9'  },
  { label: 'Octubre',    value: '10' },
  { label: 'Noviembre',  value: '11' },
  { label: 'Diciembre',  value: '12' },
];
const DAYS = Array.from({ length: 31 }, (_, i) => ({
  label: String(i + 1), value: String(i + 1),
}));
const CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => ({
  label: String(CUR_YEAR - i), value: String(CUR_YEAR - i),
}));
const GENDERS = [
  { label: 'Masculino',         value: 'MALE'             },
  { label: 'Femenino',          value: 'FEMALE'           },
  { label: 'Otro',              value: 'OTHER'            },
  { label: 'Prefiero no decir', value: 'PREFER_NOT_TO_SAY'},
];
const ID_TYPES = [
  { label: 'Cédula de ciudadanía',  value: 'CC' },
  { label: 'Cédula de extranjería', value: 'CE' },
  { label: 'Pasaporte',             value: 'PP' },
  { label: 'Tarjeta de identidad',  value: 'TI' },
];

// ── SVG Icons ──────────────────────────────────────────────────────────────
const I = (p: { children: React.ReactNode; size?: number }) => (
  <Svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none">
    {p.children}
  </Svg>
);
const sw = { strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const CameraIcon      = ({ color, size=16 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" stroke={color} {...sw} /><Circle cx={12} cy={13} r={3} stroke={color} {...sw} /></I>;
const PencilIcon      = ({ color, size=16 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" stroke={color} {...sw} /></I>;
const MailIcon        = ({ color, size=18 }: { color: string; size?: number }) =>
  <I size={size}><Rect x={2} y={4} width={20} height={16} rx={2} stroke={color} {...sw} /><Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={color} {...sw} /></I>;
const DropletIcon     = ({ color, size=18 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" stroke={color} {...sw} /></I>;
const CalendarIcon    = ({ color, size=18 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M8 2v4M16 2v4" stroke={color} {...sw} /><Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} {...sw} /><Path d="M3 10h18" stroke={color} {...sw} /></I>;
const NfcIcon         = ({ color, size=16 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M6 8.32a7.43 7.43 0 0 0 0 7.36" stroke={color} {...sw} /><Path d="M9.46 6.21a11.76 11.76 0 0 0 0 11.58" stroke={color} {...sw} /><Path d="M12.91 4.1a15.91 15.91 0 0 1 0 15.8" stroke={color} {...sw} /><Path d="M16.37 2a20.16 20.16 0 0 1 0 20" stroke={color} {...sw} /></I>;
const NavigationIcon  = ({ color, size=16 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M3.707 6.293a1 1 0 0 0 0 1.414l13.586 13.586a1 1 0 0 0 1.414 0l2.586-2.586a1 1 0 0 0 0-1.414L7.707 3.707a1 1 0 0 0-1.414 0z" stroke={color} {...sw} /><Path d="m3 3 7.5 2L13 8l-5-1.5z" stroke={color} {...sw} /></I>;
const BatteryLowIcon  = ({ color, size=16 }: { color: string; size?: number }) =>
  <I size={size}><Rect x={2} y={7} width={16} height={10} rx={2} stroke={color} {...sw} /><Path d="M22 11v2M6 11v2" stroke={color} {...sw} /></I>;
const CpuIcon         = ({ color, size=16 }: { color: string; size?: number }) =>
  <I size={size}><Rect x={4} y={4} width={16} height={16} rx={2} stroke={color} {...sw} /><Rect x={9} y={9} width={6} height={6} stroke={color} {...sw} /><Path d="M15 2v2M9 2v2M2 15h2M2 9h2M15 20v2M9 20v2M20 15h2M20 9h2" stroke={color} {...sw} /></I>;
const SettingsIcon    = ({ color, size=18 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke={color} {...sw} /><Circle cx={12} cy={12} r={3} stroke={color} {...sw} /></I>;
const LogOutIcon      = ({ color, size=18 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} {...sw} /><Polyline points="16 17 21 12 16 7" stroke={color} {...sw} /><Line x1={21} y1={12} x2={9} y2={12} stroke={color} {...sw} /></I>;
const XIcon           = ({ color, size=16 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M18 6 6 18M6 6l12 12" stroke={color} {...sw} /></I>;
const ChevronDownIcon = ({ color, size=14 }: { color: string; size?: number }) =>
  <I size={size}><Path d="m6 9 6 6 6-6" stroke={color} {...sw} /></I>;
const CheckIcon       = ({ color, size=14 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M20 6 9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></I>;
const UserIcon        = ({ color, size=16 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} {...sw} /><Circle cx={12} cy={7} r={4} stroke={color} {...sw} /></I>;
const IdCardIcon      = ({ color, size=18 }: { color: string; size?: number }) =>
  <I size={size}><Rect x={2} y={5} width={20} height={14} rx={2} stroke={color} {...sw} /><Path d="M16 10h2M16 14h2M6 10h.01M6 14h.01" stroke={color} {...sw} /></I>;
const UsersIcon       = ({ color, size=18 }: { color: string; size?: number }) =>
  <I size={size}><Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} {...sw} /><Circle cx={9} cy={7} r={4} stroke={color} {...sw} /><Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} {...sw} /></I>;

// ── Types ──────────────────────────────────────────────────────────────────
type ProfileData = {
  firstName:              string;
  lastName:               string;
  email:                  string;
  bloodType?:             string;
  dateOfBirth?:           string;   // YYYY-MM-DD from API
  nfcTagId?:              string;
  gender?:                string;
  identificationType?:    string;
  identificationNumber?:  string;
};

const GENDER_LABELS: Record<string, string> = {
  MALE:             'Masculino',
  FEMALE:           'Femenino',
  OTHER:            'Otro',
  PREFER_NOT_TO_SAY:'Prefiero no decir',
};
const ID_TYPE_LABELS: Record<string, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  PP: 'Pasaporte',
  TI: 'Tarjeta de identidad',
};
function genderLabel(v?: string)  { return v ? (GENDER_LABELS[v]  ?? v) : '—'; }
function idTypeLabel(v?: string)   { return v ? (ID_TYPE_LABELS[v] ?? v) : '—'; }

type UserDraft = {
  firstName:          string;
  lastName:           string;
  bloodType:          string;   // Prisma enum value
  dobDay:             string;   // "1"–"31"
  dobMonth:           string;   // "1"–"12"
  dobYear:            string;   // "1924"–current
  gender:             string;
  identificationType: string;
  identificationNumber: string;
};

type PickerKey = 'bloodType' | 'dobDay' | 'dobMonth' | 'dobYear' | 'gender' | 'identificationType' | null;
type PickerOption = { label: string; value: string };

// ── Sub-components ─────────────────────────────────────────────────────────
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

function SheetField({ label, value, onChange, placeholder, s }: {
  label: string; value: string; placeholder?: string;
  onChange: (v: string) => void; s: Styles;
}) {
  return (
    <View style={s.sheetField}>
      <Text style={s.sheetFieldLabel}>{label}</Text>
      <TextInput
        style={s.sheetFieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? '—'}
        placeholderTextColor={s.sheetFieldInput.color + '60'}
      />
    </View>
  );
}

/** Tappable dropdown field — shows label + current value + chevron */
function PickerField({ label, displayValue, onPress, s }: {
  label: string; displayValue: string; onPress: () => void; s: Styles;
}) {
  const { MUTED } = useAppTheme();
  return (
    <TouchableOpacity style={s.sheetField} onPress={onPress} activeOpacity={0.75}>
      <Text style={s.sheetFieldLabel}>{label}</Text>
      <View style={s.pickerFieldRow}>
        <Text
          style={[s.sheetFieldInput, { flex: 1 }, !displayValue && { opacity: 0.4 }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayValue || 'Seleccionar'}
        </Text>
        <ChevronDownIcon color={MUTED} size={14} />
      </View>
    </TouchableOpacity>
  );
}

/** Bottom-sheet modal with scrollable list of options */
function PickerModal({ visible, title, options, selected, onSelect, onClose }: {
  visible: boolean; title: string;
  options: PickerOption[]; selected: string;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={[pm.sheet, { backgroundColor: BG, paddingBottom: insets.bottom + 12 }]} activeOpacity={1}>
          {/* Header */}
          <View style={pm.header}>
            <Text style={[pm.title, { color: PRIMARY, fontFamily: FONT.displayBold }]}>{title}</Text>
            <TouchableOpacity style={[pm.closeBtn, { backgroundColor: MUTED_BG }]} onPress={onClose}>
              <XIcon color={PRIMARY} size={16} />
            </TouchableOpacity>
          </View>
          {/* List */}
          <FlatList
            data={options}
            keyExtractor={item => item.value}
            style={{ maxHeight: 320 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 4, paddingHorizontal: 4 }}
            renderItem={({ item }) => {
              const active = item.value === selected;
              return (
                <TouchableOpacity
                  style={[pm.option, { backgroundColor: active ? PRIMARY : CARD }]}
                  onPress={() => { onSelect(item.value); onClose(); }}
                  activeOpacity={0.75}
                >
                  <Text style={[pm.optionText, { color: active ? BG : PRIMARY, fontFamily: FONT.sansBold }]}>
                    {item.label}
                  </Text>
                  {active && <CheckIcon color={BG} size={14} />}
                </TouchableOpacity>
              );
            }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
const pm = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(26,21,18,0.45)', justifyContent: 'flex-end' },
  sheet:     { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title:     { fontSize: 17 },
  closeBtn:  { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
  },
  optionText: { fontSize: 15 },
});

// ── Screen ─────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, BLUE, PINK, RED, RED_BG, isDark } = useAppTheme();
  const s = React.useMemo(
    () => makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, BLUE, PINK, RED, RED_BG),
    [isDark]
  );

  const { user, logout, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [profile,        setProfile]        = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [editOpen,       setEditOpen]       = useState(false);
  const [viewOpen,       setViewOpen]       = useState(false);
  const [logoutOpen,     setLogout]         = useState(false);
  const [activePicker,   setActivePicker]   = useState<PickerKey>(null);
  const [draft,          setDraft]          = useState<UserDraft>({
    firstName: '', lastName: '', bloodType: '', dobDay: '', dobMonth: '', dobYear: '',
    gender: '', identificationType: '', identificationNumber: '',
  });

  useFocusEffect(
    useCallback(() => {
      setLoadingProfile(true);
      apiClient.get<ProfileData>('/profile')
        .then(r => setProfile(r.data))
        .catch(() => {})
        .finally(() => setLoadingProfile(false));
    }, [])
  );

  // ── Derived display values ────────────────────────────────────────────
  const firstName = profile?.firstName ?? user?.firstName ?? '—';
  const lastName  = profile?.lastName  ?? user?.lastName  ?? '—';
  const email     = profile?.email     ?? user?.email     ?? '—';
  const nfcTagId  = profile?.nfcTagId  ?? '—';
  const initials  = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  const dobFormatted = (() => {
    const dob = profile?.dateOfBirth;
    if (!dob) return '—';
    const d   = new Date(dob + 'T00:00:00');
    const age = new Date().getFullYear() - d.getFullYear();
    const mon = MONTHS_ES[d.getMonth()]?.label ?? '';
    return `${d.getDate()} ${mon} ${d.getFullYear()} · ${age} años`;
  })();

  // ── Open edit with current values ─────────────────────────────────────
  const openEdit = () => {
    const dob = profile?.dateOfBirth;  // "YYYY-MM-DD"
    let dobDay = '', dobMonth = '', dobYear = '';
    if (dob) {
      const parts = dob.split('-');
      dobYear  = parts[0] ?? '';
      dobMonth = parts[1] ? String(parseInt(parts[1], 10)) : '';
      dobDay   = parts[2] ? String(parseInt(parts[2], 10)) : '';
    }
    setDraft({
      firstName:            profile?.firstName           ?? user?.firstName ?? '',
      lastName:             profile?.lastName            ?? user?.lastName  ?? '',
      bloodType:            profile?.bloodType           ?? '',
      dobDay, dobMonth, dobYear,
      gender:               profile?.gender              ?? '',
      identificationType:   profile?.identificationType  ?? '',
      identificationNumber: profile?.identificationNumber ?? '',
    });
    setEditOpen(true);
  };

  // ── Save to API ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      Alert.alert('Campos requeridos', 'Nombre y apellido no pueden estar vacíos.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        firstName: draft.firstName.trim(),
        lastName:  draft.lastName.trim(),
      };
      if (draft.bloodType)            payload.bloodType           = draft.bloodType;
      if (draft.gender)               payload.gender              = draft.gender;
      if (draft.identificationType)   payload.identificationType  = draft.identificationType;
      if (draft.identificationNumber.trim()) payload.identificationNumber = draft.identificationNumber.trim();
      if (draft.dobDay && draft.dobMonth && draft.dobYear) {
        const y = draft.dobYear.padStart(4, '0');
        const m = draft.dobMonth.padStart(2, '0');
        const d = draft.dobDay.padStart(2, '0');
        payload.dateOfBirth = `${y}-${m}-${d}`;
      }
      const { data } = await apiClient.put<ProfileData>('/profile', payload);
      setProfile(data);
      updateUser({ firstName: data.firstName, lastName: data.lastName });
      setEditOpen(false);
    } catch (err) {
      Alert.alert('Error al guardar', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLogout(false);
    try { await logout(); } catch {}
    router.replace('/login');
  };

  // ── Picker display labels ─────────────────────────────────────────────
  const bloodDisplay = bloodTypeLabel(draft.bloodType);
  const dayDisplay   = draft.dobDay   ? `Día ${draft.dobDay}`                            : '';
  const monthDisplay = draft.dobMonth ? (MONTHS_ES.find(m => m.value === draft.dobMonth)?.label ?? '') : '';
  const yearDisplay  = draft.dobYear  || '';

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

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
          <Text style={s.userName}>{firstName} {lastName}</Text>
          <Text style={s.userEmail}>{email}</Text>
          <TouchableOpacity style={s.viewBtn} onPress={() => setViewOpen(true)} activeOpacity={0.85}>
            <UserIcon color={PRIMARY} size={14} />
            <Text style={[s.viewBtnText, { color: PRIMARY }]}>Ver perfil</Text>
          </TouchableOpacity>
        </View>

        {/* ── Información personal ─────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Información personal</Text>
        <View style={s.list}>
          <InfoRow s={s} icon={<MailIcon     color={MUTED} />} label="Email"               value={email} />
          <InfoRow s={s} icon={<DropletIcon  color={MUTED} />} label="Tipo de sangre"      value={bloodTypeLabel(profile?.bloodType)} />
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
      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => !saving && setEditOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => !saving && setEditOpen(false)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Editar perfil</Text>
              <TouchableOpacity style={s.sheetClose} onPress={() => !saving && setEditOpen(false)} disabled={saving}>
                <XIcon color={PRIMARY} size={16} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              {/* Nombre */}
              <SheetField s={s} label="Nombre"   value={draft.firstName} onChange={v => setDraft(d => ({ ...d, firstName: v }))} />
              {/* Apellido */}
              <SheetField s={s} label="Apellido" value={draft.lastName}  onChange={v => setDraft(d => ({ ...d, lastName: v }))} />

              {/* Tipo de sangre */}
              <PickerField
                s={s}
                label="Tipo de sangre"
                displayValue={bloodDisplay === '—' ? '' : bloodDisplay}
                onPress={() => setActivePicker('bloodType')}
              />

              {/* Fecha de nacimiento */}
              <View style={{ gap: 4 }}>
                <Text style={[s.sheetFieldLabel, { paddingLeft: 4 }]}>Fecha de nacimiento</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <PickerField s={s} label="Día"  displayValue={draft.dobDay}   onPress={() => setActivePicker('dobDay')} />
                  </View>
                  <View style={{ flex: 2 }}>
                    <PickerField s={s} label="Mes"  displayValue={monthDisplay}   onPress={() => setActivePicker('dobMonth')} />
                  </View>
                  <View style={{ flex: 2 }}>
                    <PickerField s={s} label="Año"  displayValue={yearDisplay}    onPress={() => setActivePicker('dobYear')} />
                  </View>
                </View>
              </View>

              {/* Género */}
              <PickerField
                s={s}
                label="Género"
                displayValue={GENDERS.find(g => g.value === draft.gender)?.label ?? ''}
                onPress={() => setActivePicker('gender')}
              />

              {/* Tipo de identificación */}
              <PickerField
                s={s}
                label="Tipo de identificación"
                displayValue={ID_TYPES.find(t => t.value === draft.identificationType)?.label ?? ''}
                onPress={() => setActivePicker('identificationType')}
              />

              {/* Número de identificación */}
              <SheetField
                s={s}
                label="Número de identificación"
                value={draft.identificationNumber}
                onChange={v => setDraft(d => ({ ...d, identificationNumber: v }))}
                placeholder="1234567890"
              />
            </View>

            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetBtnGrey} onPress={() => setEditOpen(false)} disabled={saving} activeOpacity={0.85}>
                <Text style={s.sheetBtnGreyText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetBtnDark, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                {saving
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={s.sheetBtnDarkText}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Picker modals ────────────────────────────────────────────────── */}
      <PickerModal
        visible={activePicker === 'bloodType'}
        title="Tipo de sangre"
        options={BLOOD_TYPES as unknown as PickerOption[]}
        selected={draft.bloodType}
        onSelect={v => setDraft(d => ({ ...d, bloodType: v }))}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === 'dobDay'}
        title="Día"
        options={DAYS}
        selected={draft.dobDay}
        onSelect={v => setDraft(d => ({ ...d, dobDay: v }))}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === 'dobMonth'}
        title="Mes"
        options={MONTHS_ES}
        selected={draft.dobMonth}
        onSelect={v => setDraft(d => ({ ...d, dobMonth: v }))}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === 'dobYear'}
        title="Año"
        options={YEARS}
        selected={draft.dobYear}
        onSelect={v => setDraft(d => ({ ...d, dobYear: v }))}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === 'gender'}
        title="Género"
        options={GENDERS}
        selected={draft.gender}
        onSelect={v => setDraft(d => ({ ...d, gender: v }))}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === 'identificationType'}
        title="Tipo de identificación"
        options={ID_TYPES}
        selected={draft.identificationType}
        onSelect={v => setDraft(d => ({ ...d, identificationType: v }))}
        onClose={() => setActivePicker(null)}
      />

      {/* ── Ver perfil modal ────────────────────────────────────────────── */}
      <Modal visible={viewOpen} animationType="slide" transparent onRequestClose={() => setViewOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setViewOpen(false)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            {/* Header */}
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Información del perfil</Text>
              <TouchableOpacity style={s.sheetClose} onPress={() => setViewOpen(false)}>
                <XIcon color={PRIMARY} size={16} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 10 }}>

              {/* Nombre completo */}
              <View style={s.viewSection}>
                <Text style={s.viewSectionTitle}>Datos personales</Text>
                <View style={s.viewRow}>
                  <View style={[s.viewIcon, { backgroundColor: MUTED_BG }]}><UserIcon color={MUTED} size={16} /></View>
                  <View style={s.viewCol}>
                    <Text style={s.viewLabel}>Nombre completo</Text>
                    <Text style={s.viewValue}>{firstName} {lastName}</Text>
                  </View>
                </View>
                <View style={s.viewRow}>
                  <View style={[s.viewIcon, { backgroundColor: MUTED_BG }]}><MailIcon color={MUTED} size={16} /></View>
                  <View style={s.viewCol}>
                    <Text style={s.viewLabel}>Correo electrónico</Text>
                    <Text style={s.viewValue}>{email}</Text>
                  </View>
                </View>
                <View style={s.viewRow}>
                  <View style={[s.viewIcon, { backgroundColor: MUTED_BG }]}><CalendarIcon color={MUTED} size={16} /></View>
                  <View style={s.viewCol}>
                    <Text style={s.viewLabel}>Fecha de nacimiento</Text>
                    <Text style={s.viewValue}>{dobFormatted}</Text>
                  </View>
                </View>
                <View style={s.viewRow}>
                  <View style={[s.viewIcon, { backgroundColor: MUTED_BG }]}><UsersIcon color={MUTED} size={16} /></View>
                  <View style={s.viewCol}>
                    <Text style={s.viewLabel}>Género</Text>
                    <Text style={s.viewValue}>{genderLabel(profile?.gender)}</Text>
                  </View>
                </View>
              </View>

              {/* Datos médicos */}
              <View style={s.viewSection}>
                <Text style={s.viewSectionTitle}>Datos médicos</Text>
                <View style={s.viewRow}>
                  <View style={[s.viewIcon, { backgroundColor: MUTED_BG }]}><DropletIcon color={MUTED} size={16} /></View>
                  <View style={s.viewCol}>
                    <Text style={s.viewLabel}>Tipo de sangre</Text>
                    <Text style={s.viewValue}>{bloodTypeLabel(profile?.bloodType)}</Text>
                  </View>
                </View>
              </View>

              {/* Identificación */}
              <View style={s.viewSection}>
                <Text style={s.viewSectionTitle}>Identificación</Text>
                <View style={s.viewRow}>
                  <View style={[s.viewIcon, { backgroundColor: MUTED_BG }]}><IdCardIcon color={MUTED} size={16} /></View>
                  <View style={s.viewCol}>
                    <Text style={s.viewLabel}>Tipo de documento</Text>
                    <Text style={s.viewValue}>{idTypeLabel(profile?.identificationType)}</Text>
                  </View>
                </View>
                <View style={s.viewRow}>
                  <View style={[s.viewIcon, { backgroundColor: MUTED_BG }]}><IdCardIcon color={MUTED} size={16} /></View>
                  <View style={s.viewCol}>
                    <Text style={s.viewLabel}>Número de documento</Text>
                    <Text style={s.viewValue}>{profile?.identificationNumber ?? '—'}</Text>
                  </View>
                </View>
              </View>

            </ScrollView>

            {/* Botón editar desde aquí */}
            <TouchableOpacity
              style={[s.sheetBtnDark, { marginTop: 20 }]}
              onPress={() => { setViewOpen(false); setTimeout(openEdit, 300); }}
              activeOpacity={0.85}
            >
              <PencilIcon color="#FFFFFF" size={14} />
              <Text style={s.sheetBtnDarkText}>Editar información</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Logout confirm ───────────────────────────────────────────────── */}
      <Modal visible={logoutOpen} animationType="fade" transparent onRequestClose={() => setLogout(false)}>
        <TouchableOpacity style={s.logoutOverlay} activeOpacity={1} onPress={() => setLogout(false)}>
          <TouchableOpacity style={s.logoutModal} activeOpacity={1}>
            <View style={s.logoutIcon}><LogOutIcon color={RED} size={22} /></View>
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
    userName:    { fontSize: 20, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.4, marginTop: 4 },
    userEmail:   { fontSize: 13, fontFamily: FONT.sansRegular, color: MUTED },
    viewBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 20,
      paddingHorizontal: 18, paddingVertical: 10,
    },
    viewBtnText: { fontSize: 13, fontFamily: FONT.sansBold },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#1A1512', borderRadius: 20,
      paddingHorizontal: 18, paddingVertical: 10,
    },
    editBtnText: { fontSize: 13, fontFamily: FONT.sansBold, color: '#FFFFFF' },

    // View profile modal rows
    viewSection: {
      backgroundColor: CARD, borderRadius: 20, padding: 4, gap: 2,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    viewSectionTitle: { fontSize: 11, fontFamily: FONT.sansBold, color: MUTED, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
    viewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
    viewIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    viewCol: { flex: 1, minWidth: 0 },
    viewLabel: { fontSize: 11, fontFamily: FONT.sansMedium, color: MUTED, marginBottom: 1 },
    viewValue: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY },

    sectionTitle: { fontSize: 17, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.34 },

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

    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
      flex: 1, minWidth: '44%',
      backgroundColor: CARD, borderRadius: 20, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    statIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontSize: 11, fontFamily: FONT.sansRegular, color: MUTED, marginTop: 8 },
    statValue: { fontSize: 15, fontFamily: FONT.displayBold, color: PRIMARY, marginTop: 2 },

    nfcCard: {
      backgroundColor: CARD, borderRadius: 20, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    nfcLabel: { fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED },
    nfcValue: { fontSize: 14, fontFamily: FONT.displayBold, color: PRIMARY, marginTop: 2 },

    actionRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: CARD, borderRadius: 20, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    actionText: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY, flex: 1 },

    // Edit sheet
    modalOverlay: { flex: 1, backgroundColor: 'rgba(26,21,18,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: BG, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    sheetTitle:  { fontSize: 18, fontFamily: FONT.displayBold, color: PRIMARY },
    sheetClose:  { width: 32, height: 32, borderRadius: 16, backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center' },
    sheetField: {
      backgroundColor: CARD, borderRadius: 16,
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    sheetFieldLabel: { fontSize: 11, fontFamily: FONT.sansMedium, color: MUTED, marginBottom: 2 },
    sheetFieldInput: { fontSize: 15, fontFamily: FONT.sansMedium, color: PRIMARY },
    pickerFieldRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
    sheetBtns:       { flexDirection: 'row', gap: 12, marginTop: 20 },
    sheetBtnGrey:    { flex: 1, backgroundColor: MUTED_BG, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
    sheetBtnGreyText:{ fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY },
    sheetBtnDark:    { flex: 1, backgroundColor: '#1A1512', borderRadius: 16, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    sheetBtnDarkText:{ fontSize: 14, fontFamily: FONT.sansBold, color: '#FFFFFF' },

    // Logout modal
    logoutOverlay: { flex: 1, backgroundColor: 'rgba(26,21,18,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    logoutModal: {
      backgroundColor: CARD, borderRadius: 28, width: '100%',
      paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, alignItems: 'center', gap: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 16,
    },
    logoutIcon:        { width: 52, height: 52, borderRadius: 16, backgroundColor: RED_BG, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    logoutTitle:       { fontSize: 18, fontFamily: FONT.displayBold, color: PRIMARY, marginTop: 4 },
    logoutSub:         { fontSize: 13, fontFamily: FONT.sansRegular, color: MUTED, textAlign: 'center', lineHeight: 18, marginBottom: 4 },
    logoutBtns:        { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
    logoutBtnGrey:     { flex: 1, backgroundColor: MUTED_BG, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
    logoutBtnGreyText: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY },
    logoutBtnRed:      { flex: 1, backgroundColor: RED, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
    logoutBtnRedText:  { fontSize: 14, fontFamily: FONT.sansBold, color: '#FFFFFF' },
  });
}
