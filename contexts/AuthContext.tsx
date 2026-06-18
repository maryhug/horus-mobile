import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { getItem, setItem, deleteItem } from '../utils/storage';
import { router } from 'expo-router';
import { apiClient, setUnauthorizedHandler, setAuthToken, getErrorMessage } from '../services/api';
import type { User, LoginResponse, ProfileData, RegisterPayload, RegisterResponse } from '../types/api';
import { hydrateAssistant } from '../hooks/useAssistant';
import { hydrateVoice } from '../hooks/useVoice';
import { hydrateLanguage } from './LanguageContext';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function syncRemotePreferences() {
  try {
    const { data } = await apiClient.get<{ language?: string; voiceId?: string; assistantId?: string }>('/profile/preferences');
    if (data.language)    hydrateLanguage(data.language);
    if (data.voiceId)     hydrateVoice(data.voiceId);
    if (data.assistantId) hydrateAssistant(data.assistantId);
  } catch {
    // Silently ignore — local cache will be used
  }
}

async function registerPhonePushToken() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'HORUS',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
      });
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    const { status } = existing === 'granted'
      ? { status: existing }
      : await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await apiClient.post('/profile/push-token', { pushToken: tokenData.data });
    console.log('[Push] phone token registered');
  } catch (err) {
    console.warn('[Push] failed to register phone token:', err);
  }
}

const USER_KEY = 'horus_user';
const SESSION_KEY = 'horus_session';
const TOKEN_KEY = 'horus_token';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionWasRestored: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  reAuthenticate: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  softLogout: () => void;
  updateUser: (partial: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  sessionWasRestored: false,
  login: async () => {},
  loginWithBiometric: async () => {},
  reAuthenticate: async () => {},
  register: async () => {},
  logout: async () => {},
  softLogout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionWasRestored, setSessionWasRestored] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const session = await getItem(SESSION_KEY);
        if (session === 'active') {
          const token = await getItem(TOKEN_KEY);
          if (token) setAuthToken(token);

          const raw = await getItem(USER_KEY);
          if (raw) {
            const parsedUser = JSON.parse(raw) as User;
            setUser(parsedUser);
            setSessionWasRestored(true);
            if (parsedUser.pushNotificationsEnabled !== false) {
              registerPhonePushToken();   // silently, non-blocking
            }
            syncRemotePreferences();    // silently, non-blocking
          }
        }
      } catch {
        // Ignore storage errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistUser = useCallback(async (u: User, token?: string) => {
    await setItem(USER_KEY, JSON.stringify(u));
    await setItem(SESSION_KEY, 'active');
    if (token) {
      await setItem(TOKEN_KEY, token);
      setAuthToken(token);
    }
    setUser(u);
  }, []);

  const clearSession = useCallback(async () => {
    await deleteItem(USER_KEY);
    await deleteItem(SESSION_KEY);
    await deleteItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
    setSessionWasRestored(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    let profile: User;
    if (data.user) {
      profile = data.user;
    } else {
      const { data: profileData } = await apiClient.get<ProfileData>('/profile');
      profile = profileData;
    }

    await persistUser(profile, data.accessToken);
    registerPhonePushToken();  // silently, non-blocking
    syncRemotePreferences();   // silently, non-blocking
    router.replace('/(tabs)/dashboard');
  }, [persistUser]);

  // Re-authenticate in-place (refreshes token, does NOT navigate or logout)
  const reAuthenticate = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    if (data.accessToken) {
      await setItem(TOKEN_KEY, data.accessToken);
      setAuthToken(data.accessToken);
    }
    if (data.user) {
      await setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
    }
  }, []);

  const loginWithBiometric = useCallback(async () => {
    const session = await getItem(SESSION_KEY);
    const token   = await getItem(TOKEN_KEY);
    if (session !== 'active' || !token) {
      throw new Error('No hay sesión guardada. Inicia sesión con correo y contraseña.');
    }
    setAuthToken(token);
    const raw = await getItem(USER_KEY);
    if (raw) {
      setUser(JSON.parse(raw) as User);
      registerPhonePushToken();
      syncRemotePreferences();
      router.replace('/(tabs)/dashboard');
      return;
    }
    // Fallback: fetch profile from server if user data was cleared
    const { data: profileData } = await apiClient.get<ProfileData>('/profile');
    await persistUser(profileData);
    registerPhonePushToken();
    syncRemotePreferences();
    router.replace('/(tabs)/dashboard');
  }, [persistUser]);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiClient.post<RegisterResponse>('/auth/register', payload);
    router.replace('/login?registered=1');
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors — clear local session regardless
    }
    await clearSession();
    router.replace('/login');
  }, [clearSession]);

  // Clears in-memory state only — keeps SecureStore intact so biometric login
  // remains available from the login screen on the next attempt.
  const softLogout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setSessionWasRestored(false);
    router.replace('/login');
  }, []);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearSession();
      router.replace('/login');
    });
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      sessionWasRestored,
      login,
      loginWithBiometric,
      reAuthenticate,
      register,
      logout,
      softLogout,
      updateUser,
    }),
    [user, isLoading, sessionWasRestored, login, loginWithBiometric, reAuthenticate, register, logout, softLogout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
