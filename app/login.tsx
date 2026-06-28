import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/api';
import { EmotionShape } from '../components/EmotionShape';
import { useLanguage } from '../contexts/LanguageContext';
import { getBiometricEnabled } from '../utils/biometricStorage';
import { getItem } from '../utils/storage';

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const isSmall = height < 700;

  const { login, loginWithBiometric } = useAuth();
  const { t } = useLanguage();
  const { registered } = useLocalSearchParams<{ registered?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showBioBtn, setShowBioBtn] = useState(false);

  useEffect(() => {
    (async () => {
      const [enabled, hasHw, enrolled, session] = await Promise.all([
        getBiometricEnabled(),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        getItem('horus_session'),
      ]);
      setShowBioBtn(enabled && hasHw && enrolled && session === 'active');
    })();
  }, []);

  const handleBiometric = async () => {
    setErrorMsg(null);
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verifica tu identidad para continuar',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (!result.success) return;
    setIsLoading(true);
    try {
      await loginWithBiometric();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg(t.loginErrorRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Ingresa un correo electrónico válido.');
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

        {/* Decorative shapes */}
        <EmotionShape kind="blob" color="yellow" size={isSmall ? 90 : 120} rotate={-12} style={styles.shapeYellow} />
        <EmotionShape kind="star" color="pink"   size={isSmall ? 54 : 70}  rotate={8}   style={styles.shapeStar} />
        <EmotionShape kind="blob" color="blue"   size={isSmall ? 50 : 64}  rotate={20}  style={styles.shapeBlue} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../assets/logos-horus-3.svg')}
              style={{ height: 36, width: 140 }}
              resizeMode="contain"
            />
          </View>

          {/* Title block — offset clears the tallest shape (star at ~top:176+size:70 = 246px) */}
          <View style={[styles.titleBlock, { marginTop: isSmall ? 140 : 170 }]}>
            <Text style={styles.title}>{t.loginTitle}</Text>
            <Text style={styles.subtitle}>{t.loginSubtitle}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {registered === '1' && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle-outline" size={15} color="#4CAF50" />
                <Text style={styles.successText}>{t.loginSuccess}</Text>
              </View>
            )}

            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>{t.loginEmail}</Text>
              <TextInput
                style={styles.inputField}
                placeholder={t.loginEmailPh}
                placeholderTextColor="rgba(136,130,110,0.6)"
                value={email}
                onChangeText={v => { setEmail(v); setErrorMsg(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>{t.loginPassword}</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.inputField, { flex: 1 }]}
                  placeholder={t.loginPasswordPh}
                  placeholderTextColor="rgba(136,130,110,0.6)"
                  value={password}
                  onChangeText={v => { setPassword(v); setErrorMsg(null); }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(p => !p)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={16}
                    color="#88826E"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>{t.loginForgot}</Text>
            </TouchableOpacity>

            {/* Biometric shortcut — only if account with biometric enabled exists on device */}
            {showBioBtn && (
              <TouchableOpacity
                style={[styles.bioBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleBiometric}
                activeOpacity={0.88}
                disabled={isLoading}
              >
                <Ionicons name="finger-print" size={20} color={PRIMARY} />
                <Text style={styles.bioBtnText}>Ingresar con biometría</Text>
              </TouchableOpacity>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.88}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FAFAF7" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>{t.loginBtn}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FAFAF7" />
                </>
              )}
            </TouchableOpacity>

            {/* Sign up */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>{t.loginNoAccount} </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.signupLink}>{t.loginSignUp}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },

  // Shapes — top values relative to SafeAreaView top
  shapeYellow: { position: 'absolute', right: -6,  top: 56,  zIndex: 0 },
  shapeStar:   { position: 'absolute', left: 20,   top: 130, zIndex: 0 },
  shapeBlue:   { position: 'absolute', right: 36,  top: 170, zIndex: 0 },

  scrollContent: { flexGrow: 1, paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 40,
    zIndex: 1,
  },

  // Title — marginTop set dynamically in JSX
  titleBlock: {
    paddingHorizontal: 24,
    zIndex: 1,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: PRIMARY,
    lineHeight: 42,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    color: MUTED,
    lineHeight: 22,
    maxWidth: 280,
  },

  // Form
  form: {
    paddingHorizontal: 24,
    marginTop: 32,
    gap: 12,
    zIndex: 1,
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

  // Forgot
  forgotWrap: { alignItems: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 13, fontWeight: '600', color: MUTED },

  // Submit button
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
  bioBtn: {
    backgroundColor: '#FAD957',
    borderRadius: 20,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  bioBtnText: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },

  // Sign up
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupText: { fontSize: 14, color: MUTED },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
    textDecorationLine: 'underline',
  },

  // Alerts
  errorBox: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '500' },
  successBox: {
    backgroundColor: 'rgba(76,175,80,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: { color: '#4CAF50', fontSize: 13, fontWeight: '500', flex: 1 },
});
