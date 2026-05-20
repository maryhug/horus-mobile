import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { getItem, setItem, deleteItem } from '../utils/storage';
import { router } from 'expo-router';
import { apiClient, setUnauthorizedHandler, setAuthToken, getErrorMessage } from '../services/api';
import type { User, LoginResponse, ProfileData, RegisterPayload, RegisterResponse } from '../types/api';

const USER_KEY = 'horus_user';
const SESSION_KEY = 'horus_session';
const TOKEN_KEY = 'horus_token';

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

  useEffect(() => {
    (async () => {
      try {
        const session = await getItem(SESSION_KEY);
        if (session === 'active') {
          const token = await getItem(TOKEN_KEY);
          if (token) setAuthToken(token);

          const raw = await getItem(USER_KEY);
          if (raw) setUser(JSON.parse(raw) as User);
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
