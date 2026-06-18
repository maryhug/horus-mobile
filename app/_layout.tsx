import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  AppState, AppStateStatus,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { notificationStore } from '../stores/notificationStore';

// ── Biometric lock screen ───────────────────────────────────────────────────
function BiometricGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, sessionWasRestored, logout, softLogout } = useAuth();
  const insets = useSafeAreaInsets();

  const [locked, setLocked] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  const bgTimeRef = useRef<number | null>(null);
  const authTimeRef = useRef<number>(0);
  const justUnlockRef = useRef<number>(0);
  const isPromptingRef = useRef(false);
  const didInitRef = useRef(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const canUseBiometric = useCallback(async (): Promise<boolean> => {
    const { getBiometricEnabled } = await import('../utils/biometricStorage');
    const [enabled, hasHw, enrolled] = await Promise.all([
      getBiometricEnabled(),
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return enabled && hasHw && enrolled;
  }, []);

  const tryBiometric = useCallback(async () => {
    if (isPromptingRef.current) return;
    isPromptingRef.current = true;
    setAuthFailed(false);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifica tu identidad para continuar',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      if (result.success) {
        justUnlockRef.current = Date.now();
        setLocked(false);
        setAuthFailed(false);
      } else {
        setAuthFailed(true);
      }
    } finally {
      isPromptingRef.current = false;
    }
  }, []);

  const checkAndLock = useCallback(async () => {
    const ok = await canUseBiometric();
    if (ok) {
      setTimeout(tryBiometric, 350);
    } else {
      await logout();
    }
  }, [canUseBiometric, tryBiometric, logout]);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Synchronously lock before first paint — prevents dashboard flash
  useLayoutEffect(() => {
    if (!isLoading && isAuthenticated && sessionWasRestored && !didInitRef.current) {
      setLocked(true);
    }
  }, [isLoading, isAuthenticated, sessionWasRestored]);

  // Reset gate when session is cleared
  useEffect(() => {
    if (!isAuthenticated) {
      setLocked(false);
      setAuthFailed(false);
      didInitRef.current = false;
    } else {
      authTimeRef.current = Date.now();
    }
  }, [isAuthenticated]);

  // Cold start: session was restored from storage → always gate first
  useEffect(() => {
    if (!isLoading && isAuthenticated && sessionWasRestored && !didInitRef.current) {
      didInitRef.current = true;
      checkAndLock();
    }
  }, [isLoading, isAuthenticated, sessionWasRestored, checkAndLock]);

  // Background return: gate after >3s away
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        bgTimeRef.current = Date.now();
      } else if (next === 'active' && isAuthenticated) {
        if (isPromptingRef.current) return;
        const elapsed = bgTimeRef.current ? Date.now() - bgTimeRef.current : 0;
        const sinceAuth = Date.now() - authTimeRef.current;
        const sinceUnlock = Date.now() - justUnlockRef.current;
        if (elapsed > 3000 && sinceAuth > 5000 && sinceUnlock > 3000) {
          setLocked(true);
          checkAndLock();
        }
      }
    });
    return () => sub.remove();
  }, [isAuthenticated, checkAndLock]);

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      {children}
      {locked && (
        <View style={[bioS.overlay, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          <View style={bioS.iconWrap}>
            <Ionicons name="shield-checkmark" size={44} color="#F9F6ED" />
          </View>
          <Text style={bioS.title}>HORUS</Text>
          <Text style={bioS.subtitle}>Tu sesión está protegida</Text>
          {authFailed && <Text style={bioS.error}>No se pudo verificar la identidad</Text>}
          <TouchableOpacity style={bioS.btn} onPress={tryBiometric} activeOpacity={0.85}>
            <Ionicons name="finger-print" size={20} color="#3D2C00" />
            <Text style={bioS.btnText}>Verificar identidad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={bioS.secondaryBtn} onPress={softLogout} activeOpacity={0.75}>
            <Text style={bioS.secondaryText}>Usar correo y contraseña</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const bioS = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1512',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: '#2A2520',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#F9F6ED', letterSpacing: 4 },
  subtitle: { fontSize: 14, color: '#A09080', marginBottom: 24 },
  error: { fontSize: 13, color: '#FF6B6B', marginBottom: 4, textAlign: 'center' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FAD957', borderRadius: 20,
    paddingHorizontal: 32, paddingVertical: 16, width: '100%',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#3D2C00' },
  secondaryBtn: { marginTop: 4 },
  secondaryText: { fontSize: 14, color: '#A09080' },
});

function RouteGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLogin = segments[0] === 'login';
    const inRegister = segments[0] === 'register';
    // @ts-ignore
    const inIndex = segments.length === 0 || segments[0] === 'index';

    if (!isAuthenticated && (inAuthGroup || inIndex)) {
      router.replace('/login');
    } else if (isAuthenticated && (inLogin || inRegister || inIndex)) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

function NotificationHandler() {
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Handle cold-start tap (app was closed)
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return;
      handleNotificationData(response.notification.request.content.data, router);
    });

    // Handle tap while app is running/backgrounded
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationData(response.notification.request.content.data, router);
    });

    return () => { responseListener.current?.remove(); };
  }, []);

  return null;
}

function handleNotificationData(data: Record<string, unknown> | undefined, router: ReturnType<typeof useRouter>) {
  if (!data?.type) return;
  if (data.type === 'health_report') {
    notificationStore.set('health_report');
    router.push('/(tabs)/assistant');
  } else if (data.type === 'device_linked' || data.type === 'profile_scanned') {
    router.push('/(tabs)/monitor');
  }
}

function RootNavigator() {
  const { isDark } = useTheme();
  return (
    <BiometricGate>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RouteGuard />
      <NotificationHandler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="emergency" />
      </Stack>
    </BiometricGate>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#F9F6ED' }} />;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}