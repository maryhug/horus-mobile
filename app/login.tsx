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
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: c.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxActive: { backgroundColor: c.accent, borderColor: c.accent },
    checkLabel: { color: c.textSecondary, fontSize: 13 },
    forgotLink: { color: c.accent, fontSize: 13, fontWeight: '500' },
    loginBtn: {
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
    loginBtnDisabled: { opacity: 0.7 },
    loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
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
    signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    signupText: { color: c.textSecondary, fontSize: 14 },
    signupLink: { color: c.accent, fontSize: 14, fontWeight: '600' },
  });
}

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Ingresa tu correo y contraseña.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await login(email.trim(), password);
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
            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                <Ionicons name="watch-outline" size={34} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.title}>
              <Text style={styles.titleAccent}>Horus </Text>
              <Text style={styles.titleBold}>Braslet</Text>
            </Text>
            <Text style={styles.subtitle}>
              Inicia sesión para conectar con tu manilla inteligente
            </Text>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF233C" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={[styles.inputBox, errorMsg ? styles.inputBoxError : null]}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="tu@correo.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={v => { setEmail(v); setErrorMsg(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.inputBox, errorMsg ? styles.inputBoxError : null]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={v => { setPassword(v); setErrorMsg(null); }}
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
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.checkRow} onPress={() => setRememberMe(v => !v)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkLabel}>Recordarme</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>¿No tienes cuenta? </Text>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Solicita acceso</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
