import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { apiClient, setUnauthorizedHandler, getErrorMessage } from '../services/api';
import type { User, LoginResponse, ProfileData, RegisterPayload, RegisterResponse } from '../types/api';

const USER_KEY = 'horus_user';
const SESSION_KEY = 'horus_session';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from SecureStore on mount
  useEffect(() => {
    (async () => {
      try {
        const session = await SecureStore.getItemAsync(SESSION_KEY);
        if (session === 'active') {
          const raw = await SecureStore.getItemAsync(USER_KEY);
          if (raw) setUser(JSON.parse(raw) as User);
        }
      } catch {
        // Ignore storage errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistUser = useCallback(async (u: User) => {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
    await SecureStore.setItemAsync(SESSION_KEY, 'active');
    setUser(u);
  }, []);

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // TODO: ajustar según la respuesta real de la API
    const { data } = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    // If login returns user directly, use it; otherwise fetch profile
    let profile: User;
    if (data.user) {
      profile = data.user;
    } else {
      const { data: profileData } = await apiClient.get<ProfileData>('/profile');
      profile = profileData;
    }

    await persistUser(profile);
    router.replace('/(tabs)/dashboard');
  }, [persistUser]);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiClient.post<RegisterResponse>('/auth/register', payload);
    // Backend doesn't establish a session on register — redirect to login
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

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Wire up global 401 handler
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
      login,
      register,
      logout,
      updateUser,
    }),
    [user, isLoading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
