import axios, { AxiosError } from 'axios';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
  },
  timeout: 15000,
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    const fieldErrors = data?.errors as Record<string, string> | undefined;
    if (fieldErrors) {
      const first = Object.values(fieldErrors)[0];
      if (first) return first;
    }
    const serverMsg =
      (data?.message as string) ?? (data?.error as string) ?? null;
    if (serverMsg) return serverMsg;
    if (!error.response) return 'Sin conexión. Verifica tu red.';
    if (error.response.status >= 500) return 'Error del servidor. Intenta más tarde.';
    if (error.response.status === 401) return 'Sesión expirada. Por favor inicia sesión de nuevo.';
    if (error.response.status === 403) return 'No tienes permiso para realizar esta acción.';
    if (error.response.status === 404) return 'Recurso no encontrado.';
  }
  return 'Ha ocurrido un error. Intenta de nuevo.';
}
