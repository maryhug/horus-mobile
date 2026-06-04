import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/api';
import { EmotionShape } from '../components/EmotionShape';

function InputCard({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  disabled?: boolean;
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
            <Ionicons
              name={show ? 'eye-outline' : 'eye-off-outline'}
              size={16}
              color="#88826E"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const { height } = useWindowDimensions();
  const isSmall = height < 700;

  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) return setErrorMsg('Ingresa tu nombre y apellido.');
    if (!email.includes('@')) return setErrorMsg('Ingresa un correo válido.');
    if (password.length < 6) return setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirm) return setErrorMsg('Las contraseñas no coinciden.');
    if (!acceptedTerms) return setErrorMsg('Debes aceptar los términos.');

    setErrorMsg(null);
    setIsLoading(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        confirmPassword: confirm,
      });
      router.replace({ pathname: '/login', params: { registered: '1' } });
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

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

          {/* Title — offset clears cross shape (top:60 + size:84 = 144px) */}
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

            {/* Nombre + Apellido en 2 columnas */}
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <InputCard
                  label="Nombre"
                  value={firstName}
                  onChange={v => { setFirstName(v); setErrorMsg(null); }}
                  placeholder="Mateo"
                  disabled={isLoading}
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputCard
                  label="Apellido"
                  value={lastName}
                  onChange={v => { setLastName(v); setErrorMsg(null); }}
                  placeholder="Restrepo"
                  disabled={isLoading}
                />
              </View>
            </View>

            <InputCard
              label="Correo"
              value={email}
              onChange={v => { setEmail(v); setErrorMsg(null); }}
              placeholder="tu@correo.com"
              type="email"
              disabled={isLoading}
            />

            <InputCard
              label="Contraseña"
              value={password}
              onChange={v => { setPassword(v); setErrorMsg(null); }}
              placeholder="••••••••"
              type="password"
              disabled={isLoading}
            />

            <InputCard
              label="Confirmar contraseña"
              value={confirm}
              onChange={v => { setConfirm(v); setErrorMsg(null); }}
              placeholder="••••••••"
              type="password"
              disabled={isLoading}
            />

            {/* Terms */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAcceptedTerms(v => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
                {acceptedTerms && (
                  <Ionicons name="checkmark" size={10} color="#FAFAF7" strokeWidth={3} />
                )}
              </View>
              <Text style={styles.termsText}>
                Acepto los Términos y la Política de privacidad de Horus.
              </Text>
            </TouchableOpacity>

            {/* Submit */}
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

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.loginLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BG = '#F9F6ED';
const CARD = '#FFFFFF';
const PRIMARY = '#1A1512';
const MUTED = '#8C7F6E';
const GREEN = '#96C979';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },

  // Shapes
  shapeCross: { position: 'absolute', left: -12, top: 90, zIndex: 0 },
  shapeHeart: { position: 'absolute', right: 32,  top: 48, zIndex: 0 },

  scrollContent: { flexGrow: 1, paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 32,
    zIndex: 1,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: -0.5,
  },

  // Title — marginTop set dynamically in JSX
  titleBlock: {
    paddingHorizontal: 24,
    zIndex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: PRIMARY,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: MUTED,
    lineHeight: 22,
  },

  // Form
  form: {
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 12,
    zIndex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Input card
  inputCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingTop: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  inputLabel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
  inputField: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
    fontSize: 15,
    fontWeight: '500',
    color: PRIMARY,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: 'rgba(136,130,110,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: GREEN,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: MUTED,
    lineHeight: 18,
  },

  // Submit
  submitBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 20,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: '#FAFAF7',
    fontSize: 15,
    fontWeight: '700',
  },

  // Login link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: { fontSize: 14, color: MUTED },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
    textDecorationLine: 'underline',
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '500' },
});
