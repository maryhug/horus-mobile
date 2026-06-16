import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Alert, FlatList, Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, getErrorMessage } from '../../services/api';
import type { ProfileUpdatePayload } from '../../types/api';
import { FONT } from '../../constants/fonts';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useLanguage } from '../../contexts/LanguageContext';

// ── Foreground colors ──────────────────────────────────────────────────────
const PINK_FG   = '#7A1A3A';

// ── Enums display ──────────────────────────────────────────────────────────
const BLOOD_TYPES = [
  { label: 'A+',  value: 'A_POSITIVE'  }, { label: 'A-',  value: 'A_NEGATIVE'  },
  { label: 'B+',  value: 'B_POSITIVE'  }, { label: 'B-',  value: 'B_NEGATIVE'  },
  { label: 'AB+', value: 'AB_POSITIVE' }, { label: 'AB-', value: 'AB_NEGATIVE' },
  { label: 'O+',  value: 'O_POSITIVE'  }, { label: 'O-',  value: 'O_NEGATIVE'  },
] as const;

const ALLERGY_TYPES = [
  { label: 'Medicamento',    value: 'MEDICATION'   },
  { label: 'Alimento',       value: 'FOOD'         },
  { label: 'Ambiental',      value: 'ENVIRONMENTAL'},
  { label: 'Otro',           value: 'OTHER'        },
];
const ALLERGY_SEVERITIES = [
  { label: 'Leve',          value: 'MILD'             },
  { label: 'Moderada',      value: 'MODERATE'         },
  { label: 'Severa',        value: 'SEVERE'           },
  { label: 'Riesgo vital',  value: 'LIFE_THREATENING' },
];
const CONDITION_SEVERITIES = [
  { label: 'Leve',     value: 'MILD'     },
  { label: 'Moderada', value: 'MODERATE' },
  { label: 'Severa',   value: 'SEVERE'   },
];
const CONDITION_STATUSES = [
  { label: 'Activa',       value: 'ACTIVE'      },
  { label: 'Controlada',   value: 'MANAGED'     },
  { label: 'En remisión',  value: 'IN_REMISSION'},
  { label: 'Resuelta',     value: 'RESOLVED'    },
];

function bloodTypeLabel(v?: string | null)   { return v ? BLOOD_TYPES.find(b => b.value === v)?.label ?? v : '—'; }
function allergyTypeLabel(v: string)         { return ALLERGY_TYPES.find(a => a.value === v)?.label ?? v; }
function allergySeverityLabel(v: string)     { return ALLERGY_SEVERITIES.find(a => a.value === v)?.label ?? v; }
function conditionStatusLabel(v: string)     { return CONDITION_STATUSES.find(c => c.value === v)?.label ?? v; }

const DAYS      = Array.from({ length: 31 }, (_, i) => ({ label: String(i+1), value: String(i+1) }));
const CUR_YEAR  = new Date().getFullYear();
const YEARS     = Array.from({ length: 100 }, (_, i) => ({ label: String(CUR_YEAR - i), value: String(CUR_YEAR - i) }));

// ── Types ──────────────────────────────────────────────────────────────────
type ProfileData = {
  firstName: string; lastName: string; email: string;
  bloodType?: string; dateOfBirth?: string;
  gender?: string; identificationType?: string; identificationNumber?: string;
};
type AllergyItem = { id: string; allergenName: string; allergyType: string; severity: string; reactionDescription: string | null; isActive: boolean };
type ConditionItem = { id: string; conditionName: string; severity: string | null; status: string; notes: string | null };
type MedItem = { id: string; name: string; dosage: string | null; frequency: string | null; isCurrent: boolean };
type MedProfile = { heightCm: number | null; weightKg: number | null; organDonor: boolean; insuranceProvider: string | null };
type MedicalData = { medicalProfile: MedProfile | null; allergies: AllergyItem[]; conditions: ConditionItem[]; medications: MedItem[] };

type EditDraft = {
  firstName: string; lastName: string; email: string;
  bloodType: string; dobDay: string; dobMonth: string; dobYear: string;
  gender: string; identificationType: string; identificationNumber: string;
  heightCm: string; weightKg: string; organDonor: boolean; insuranceProvider: string;
};


type PickerOption = { label: string; value: string };

// ── SVG Icons ──────────────────────────────────────────────────────────────
const I = (p: { children: React.ReactNode; size?: number }) => (
  <Svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none">{p.children}</Svg>
);
const sw = { strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const CameraIcon     = ({ color, size=16 }: { color: string; size?: number }) => <I size={size}><Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" stroke={color} {...sw} /><Circle cx={12} cy={13} r={3} stroke={color} {...sw} /></I>;
const PencilIcon     = ({ color, size=16 }: { color: string; size?: number }) => <I size={size}><Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" stroke={color} {...sw} /></I>;
const MailIcon       = ({ color, size=18 }: { color: string; size?: number }) => <I size={size}><Rect x={2} y={4} width={20} height={16} rx={2} stroke={color} {...sw} /><Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={color} {...sw} /></I>;
const DropletIcon    = ({ color, size=18 }: { color: string; size?: number }) => <I size={size}><Path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" stroke={color} {...sw} /></I>;
const CalendarIcon   = ({ color, size=18 }: { color: string; size?: number }) => <I size={size}><Path d="M8 2v4M16 2v4" stroke={color} {...sw} /><Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} {...sw} /><Path d="M3 10h18" stroke={color} {...sw} /></I>;
const SettingsIcon   = ({ color, size=18 }: { color: string; size?: number }) => <I size={size}><Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke={color} {...sw} /><Circle cx={12} cy={12} r={3} stroke={color} {...sw} /></I>;
const LogOutIcon     = ({ color, size=18 }: { color: string; size?: number }) => <I size={size}><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} {...sw} /><Polyline points="16 17 21 12 16 7" stroke={color} {...sw} /><Line x1={21} y1={12} x2={9} y2={12} stroke={color} {...sw} /></I>;
const XIcon          = ({ color, size=16 }: { color: string; size?: number }) => <I size={size}><Path d="M18 6 6 18M6 6l12 12" stroke={color} {...sw} /></I>;
const LockIcon       = ({ color, size=14 }: { color: string; size?: number }) => <I size={size}><Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} {...sw} /><Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} {...sw} /></I>;
const ChevronDownIcon= ({ color, size=14 }: { color: string; size?: number }) => <I size={size}><Path d="m6 9 6 6 6-6" stroke={color} {...sw} /></I>;
const ChevronRightIcon = ({ color, size=14 }: { color: string; size?: number }) => <I size={size}><Path d="m9 18 6-6-6-6" stroke={color} {...sw} /></I>;
const CheckIcon      = ({ color, size=14 }: { color: string; size?: number }) => <I size={size}><Path d="M20 6 9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></I>;
const UserIcon       = ({ color, size=16 }: { color: string; size?: number }) => <I size={size}><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} {...sw} /><Circle cx={12} cy={7} r={4} stroke={color} {...sw} /></I>;
const IdCardIcon     = ({ color, size=18 }: { color: string; size?: number }) => <I size={size}><Rect x={2} y={5} width={20} height={14} rx={2} stroke={color} {...sw} /><Path d="M16 10h2M16 14h2M6 10h.01M6 14h.01" stroke={color} {...sw} /></I>;
const UsersIcon      = ({ color, size=18 }: { color: string; size?: number }) => <I size={size}><Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} {...sw} /><Circle cx={9} cy={7} r={4} stroke={color} {...sw} /><Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} {...sw} /></I>;
const PlusIcon       = ({ color, size=16 }: { color: string; size?: number }) => <I size={size}><Path d="M12 5v14M5 12h14" stroke={color} {...sw} /></I>;
const HeartIcon      = ({ color, size=16 }: { color: string; size?: number }) => <I size={size}><Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} {...sw} /></I>;

// ── Picker modal ───────────────────────────────────────────────────────────
function PickerModal({ visible, title, options, selected, onSelect, onClose }: {
  visible: boolean; title: string; options: PickerOption[]; selected: string;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={[pm.sheet, { backgroundColor: BG, paddingBottom: insets.bottom + 12 }]} activeOpacity={1}>
          <View style={pm.header}>
            <Text style={[pm.title, { color: PRIMARY, fontFamily: FONT.displayBold }]}>{title}</Text>
            <TouchableOpacity style={[pm.closeBtn, { backgroundColor: MUTED_BG }]} onPress={onClose}>
              <XIcon color={PRIMARY} size={16} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options} keyExtractor={item => item.value}
            style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 4, paddingHorizontal: 4 }}
            renderItem={({ item }) => {
              const active = item.value === selected;
              return (
                <TouchableOpacity
                  style={[pm.option, { backgroundColor: active ? PRIMARY : CARD }]}
                  onPress={() => { onSelect(item.value); onClose(); }} activeOpacity={0.75}
                >
                  <Text style={[pm.optionText, { color: active ? BG : PRIMARY, fontFamily: FONT.sansBold }]}>{item.label}</Text>
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
  option:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13 },
  optionText:{ fontSize: 15 },
});

// ── SheetField / PickerField / InlinePickerField ───────────────────────────
function SheetField({ label, value, onChange, placeholder, locked, multiline }: {
  label: string; value: string; placeholder?: string;
  onChange: (v: string) => void; locked?: boolean; multiline?: boolean;
}) {
  const { CARD, PRIMARY, MUTED } = useAppTheme();
  return (
    <View style={[sf.field, { backgroundColor: CARD }, locked && sf.locked]}>
      <Text style={[sf.label, { color: MUTED }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={[sf.input, { color: PRIMARY, flex: 1 }]}
          value={value} onChangeText={onChange}
          placeholder={placeholder ?? '—'} placeholderTextColor={MUTED + '80'}
          editable={!locked} multiline={multiline}
        />
        {locked && <LockIcon color={MUTED} size={14} />}
      </View>
    </View>
  );
}

// Picker que se usa FUERA de un Modal — abre otro Modal encima
function PickerField({ label, displayValue, onPress, locked }: {
  label: string; displayValue: string; onPress: () => void; locked?: boolean;
}) {
  const { CARD, PRIMARY, MUTED } = useAppTheme();
  const { t } = useLanguage();
  return (
    <TouchableOpacity
      style={[sf.field, { backgroundColor: CARD }, locked && sf.locked]}
      onPress={locked ? undefined : onPress} activeOpacity={locked ? 1 : 0.75}
    >
      <Text style={[sf.label, { color: MUTED }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[sf.input, { color: PRIMARY, flex: 1 }, !displayValue && { opacity: 0.4 }]} numberOfLines={1}>
          {displayValue || t.select}
        </Text>
        {locked ? <LockIcon color={MUTED} size={14} /> : <ChevronDownIcon color={MUTED} size={14} />}
      </View>
    </TouchableOpacity>
  );
}

// Picker que se usa DENTRO de un Modal — expande opciones inline (sin modal anidado)
function InlinePickerField({ label, displayValue, options, selected, onSelect, locked }: {
  label: string; displayValue: string; options: PickerOption[];
  selected: string; onSelect: (v: string) => void; locked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { CARD, PRIMARY, MUTED, MUTED_BG, GREEN } = useAppTheme();
  return (
    <View>
      <TouchableOpacity
        style={[sf.field, { backgroundColor: CARD }, locked && sf.locked]}
        onPress={locked ? undefined : () => setOpen(o => !o)}
        activeOpacity={locked ? 1 : 0.75}
      >
        <Text style={[sf.label, { color: MUTED }]}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[sf.input, { color: PRIMARY, flex: 1 }, !displayValue && { opacity: 0.4 }]} numberOfLines={1}>
            {displayValue || 'Seleccionar'}
          </Text>
          {locked ? <LockIcon color={MUTED} size={14} /> : <ChevronDownIcon color={open ? PRIMARY : MUTED} size={14} />}
        </View>
      </TouchableOpacity>
      {open && (
        <View style={{ backgroundColor: CARD, borderRadius: 14, marginTop: 4, overflow: 'hidden',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 }}>
          {options.map((opt, i) => {
            const active = opt.value === selected;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { onSelect(opt.value); setOpen(false); }}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 16, paddingVertical: 13,
                  borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: MUTED_BG,
                  backgroundColor: active ? GREEN + '18' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: active ? FONT.sansBold : FONT.sansMedium, color: active ? PRIMARY : MUTED }}>
                  {opt.label}
                </Text>
                {active && <CheckIcon color={PRIMARY} size={14} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const sf = StyleSheet.create({
  field:  { borderRadius: 16, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  locked: { opacity: 0.5 },
  label:  { fontSize: 11, fontFamily: FONT.sansMedium, marginBottom: 2 },
  input:  { fontSize: 15, fontFamily: FONT.sansMedium },
});

// ── AccordionSection ───────────────────────────────────────────────────────
function AccordionSection({ title, icon, open, onToggle, children, badge, PRIMARY, CARD, MUTED, MUTED_BG }: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void;
  children: React.ReactNode; badge?: number | string;
  PRIMARY: string; CARD: string; MUTED: string; MUTED_BG: string;
}) {
  return (
    <View style={{ backgroundColor: CARD, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}>
      <TouchableOpacity
        onPress={onToggle} activeOpacity={0.75}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}
      >
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
        <Text style={{ flex: 1, fontSize: 15, fontFamily: FONT.displayBold, color: PRIMARY }}>{title}</Text>
        {badge !== undefined && (
          <View style={{ backgroundColor: PRIMARY, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
            <Text style={{ fontSize: 11, fontFamily: FONT.sansBold, color: CARD }}>{badge}</Text>
          </View>
        )}
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <ChevronRightIcon color={MUTED} size={16} />
        </View>
      </TouchableOpacity>
      {open && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
          {children}
        </View>
      )}
    </View>
  );
}

// ── InfoRow ────────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon, PRIMARY, MUTED, MUTED_BG }: {
  label: string; value: string; icon: React.ReactNode;
  PRIMARY: string; MUTED: string; MUTED_BG: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
      <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontFamily: FONT.sansRegular, color: MUTED }}>{label}</Text>
        <Text style={{ fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY }}>{value}</Text>
      </View>
    </View>
  );
}

// ── Severity badge ─────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const color = severity === 'LIFE_THREATENING' || severity === 'SEVERE' ? '#EF4444'
    : severity === 'MODERATE' ? '#F59E0B' : '#22C55E';
  return (
    <View style={{ backgroundColor: color + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontFamily: FONT.sansBold, color }}>{allergySeverityLabel(severity)}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'ACTIVE' ? '#EF4444' : status === 'MANAGED' ? '#F59E0B' : '#22C55E';
  return (
    <View style={{ backgroundColor: color + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontFamily: FONT.sansBold, color }}>{conditionStatusLabel(status)}</Text>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, BLUE, PINK, RED, RED_BG, isDark } = useAppTheme();
  const s = React.useMemo(
    () => makeStyles(BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, BLUE, PINK, RED, RED_BG),
    [isDark]
  );
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  // ── Translated pickers ────────────────────────────────────────────────────
  const GENDERS_T = React.useMemo(() => [
    { label: t.genderMale,      value: 'MALE'              },
    { label: t.genderFemale,    value: 'FEMALE'            },
    { label: t.genderOther,     value: 'OTHER'             },
    { label: t.genderPreferNot, value: 'PREFER_NOT_TO_SAY' },
  ], [t]);
  const ID_TYPES_T = React.useMemo(() => [
    { label: t.idTypeCC,  value: 'CC'  }, { label: t.idTypeCE,  value: 'CE'  },
    { label: t.idTypePP,  value: 'PP'  }, { label: t.idTypeTI,  value: 'TI'  },
    { label: t.idTypePPE, value: 'PPE' },
  ], [t]);
  const MONTHS_T = React.useMemo(() => t.months.map((label, i) => ({ label, value: String(i + 1) })), [t]);

  const genderLabel = (v?: string) => v ? (GENDERS_T.find(g => g.value === v)?.label ?? v) : '—';
  const idTypeLabel = (v?: string) => v ? (ID_TYPES_T.find(d => d.value === v)?.label ?? v) : '—';

  // ── State ─────────────────────────────────────────────────────────────────
  const [profile,     setProfile]     = useState<ProfileData | null>(null);
  const [medData,     setMedData]     = useState<MedicalData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [editOpen,    setEditOpen]    = useState(false);
  const [logoutOpen,  setLogout]      = useState(false);
  // Accordion state
  const [sections, setSections] = useState({ personal: true, medical: false, allergies: false, conditions: false, medications: false });
  const toggleSection = (k: keyof typeof sections) => setSections(p => ({ ...p, [k]: !p[k] }));

  // Edit draft
  const [draft, setDraft] = useState<EditDraft>({
    firstName: '', lastName: '', email: '', bloodType: '',
    dobDay: '', dobMonth: '', dobYear: '',
    gender: '', identificationType: '', identificationNumber: '',
    heightCm: '', weightKg: '', organDonor: false, insuranceProvider: '',
  });

  // Add allergy
  const [addAllergyOpen, setAddAllergyOpen] = useState(false);
  const [allergyDraft, setAllergyDraft] = useState({ allergenName: '', allergyType: '', severity: '', reactionDescription: '' });
  const [savingAllergy, setSavingAllergy] = useState(false);

  // Edit allergy
  const [editAllergyItem, setEditAllergyItem] = useState<AllergyItem | null>(null);
  const [editAllergyDraft, setEditAllergyDraft] = useState({ allergenName: '', allergyType: '', severity: '', reactionDescription: '' });
  const [savingEditAllergy, setSavingEditAllergy] = useState(false);

  // Add condition
  const [addConditionOpen, setAddConditionOpen] = useState(false);
  const [conditionDraft, setConditionDraft] = useState({ conditionName: '', severity: '', status: 'ACTIVE', notes: '' });
  const [savingCondition, setSavingCondition] = useState(false);

  // Edit condition
  const [editConditionItem, setEditConditionItem] = useState<ConditionItem | null>(null);
  const [editConditionDraft, setEditConditionDraft] = useState({ conditionName: '', severity: '', status: 'ACTIVE', notes: '' });
  const [savingEditCondition, setSavingEditCondition] = useState(false);

  // Add medication
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [medDraft, setMedDraft] = useState({ name: '', dosage: '', frequency: '' });
  const [savingMed, setSavingMed] = useState(false);

  // Edit medication
  const [editMedItem, setEditMedItem] = useState<MedItem | null>(null);
  const [editMedDraft, setEditMedDraft] = useState({ name: '', dosage: '', frequency: '', isCurrent: true });
  const [savingEditMed, setSavingEditMed] = useState(false);

  // ── Load data ─────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([
        apiClient.get<ProfileData>('/profile').then(r => setProfile(r.data)),
        apiClient.get<MedicalData>('/profile/medical').then(r => setMedData(r.data)),
      ]).catch(() => {}).finally(() => setLoading(false));
    }, [])
  );

  // ── Derived values ─────────────────────────────────────────────────────────
  const firstName = profile?.firstName ?? user?.firstName ?? '—';
  const lastName  = profile?.lastName  ?? user?.lastName  ?? '—';
  const email     = profile?.email     ?? user?.email     ?? '—';
  const initials  = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  const dobFormatted = (() => {
    const dob = profile?.dateOfBirth;
    if (!dob) return '—';
    const d   = new Date(dob + 'T00:00:00');
    const age = new Date().getFullYear() - d.getFullYear();
    const mon = t.months[d.getMonth()] ?? '';
    return `${d.getDate()} ${mon} ${d.getFullYear()} · ${age} ${t.years}`;
  })();

  const idLocked = !!profile?.identificationType && !!profile?.identificationNumber;

  // ── Open edit ─────────────────────────────────────────────────────────────
  const openEdit = () => {
    const dob = profile?.dateOfBirth;
    let dobDay = '', dobMonth = '', dobYear = '';
    if (dob) {
      const [y, m, d] = dob.split('-');
      dobYear = y ?? ''; dobMonth = m ? String(parseInt(m, 10)) : ''; dobDay = d ? String(parseInt(d, 10)) : '';
    }
    setDraft({
      firstName:            profile?.firstName           ?? user?.firstName ?? '',
      lastName:             profile?.lastName            ?? user?.lastName  ?? '',
      email:                profile?.email               ?? user?.email     ?? '',
      bloodType:            profile?.bloodType           ?? '',
      dobDay, dobMonth, dobYear,
      gender:               profile?.gender              ?? '',
      identificationType:   profile?.identificationType  ?? '',
      identificationNumber: profile?.identificationNumber ?? '',
      heightCm:             medData?.medicalProfile?.heightCm != null ? String(medData.medicalProfile.heightCm) : '',
      weightKg:             medData?.medicalProfile?.weightKg != null ? String(medData.medicalProfile.weightKg) : '',
      organDonor:           medData?.medicalProfile?.organDonor ?? false,
      insuranceProvider:    medData?.medicalProfile?.insuranceProvider ?? '',
    });
    setEditOpen(true);
  };

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      Alert.alert(t.profileRequiredFields, t.profileRequiredMsg); return;
    }
    const emailChanged = draft.email.trim().toLowerCase() !== email.toLowerCase();

    const doSave = async () => {
      setSaving(true);
      try {
        const payload: ProfileUpdatePayload = {
          firstName: draft.firstName.trim(),
          lastName:  draft.lastName.trim(),
        };
        if (draft.gender) payload.gender = draft.gender;
        if (!idLocked) {
          if (draft.identificationType)   payload.identificationType   = draft.identificationType;
          if (draft.identificationNumber) payload.identificationNumber = draft.identificationNumber.trim();
        }

        const [profileRes] = await Promise.all([
          apiClient.put<ProfileData>('/profile', payload),
          apiClient.put('/profile/medical', {
            heightCm:          draft.heightCm || null,
            weightKg:          draft.weightKg || null,
            organDonor:        draft.organDonor,
            insuranceProvider: draft.insuranceProvider || null,
          }),
          emailChanged ? apiClient.put('/profile/email', { email: draft.email.trim() }) : Promise.resolve(null),
        ]);

        setProfile(profileRes.data);
        if (emailChanged) setProfile(p => p ? { ...p, email: draft.email.trim() } : p);
        await apiClient.get<MedicalData>('/profile/medical').then(r => setMedData(r.data));
        updateUser({ firstName: profileRes.data.firstName, lastName: profileRes.data.lastName });
        setEditOpen(false);
      } catch (err) {
        Alert.alert(t.profileSaveError, getErrorMessage(err));
      } finally {
        setSaving(false);
      }
    };

    if (emailChanged) {
      Alert.alert(
        'Cambiar correo',
        `El correo "${draft.email.trim()}" será el que uses para iniciar sesión. ¿Confirmar?`,
        [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', onPress: doSave }],
      );
    } else {
      await doSave();
    }
  };

  // ── Add allergy ───────────────────────────────────────────────────────────
  const handleAddAllergy = async () => {
    if (!allergyDraft.allergenName.trim() || !allergyDraft.allergyType || !allergyDraft.severity) {
      Alert.alert('Campos requeridos', 'Nombre, tipo y severidad son obligatorios.'); return;
    }
    setSavingAllergy(true);
    try {
      const { data } = await apiClient.post<AllergyItem>('/profile/allergies', {
        allergenName:        allergyDraft.allergenName.trim(),
        allergyType:         allergyDraft.allergyType,
        severity:            allergyDraft.severity,
        reactionDescription: allergyDraft.reactionDescription.trim() || null,
      });
      setMedData(p => p ? { ...p, allergies: [data, ...p.allergies] } : p);
      setAllergyDraft({ allergenName: '', allergyType: '', severity: '', reactionDescription: '' });
      setAddAllergyOpen(false);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSavingAllergy(false);
    }
  };

  const openEditAllergy = (item: AllergyItem) => {
    setEditAllergyDraft({ allergenName: item.allergenName, allergyType: item.allergyType, severity: item.severity, reactionDescription: item.reactionDescription ?? '' });
    setEditAllergyItem(item);
  };

  const handleSaveEditAllergy = async () => {
    if (!editAllergyItem) return;
    if (!editAllergyDraft.allergenName.trim() || !editAllergyDraft.allergyType || !editAllergyDraft.severity) {
      Alert.alert('Campos requeridos', 'Nombre, tipo y severidad son obligatorios.'); return;
    }
    setSavingEditAllergy(true);
    try {
      await apiClient.patch(`/profile/allergies/${editAllergyItem.id}`, {
        allergenName:        editAllergyDraft.allergenName.trim(),
        allergyType:         editAllergyDraft.allergyType,
        severity:            editAllergyDraft.severity,
        reactionDescription: editAllergyDraft.reactionDescription.trim() || null,
      });
      setMedData(p => p ? { ...p, allergies: p.allergies.map(a => a.id === editAllergyItem.id
        ? { ...a, allergenName: editAllergyDraft.allergenName.trim(), allergyType: editAllergyDraft.allergyType, severity: editAllergyDraft.severity, reactionDescription: editAllergyDraft.reactionDescription.trim() || null }
        : a) } : p);
      setEditAllergyItem(null);
    } catch (err) { Alert.alert('Error', getErrorMessage(err)); }
    finally { setSavingEditAllergy(false); }
  };

  const toggleAllergy = (item: AllergyItem) => {
    Alert.alert(item.allergenName, '¿Qué deseas hacer?', [
      { text: 'Editar', onPress: () => openEditAllergy(item) },
      { text: item.isActive ? 'Marcar como inactiva' : 'Reactivar',
        onPress: async () => {
          const next = !item.isActive;
          await apiClient.patch(`/profile/allergies/${item.id}`, { isActive: next }).catch(() => {});
          setMedData(p => p ? { ...p, allergies: p.allergies.map(a => a.id === item.id ? { ...a, isActive: next } : a) } : p);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // ── Add condition ─────────────────────────────────────────────────────────
  const handleAddCondition = async () => {
    if (!conditionDraft.conditionName.trim()) {
      Alert.alert('Campo requerido', 'El nombre de la condición es obligatorio.'); return;
    }
    setSavingCondition(true);
    try {
      const { data } = await apiClient.post<ConditionItem>('/profile/conditions', {
        conditionName: conditionDraft.conditionName.trim(),
        severity:      conditionDraft.severity || null,
        status:        conditionDraft.status || 'ACTIVE',
        notes:         conditionDraft.notes.trim() || null,
      });
      setMedData(p => p ? { ...p, conditions: [data, ...p.conditions] } : p);
      setConditionDraft({ conditionName: '', severity: '', status: 'ACTIVE', notes: '' });
      setAddConditionOpen(false);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSavingCondition(false);
    }
  };

  const openEditCondition = (item: ConditionItem) => {
    setEditConditionDraft({ conditionName: item.conditionName, severity: item.severity ?? '', status: item.status, notes: item.notes ?? '' });
    setEditConditionItem(item);
  };

  const handleSaveEditCondition = async () => {
    if (!editConditionItem) return;
    if (!editConditionDraft.conditionName.trim()) { Alert.alert('Campo requerido', 'El nombre de la condición es obligatorio.'); return; }
    setSavingEditCondition(true);
    try {
      await apiClient.patch(`/profile/conditions/${editConditionItem.id}`, {
        conditionName: editConditionDraft.conditionName.trim(),
        severity:      editConditionDraft.severity || null,
        status:        editConditionDraft.status,
        notes:         editConditionDraft.notes.trim() || null,
      });
      setMedData(p => p ? { ...p, conditions: p.conditions.map(c => c.id === editConditionItem.id
        ? { ...c, conditionName: editConditionDraft.conditionName.trim(), severity: editConditionDraft.severity || null, status: editConditionDraft.status, notes: editConditionDraft.notes.trim() || null }
        : c) } : p);
      setEditConditionItem(null);
    } catch (err) { Alert.alert('Error', getErrorMessage(err)); }
    finally { setSavingEditCondition(false); }
  };

  const changeConditionStatus = (item: ConditionItem) => {
    openEditCondition(item);
  };

  // ── Medication handlers ───────────────────────────────────────────────────
  const handleAddMed = async () => {
    if (!medDraft.name.trim()) { Alert.alert('Error', 'El nombre del medicamento es requerido'); return; }
    setSavingMed(true);
    try {
      const { data } = await apiClient.post<MedItem>('/profile/medications', {
        name: medDraft.name.trim(), dosage: medDraft.dosage.trim() || null, frequency: medDraft.frequency.trim() || null,
      });
      setMedData(p => p ? { ...p, medications: [data, ...p.medications] } : p);
      setMedDraft({ name: '', dosage: '', frequency: '' });
      setAddMedOpen(false);
    } catch (err) { Alert.alert('Error', getErrorMessage(err)); }
    finally { setSavingMed(false); }
  };

  const openEditMed = (item: MedItem) => {
    setEditMedItem(item);
    setEditMedDraft({ name: item.name, dosage: item.dosage ?? '', frequency: item.frequency ?? '', isCurrent: item.isCurrent });
  };

  const handleSaveEditMed = async () => {
    if (!editMedItem) return;
    setSavingEditMed(true);
    try {
      await apiClient.patch(`/profile/medications/${editMedItem.id}`, {
        name: editMedDraft.name.trim(), dosage: editMedDraft.dosage.trim() || null,
        frequency: editMedDraft.frequency.trim() || null, isCurrent: editMedDraft.isCurrent,
      });
      setMedData(p => p ? { ...p, medications: p.medications.map(m => m.id === editMedItem.id
        ? { ...m, name: editMedDraft.name.trim(), dosage: editMedDraft.dosage.trim() || null, frequency: editMedDraft.frequency.trim() || null, isCurrent: editMedDraft.isCurrent }
        : m) } : p);
      setEditMedItem(null);
    } catch (err) { Alert.alert('Error', getErrorMessage(err)); }
    finally { setSavingEditMed(false); }
  };

  const handleLogout = async () => { setLogout(false); try { await logout(); } catch {} router.replace('/login'); };

  // Picker display labels
  const bloodDisplay   = bloodTypeLabel(draft.bloodType);
  const dayDisplay     = draft.dobDay   ? `Día ${draft.dobDay}` : '';
  const monthDisplay   = draft.dobMonth ? (MONTHS_T.find(m => m.value === draft.dobMonth)?.label ?? '') : '';
  const yearDisplay    = draft.dobYear  || '';
  const genderDisplay  = draft.gender   ? (GENDERS_T.find(g => g.value === draft.gender)?.label ?? '') : '';
  const idTypeDisplay  = draft.identificationType ? (ID_TYPES_T.find(d => d.value === draft.identificationType)?.label ?? '') : '';

  const activeAllergies  = medData?.allergies.filter(a => a.isActive).length ?? 0;
  const activeConditions = medData?.conditions.filter(c => c.status === 'ACTIVE').length ?? 0;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <Text style={s.title}>{t.profileTitle}</Text>

        {/* ── Avatar card ─────────────────────────────────────────────── */}
        <View style={s.avatarCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              {loading
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
          <TouchableOpacity style={s.editBtn} onPress={openEdit} activeOpacity={0.85}>
            <PencilIcon color="#FFFFFF" size={14} />
            <Text style={s.editBtnText}>{t.profileEdit}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Datos personales ─────────────────────────────────────────── */}
        <AccordionSection
          title={t.profilePersonal} icon={<UserIcon color={MUTED} size={16} />}
          open={sections.personal} onToggle={() => toggleSection('personal')}
          PRIMARY={PRIMARY} CARD={CARD} MUTED={MUTED} MUTED_BG={MUTED_BG}
        >
          <InfoRow label={t.profileEmail}   value={email}                                     icon={<MailIcon     color={MUTED} size={14} />} PRIMARY={PRIMARY} MUTED={MUTED} MUTED_BG={MUTED_BG} />
          <InfoRow label={t.profileDob}     value={dobFormatted}                              icon={<CalendarIcon color={MUTED} size={14} />} PRIMARY={PRIMARY} MUTED={MUTED} MUTED_BG={MUTED_BG} />
          <InfoRow label={t.profileGender}  value={genderLabel(profile?.gender)}              icon={<UsersIcon    color={MUTED} size={14} />} PRIMARY={PRIMARY} MUTED={MUTED} MUTED_BG={MUTED_BG} />
          <InfoRow label={t.profileDocType} value={idTypeLabel(profile?.identificationType)}  icon={<IdCardIcon   color={MUTED} size={14} />} PRIMARY={PRIMARY} MUTED={MUTED} MUTED_BG={MUTED_BG} />
          <InfoRow label={t.profileDocNumber} value={profile?.identificationNumber ?? '—'}   icon={<IdCardIcon   color={MUTED} size={14} />} PRIMARY={PRIMARY} MUTED={MUTED} MUTED_BG={MUTED_BG} />
        </AccordionSection>

        {/* ── Médico ───────────────────────────────────────────────────── */}
        <AccordionSection
          title={t.profileMedical} icon={<HeartIcon color={MUTED} size={16} />}
          open={sections.medical} onToggle={() => toggleSection('medical')}
          PRIMARY={PRIMARY} CARD={CARD} MUTED={MUTED} MUTED_BG={MUTED_BG}
        >
          <InfoRow label={t.profileBloodType}  value={bloodTypeLabel(profile?.bloodType)}                                        icon={<DropletIcon color={MUTED} size={14} />} PRIMARY={PRIMARY} MUTED={MUTED} MUTED_BG={MUTED_BG} />
          <InfoRow label="Altura"              value={medData?.medicalProfile?.heightCm != null ? `${medData.medicalProfile.heightCm} cm` : '—'} icon={<UserIcon    color={MUTED} size={14} />} PRIMARY={PRIMARY} MUTED={MUTED} MUTED_BG={MUTED_BG} />
          <InfoRow label="Peso"                value={medData?.medicalProfile?.weightKg != null ? `${medData.medicalProfile.weightKg} kg` : '—'} icon={<UserIcon    color={MUTED} size={14} />} PRIMARY={PRIMARY} MUTED={MUTED} MUTED_BG={MUTED_BG} />
          <InfoRow label="Donante de órganos"  value={medData?.medicalProfile?.organDonor ? 'Sí' : 'No'}                          icon={<HeartIcon   color={MUTED} size={14} />} PRIMARY={PRIMARY} MUTED={MUTED} MUTED_BG={MUTED_BG} />
          {!!medData?.medicalProfile?.insuranceProvider && (
            <InfoRow label="Aseguradora" value={medData.medicalProfile.insuranceProvider} icon={<IdCardIcon color={MUTED} size={14} />} PRIMARY={PRIMARY} MUTED={MUTED} MUTED_BG={MUTED_BG} />
          )}
        </AccordionSection>

        {/* ── Alergias ─────────────────────────────────────────────────── */}
        <AccordionSection
          title="Alergias" icon={<HeartIcon color={MUTED} size={16} />}
          open={sections.allergies} onToggle={() => toggleSection('allergies')}
          badge={activeAllergies > 0 ? activeAllergies : undefined}
          PRIMARY={PRIMARY} CARD={CARD} MUTED={MUTED} MUTED_BG={MUTED_BG}
        >
          {(medData?.allergies.length ?? 0) === 0 ? (
            <Text style={{ fontSize: 13, color: MUTED, fontFamily: FONT.sansRegular, textAlign: 'center', paddingVertical: 8 }}>Sin alergias registradas</Text>
          ) : medData!.allergies.map(a => (
            <TouchableOpacity key={a.id} onPress={() => toggleAllergy(a)} activeOpacity={0.75}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: MUTED_BG, opacity: a.isActive ? 1 : 0.45 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY }}>{a.allergenName}</Text>
                <Text style={{ fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED }}>{allergyTypeLabel(a.allergyType)}</Text>
              </View>
              <SeverityBadge severity={a.severity} />
              {!a.isActive && (
                <View style={{ backgroundColor: MUTED_BG, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 10, fontFamily: FONT.sansBold, color: MUTED }}>inactiva</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setAddAllergyOpen(true)} activeOpacity={0.75}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingVertical: 10, borderRadius: 12, backgroundColor: MUTED_BG, paddingHorizontal: 14, alignSelf: 'flex-start' }}>
            <PlusIcon color={PRIMARY} size={14} />
            <Text style={{ fontSize: 13, fontFamily: FONT.sansBold, color: PRIMARY }}>Agregar alergia</Text>
          </TouchableOpacity>
        </AccordionSection>

        {/* ── Condiciones crónicas ──────────────────────────────────────── */}
        <AccordionSection
          title="Condiciones crónicas" icon={<HeartIcon color={MUTED} size={16} />}
          open={sections.conditions} onToggle={() => toggleSection('conditions')}
          badge={activeConditions > 0 ? activeConditions : undefined}
          PRIMARY={PRIMARY} CARD={CARD} MUTED={MUTED} MUTED_BG={MUTED_BG}
        >
          {(medData?.conditions.length ?? 0) === 0 ? (
            <Text style={{ fontSize: 13, color: MUTED, fontFamily: FONT.sansRegular, textAlign: 'center', paddingVertical: 8 }}>Sin condiciones registradas</Text>
          ) : medData!.conditions.map(c => (
            <TouchableOpacity key={c.id} onPress={() => changeConditionStatus(c)} activeOpacity={0.75}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: MUTED_BG }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY }}>{c.conditionName}</Text>
                {!!c.notes && <Text style={{ fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED }} numberOfLines={1}>{c.notes}</Text>}
              </View>
              <StatusBadge status={c.status} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setAddConditionOpen(true)} activeOpacity={0.75}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingVertical: 10, borderRadius: 12, backgroundColor: MUTED_BG, paddingHorizontal: 14, alignSelf: 'flex-start' }}>
            <PlusIcon color={PRIMARY} size={14} />
            <Text style={{ fontSize: 13, fontFamily: FONT.sansBold, color: PRIMARY }}>Agregar condición</Text>
          </TouchableOpacity>
        </AccordionSection>

        {/* ── Medicamentos ─────────────────────────────────────────────── */}
        <AccordionSection
          title="Medicamentos" icon={<HeartIcon color={MUTED} size={16} />}
          open={sections.medications} onToggle={() => toggleSection('medications')}
          badge={(medData?.medications.length ?? 0) > 0 ? medData!.medications.length : undefined}
          PRIMARY={PRIMARY} CARD={CARD} MUTED={MUTED} MUTED_BG={MUTED_BG}
        >
          {(medData?.medications.length ?? 0) === 0 ? (
            <Text style={{ fontSize: 13, color: MUTED, fontFamily: FONT.sansRegular, textAlign: 'center', paddingVertical: 8 }}>Sin medicamentos registrados</Text>
          ) : medData!.medications.map(m => (
            <TouchableOpacity key={m.id} onPress={() => openEditMed(m)} activeOpacity={0.75}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: MUTED_BG, opacity: m.isCurrent ? 1 : 0.45 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY }}>{m.name || '—'}</Text>
                {(m.dosage || m.frequency) && (
                  <Text style={{ fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED }}>
                    {[m.dosage, m.frequency].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </View>
              {!m.isCurrent && (
                <View style={{ backgroundColor: MUTED_BG, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 10, fontFamily: FONT.sansBold, color: MUTED }}>inactivo</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setAddMedOpen(true)} activeOpacity={0.75}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingVertical: 10, borderRadius: 12, backgroundColor: MUTED_BG, paddingHorizontal: 14, alignSelf: 'flex-start' }}>
            <PlusIcon color={PRIMARY} size={14} />
            <Text style={{ fontSize: 13, fontFamily: FONT.sansBold, color: PRIMARY }}>Agregar medicamento</Text>
          </TouchableOpacity>
        </AccordionSection>

        {/* ── Acciones ─────────────────────────────────────────────────── */}
        <View style={{ gap: 8 }}>
          <TouchableOpacity style={s.actionRow} onPress={() => router.push('/settings')} activeOpacity={0.75}>
            <SettingsIcon color={PRIMARY} size={18} />
            <Text style={s.actionText}>{t.settingsTitle}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionRow} onPress={() => setLogout(true)} activeOpacity={0.75}>
            <LogOutIcon color={RED} size={18} />
            <Text style={[s.actionText, { color: RED }]}>{t.profileLogout}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Edit bottom sheet ─────────────────────────────────────────────── */}
      <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => !saving && setEditOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => !saving && setEditOpen(false)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{t.profileEditTitle}</Text>
              <TouchableOpacity style={s.sheetClose} onPress={() => !saving && setEditOpen(false)} disabled={saving}>
                <XIcon color={PRIMARY} size={16} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }} contentContainerStyle={{ gap: 10 }}>
              {/* Datos básicos */}
              <Text style={s.editSectionLabel}>Datos básicos</Text>
              <SheetField label={t.profileName}     value={draft.firstName} onChange={v => setDraft(d => ({ ...d, firstName: v }))} />
              <SheetField label={t.profileLastName} value={draft.lastName}  onChange={v => setDraft(d => ({ ...d, lastName: v }))} />
              <SheetField label={t.profileEmail}    value={draft.email}     onChange={v => setDraft(d => ({ ...d, email: v }))} placeholder="correo@ejemplo.com" />

              {/* Información personal */}
              <Text style={s.editSectionLabel}>Información personal</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <InlinePickerField label={t.profileDay}   displayValue={dayDisplay}   options={DAYS}     selected={draft.dobDay}   onSelect={() => {}} locked />
                </View>
                <View style={{ flex: 1 }}>
                  <InlinePickerField label={t.profileMonth} displayValue={monthDisplay} options={MONTHS_T} selected={draft.dobMonth} onSelect={() => {}} locked />
                </View>
                <View style={{ flex: 1 }}>
                  <InlinePickerField label={t.profileYear}  displayValue={yearDisplay}  options={YEARS}    selected={draft.dobYear}  onSelect={() => {}} locked />
                </View>
              </View>
              <InlinePickerField label={t.profileGender} displayValue={genderDisplay} options={GENDERS_T} selected={draft.gender} onSelect={v => setDraft(d => ({ ...d, gender: v }))} />

              {/* Documento */}
              <Text style={s.editSectionLabel}>Documento {idLocked && '(bloqueado — ya registrado)'}</Text>
              <InlinePickerField label={t.profileDocType} displayValue={idTypeDisplay} options={ID_TYPES_T} selected={draft.identificationType} onSelect={v => setDraft(d => ({ ...d, identificationType: v }))} locked={idLocked} />
              <SheetField        label={t.profileDocNumber} value={draft.identificationNumber} onChange={v => setDraft(d => ({ ...d, identificationNumber: v }))} locked={idLocked} />

              {/* Médico */}
              <Text style={s.editSectionLabel}>Perfil médico</Text>
              <InlinePickerField label={t.profileBloodType} displayValue={bloodDisplay} options={BLOOD_TYPES as unknown as PickerOption[]} selected={draft.bloodType} onSelect={() => {}} locked />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <SheetField label="Altura (cm)" value={draft.heightCm} onChange={v => setDraft(d => ({ ...d, heightCm: v }))} placeholder="170" />
                </View>
                <View style={{ flex: 1 }}>
                  <SheetField label="Peso (kg)"   value={draft.weightKg} onChange={v => setDraft(d => ({ ...d, weightKg: v }))} placeholder="65" />
                </View>
              </View>
              <View style={[sf.field, { backgroundColor: CARD, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <Text style={{ fontSize: 14, fontFamily: FONT.sansMedium, color: PRIMARY }}>Donante de órganos</Text>
                <Switch value={draft.organDonor} onValueChange={v => setDraft(d => ({ ...d, organDonor: v }))} trackColor={{ true: GREEN }} />
              </View>
              <SheetField label="Aseguradora" value={draft.insuranceProvider} onChange={v => setDraft(d => ({ ...d, insuranceProvider: v }))} placeholder="Nombre de la EPS / seguro" />
            </ScrollView>

            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetBtnGrey} onPress={() => setEditOpen(false)} disabled={saving} activeOpacity={0.85}>
                <Text style={s.sheetBtnGreyText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetBtnDark, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.sheetBtnDarkText}>{t.save}</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>


      {/* ── Agregar alergia ───────────────────────────────────────────────── */}
      <Modal visible={addAllergyOpen} animationType="slide" transparent onRequestClose={() => setAddAllergyOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setAddAllergyOpen(false)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Agregar alergia</Text>
              <TouchableOpacity style={s.sheetClose} onPress={() => setAddAllergyOpen(false)}>
                <XIcon color={PRIMARY} size={16} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <SheetField label="Nombre del alérgeno *" value={allergyDraft.allergenName} onChange={v => setAllergyDraft(d => ({ ...d, allergenName: v }))} placeholder="p. ej. Penicilina" />
              <InlinePickerField label="Tipo *"      displayValue={ALLERGY_TYPES.find(a => a.value === allergyDraft.allergyType)?.label ?? ''}    options={ALLERGY_TYPES}      selected={allergyDraft.allergyType} onSelect={v => setAllergyDraft(d => ({ ...d, allergyType: v }))} />
              <InlinePickerField label="Severidad *" displayValue={ALLERGY_SEVERITIES.find(a => a.value === allergyDraft.severity)?.label ?? ''}  options={ALLERGY_SEVERITIES} selected={allergyDraft.severity}    onSelect={v => setAllergyDraft(d => ({ ...d, severity: v }))} />
              <SheetField label="Descripción de reacción (opcional)" value={allergyDraft.reactionDescription} onChange={v => setAllergyDraft(d => ({ ...d, reactionDescription: v }))} placeholder="p. ej. Urticaria, dificultad respiratoria" multiline />
            </View>
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetBtnGrey} onPress={() => setAddAllergyOpen(false)} disabled={savingAllergy} activeOpacity={0.85}>
                <Text style={s.sheetBtnGreyText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetBtnDark, savingAllergy && { opacity: 0.7 }]} onPress={handleAddAllergy} disabled={savingAllergy} activeOpacity={0.85}>
                {savingAllergy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.sheetBtnDarkText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Agregar condición ─────────────────────────────────────────────── */}
      <Modal visible={addConditionOpen} animationType="slide" transparent onRequestClose={() => setAddConditionOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setAddConditionOpen(false)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Agregar condición</Text>
              <TouchableOpacity style={s.sheetClose} onPress={() => setAddConditionOpen(false)}>
                <XIcon color={PRIMARY} size={16} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <SheetField label="Nombre de la condición *" value={conditionDraft.conditionName} onChange={v => setConditionDraft(d => ({ ...d, conditionName: v }))} placeholder="p. ej. Diabetes tipo 2" />
              <InlinePickerField label="Severidad" displayValue={CONDITION_SEVERITIES.find(c => c.value === conditionDraft.severity)?.label ?? ''}  options={CONDITION_SEVERITIES} selected={conditionDraft.severity} onSelect={v => setConditionDraft(d => ({ ...d, severity: v }))} />
              <InlinePickerField label="Estado"    displayValue={CONDITION_STATUSES.find(c => c.value === conditionDraft.status)?.label ?? ''}       options={CONDITION_STATUSES}   selected={conditionDraft.status}   onSelect={v => setConditionDraft(d => ({ ...d, status: v }))} />
              <SheetField label="Notas (opcional)" value={conditionDraft.notes} onChange={v => setConditionDraft(d => ({ ...d, notes: v }))} placeholder="Información adicional" multiline />
            </View>
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetBtnGrey} onPress={() => setAddConditionOpen(false)} disabled={savingCondition} activeOpacity={0.85}>
                <Text style={s.sheetBtnGreyText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetBtnDark, savingCondition && { opacity: 0.7 }]} onPress={handleAddCondition} disabled={savingCondition} activeOpacity={0.85}>
                {savingCondition ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.sheetBtnDarkText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Editar alergia ────────────────────────────────────────────────── */}
      <Modal visible={!!editAllergyItem} animationType="slide" transparent onRequestClose={() => setEditAllergyItem(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditAllergyItem(null)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Editar alergia</Text>
              <TouchableOpacity style={s.sheetClose} onPress={() => setEditAllergyItem(null)}>
                <XIcon color={PRIMARY} size={16} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <SheetField label="Nombre del alérgeno *" value={editAllergyDraft.allergenName} onChange={v => setEditAllergyDraft(d => ({ ...d, allergenName: v }))} />
              <InlinePickerField label="Tipo *"      displayValue={ALLERGY_TYPES.find(a => a.value === editAllergyDraft.allergyType)?.label ?? ''}    options={ALLERGY_TYPES}      selected={editAllergyDraft.allergyType} onSelect={v => setEditAllergyDraft(d => ({ ...d, allergyType: v }))} />
              <InlinePickerField label="Severidad *" displayValue={ALLERGY_SEVERITIES.find(a => a.value === editAllergyDraft.severity)?.label ?? ''}  options={ALLERGY_SEVERITIES} selected={editAllergyDraft.severity}    onSelect={v => setEditAllergyDraft(d => ({ ...d, severity: v }))} />
              <SheetField label="Descripción de reacción (opcional)" value={editAllergyDraft.reactionDescription} onChange={v => setEditAllergyDraft(d => ({ ...d, reactionDescription: v }))} placeholder="p. ej. Urticaria, dificultad respiratoria" multiline />
            </View>
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetBtnGrey} onPress={() => setEditAllergyItem(null)} disabled={savingEditAllergy} activeOpacity={0.85}>
                <Text style={s.sheetBtnGreyText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetBtnDark, savingEditAllergy && { opacity: 0.7 }]} onPress={handleSaveEditAllergy} disabled={savingEditAllergy} activeOpacity={0.85}>
                {savingEditAllergy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.sheetBtnDarkText}>{t.save}</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Editar condición ──────────────────────────────────────────────── */}
      <Modal visible={!!editConditionItem} animationType="slide" transparent onRequestClose={() => setEditConditionItem(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditConditionItem(null)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Editar condición</Text>
              <TouchableOpacity style={s.sheetClose} onPress={() => setEditConditionItem(null)}>
                <XIcon color={PRIMARY} size={16} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <SheetField label="Nombre de la condición *" value={editConditionDraft.conditionName} onChange={v => setEditConditionDraft(d => ({ ...d, conditionName: v }))} />
              <InlinePickerField label="Severidad" displayValue={CONDITION_SEVERITIES.find(c => c.value === editConditionDraft.severity)?.label ?? ''}  options={CONDITION_SEVERITIES} selected={editConditionDraft.severity} onSelect={v => setEditConditionDraft(d => ({ ...d, severity: v }))} />
              <InlinePickerField label="Estado"    displayValue={CONDITION_STATUSES.find(c => c.value === editConditionDraft.status)?.label ?? ''}       options={CONDITION_STATUSES}   selected={editConditionDraft.status}   onSelect={v => setEditConditionDraft(d => ({ ...d, status: v }))} />
              <SheetField label="Notas (opcional)" value={editConditionDraft.notes} onChange={v => setEditConditionDraft(d => ({ ...d, notes: v }))} placeholder="Información adicional" multiline />
            </View>
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetBtnGrey} onPress={() => setEditConditionItem(null)} disabled={savingEditCondition} activeOpacity={0.85}>
                <Text style={s.sheetBtnGreyText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetBtnDark, savingEditCondition && { opacity: 0.7 }]} onPress={handleSaveEditCondition} disabled={savingEditCondition} activeOpacity={0.85}>
                {savingEditCondition ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.sheetBtnDarkText}>{t.save}</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Add medication ───────────────────────────────────────────────── */}
      <Modal visible={addMedOpen} animationType="slide" transparent onRequestClose={() => setAddMedOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setAddMedOpen(false)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Agregar medicamento</Text>
              <TouchableOpacity style={s.sheetClose} onPress={() => setAddMedOpen(false)}>
                <XIcon color={PRIMARY} size={16} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <SheetField label="Nombre del medicamento *" value={medDraft.name} onChange={v => setMedDraft(d => ({ ...d, name: v }))} placeholder="Ej: Metformina" />
              <SheetField label="Dosis (opcional)" value={medDraft.dosage} onChange={v => setMedDraft(d => ({ ...d, dosage: v }))} placeholder="Ej: 500mg" />
              <SheetField label="Frecuencia (opcional)" value={medDraft.frequency} onChange={v => setMedDraft(d => ({ ...d, frequency: v }))} placeholder="Ej: Cada 8 horas" />
            </View>
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetBtnGrey} onPress={() => setAddMedOpen(false)} disabled={savingMed} activeOpacity={0.85}>
                <Text style={s.sheetBtnGreyText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetBtnDark, savingMed && { opacity: 0.7 }]} onPress={handleAddMed} disabled={savingMed} activeOpacity={0.85}>
                {savingMed ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.sheetBtnDarkText}>Agregar</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit medication ───────────────────────────────────────────────── */}
      <Modal visible={!!editMedItem} animationType="slide" transparent onRequestClose={() => setEditMedItem(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditMedItem(null)}>
          <TouchableOpacity style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} activeOpacity={1}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Editar medicamento</Text>
              <TouchableOpacity style={s.sheetClose} onPress={() => setEditMedItem(null)}>
                <XIcon color={PRIMARY} size={16} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <SheetField label="Nombre del medicamento *" value={editMedDraft.name} onChange={v => setEditMedDraft(d => ({ ...d, name: v }))} />
              <SheetField label="Dosis" value={editMedDraft.dosage} onChange={v => setEditMedDraft(d => ({ ...d, dosage: v }))} placeholder="Ej: 500mg" />
              <SheetField label="Frecuencia" value={editMedDraft.frequency} onChange={v => setEditMedDraft(d => ({ ...d, frequency: v }))} placeholder="Ej: Cada 8 horas" />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
                <Text style={{ fontSize: 14, fontFamily: FONT.sansRegular, color: PRIMARY }}>Medicamento activo</Text>
                <Switch
                  value={editMedDraft.isCurrent}
                  onValueChange={v => setEditMedDraft(d => ({ ...d, isCurrent: v }))}
                  trackColor={{ false: MUTED_BG, true: '#4CAF50' }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetBtnGrey} onPress={() => setEditMedItem(null)} disabled={savingEditMed} activeOpacity={0.85}>
                <Text style={s.sheetBtnGreyText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sheetBtnDark, savingEditMed && { opacity: 0.7 }]} onPress={handleSaveEditMed} disabled={savingEditMed} activeOpacity={0.85}>
                {savingEditMed ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.sheetBtnDarkText}>{t.save}</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Logout confirm ───────────────────────────────────────────────── */}
      <Modal visible={logoutOpen} animationType="fade" transparent onRequestClose={() => setLogout(false)}>
        <TouchableOpacity style={s.logoutOverlay} activeOpacity={1} onPress={() => setLogout(false)}>
          <TouchableOpacity style={s.logoutModal} activeOpacity={1}>
            <View style={s.logoutIcon}><LogOutIcon color={RED} size={22} /></View>
            <Text style={s.logoutTitle}>{t.profileLogoutTitle}</Text>
            <Text style={s.logoutSub}>{t.profileLogoutSub}</Text>
            <View style={s.logoutBtns}>
              <TouchableOpacity style={s.logoutBtnGrey} onPress={() => setLogout(false)} activeOpacity={0.85}>
                <Text style={s.logoutBtnGreyText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.logoutBtnRed} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={s.logoutBtnRedText}>{t.profileLogout}</Text>
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
    title:     { fontSize: 26, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.52, paddingTop: 8 },

    avatarCard: {
      backgroundColor: CARD, borderRadius: 28, paddingVertical: 24, paddingHorizontal: 20,
      alignItems: 'center', gap: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    avatarWrap: { position: 'relative', marginBottom: 4 },
    avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 32, fontFamily: FONT.displayBold, color: PINK_FG },
    cameraBtn: {
      position: 'absolute', bottom: 0, right: 0,
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: CARD,
    },
    userName:    { fontSize: 20, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.4, marginTop: 4 },
    userEmail:   { fontSize: 13, fontFamily: FONT.sansRegular, color: MUTED },
    editBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1A1512', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10, marginTop: 4 },
    editBtnText: { fontSize: 13, fontFamily: FONT.sansBold, color: '#FFFFFF' },

    actionRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: CARD, borderRadius: 20, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    actionText: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY, flex: 1 },

    // Edit sheet
    modalOverlay: { flex: 1, backgroundColor: 'rgba(26,21,18,0.45)', justifyContent: 'flex-end' },
    sheet:        { backgroundColor: BG, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
    sheetHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    sheetTitle:   { fontSize: 18, fontFamily: FONT.displayBold, color: PRIMARY },
    sheetClose:   { width: 32, height: 32, borderRadius: 16, backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center' },
    editSectionLabel: { fontSize: 12, fontFamily: FONT.sansBold, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
    sheetBtns:        { flexDirection: 'row', gap: 12, marginTop: 16 },
    sheetBtnGrey:     { flex: 1, backgroundColor: MUTED_BG, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
    sheetBtnGreyText: { fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY },
    sheetBtnDark:     { flex: 1, backgroundColor: '#1A1512', borderRadius: 16, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    sheetBtnDarkText: { fontSize: 14, fontFamily: FONT.sansBold, color: '#FFFFFF' },

    // Logout modal
    logoutOverlay:     { flex: 1, backgroundColor: 'rgba(26,21,18,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    logoutModal:       { backgroundColor: CARD, borderRadius: 28, width: '100%', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 16 },
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
