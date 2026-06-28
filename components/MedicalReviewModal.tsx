import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Modal, TouchableOpacity,
  TextInput, StyleSheet, Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT } from '../constants/fonts';

// ── Enum display maps ─────────────────────────────────────────────────────────
const BLOOD_LABEL: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
};
const GENDER_LABEL: Record<string, string> = {
  MALE: 'Masculino', FEMALE: 'Femenino', OTHER: 'Otro', PREFER_NOT_TO_SAY: 'Prefiero no decir',
};
const ALLERGY_TYPE_LABEL: Record<string, string> = {
  MEDICATION: 'Medicamento', FOOD: 'Alimento', ENVIRONMENTAL: 'Ambiental', OTHER: 'Otro',
};
const ALLERGY_SEV_LABEL: Record<string, string> = {
  MILD: 'Leve', MODERATE: 'Moderada', SEVERE: 'Severa', LIFE_THREATENING: 'Crítica',
};
const COND_SEV_LABEL: Record<string, string> = {
  MILD: 'Leve', MODERATE: 'Moderada', SEVERE: 'Severa',
};
const COND_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activa', MANAGED: 'Controlada', IN_REMISSION: 'En remisión', RESOLVED: 'Resuelta',
};
const ROUTE_LABEL: Record<string, string> = {
  ORAL: 'Oral', INJECTION: 'Inyección', TOPICAL: 'Tópico', INHALATION: 'Inhalación', OTHER: 'Otro',
};
const EVENT_TYPE_LABEL: Record<string, string> = {
  SURGERY: 'Cirugía', HOSPITALIZATION: 'Hospitalización', VACCINATION: 'Vacunación',
  INJURY: 'Lesión', OTHER: 'Otro',
};

// ── Review types ─────────────────────────────────────────────────────────────
export interface ReviewAllergy {
  _id: string; _included: boolean; _expanded: boolean;
  allergenName: string; allergyType: string; severity: string; reactionDescription: string;
}
export interface ReviewCondition {
  _id: string; _included: boolean; _expanded: boolean;
  conditionName: string; severity: string; status: string; notes: string;
}
export interface ReviewMedication {
  _id: string; _included: boolean; _expanded: boolean;
  customMedicationName: string; dosage: string; frequency: string; route: string; purpose: string;
}
export interface ReviewHistory {
  _id: string; _included: boolean; _expanded: boolean;
  eventType: string; eventName: string; location: string; outcome: string;
}
export interface ReviewPersonalInfo {
  bloodType: string; gender: string;
  _includeBloodType: boolean; _includeGender: boolean;
}

export interface ReviewState {
  personalInfo: ReviewPersonalInfo | null;
  allergies: ReviewAllergy[];
  conditions: ReviewCondition[];
  medications: ReviewMedication[];
  history: ReviewHistory[];
}

export type ConfirmPayload = {
  personalInfo: { bloodType?: string; gender?: string } | null;
  allergies: Omit<ReviewAllergy, '_id' | '_included' | '_expanded'>[];
  chronicConditions: Omit<ReviewCondition, '_id' | '_included' | '_expanded'>[];
  medications: Omit<ReviewMedication, '_id' | '_included' | '_expanded'>[];
  medicalHistory: Omit<ReviewHistory, '_id' | '_included' | '_expanded'>[];
};

// Build ReviewState from raw structured data
export function buildReviewState(raw: any): ReviewState {
  let id = 0;
  const nextId = () => String(++id);

  const personalInfo: ReviewPersonalInfo | null = (raw?.personalInfo?.bloodType || raw?.personalInfo?.gender)
    ? {
        bloodType: raw.personalInfo.bloodType || '',
        gender:    raw.personalInfo.gender    || '',
        _includeBloodType: !!raw.personalInfo.bloodType,
        _includeGender:    !!raw.personalInfo.gender,
      }
    : null;

  return {
    personalInfo,
    allergies: (raw?.allergies || []).map((a: any) => ({
      _id: nextId(), _included: true, _expanded: false,
      allergenName:       a.allergenName         || '',
      allergyType:        a.allergyType           || 'OTHER',
      severity:           a.severity              || 'MILD',
      reactionDescription: a.reactionDescription || '',
    })),
    conditions: (raw?.chronicConditions || []).map((c: any) => ({
      _id: nextId(), _included: true, _expanded: false,
      conditionName: c.conditionName || '',
      severity:      c.severity      || 'MILD',
      status:        c.status        || 'ACTIVE',
      notes:         c.notes         || '',
    })),
    medications: (raw?.medications || []).map((m: any) => ({
      _id: nextId(), _included: true, _expanded: false,
      customMedicationName: m.customMedicationName || '',
      dosage:    m.dosage    || '',
      frequency: m.frequency || '',
      route:     m.route     || 'ORAL',
      purpose:   m.purpose   || '',
    })),
    history: (raw?.medicalHistory || []).map((h: any) => ({
      _id: nextId(), _included: true, _expanded: false,
      eventType: h.eventType || 'OTHER',
      eventName: h.eventName || '',
      location:  h.location  || '',
      outcome:   h.outcome   || '',
    })),
  };
}

export function buildConfirmPayload(
  state: ReviewState,
  existingProfile?: { bloodType?: string; gender?: string },
): ConfirmPayload {
  const pi = state.personalInfo;
  const btOk  = pi?._includeBloodType && pi.bloodType && getFieldStatus(pi.bloodType, existingProfile?.bloodType) === 'new';
  const genOk = pi?._includeGender    && pi.gender    && getFieldStatus(pi.gender,    existingProfile?.gender)    === 'new';
  return {
    personalInfo: pi ? {
      ...(btOk  ? { bloodType: pi.bloodType } : {}),
      ...(genOk ? { gender:    pi.gender    } : {}),
    } : null,
    allergies: state.allergies.filter(a => a._included).map(({ _id, _included, _expanded, ...rest }) => rest),
    chronicConditions: state.conditions.filter(c => c._included).map(({ _id, _included, _expanded, ...rest }) => rest),
    medications: state.medications.filter(m => m._included).map(({ _id, _included, _expanded, ...rest }) => rest),
    medicalHistory: state.history.filter(h => h._included).map(({ _id, _included, _expanded, ...rest }) => rest),
  };
}

// ── SVG helpers ───────────────────────────────────────────────────────────────
const sw = { strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function Icon({ size = 20, children }: { size?: number; children: React.ReactNode }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</Svg>;
}
const PencilIcon = ({ c }: { c: string }) => (
  <Icon size={16}>
    <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" stroke={c} {...sw} />
  </Icon>
);
const ChevronDown = ({ c }: { c: string }) => (
  <Icon size={16}><Path d="m6 9 6 6 6-6" stroke={c} {...sw} /></Icon>
);
const ChevronUp = ({ c }: { c: string }) => (
  <Icon size={16}><Path d="m18 15-6-6-6 6" stroke={c} {...sw} /></Icon>
);
const BrainIcon = ({ c, s = 28 }: { c: string; s?: number }) => (
  <Icon size={s}>
    <Path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" stroke={c} {...sw} />
    <Path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" stroke={c} {...sw} />
    <Path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" stroke={c} {...sw} />
    <Path d="M17.599 6.5a3 3 0 0 0 .399-1.375" stroke={c} {...sw} />
    <Path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" stroke={c} {...sw} />
    <Path d="M3.477 10.896a4 4 0 0 1 .585-.396" stroke={c} {...sw} />
    <Path d="M19.938 10.5a4 4 0 0 1 .585.396" stroke={c} {...sw} />
    <Path d="M6 18a4 4 0 0 1-1.967-.516" stroke={c} {...sw} />
    <Path d="M19.967 17.484A4 4 0 0 1 18 18" stroke={c} {...sw} />
  </Icon>
);

// ── Chip selector for enums ───────────────────────────────────────────────────
function ChipSelector({
  value, options, labelMap, onChange, color,
}: {
  value: string;
  options: string[];
  labelMap: Record<string, string>;
  onChange: (v: string) => void;
  color: string;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          onPress={() => onChange(opt)}
          style={{
            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
            backgroundColor: value === opt ? color : 'transparent',
            borderWidth: 1.5, borderColor: value === opt ? color : '#C8C2B6',
          }}
        >
          <Text style={{
            fontSize: 11, fontFamily: FONT.sansBold,
            color: value === opt ? '#fff' : '#888',
          }}>
            {labelMap[opt] || opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Generic item row ──────────────────────────────────────────────────────────
function ItemRow({
  included, onToggle, title, subtitle, expanded, onExpand, children, colors,
}: {
  included: boolean; onToggle: () => void;
  title: string; subtitle?: string;
  expanded: boolean; onExpand: () => void;
  children?: React.ReactNode;
  colors: { CARD: string; PRIMARY: string; MUTED: string; MUTED_BG: string; GREEN: string };
}) {
  const { CARD, PRIMARY, MUTED, MUTED_BG, GREEN } = colors;
  return (
    <View style={{
      backgroundColor: CARD, borderRadius: 16, marginBottom: 8,
      opacity: included ? 1 : 0.5,
      borderWidth: 1.5,
      borderColor: included ? GREEN + '44' : '#C8C2B6',
      overflow: 'hidden',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 }}>
        {/* Toggle checkbox */}
        <TouchableOpacity
          onPress={onToggle}
          style={{
            width: 22, height: 22, borderRadius: 6,
            borderWidth: 2, borderColor: included ? GREEN : '#C8C2B6',
            backgroundColor: included ? GREEN : 'transparent',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          {included && (
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 13, fontFamily: FONT.sansBold, color: PRIMARY }} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={{ fontSize: 11, fontFamily: FONT.sansRegular, color: MUTED, marginTop: 1 }}>{subtitle}</Text> : null}
        </View>

        {/* Expand/collapse */}
        <TouchableOpacity
          onPress={onExpand}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center',
          }}
        >
          {expanded ? <ChevronUp c={MUTED} /> : <ChevronDown c={MUTED} />}
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: MUTED_BG, gap: 10 }}>
          {children}
        </View>
      )}
    </View>
  );
}

function FieldLabel({ label, MUTED }: { label: string; MUTED: string }) {
  return <Text style={{ fontSize: 11, fontFamily: FONT.sansBold, color: MUTED, marginBottom: 2, marginTop: 8 }}>{label.toUpperCase()}</Text>;
}

function FieldInput({ value, onChange, PRIMARY, MUTED_BG, multiline = false }: {
  value: string; onChange: (v: string) => void;
  PRIMARY: string; MUTED_BG: string; multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      multiline={multiline}
      style={{
        backgroundColor: MUTED_BG, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 8,
        fontSize: 13, fontFamily: FONT.sansRegular, color: PRIMARY,
        minHeight: multiline ? 60 : undefined,
        textAlignVertical: multiline ? 'top' : 'center',
      }}
    />
  );
}

// ── Personal info row ─────────────────────────────────────────────────────────
function PersonalInfoRow({
  label, extractedRaw, extractedLabel, existingLabel, status,
  included, onToggle, colors, style,
}: {
  label: string;
  extractedRaw: string;
  extractedLabel: string;
  existingLabel?: string;
  status: FieldStatus;
  included: boolean;
  onToggle: () => void;
  colors: { CARD: string; PRIMARY: string; MUTED: string; MUTED_BG: string; BLUE: string; RED: string };
  style?: object;
}) {
  const { CARD, PRIMARY, MUTED, MUTED_BG, BLUE, RED } = colors;
  const locked   = status === 'exists' || status === 'conflict';
  const isNew    = status === 'new';
  const isConflict = status === 'conflict';

  const borderColor = isConflict ? RED + '88'
    : (isNew && included) ? BLUE + '44'
    : '#C8C2B6';

  return (
    <View style={[
      s.simpleRow,
      { backgroundColor: CARD, borderColor },
      isConflict && { backgroundColor: RED + '0A' },
      style,
    ]}>
      {/* Checkbox — disabled if locked */}
      <TouchableOpacity
        onPress={isNew ? onToggle : undefined}
        activeOpacity={isNew ? 0.7 : 1}
        style={[
          s.checkbox,
          {
            borderColor: locked ? '#C8C2B6' : (included ? BLUE : '#C8C2B6'),
            backgroundColor: isNew && included ? BLUE : 'transparent',
            opacity: locked ? 0.4 : 1,
          },
        ]}
      >
        {isNew && included && (
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6 9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </TouchableOpacity>

      {/* Label + value + status badge */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[s.simpleLabel, { color: MUTED, flex: 1 }]}>{label}</Text>
          {status === 'exists' && (
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: MUTED_BG }}>
              <Text style={{ fontSize: 10, fontFamily: FONT.sansBold, color: MUTED }}>Ya registrado</Text>
            </View>
          )}
          {status === 'conflict' && (
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: RED + '22' }}>
              <Text style={{ fontSize: 10, fontFamily: FONT.sansBold, color: RED }}>Conflicto</Text>
            </View>
          )}
        </View>

        <Text style={[s.simpleValue, { color: locked ? MUTED : PRIMARY, marginTop: 1 }]}>
          {extractedLabel}
        </Text>

        {/* Conflict explanation */}
        {isConflict && existingLabel && (
          <Text style={{ fontSize: 11, fontFamily: FONT.sansRegular, color: RED, marginTop: 3, lineHeight: 16 }}>
            Tu perfil ya tiene registrado: <Text style={{ fontFamily: FONT.sansBold }}>{existingLabel}</Text>. No se puede sobreescribir desde el historial.
          </Text>
        )}

        {/* Exists explanation */}
        {status === 'exists' && existingLabel && (
          <Text style={{ fontSize: 11, fontFamily: FONT.sansRegular, color: MUTED, marginTop: 2 }}>
            Coincide con tu perfil — no se duplicará.
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, count, color, included, PRIMARY, MUTED }: {
  title: string; count: number; color: string; included: number; PRIMARY: string; MUTED: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
      <Text style={{ fontSize: 15, fontFamily: FONT.displayBold, color: PRIMARY, letterSpacing: -0.3 }}>{title}</Text>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: color + '22' }}>
          <Text style={{ fontSize: 11, fontFamily: FONT.sansBold, color }}>{included}/{count} incluidos</Text>
        </View>
      </View>
    </View>
  );
}

// ── Personal info field status ────────────────────────────────────────────────
type FieldStatus = 'new' | 'exists' | 'conflict';

function getFieldStatus(extracted: string | undefined, existing: string | undefined): FieldStatus {
  if (!extracted) return 'new';
  if (!existing)  return 'new';
  return existing === extracted ? 'exists' : 'conflict';
}

// ── Main modal component ──────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  state: ReviewState;
  onChange: (s: ReviewState) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  existingProfile?: { bloodType?: string; gender?: string };
}

export default function MedicalReviewModal({ visible, state, onChange, onConfirm, onCancel, loading, existingProfile }: Props) {
  const { BG, CARD, PRIMARY, MUTED, MUTED_BG, GREEN, YELLOW, BLUE, PINK, isDark } = useAppTheme();
  const RED = '#C0392B';
  const PURPLE = '#9B59B6';

  // Compute field statuses for personal info
  const btStatus  = getFieldStatus(state.personalInfo?.bloodType || undefined, existingProfile?.bloodType || undefined);
  const genStatus = getFieldStatus(state.personalInfo?.gender    || undefined, existingProfile?.gender    || undefined);

  // Fields that are 'new' (not yet in profile) count toward the total
  const piBloodIncluded = state.personalInfo?._includeBloodType && btStatus  === 'new';
  const piGenIncluded   = state.personalInfo?._includeGender    && genStatus === 'new';

  const totalIncluded =
    (state.allergies.filter(a => a._included).length) +
    (state.conditions.filter(c => c._included).length) +
    (state.medications.filter(m => m._included).length) +
    (state.history.filter(h => h._included).length) +
    (piBloodIncluded ? 1 : 0) +
    (piGenIncluded   ? 1 : 0);

  // patch helpers
  const patchAllergy   = (id: string, patch: Partial<ReviewAllergy>) =>
    onChange({ ...state, allergies:   state.allergies.map(a => a._id === id ? { ...a, ...patch } : a) });
  const patchCondition = (id: string, patch: Partial<ReviewCondition>) =>
    onChange({ ...state, conditions:  state.conditions.map(c => c._id === id ? { ...c, ...patch } : c) });
  const patchMedication = (id: string, patch: Partial<ReviewMedication>) =>
    onChange({ ...state, medications: state.medications.map(m => m._id === id ? { ...m, ...patch } : m) });
  const patchHistory   = (id: string, patch: Partial<ReviewHistory>) =>
    onChange({ ...state, history:     state.history.map(h => h._id === id ? { ...h, ...patch } : h) });

  const colors = { CARD, PRIMARY, MUTED, MUTED_BG, GREEN };

  const piFieldCount = (state.personalInfo?.bloodType ? 1 : 0) + (state.personalInfo?.gender ? 1 : 0);
  const totalItems =
    state.allergies.length + state.conditions.length +
    state.medications.length + state.history.length + piFieldCount;

  if (totalItems === 0 && !loading) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[s.root, { backgroundColor: BG }]}>
        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <View style={[s.topBar, { borderBottomColor: MUTED_BG }]}>
          <View style={s.topLeft}>
            <View style={[s.brainIconWrap, { backgroundColor: MUTED_BG }]}>
              <BrainIcon c={GREEN} s={22} />
            </View>
            <View>
              <Text style={[s.topTitle, { color: PRIMARY }]}>Revisión de datos</Text>
              <Text style={[s.topSub, { color: MUTED }]}>Verifica lo que la IA extrajo</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onCancel} style={[s.closeBtn, { backgroundColor: MUTED_BG }]} disabled={loading}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6 6 18" stroke={MUTED} strokeWidth={2} strokeLinecap="round" />
              <Path d="m6 6 12 12" stroke={MUTED} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* ── Disclaimer banner ───────────────────────────────────────────── */}
        <View style={[s.banner, { backgroundColor: YELLOW + '22', borderColor: YELLOW + '66' }]}>
          <Text style={[s.bannerText, { color: PRIMARY }]}>
            La IA puede cometer errores. Revisa cada dato, edita si es necesario y desmarca los que no correspondan.
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Personal info ──────────────────────────────────────────────── */}
          {state.personalInfo && (state.personalInfo.bloodType || state.personalInfo.gender) && (
            <>
              <SectionHeader
                title="Info personal" color={BLUE} PRIMARY={PRIMARY} MUTED={MUTED}
                count={piFieldCount}
                included={(piBloodIncluded ? 1 : 0) + (piGenIncluded ? 1 : 0)}
              />

              {state.personalInfo.bloodType && (
                <PersonalInfoRow
                  label="Tipo de sangre"
                  extractedRaw={state.personalInfo.bloodType}
                  extractedLabel={BLOOD_LABEL[state.personalInfo.bloodType] || state.personalInfo.bloodType}
                  existingLabel={existingProfile?.bloodType ? (BLOOD_LABEL[existingProfile.bloodType] || existingProfile.bloodType) : undefined}
                  status={btStatus}
                  included={state.personalInfo._includeBloodType}
                  onToggle={() => onChange({ ...state, personalInfo: { ...state.personalInfo!, _includeBloodType: !state.personalInfo!._includeBloodType } })}
                  colors={{ CARD, PRIMARY, MUTED, MUTED_BG, BLUE, RED }}
                />
              )}

              {state.personalInfo.gender && (
                <PersonalInfoRow
                  label="Género"
                  extractedRaw={state.personalInfo.gender}
                  extractedLabel={GENDER_LABEL[state.personalInfo.gender] || state.personalInfo.gender}
                  existingLabel={existingProfile?.gender ? (GENDER_LABEL[existingProfile.gender] || existingProfile.gender) : undefined}
                  status={genStatus}
                  included={state.personalInfo._includeGender}
                  onToggle={() => onChange({ ...state, personalInfo: { ...state.personalInfo!, _includeGender: !state.personalInfo!._includeGender } })}
                  colors={{ CARD, PRIMARY, MUTED, MUTED_BG, BLUE, RED }}
                  style={{ marginTop: 6 }}
                />
              )}
              <View style={s.divider} />
            </>
          )}

          {/* ── Alergias ───────────────────────────────────────────────────── */}
          {state.allergies.length > 0 && (
            <>
              <SectionHeader title="Alergias" count={state.allergies.length}
                color={PINK} included={state.allergies.filter(a => a._included).length}
                PRIMARY={PRIMARY} MUTED={MUTED} />
              {state.allergies.map(a => (
                <ItemRow key={a._id} included={a._included} onToggle={() => patchAllergy(a._id, { _included: !a._included })}
                  title={a.allergenName || '(sin nombre)'}
                  subtitle={`${ALLERGY_TYPE_LABEL[a.allergyType] || a.allergyType} · ${ALLERGY_SEV_LABEL[a.severity] || a.severity}`}
                  expanded={a._expanded} onExpand={() => patchAllergy(a._id, { _expanded: !a._expanded })}
                  colors={colors}
                >
                  <FieldLabel label="Nombre del alérgeno" MUTED={MUTED} />
                  <FieldInput value={a.allergenName} onChange={v => patchAllergy(a._id, { allergenName: v })} PRIMARY={PRIMARY} MUTED_BG={MUTED_BG} />
                  <FieldLabel label="Tipo de alergia" MUTED={MUTED} />
                  <ChipSelector value={a.allergyType} options={['MEDICATION', 'FOOD', 'ENVIRONMENTAL', 'OTHER']}
                    labelMap={ALLERGY_TYPE_LABEL} onChange={v => patchAllergy(a._id, { allergyType: v })} color={PINK} />
                  <FieldLabel label="Severidad" MUTED={MUTED} />
                  <ChipSelector value={a.severity} options={['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']}
                    labelMap={ALLERGY_SEV_LABEL} onChange={v => patchAllergy(a._id, { severity: v })} color={PINK} />
                  <FieldLabel label="Descripción de la reacción" MUTED={MUTED} />
                  <FieldInput value={a.reactionDescription} onChange={v => patchAllergy(a._id, { reactionDescription: v })} PRIMARY={PRIMARY} MUTED_BG={MUTED_BG} multiline />
                </ItemRow>
              ))}
              <View style={s.divider} />
            </>
          )}

          {/* ── Condiciones crónicas ───────────────────────────────────────── */}
          {state.conditions.length > 0 && (
            <>
              <SectionHeader title="Condiciones crónicas" count={state.conditions.length}
                color={YELLOW} included={state.conditions.filter(c => c._included).length}
                PRIMARY={PRIMARY} MUTED={MUTED} />
              {state.conditions.map(c => (
                <ItemRow key={c._id} included={c._included} onToggle={() => patchCondition(c._id, { _included: !c._included })}
                  title={c.conditionName || '(sin nombre)'}
                  subtitle={`${COND_STATUS_LABEL[c.status] || c.status}${c.severity ? ' · ' + (COND_SEV_LABEL[c.severity] || c.severity) : ''}`}
                  expanded={c._expanded} onExpand={() => patchCondition(c._id, { _expanded: !c._expanded })}
                  colors={colors}
                >
                  <FieldLabel label="Nombre de la condición" MUTED={MUTED} />
                  <FieldInput value={c.conditionName} onChange={v => patchCondition(c._id, { conditionName: v })} PRIMARY={PRIMARY} MUTED_BG={MUTED_BG} />
                  <FieldLabel label="Estado" MUTED={MUTED} />
                  <ChipSelector value={c.status} options={['ACTIVE', 'MANAGED', 'IN_REMISSION', 'RESOLVED']}
                    labelMap={COND_STATUS_LABEL} onChange={v => patchCondition(c._id, { status: v })} color={YELLOW} />
                  <FieldLabel label="Severidad" MUTED={MUTED} />
                  <ChipSelector value={c.severity} options={['MILD', 'MODERATE', 'SEVERE']}
                    labelMap={COND_SEV_LABEL} onChange={v => patchCondition(c._id, { severity: v })} color={YELLOW} />
                  <FieldLabel label="Notas" MUTED={MUTED} />
                  <FieldInput value={c.notes} onChange={v => patchCondition(c._id, { notes: v })} PRIMARY={PRIMARY} MUTED_BG={MUTED_BG} multiline />
                </ItemRow>
              ))}
              <View style={s.divider} />
            </>
          )}

          {/* ── Medicamentos ──────────────────────────────────────────────── */}
          {state.medications.length > 0 && (
            <>
              <SectionHeader title="Medicamentos" count={state.medications.length}
                color={GREEN} included={state.medications.filter(m => m._included).length}
                PRIMARY={PRIMARY} MUTED={MUTED} />
              {state.medications.map(m => (
                <ItemRow key={m._id} included={m._included} onToggle={() => patchMedication(m._id, { _included: !m._included })}
                  title={m.customMedicationName || '(sin nombre)'}
                  subtitle={[m.dosage, m.frequency].filter(Boolean).join(' · ') || 'Sin dosis/frecuencia'}
                  expanded={m._expanded} onExpand={() => patchMedication(m._id, { _expanded: !m._expanded })}
                  colors={colors}
                >
                  <FieldLabel label="Nombre del medicamento" MUTED={MUTED} />
                  <FieldInput value={m.customMedicationName} onChange={v => patchMedication(m._id, { customMedicationName: v })} PRIMARY={PRIMARY} MUTED_BG={MUTED_BG} />
                  <FieldLabel label="Dosis" MUTED={MUTED} />
                  <FieldInput value={m.dosage} onChange={v => patchMedication(m._id, { dosage: v })} PRIMARY={PRIMARY} MUTED_BG={MUTED_BG} />
                  <FieldLabel label="Frecuencia" MUTED={MUTED} />
                  <FieldInput value={m.frequency} onChange={v => patchMedication(m._id, { frequency: v })} PRIMARY={PRIMARY} MUTED_BG={MUTED_BG} />
                  <FieldLabel label="Vía de administración" MUTED={MUTED} />
                  <ChipSelector value={m.route} options={['ORAL', 'INJECTION', 'TOPICAL', 'INHALATION', 'OTHER']}
                    labelMap={ROUTE_LABEL} onChange={v => patchMedication(m._id, { route: v })} color={GREEN} />
                  <FieldLabel label="Propósito" MUTED={MUTED} />
                  <FieldInput value={m.purpose} onChange={v => patchMedication(m._id, { purpose: v })} PRIMARY={PRIMARY} MUTED_BG={MUTED_BG} />
                </ItemRow>
              ))}
              <View style={s.divider} />
            </>
          )}

          {/* ── Historial médico ──────────────────────────────────────────── */}
          {state.history.length > 0 && (
            <>
              <SectionHeader title="Historial médico" count={state.history.length}
                color={PURPLE} included={state.history.filter(h => h._included).length}
                PRIMARY={PRIMARY} MUTED={MUTED} />
              {state.history.map(h => (
                <ItemRow key={h._id} included={h._included} onToggle={() => patchHistory(h._id, { _included: !h._included })}
                  title={h.eventName || '(sin nombre)'}
                  subtitle={EVENT_TYPE_LABEL[h.eventType] || h.eventType}
                  expanded={h._expanded} onExpand={() => patchHistory(h._id, { _expanded: !h._expanded })}
                  colors={colors}
                >
                  <FieldLabel label="Nombre del evento" MUTED={MUTED} />
                  <FieldInput value={h.eventName} onChange={v => patchHistory(h._id, { eventName: v })} PRIMARY={PRIMARY} MUTED_BG={MUTED_BG} />
                  <FieldLabel label="Tipo de evento" MUTED={MUTED} />
                  <ChipSelector value={h.eventType} options={['SURGERY', 'HOSPITALIZATION', 'VACCINATION', 'INJURY', 'OTHER']}
                    labelMap={EVENT_TYPE_LABEL} onChange={v => patchHistory(h._id, { eventType: v })} color={PURPLE} />
                  <FieldLabel label="Lugar / Institución" MUTED={MUTED} />
                  <FieldInput value={h.location} onChange={v => patchHistory(h._id, { location: v })} PRIMARY={PRIMARY} MUTED_BG={MUTED_BG} />
                  <FieldLabel label="Resultado / Observaciones" MUTED={MUTED} />
                  <FieldInput value={h.outcome} onChange={v => patchHistory(h._id, { outcome: v })} PRIMARY={PRIMARY} MUTED_BG={MUTED_BG} multiline />
                </ItemRow>
              ))}
            </>
          )}

          {totalItems === 0 && (
            <View style={[s.emptyState, { backgroundColor: CARD }]}>
              <Text style={{ fontSize: 14, fontFamily: FONT.sansBold, color: PRIMARY }}>Sin datos médicos detectados</Text>
              <Text style={{ fontSize: 12, fontFamily: FONT.sansRegular, color: MUTED, marginTop: 4 }}>
                El documento no contiene información médica estructurada.
              </Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── Bottom action bar ────────────────────────────────────────────── */}
        <View style={[s.bottomBar, { backgroundColor: BG, borderTopColor: MUTED_BG }]}>
          <TouchableOpacity style={[s.btnCancel, { backgroundColor: MUTED_BG }]} onPress={onCancel} disabled={loading}>
            <Text style={[s.btnCancelText, { color: MUTED }]}>Descartar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btnConfirm, { backgroundColor: GREEN, opacity: loading ? 0.6 : 1 }]}
            onPress={() => {
              if (totalIncluded === 0) {
                Alert.alert('Sin datos', 'Selecciona al menos un dato para guardar.');
                return;
              }
              onConfirm();
            }}
            disabled={loading}
          >
            <Text style={s.btnConfirmText}>
              {loading ? 'Guardando…' : `Guardar ${totalIncluded} dato${totalIncluded !== 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  topLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brainIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 17, fontFamily: FONT.displayBold, letterSpacing: -0.34 },
  topSub:   { fontSize: 12, fontFamily: FONT.sansRegular, marginTop: 1 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  banner: {
    marginHorizontal: 16, marginTop: 10, borderRadius: 12,
    borderWidth: 1, padding: 12,
  },
  bannerText: { fontSize: 12, fontFamily: FONT.sansRegular, lineHeight: 18 },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  divider: { height: 1, backgroundColor: 'transparent', marginVertical: 8 },

  simpleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  simpleLabel: { flex: 1, fontSize: 12, fontFamily: FONT.sansRegular },
  simpleValue: { fontSize: 13, fontFamily: FONT.sansBold },

  emptyState: {
    borderRadius: 20, padding: 32, alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12, paddingHorizontal: 16,
    paddingBottom: 36, paddingTop: 12,
    borderTopWidth: 1,
  },
  btnCancel:      { flex: 1, paddingVertical: 15, borderRadius: 18, alignItems: 'center' },
  btnCancelText:  { fontSize: 15, fontFamily: FONT.sansBold },
  btnConfirm:     { flex: 2, paddingVertical: 15, borderRadius: 18, alignItems: 'center' },
  btnConfirmText: { fontSize: 15, fontFamily: FONT.sansBold, color: '#fff' },
});
