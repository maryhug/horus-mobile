import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/api';
import { AppColors } from '../constants/colors';

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 28,
      borderWidth: 1,
      borderColor: c.border,
    },
    logoWrap: { alignItems: 'center', marginBottom: 22 },
    logoCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: c.accent,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    },
    backBtn: {
      position: 'absolute',
      top: 0,
      left: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      padding: 4,
    },
    backText: { color: c.accent, fontSize: 14, fontWeight: '600' },
    title: { textAlign: 'center', fontSize: 26, fontWeight: '700', marginBottom: 8 },
    titleAccent: { color: c.accent, fontWeight: '700' },
    titleBold: { color: c.textPrimary, fontWeight: '700' },
    subtitle: {
      textAlign: 'center',
      color: c.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 28,
    },
    nameRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    nameGroup: { flex: 1 },
    inputGroup: { marginBottom: 16 },
    label: { color: c.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 8 },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceElevated,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      height: 50,
    },
    inputBoxError: { borderColor: c.strawberryRed ?? '#EF233C' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: c.textPrimary, fontSize: 15 },
    eyeBtn: { padding: 4 },
    strengthRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
    strengthBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: c.border },
    strengthLabel: { fontSize: 11, color: c.textMuted, marginTop: 4 },
    termsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 24,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: c.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 1,
      flexShrink: 0,
    },
    checkboxActive: { backgroundColor: c.accent, borderColor: c.accent },
    termsText: { flex: 1, color: c.textSecondary, fontSize: 13, lineHeight: 18 },
    termsLink: { color: c.accent, fontWeight: '600' },
    registerBtn: {
      backgroundColor: c.accent,
      borderRadius: 14,
      height: 52,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    registerBtnDisabled: { opacity: 0.7 },
    registerBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    errorBox: {
      backgroundColor: 'rgba(239,35,60,0.10)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(239,35,60,0.25)',
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    errorText: { color: '#EF233C', fontSize: 13, flex: 1, lineHeight: 18 },
    successBox: {
      backgroundColor: 'rgba(76,175,80,0.10)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(76,175,80,0.25)',
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    successText: { color: '#4CAF50', fontSize: 13, flex: 1, lineHeight: 18 },
    loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    loginText: { color: c.textSecondary, fontSize: 14 },
    loginLink: { color: c.accent, fontSize: 14, fontWeight: '600' },
  });
}

function getPasswordStrength(pwd: string): { level: number; label: string; color: string } {
  if (pwd.length === 0) return { level: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 1, label: 'Débil', color: '#EF233C' };
  if (score === 2) return { level: 2, label: 'Regular', color: '#FF9800' };
  if (score === 3) return { level: 3, label: 'Buena', color: '#2196F3' };
  return { level: 4, label: 'Fuerte', color: '#4CAF50' };
}

export default function RegisterScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const strength = getPasswordStrength(password);

  const clearError = () => setErrorMsg(null);

  const validate = (): string | null => {
    if (!firstName.trim()) return 'Ingresa tu nombre.';
    if (!lastName.trim()) return 'Ingresa tu apellido.';
    if (!email.trim()) return 'Ingresa tu correo electrónico.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Correo electrónico inválido.';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
    if (!acceptedTerms) return 'Debes aceptar los términos y condiciones.';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Back button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={16} color={colors.accent} />
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>

            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                <Ionicons name="person-add-outline" size={32} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.title}>
              <Text style={styles.titleAccent}>Crear </Text>
              <Text style={styles.titleBold}>cuenta</Text>
            </Text>
            <Text style={styles.subtitle}>
              Regístrate para comenzar a usar tu manilla Horus
            </Text>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF233C" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {successMsg && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            {/* Nombre y Apellido en fila */}
            <View style={styles.nameRow}>
              <View style={styles.nameGroup}>
                <Text style={styles.label}>Nombre</Text>
                <View style={[styles.inputBox, errorMsg && !firstName ? styles.inputBoxError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre"
                    placeholderTextColor={colors.textMuted}
                    value={firstName}
                    onChangeText={v => { setFirstName(v); clearError(); }}
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>
              </View>
              <View style={styles.nameGroup}>
                <Text style={styles.label}>Apellido</Text>
                <View style={[styles.inputBox, errorMsg && !lastName ? styles.inputBoxError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Apellido"
                    placeholderTextColor={colors.textMuted}
                    value={lastName}
                    onChangeText={v => { setLastName(v); clearError(); }}
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={[styles.inputBox, errorMsg && !email ? styles.inputBoxError : null]}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="tu@correo.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={v => { setEmail(v); clearError(); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={v => { setPassword(v); clearError(); }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {/* Indicador de fortaleza */}
              {password.length > 0 && (
                <>
                  <View style={styles.strengthRow}>
                    {[1, 2, 3, 4].map(i => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          { backgroundColor: i <= strength.level ? strength.color : undefined },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                </>
              )}
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={[
                styles.inputBox,
                confirmPassword.length > 0 && confirmPassword !== password ? styles.inputBoxError : null,
              ]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repite la contraseña"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={v => { setConfirmPassword(v); clearError(); }}
                  secureTextEntry={!showConfirm}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <Text style={{ color: '#EF233C', fontSize: 11, marginTop: 4 }}>
                  Las contraseñas no coinciden
                </Text>
              )}
            </View>

            {/* Términos y condiciones */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAcceptedTerms(v => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
                {acceptedTerms && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
              </View>
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text style={styles.termsLink}>Términos de uso</Text>
                {' '}y la{' '}
                <Text style={styles.termsLink}>Política de privacidad</Text>
                {' '}de Horus Braslet
              </Text>
            </TouchableOpacity>

            {/* Botón registrar */}
            <TouchableOpacity
              style={[styles.registerBtn, isLoading && styles.registerBtnDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.registerBtnText}>Crear cuenta</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

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
