import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  useWindowDimensions, Modal, FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, getErrorMessage, setAuthToken } from '../services/api';
import { EmotionShape } from '../components/EmotionShape';

// ── Static theme (register is always light) ────────────────────────────────
const BG      = '#F9F6ED';
const CARD    = '#FFFFFF';
const PRIMARY = '#1A1512';
const MUTED   = '#8C7F6E';
const MUTED_BG= 'rgba(136,130,110,0.12)';
const GREEN   = '#96C979';

// ── Picker data ────────────────────────────────────────────────────────────
const BLOOD_TYPES = [
  { label: 'A+',  value: 'A_POSITIVE'  },
  { label: 'A-',  value: 'A_NEGATIVE'  },
  { label: 'B+',  value: 'B_POSITIVE'  },
  { label: 'B-',  value: 'B_NEGATIVE'  },
  { label: 'AB+', value: 'AB_POSITIVE' },
  { label: 'AB-', value: 'AB_NEGATIVE' },
  { label: 'O+',  value: 'O_POSITIVE'  },
  { label: 'O-',  value: 'O_NEGATIVE'  },
];
const GENDERS = [
  { label: 'Masculino',        value: 'MALE'            },
  { label: 'Femenino',         value: 'FEMALE'          },
  { label: 'Otro',             value: 'OTHER'           },
  { label: 'Prefiero no decir',value: 'PREFER_NOT_TO_SAY' },
];
const ID_TYPES = [
  { label: 'Cédula de ciudadanía', value: 'CC' },
  { label: 'Cédula de extranjería',value: 'CE' },
  { label: 'Pasaporte',            value: 'PP' },
  { label: 'Tarjeta de identidad', value: 'TI' },
];
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
const DAYS  = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) }));
const CUR_Y = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => ({ label: String(CUR_Y - i), value: String(CUR_Y - i) }));

type PickerOption = { label: string; value: string };
type PickerKey = 'dobDay' | 'dobMonth' | 'dobYear' | 'gender' | 'bloodType' | 'idType' | null;

// ── Helpers ────────────────────────────────────────────────────────────────
function findLabel(options: PickerOption[], value: string) {
  return options.find(o => o.value === value)?.label ?? '';
}

// ── InputCard ──────────────────────────────────────────────────────────────
function InputCard({
  label, value, onChange, placeholder, type = 'text', disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: 'text' | 'email' | 'password'; disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <View style={styles.inputCard}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={isPassword ? styles.passwordRow : undefined}>
        <TextInput
          style={[styles.inputField, isPassword && { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor="rgba(136,130,110,0.6)"
          value={value}
          onChangeText={onChange}
          keyboardType={type === 'email' ? 'email-address' : 'default'}
          autoCapitalize={type === 'email' ? 'none' : 'words'}
          autoCorrect={false}
          secureTextEntry={isPassword && !show}
          editable={!disabled}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShow(s => !s)} style={styles.eyeBtn}>
            <Ionicons name={show ? 'eye-outline' : 'eye-off-outline'} size={16} color={MUTED} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── PickerCard — tappable, same visual style as InputCard ──────────────────
function PickerCard({
  label, displayValue, onPress, disabled,
}: {
  label: string; displayValue: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.inputCard}
      onPress={!disabled ? onPress : undefined}
      activeOpacity={0.75}
    >
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.pickerRow}>
        <Text
          style={[styles.inputField, { flex: 1, paddingTop: 4 }, !displayValue && { color: 'rgba(136,130,110,0.6)' }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayValue || 'Seleccionar'}
        </Text>
        <Ionicons name="chevron-down" size={14} color={MUTED} style={{ paddingRight: 16, paddingBottom: 12 }} />
      </View>
    </TouchableOpacity>
  );
}

// ── PickerModal — light-theme bottom sheet ─────────────────────────────────
function PickerModal({ visible, title, options, selected, onSelect, onClose }: {
  visible: boolean; title: string;
  options: PickerOption[]; selected: string;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={[pm.sheet, { paddingBottom: insets.bottom + 12 }]} activeOpacity={1}>
          <View style={pm.header}>
            <Text style={pm.title}>{title}</Text>
            <TouchableOpacity style={pm.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color={PRIMARY} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={item => item.value}
            style={{ maxHeight: 340 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 4, paddingHorizontal: 4 }}
            renderItem={({ item }) => {
              const active = item.value === selected;
              return (
                <TouchableOpacity
                  style={[pm.option, active && pm.optionActive]}
                  onPress={() => { onSelect(item.value); onClose(); }}
                  activeOpacity={0.75}
                >
                  <Text style={[pm.optionText, active && pm.optionTextActive]}>
                    {item.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={14} color={BG} />}
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
  overlay:       { flex: 1, backgroundColor: 'rgba(26,21,18,0.4)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: BG, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title:         { fontSize: 17, fontWeight: '700', color: PRIMARY },
  closeBtn:      { width: 30, height: 30, borderRadius: 15, backgroundColor: MUTED_BG, alignItems: 'center', justifyContent: 'center' },
  option:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: CARD },
  optionActive:  { backgroundColor: PRIMARY },
  optionText:    { fontSize: 15, fontWeight: '500', color: PRIMARY },
  optionTextActive: { color: BG, fontWeight: '700' },
});

// ── Screen ─────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const { height } = useWindowDimensions();
  const isSmall = height < 700;
  const { login } = useAuth();

  // Basic fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Extra profile fields
  const [dobDay,    setDobDay]    = useState('');
  const [dobMonth,  setDobMonth]  = useState('');
  const [dobYear,   setDobYear]   = useState('');
  const [gender,    setGender]    = useState('');
  const [bloodType, setBloodType] = useState('');
  const [idType,    setIdType]    = useState('');
  const [idNumber,  setIdNumber]  = useState('');

  const [activePicker, setActivePicker] = useState<PickerKey>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

  const clearError = () => setErrorMsg(null);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) return setErrorMsg('Ingresa tu nombre y apellido.');
    if (!email.includes('@'))                  return setErrorMsg('Ingresa un correo válido.');
    if (password.length < 6)                   return setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirm)                  return setErrorMsg('Las contraseñas no coinciden.');
    if (!acceptedTerms)                        return setErrorMsg('Debes aceptar los términos.');

    setErrorMsg(null);
    setIsLoading(true);
    try {
      // 1 — Crear cuenta
      await apiClient.post('/auth/register', {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
        password,
        confirmPassword: confirm,
      });

      // 2 — Login automático para obtener el Bearer token
      const loginRes = await apiClient.post<{ accessToken?: string }>('/auth/login', {
        email: email.trim(), password,
      });
      // Setear el token para que el PUT /profile siguiente lo incluya
      if (loginRes.data.accessToken) setAuthToken(loginRes.data.accessToken);

      // 3 — Guardar datos de perfil opcionales (solo los que se llenaron)
      const profilePayload: Record<string, string> = {};
      if (bloodType)        profilePayload.bloodType           = bloodType;
      if (gender)           profilePayload.gender              = gender;
      if (idType)           profilePayload.identificationType  = idType;
      if (idNumber.trim())  profilePayload.identificationNumber= idNumber.trim();
      if (dobDay && dobMonth && dobYear) {
        const y = dobYear.padStart(4, '0');
        const m = dobMonth.padStart(2, '0');
        const d = dobDay.padStart(2, '0');
        profilePayload.dateOfBirth = `${y}-${m}-${d}`;
      }
      if (Object.keys(profilePayload).length > 0) {
        await apiClient.put('/profile', profilePayload);
      }

      // 4 — Redirigir a login con mensaje de éxito
      router.replace({ pathname: '/login', params: { registered: '1' } });
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Derived display labels
  const monthLabel = dobMonth ? findLabel(MONTHS_ES, dobMonth) : '';
  const genderLabel = findLabel(GENDERS, gender);
  const bloodLabel  = findLabel(BLOOD_TYPES, bloodType);
  const idTypeLabel = findLabel(ID_TYPES, idType);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>

        {/* Decorative shapes */}
        <EmotionShape kind="cross" color="green" size={isSmall ? 64 : 84} rotate={-10} style={styles.shapeCross} />
        <EmotionShape kind="heart" color="pink"  size={isSmall ? 46 : 60} rotate={12}  style={styles.shapeHeart} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Ionicons name="shield-checkmark" size={20} color="#FAFAF7" />
            </View>
            <Text style={styles.logoText}>Horus</Text>
          </View>

          {/* Title */}
          <View style={[styles.titleBlock, { marginTop: isSmall ? 90 : 110 }]}>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Empieza a cuidar tu salud en minutos.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* ── Nombre + Apellido ── */}
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <InputCard label="Nombre"   value={firstName} onChange={v => { setFirstName(v); clearError(); }} placeholder="Mateo"    disabled={isLoading} />
              </View>
              <View style={{ flex: 1 }}>
                <InputCard label="Apellido" value={lastName}  onChange={v => { setLastName(v);  clearError(); }} placeholder="Restrepo" disabled={isLoading} />
              </View>
            </View>

            {/* ── Correo ── */}
            <InputCard label="Correo"    value={email}    onChange={v => { setEmail(v);    clearError(); }} placeholder="tu@correo.com" type="email"    disabled={isLoading} />

            {/* ── Contraseña ── */}
            <InputCard label="Contraseña"          value={password} onChange={v => { setPassword(v); clearError(); }} placeholder="••••••••" type="password" disabled={isLoading} />
            <InputCard label="Confirmar contraseña" value={confirm}  onChange={v => { setConfirm(v);  clearError(); }} placeholder="••••••••" type="password" disabled={isLoading} />

            {/* ── Separador opcional ── */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Datos médicos (opcional)</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Fecha de nacimiento ── */}
            <View>
              <Text style={styles.groupLabel}>Fecha de nacimiento</Text>
              <View style={styles.dobRow}>
                <View style={{ flex: 1 }}>
                  <PickerCard label="Día"  displayValue={dobDay}    onPress={() => setActivePicker('dobDay')}   disabled={isLoading} />
                </View>
                <View style={{ flex: 2 }}>
                  <PickerCard label="Mes"  displayValue={monthLabel} onPress={() => setActivePicker('dobMonth')} disabled={isLoading} />
                </View>
                <View style={{ flex: 2 }}>
                  <PickerCard label="Año"  displayValue={dobYear}   onPress={() => setActivePicker('dobYear')}  disabled={isLoading} />
                </View>
              </View>
            </View>

            {/* ── Género ── */}
            <PickerCard label="Género"         displayValue={genderLabel} onPress={() => setActivePicker('gender')}    disabled={isLoading} />

            {/* ── Tipo de sangre ── */}
            <PickerCard label="Tipo de sangre" displayValue={bloodLabel}  onPress={() => setActivePicker('bloodType')} disabled={isLoading} />

            {/* ── Identificación ── */}
            <PickerCard label="Tipo de identificación" displayValue={idTypeLabel} onPress={() => setActivePicker('idType')} disabled={isLoading} />
            <InputCard  label="Número de identificación" value={idNumber} onChange={v => { setIdNumber(v); clearError(); }} placeholder="1234567890" disabled={isLoading} />

            {/* ── Terms ── */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setAcceptedTerms(v => !v)} activeOpacity={0.8}>
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
                {acceptedTerms && <Ionicons name="checkmark" size={10} color="#FAFAF7" />}
              </View>
              <Text style={styles.termsText}>Acepto los Términos y la Política de privacidad de Horus.</Text>
            </TouchableOpacity>

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleRegister}
              activeOpacity={0.88}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FAFAF7" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Crear cuenta</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FAFAF7" />
                </>
              )}
            </TouchableOpacity>

            {/* ── Login link ── */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.loginLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Picker modals ── */}
      <PickerModal visible={activePicker === 'dobDay'}   title="Día"                    options={DAYS}        selected={dobDay}    onSelect={setDobDay}    onClose={() => setActivePicker(null)} />
      <PickerModal visible={activePicker === 'dobMonth'}  title="Mes"                    options={MONTHS_ES}   selected={dobMonth}  onSelect={setDobMonth}  onClose={() => setActivePicker(null)} />
      <PickerModal visible={activePicker === 'dobYear'}   title="Año"                    options={YEARS}       selected={dobYear}   onSelect={setDobYear}   onClose={() => setActivePicker(null)} />
      <PickerModal visible={activePicker === 'gender'}    title="Género"                 options={GENDERS}     selected={gender}    onSelect={setGender}    onClose={() => setActivePicker(null)} />
      <PickerModal visible={activePicker === 'bloodType'} title="Tipo de sangre"         options={BLOOD_TYPES} selected={bloodType} onSelect={setBloodType} onClose={() => setActivePicker(null)} />
      <PickerModal visible={activePicker === 'idType'}    title="Tipo de identificación" options={ID_TYPES}    selected={idType}    onSelect={setIdType}    onClose={() => setActivePicker(null)} />

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  flex:      { flex: 1 },

  shapeCross: { position: 'absolute', left: -12, top: 90, zIndex: 0 },
  shapeHeart: { position: 'absolute', right: 32, top: 48, zIndex: 0 },

  scrollContent: { flexGrow: 1, paddingBottom: 48 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingTop: 32, zIndex: 1,
  },
  logoBox: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 20, fontWeight: '700', color: PRIMARY, letterSpacing: -0.5 },

  titleBlock: { paddingHorizontal: 24, zIndex: 1 },
  title:    { fontSize: 34, fontWeight: '800', color: PRIMARY, lineHeight: 36, letterSpacing: -0.8 },
  subtitle: { marginTop: 8, fontSize: 15, color: MUTED, lineHeight: 22 },

  form:    { paddingHorizontal: 24, marginTop: 24, gap: 12, zIndex: 1 },
  nameRow: { flexDirection: 'row', gap: 12 },

  // Divider
  divider:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(136,130,110,0.2)' },
  dividerText: { fontSize: 12, fontWeight: '600', color: MUTED },

  // Date row
  groupLabel: { fontSize: 12, fontWeight: '600', color: MUTED, marginBottom: 6, paddingLeft: 4 },
  dobRow:     { flexDirection: 'row', gap: 10 },

  // Input card
  inputCard: {
    backgroundColor: CARD, borderRadius: 20,
    paddingHorizontal: 4, paddingTop: 4,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 2,
  },
  inputLabel: { paddingHorizontal: 16, paddingTop: 12, fontSize: 12, fontWeight: '600', color: MUTED },
  inputField: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4, fontSize: 15, fontWeight: '500', color: PRIMARY },

  // Picker card
  pickerRow: { flexDirection: 'row', alignItems: 'center' },

  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn:      { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 },

  // Terms
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4, paddingTop: 4 },
  checkbox: {
    width: 18, height: 18, borderRadius: 5,
    backgroundColor: 'rgba(136,130,110,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxActive: { backgroundColor: GREEN },
  termsText: { flex: 1, fontSize: 13, color: MUTED, lineHeight: 18 },

  // Submit
  submitBtn: {
    backgroundColor: PRIMARY, borderRadius: 20, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: '#FAFAF7', fontSize: 15, fontWeight: '700' },

  // Login link
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  loginText: { fontSize: 14, color: MUTED },
  loginLink: { fontSize: 14, fontWeight: '700', color: PRIMARY, textDecorationLine: 'underline' },

  // Error
  errorBox: { backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '500' },
});
