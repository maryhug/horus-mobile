import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RouteGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLogin = segments[0] === 'login';
    const inIndex = segments.length === 0 || segments[0] === 'index';

    if (!isAuthenticated && (inAuthGroup || inIndex)) {
      router.replace('/login');
    } else if (isAuthenticated && (inLogin || inIndex)) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

function RootNavigator() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RouteGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="emergency" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
