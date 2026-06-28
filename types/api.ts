// TODO: ajustar según la respuesta real de la API para cada endpoint

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nfcTagId?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  identificationNumber?: string;
  identificationType?: string;
  photoUrl?: string;
  phone?: string;
  location?: string;
  pushNotificationsEnabled?: boolean;
  userDisabledPush?: boolean;
}

// POST /api/auth/login — TODO: ajustar según la respuesta real de la API
export interface LoginResponse {
  user?: User;
  accessToken?: string;
  message?: string;
}

export interface HealthMetrics {
  heartRate: number | null;
  steps: number | null;
  calories: number | null;
  activityMinutes: number | null;
  battery: number | null;
  score: number | null;
  updatedAt: string | null;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'qr_scan' | 'health_alert' | 'info';
  read: boolean;
  timestamp: { _seconds: number; _nanoseconds: number } | string;
}

// GET /api/dashboard/info
export interface DashboardData {
  id: string;
  email: string;
  timestamp?: string;
  health: HealthMetrics | null;
  notifications: AppNotification[];
  hourlyActivity: number[]; // 24 values — steps delta per hour (Colombia time)
}

// GET /api/profile
export interface ProfileData extends User {}

// PUT /api/profile
export interface ProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  identificationNumber?: string;
  identificationType?: string;
}

// GET/POST /api/contacts
export interface Contact {
  id: string;
  name: string;
  relation?: string;
  phone: string;
}

export interface CreateContactPayload {
  name: string;
  phone: string;
  relation?: string;
}

// POST /api/chat — TODO: ajustar según la respuesta real de la API
export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  message?: string;
  response?: string;
  content?: string;
}

// POST /api/auth/register
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  user?: User;
  message?: string;
}

// POST /api/tts
export interface TtsRequest {
  text: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}
