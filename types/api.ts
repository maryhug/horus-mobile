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
}

// POST /api/auth/login — TODO: ajustar según la respuesta real de la API
export interface LoginResponse {
  user?: User;
  accessToken?: string;
  message?: string;
}

// GET /api/dashboard/info — TODO: ajustar según la respuesta real de la API
export interface DashboardData {
  id: string;
  email: string;
  timestamp?: string;
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

// POST /api/tts
export interface TtsRequest {
  text: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}
