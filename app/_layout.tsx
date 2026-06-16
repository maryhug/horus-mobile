import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { notificationStore } from '../stores/notificationStore';

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
      <>
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
      </>
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