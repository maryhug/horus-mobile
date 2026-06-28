import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getItem, setItem } from '../utils/storage';
import { apiClient } from '../services/api';

const LANG_KEY = 'horus_language';

export type Language = 'es' | 'en' | 'pt';

// ── Full translations interface ────────────────────────────────────────────
export interface T {
  // ── Common ───────────────────────────────────────────────────────────────
  cancel: string;
  save: string;
  confirm: string;
  select: string;
  back: string;
  noData: string;
  online: string;
  years: string;
  notProvided: string;
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  months: string[];
  // Gender labels
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  genderPreferNot: string;
  // ID type labels
  idTypeCC: string;
  idTypeCE: string;
  idTypePP: string;
  idTypeTI: string;
  idTypePPE: string;
  // Language names (for selector)
  langEs: string;
  langEn: string;
  langPt: string;

  // ── Login ─────────────────────────────────────────────────────────────────
  loginTitle: string;
  loginSubtitle: string;
  loginEmail: string;
  loginEmailPh: string;
  loginPassword: string;
  loginPasswordPh: string;
  loginForgot: string;
  loginBtn: string;
  loginNoAccount: string;
  loginSignUp: string;
  loginErrorRequired: string;
  loginSuccess: string;

  // ── Register ──────────────────────────────────────────────────────────────
  registerTitle: string;
  registerSubtitle: string;
  registerFirstName: string;
  registerLastName: string;
  registerEmail: string;
  registerPassword: string;
  registerConfirmPw: string;
  registerMedicalSection: string;
  registerDay: string;
  registerMonth: string;
  registerYear: string;
  registerGender: string;
  registerBloodType: string;
  registerIdType: string;
  registerIdNumber: string;
  registerIdNumberPh: string;
  registerBtn: string;
  registerHasAccount: string;
  registerSignIn: string;
  registerDob: string;
  registerTerms: string;
  registerErrorName: string;
  registerErrorEmail: string;
  registerErrorPassword: string;
  registerErrorMatch: string;
  registerErrorTerms: string;

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashLive: string;
  dashHelloIm: string;
  dashMetrics: string;
  dashWaitingSensor: string;
  dashDevice: string;
  dashBattery: string;
  dashLastSync: string;
  dashToday: string;
  dashNoData: string;
  dashActivity: string;
  dashNoDataSensor: string;
  dashQuickActions: string;
  dashQrId: string;
  dashAI: string;
  dashFiles: string;
  dashProfile: string;
  dashAlerts: string;
  dashAllGood: string;
  dashNoAlerts: string;

  // ── Assistant (chat) ──────────────────────────────────────────────────────
  chatSuggestion1: string;
  chatSuggestion2: string;
  chatSuggestion3: string;
  chatWelcomeSub: string;
  chatPlaceholder: string;
  chatOnline: string;
  chatCanned: string;
  chatHorusAI: string;

  // ── QR Médico ─────────────────────────────────────────────────────────────
  qrTitle: string;
  qrShare: string;
  qrShareTitle: string;
  qrPrivacyTitle: string;
  qrAge: string;
  qrBlood: string;
  qrAllergies: string;
  qrAllergiesDesc: string;
  qrMeds: string;
  qrMedsDesc: string;
  qrConditions: string;
  qrConditionsDesc: string;
  qrContacts: string;
  qrContactsDesc: string;
  qrNotes: string;
  qrNotesDesc: string;

  // ── Files ─────────────────────────────────────────────────────────────────
  filesTitle: string;
  filesStorage: string;
  filesUpload: string;
  filesNoFiles: string;
  filesDelete: string;
  filesShare: string;
  filesDeleteTitle: string;
  filesDeleteMsg: string;
  filesDeleteConfirm: string;

  // ── Profile ───────────────────────────────────────────────────────────────
  profileTitle: string;
  profileView: string;
  profileEdit: string;
  profilePersonal: string;
  profileMedical: string;
  profileId: string;
  profileName: string;
  profileLastName: string;
  profileEmail: string;
  profileBloodType: string;
  profileDob: string;
  profileGender: string;
  profileIdType: string;
  profileIdNumber: string;
  profileNfc: string;
  profileNotProvided: string;
  profileSave: string;
  profileClose: string;
  profileDay: string;
  profileMonth: string;
  profileYear: string;

  // ── Settings ──────────────────────────────────────────────────────────────
  settingsTitle: string;
  settingsAppearance: string;
  settingsTheme: string;
  settingsDark: string;
  settingsLight: string;
  settingsLanguage: string;
  settingsLanguageTitle: string;
  settingsAssistant: string;
  settingsAssistantSub: string;
  settingsNotifications: string;
  settingsPush: string;
  settingsPrivacy: string;
  settingsBiometric: string;
  settingsChangePassword: string;
  settingsDevice: string;
  settingsFirmware: string;
  settingsGenerateCode: string;
  settingsDanger: string;
  settingsDeleteAccount: string;
  settingsDeleteTitle: string;
  settingsDeleteSub: string;
  settingsDeleteConfirm: string;
  settingsCancel: string;
  settingsChangePasswordSoon: string;
  settingsLinkSmartwatch: string;
  settingsSmartwatchDesc: string;
  settingsCodeExpires: string;
  settingsNewCode: string;
  settingsGenerateCodeBtn: string;
  settingsConfirmAssistant: string;
  settingsConfirmAssistantSub: string;
  settingsConfirmAssistantSub2: string;
  settingsChangeBtn: string;

  // ── Dashboard metrics ─────────────────────────────────────────────────────
  dashMetricHeart: string;
  dashMetricSteps: string;
  dashMetricCalories: string;
  dashMetricActivity: string;
  dashMetricStepsUnit: string;

  // ── QR additional ─────────────────────────────────────────────────────────
  qrSubtitle: string;
  qrSaved: string;
  qrSaveBtn: string;
  qrCompress: string;
  qrGenerate: string;
  qrWatchTitle: string;
  qrWatchStep1: string;
  qrWatchStep2: string;
  qrWatchStep3: string;
  qrWatchStep4: string;

  // ── Files additional ──────────────────────────────────────────────────────
  filesSubtitle: string;
  filesRecentTitle: string;
  filesUploadSub: string;
  filesUploadFirst: string;
  filesOf: string;

  // ── Profile additional ────────────────────────────────────────────────────
  profileHorusDevice: string;
  profileLogout: string;
  profileLogoutTitle: string;
  profileLogoutSub: string;
  profileEditTitle: string;
  profileViewTitle: string;
  profileFullName: string;
  profileDocType: string;
  profileDocNumber: string;
  profileNfcId: string;
  profileRequiredFields: string;
  profileRequiredMsg: string;
  profileSaveError: string;

  // ── Monitor ───────────────────────────────────────────────────────────────
  monitorTitle: string;
  monitorSubtitle: string;
  monitorLiveLocation: string;
  monitorWaitingGps: string;
  monitorNfcTitle: string;
  monitorNfcSub: string;
  monitorActive: string;
  monitorProtocol: string;
  monitorFrequency: string;
  monitorRange: string;
  monitorTagId: string;
  monitorRecentNotifs: string;
  monitorNoNotifs: string;
  monitorNoNotifsDesc: string;
  monitorActiveProducts: string;
  monitorDeactivate: string;
  monitorActivateDevice: string;
  monitorDeactivateBtn: string;
  monitorActivateBtn: string;
  monitorActivateCardTitle: string;
  monitorActivateCardDesc: string;
  monitorActivateCardBtn: string;
  nfcModalScanningTitle: string;
  nfcModalScanningDesc: string;
  nfcAlertSuccess: string;
  nfcAlertSuccessDesc: string;
  // ── Navbar tabs ───────────────────────────────────────────────────────────
  navHome: string;
  navMonitor: string;
  navId: string;
  navAi: string;
  navFiles: string;
  navProfile: string;
}

// ── Spanish ────────────────────────────────────────────────────────────────
const es: T = {
  // Common
  cancel: 'Cancelar',
  save: 'Guardar',
  confirm: 'Confirmar',
  select: 'Seleccionar',
  back: 'Volver',
  noData: 'sin datos',
  online: 'En línea',
  years: 'años',
  notProvided: 'No proporcionado',
  greetingMorning: 'Buenos días',
  greetingAfternoon: 'Buenas tardes',
  greetingEvening: 'Buenas noches',
  months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  genderMale: 'Masculino',
  genderFemale: 'Femenino',
  genderOther: 'Otro',
  genderPreferNot: 'Prefiero no decir',
  idTypeCC: 'Cédula de ciudadanía',
  idTypeCE: 'Cédula de extranjería',
  idTypePP: 'Pasaporte',
  idTypeTI: 'Tarjeta de identidad',
  idTypePPE: 'Permiso de permanencia',
  langEs: 'Español',
  langEn: 'English',
  langPt: 'Português',

  // Login
  loginTitle: 'Bienvenido\nde vuelta',
  loginSubtitle: 'Monitorea tu salud y seguridad con tu manilla Horus.',
  loginEmail: 'Correo',
  loginEmailPh: 'tu@correo.com',
  loginPassword: 'Contraseña',
  loginPasswordPh: '••••••••',
  loginForgot: '¿Olvidaste tu contraseña?',
  loginBtn: 'Iniciar sesión',
  loginNoAccount: '¿No tienes cuenta?',
  loginSignUp: 'Regístrate',
  loginErrorRequired: 'Ingresa tu correo y contraseña.',
  loginSuccess: '¡Cuenta creada! Ya puedes iniciar sesión.',

  // Register
  registerTitle: 'Crear cuenta',
  registerSubtitle: 'Únete a Horus y monitorea tu salud.',
  registerFirstName: 'Nombre',
  registerLastName: 'Apellido',
  registerEmail: 'Correo',
  registerPassword: 'Contraseña',
  registerConfirmPw: 'Confirmar contraseña',
  registerMedicalSection: 'Datos médicos (opcional)',
  registerDay: 'Día',
  registerMonth: 'Mes',
  registerYear: 'Año',
  registerGender: 'Género',
  registerBloodType: 'Tipo de sangre',
  registerIdType: 'Tipo de identificación',
  registerIdNumber: 'Número de identificación',
  registerIdNumberPh: 'Ej: 1234567890',
  registerBtn: 'Crear cuenta',
  registerHasAccount: '¿Ya tienes cuenta?',
  registerSignIn: 'Inicia sesión',
  registerDob: 'Fecha de nacimiento',
  registerTerms: 'Acepto los Términos y la Política de privacidad de Horus.',
  registerErrorName: 'Ingresa tu nombre y apellido.',
  registerErrorEmail: 'Ingresa un correo válido.',
  registerErrorPassword: 'La contraseña debe tener al menos 6 caracteres.',
  registerErrorMatch: 'Las contraseñas no coinciden.',
  registerErrorTerms: 'Debes aceptar los términos.',

  // Dashboard
  dashLive: 'En vivo',
  dashHelloIm: 'Hola, soy',
  dashMetrics: 'Tus métricas',
  dashWaitingSensor: 'Esperando sensor',
  dashDevice: 'Dispositivo',
  dashBattery: 'Batería',
  dashLastSync: 'Última sync',
  dashToday: 'hoy',
  dashNoData: 'sin datos',
  dashActivity: 'Actividad 24h',
  dashNoDataSensor: 'Sin datos',
  dashQuickActions: 'Acciones rápidas',
  dashQrId: 'ID Médico',
  dashAI: 'IA',
  dashFiles: 'Archivos',
  dashProfile: 'Perfil',
  dashAlerts: 'Alertas recientes',
  dashAllGood: 'Todo en orden',
  dashNoAlerts: 'No hay alertas del sistema',

  // Assistant
  chatSuggestion1: '¿Cómo va mi actividad esta semana?',
  chatSuggestion2: 'Resumen de alertas de seguridad',
  chatSuggestion3: 'Estado de la batería y sincronización',
  chatWelcomeSub: 'Pregúntame sobre tu actividad, alertas o el estado de tu dispositivo.',
  chatPlaceholder: 'Escribe un mensaje…',
  chatOnline: 'En línea',
  chatCanned: 'Aún no recibo datos del sensor de tu manilla, así que no puedo mostrar métricas reales todavía. En cuanto se sincronice, podré darte un resumen detallado de tu actividad, alertas y batería.',
  chatHorusAI: 'Horus AI',

  // QR Médico
  qrTitle: 'ID Médico',
  qrShare: 'Compartir QR',
  qrShareTitle: 'Mi ID Médico - Horus',
  qrPrivacyTitle: 'Privacidad del QR',
  qrAge: 'años',
  qrBlood: 'Tipo de sangre',
  qrAllergies: 'Alergias',
  qrAllergiesDesc: 'Severidad y reacción',
  qrMeds: 'Medicamentos actuales',
  qrMedsDesc: 'Dosis y frecuencia',
  qrConditions: 'Condiciones crónicas',
  qrConditionsDesc: 'Solo activas',
  qrContacts: 'Contactos de emergencia',
  qrContactsDesc: 'Nombre y teléfono',
  qrNotes: 'Notas médicas',
  qrNotesDesc: 'Información adicional',

  // Files
  filesTitle: 'Mis archivos',
  filesStorage: 'de almacenamiento usado',
  filesUpload: 'Subir archivo',
  filesNoFiles: 'No hay archivos',
  filesDelete: 'Eliminar',
  filesShare: 'Compartir',
  filesDeleteTitle: '¿Eliminar archivo?',
  filesDeleteMsg: '¿Estás seguro de que deseas eliminar este archivo?',
  filesDeleteConfirm: 'Eliminar',

  // Profile
  profileTitle: 'Mi perfil',
  profileView: 'Ver perfil',
  profileEdit: 'Editar información',
  profilePersonal: 'Datos personales',
  profileMedical: 'Datos médicos',
  profileId: 'Identificación',
  profileName: 'Nombre',
  profileLastName: 'Apellido',
  profileEmail: 'Correo',
  profileBloodType: 'Tipo de sangre',
  profileDob: 'Fecha de nacimiento',
  profileGender: 'Género',
  profileIdType: 'Tipo de ID',
  profileIdNumber: 'Número de ID',
  profileNfc: 'NFC',
  profileNotProvided: 'No proporcionado',
  profileSave: 'Guardar cambios',
  profileClose: 'Cerrar',
  profileDay: 'Día',
  profileMonth: 'Mes',
  profileYear: 'Año',

  // Settings
  settingsTitle: 'Configuración',
  settingsAppearance: 'Apariencia',
  settingsTheme: 'Tema',
  settingsDark: 'Oscuro',
  settingsLight: 'Claro',
  settingsLanguage: 'Idioma',
  settingsLanguageTitle: 'Idioma',
  settingsAssistant: 'Tu asistente',
  settingsAssistantSub: 'Elige tu compañero de salud. Aparecerá en el inicio y en el chat con la IA.',
  settingsNotifications: 'Notificaciones',
  settingsPush: 'Push notifications',
  settingsPrivacy: 'Privacidad y seguridad',
  settingsBiometric: 'Autenticación biométrica',
  settingsChangePassword: 'Cambiar contraseña',
  settingsDevice: 'Dispositivo',
  settingsFirmware: 'Firmware',
  settingsGenerateCode: 'Generar código de smartwatch',
  settingsDanger: 'Zona de peligro',
  settingsDeleteAccount: 'Eliminar cuenta',
  settingsDeleteTitle: '¿Eliminar cuenta?',
  settingsDeleteSub: 'Esta acción es irreversible. Se perderán todos tus datos.',
  settingsDeleteConfirm: 'Eliminar',
  settingsCancel: 'Cancelar',
  settingsChangePasswordSoon: 'Próximamente disponible.',
  settingsLinkSmartwatch: 'Vincular smartwatch',
  settingsSmartwatchDesc: 'Ingresa este código en tu smartwatch Horus para vincularlo con tu cuenta. Expira en 2 minutos.',
  settingsCodeExpires: 'Expira en',
  settingsNewCode: 'Nuevo código',
  settingsGenerateCodeBtn: 'Generar código',
  settingsConfirmAssistant: '¿Cambiar asistente?',
  settingsConfirmAssistantSub: '¿Estás seguro de que quieres cambiar a',
  settingsConfirmAssistantSub2: 'como tu compañero de salud?',
  settingsChangeBtn: 'Cambiar',

  // Dashboard metrics
  dashMetricHeart: 'Frecuencia cardíaca',
  dashMetricSteps: 'Pasos',
  dashMetricCalories: 'Calorías',
  dashMetricActivity: 'Actividad',
  dashMetricStepsUnit: 'pasos',

  // QR additional
  qrSubtitle: 'Escaneable en emergencias, sin app',
  qrSaved: 'Guardado',
  qrSaveBtn: 'Guardar',
  qrCompress: 'Comprimir QR',
  qrGenerate: 'Generar QR',
  qrWatchTitle: 'Ponlo en tu reloj',
  qrWatchStep1: 'Guarda el QR como imagen en tu teléfono',
  qrWatchStep2: 'Abre la app del smartwatch Horus Watch X',
  qrWatchStep3: 'Selecciona Fondo de pantalla y elige el QR',
  qrWatchStep4: 'Cualquier persona podrá escanearlo en una emergencia',

  // Files additional
  filesSubtitle: 'Documentos y reportes médicos',
  filesRecentTitle: 'Archivos recientes',
  filesUploadSub: 'PDF, CSV, JSON, PNG · máx. 25 MB',
  filesUploadFirst: 'Sube tu primer documento',
  filesOf: 'de',

  // Profile additional
  profileHorusDevice: 'Mi manilla Horus',
  profileLogout: 'Cerrar sesión',
  profileLogoutTitle: '¿Cerrar sesión?',
  profileLogoutSub: 'Tendrás que iniciar sesión de nuevo.',
  profileEditTitle: 'Editar perfil',
  profileViewTitle: 'Información del perfil',
  profileFullName: 'Nombre completo',
  profileDocType: 'Tipo de documento',
  profileDocNumber: 'Número de documento',
  profileNfcId: 'ID del tag NFC',
  profileRequiredFields: 'Campos requeridos',
  profileRequiredMsg: 'Nombre y apellido no pueden estar vacíos.',
  profileSaveError: 'Error al guardar',

  // Monitor
  monitorTitle: 'Monitor',
  monitorSubtitle: 'Ubicación y conectividad en tiempo real',
  monitorLiveLocation: 'Ubicación en vivo',
  monitorWaitingGps: 'Esperando coordenadas GPS del dispositivo',
  monitorNfcTitle: 'Estado NFC',
  monitorNfcSub: 'Tag registrado y activo',
  monitorActive: 'Activo',
  monitorProtocol: 'Protocolo',
  monitorFrequency: 'Frecuencia',
  monitorRange: 'Rango',
  monitorTagId: 'ID del tag',
  monitorRecentNotifs: 'Notificaciones recientes',
  monitorNoNotifs: 'Sin notificaciones',
  monitorNoNotifsDesc: 'No hay alertas del dispositivo',
  monitorActiveProducts: 'Productos activos',
  monitorDeactivate: '¿Deseas desactivar este dispositivo?',
  monitorActivateDevice: '¿Deseas activar este dispositivo?',
  monitorDeactivateBtn: 'Desactivar',
  monitorActivateBtn: 'Activar',
  monitorActivateCardTitle: 'Vincular Tarjeta Horus',
  monitorActivateCardDesc: 'Activa tu tarjeta de emergencia acercándola al celular',
  monitorActivateCardBtn: 'Vincular',
  nfcModalScanningTitle: 'Listo para escanear',
  nfcModalScanningDesc: 'Acerca tu tarjeta Horus a la parte posterior de tu teléfono.',
  nfcAlertSuccess: '¡Vinculado y Activo!',
  nfcAlertSuccessDesc: 'La tarjeta NFC ha sido vinculada correctamente a tu cuenta.',
  // Navbar
  navHome: 'Inicio',
  navMonitor: 'Monitor',
  navId: 'ID',
  navAi: 'IA',
  navFiles: 'Archivos',
  navProfile: 'Perfil',
};

// ── English ────────────────────────────────────────────────────────────────
const en: T = {
  // Common
  cancel: 'Cancel',
  save: 'Save',
  confirm: 'Confirm',
  select: 'Select',
  back: 'Back',
  noData: 'no data',
  online: 'Online',
  years: 'years',
  notProvided: 'Not provided',
  greetingMorning: 'Good morning',
  greetingAfternoon: 'Good afternoon',
  greetingEvening: 'Good evening',
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  genderMale: 'Male',
  genderFemale: 'Female',
  genderOther: 'Other',
  genderPreferNot: 'Prefer not to say',
  idTypeCC: 'National ID card',
  idTypeCE: 'Foreign ID card',
  idTypePP: 'Passport',
  idTypeTI: 'Identity card',
  idTypePPE: 'Temporary residence permit',
  langEs: 'Español',
  langEn: 'English',
  langPt: 'Português',

  // Login
  loginTitle: 'Welcome\nback',
  loginSubtitle: 'Monitor your health and safety with your Horus bracelet.',
  loginEmail: 'Email',
  loginEmailPh: 'your@email.com',
  loginPassword: 'Password',
  loginPasswordPh: '••••••••',
  loginForgot: 'Forgot your password?',
  loginBtn: 'Sign in',
  loginNoAccount: "Don't have an account?",
  loginSignUp: 'Sign up',
  loginErrorRequired: 'Enter your email and password.',
  loginSuccess: 'Account created! You can now sign in.',

  // Register
  registerTitle: 'Create account',
  registerSubtitle: 'Join Horus and monitor your health.',
  registerFirstName: 'First name',
  registerLastName: 'Last name',
  registerEmail: 'Email',
  registerPassword: 'Password',
  registerConfirmPw: 'Confirm password',
  registerMedicalSection: 'Medical data (optional)',
  registerDay: 'Day',
  registerMonth: 'Month',
  registerYear: 'Year',
  registerGender: 'Gender',
  registerBloodType: 'Blood type',
  registerIdType: 'ID type',
  registerIdNumber: 'ID number',
  registerIdNumberPh: 'e.g. 1234567890',
  registerBtn: 'Create account',
  registerHasAccount: 'Already have an account?',
  registerSignIn: 'Sign in',
  registerDob: 'Date of birth',
  registerTerms: 'I accept the Horus Terms and Privacy Policy.',
  registerErrorName: 'Enter your first and last name.',
  registerErrorEmail: 'Enter a valid email address.',
  registerErrorPassword: 'Password must be at least 6 characters.',
  registerErrorMatch: 'Passwords do not match.',
  registerErrorTerms: 'You must accept the terms.',

  // Dashboard
  dashLive: 'Live',
  dashHelloIm: "Hi, I'm",
  dashMetrics: 'Your metrics',
  dashWaitingSensor: 'Waiting for sensor',
  dashDevice: 'Device',
  dashBattery: 'Battery',
  dashLastSync: 'Last sync',
  dashToday: 'today',
  dashNoData: 'no data',
  dashActivity: 'Activity 24h',
  dashNoDataSensor: 'No data',
  dashQuickActions: 'Quick actions',
  dashQrId: 'Medical ID',
  dashAI: 'AI',
  dashFiles: 'Files',
  dashProfile: 'Profile',
  dashAlerts: 'Recent alerts',
  dashAllGood: 'All clear',
  dashNoAlerts: 'No system alerts',

  // Assistant
  chatSuggestion1: 'How is my activity this week?',
  chatSuggestion2: 'Security alerts summary',
  chatSuggestion3: 'Battery and sync status',
  chatWelcomeSub: 'Ask me about your activity, alerts or device status.',
  chatPlaceholder: 'Type a message…',
  chatOnline: 'Online',
  chatCanned: "I'm not yet receiving data from your bracelet sensor, so I can't show real metrics yet. Once it syncs, I'll give you a detailed summary of your activity, alerts and battery.",
  chatHorusAI: 'Horus AI',

  // QR Médico
  qrTitle: 'Medical ID',
  qrShare: 'Share QR',
  qrShareTitle: 'My Medical ID - Horus',
  qrPrivacyTitle: 'QR Privacy',
  qrAge: 'years',
  qrBlood: 'Blood type',
  qrAllergies: 'Allergies',
  qrAllergiesDesc: 'Severity and reaction',
  qrMeds: 'Current medications',
  qrMedsDesc: 'Dosage and frequency',
  qrConditions: 'Chronic conditions',
  qrConditionsDesc: 'Active only',
  qrContacts: 'Emergency contacts',
  qrContactsDesc: 'Name and phone',
  qrNotes: 'Medical notes',
  qrNotesDesc: 'Additional information',

  // Files
  filesTitle: 'My files',
  filesStorage: 'storage used',
  filesUpload: 'Upload file',
  filesNoFiles: 'No files',
  filesDelete: 'Delete',
  filesShare: 'Share',
  filesDeleteTitle: 'Delete file?',
  filesDeleteMsg: 'Are you sure you want to delete this file?',
  filesDeleteConfirm: 'Delete',

  // Profile
  profileTitle: 'My profile',
  profileView: 'View profile',
  profileEdit: 'Edit information',
  profilePersonal: 'Personal data',
  profileMedical: 'Medical data',
  profileId: 'Identification',
  profileName: 'First name',
  profileLastName: 'Last name',
  profileEmail: 'Email',
  profileBloodType: 'Blood type',
  profileDob: 'Date of birth',
  profileGender: 'Gender',
  profileIdType: 'ID type',
  profileIdNumber: 'ID number',
  profileNfc: 'NFC',
  profileNotProvided: 'Not provided',
  profileSave: 'Save changes',
  profileClose: 'Close',
  profileDay: 'Day',
  profileMonth: 'Month',
  profileYear: 'Year',

  // Settings
  settingsTitle: 'Settings',
  settingsAppearance: 'Appearance',
  settingsTheme: 'Theme',
  settingsDark: 'Dark',
  settingsLight: 'Light',
  settingsLanguage: 'Language',
  settingsLanguageTitle: 'Language',
  settingsAssistant: 'Your assistant',
  settingsAssistantSub: 'Choose your health companion. It will appear on the home screen and in the AI chat.',
  settingsNotifications: 'Notifications',
  settingsPush: 'Push notifications',
  settingsPrivacy: 'Privacy & security',
  settingsBiometric: 'Biometric authentication',
  settingsChangePassword: 'Change password',
  settingsDevice: 'Device',
  settingsFirmware: 'Firmware',
  settingsGenerateCode: 'Generate smartwatch code',
  settingsDanger: 'Danger zone',
  settingsDeleteAccount: 'Delete account',
  settingsDeleteTitle: 'Delete account?',
  settingsDeleteSub: 'This action is irreversible. All your data will be lost.',
  settingsDeleteConfirm: 'Delete',
  settingsCancel: 'Cancel',
  settingsChangePasswordSoon: 'Coming soon.',
  settingsLinkSmartwatch: 'Link smartwatch',
  settingsSmartwatchDesc: 'Enter this code on your Horus smartwatch to link it to your account. Expires in 2 minutes.',
  settingsCodeExpires: 'Expires in',
  settingsNewCode: 'New code',
  settingsGenerateCodeBtn: 'Generate code',
  settingsConfirmAssistant: 'Change assistant?',
  settingsConfirmAssistantSub: 'Are you sure you want to change to',
  settingsConfirmAssistantSub2: 'as your health companion?',
  settingsChangeBtn: 'Change',

  // Dashboard metrics
  dashMetricHeart: 'Heart rate',
  dashMetricSteps: 'Steps',
  dashMetricCalories: 'Calories',
  dashMetricActivity: 'Activity',
  dashMetricStepsUnit: 'steps',

  // QR additional
  qrSubtitle: 'Scannable in emergencies, no app needed',
  qrSaved: 'Saved',
  qrSaveBtn: 'Save',
  qrCompress: 'Collapse QR',
  qrGenerate: 'Generate QR',
  qrWatchTitle: 'Put it on your watch',
  qrWatchStep1: 'Save the QR as an image on your phone',
  qrWatchStep2: 'Open the Horus Watch X smartwatch app',
  qrWatchStep3: 'Select Wallpaper and choose the QR',
  qrWatchStep4: 'Anyone can scan it in an emergency',

  // Files additional
  filesSubtitle: 'Documents and medical reports',
  filesRecentTitle: 'Recent files',
  filesUploadSub: 'PDF, CSV, JSON, PNG · max. 25 MB',
  filesUploadFirst: 'Upload your first document',
  filesOf: 'of',

  // Profile additional
  profileHorusDevice: 'My Horus bracelet',
  profileLogout: 'Log out',
  profileLogoutTitle: 'Log out?',
  profileLogoutSub: 'You will need to sign in again.',
  profileEditTitle: 'Edit profile',
  profileViewTitle: 'Profile information',
  profileFullName: 'Full name',
  profileDocType: 'Document type',
  profileDocNumber: 'Document number',
  profileNfcId: 'NFC tag ID',
  profileRequiredFields: 'Required fields',
  profileRequiredMsg: 'First and last name cannot be empty.',
  profileSaveError: 'Save error',

  // Monitor
  monitorTitle: 'Monitor',
  monitorSubtitle: 'Real-time location and connectivity',
  monitorLiveLocation: 'Live location',
  monitorWaitingGps: 'Waiting for GPS coordinates from device',
  monitorNfcTitle: 'NFC Status',
  monitorNfcSub: 'Tag registered and active',
  monitorActive: 'Active',
  monitorProtocol: 'Protocol',
  monitorFrequency: 'Frequency',
  monitorRange: 'Range',
  monitorTagId: 'Tag ID',
  monitorRecentNotifs: 'Recent notifications',
  monitorNoNotifs: 'No notifications',
  monitorNoNotifsDesc: 'No device alerts',
  monitorActiveProducts: 'Active products',
  monitorDeactivate: 'Do you want to deactivate this device?',
  monitorActivateDevice: 'Do you want to activate this device?',
  monitorDeactivateBtn: 'Deactivate',
  monitorActivateBtn: 'Activate',
  monitorActivateCardTitle: 'Link Horus Card',
  monitorActivateCardDesc: 'Activate your emergency card by bringing it close to your phone',
  monitorActivateCardBtn: 'Link',
  nfcModalScanningTitle: 'Ready to scan',
  nfcModalScanningDesc: 'Hold your Horus card near the back of your phone.',
  nfcAlertSuccess: 'Linked and Active!',
  nfcAlertSuccessDesc: 'The NFC card has been successfully linked to your account.',
  // Navbar
  navHome: 'Home',
  navMonitor: 'Monitor',
  navId: 'ID',
  navAi: 'AI',
  navFiles: 'Files',
  navProfile: 'Profile',
};

// ── Portuguese (Brazilian) ─────────────────────────────────────────────────
const pt: T = {
  // Common
  cancel: 'Cancelar',
  save: 'Salvar',
  confirm: 'Confirmar',
  select: 'Selecionar',
  back: 'Voltar',
  noData: 'sem dados',
  online: 'Online',
  years: 'anos',
  notProvided: 'Não informado',
  greetingMorning: 'Bom dia',
  greetingAfternoon: 'Boa tarde',
  greetingEvening: 'Boa noite',
  months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  genderMale: 'Masculino',
  genderFemale: 'Feminino',
  genderOther: 'Outro',
  genderPreferNot: 'Prefiro não dizer',
  idTypeCC: 'CPF',
  idTypeCE: 'RNE',
  idTypePP: 'Passaporte',
  idTypeTI: 'RG',
  idTypePPE: 'Autorização de residência temporária',
  langEs: 'Español',
  langEn: 'English',
  langPt: 'Português',

  // Login
  loginTitle: 'Bem-vindo\nde volta',
  loginSubtitle: 'Monitore sua saúde e segurança com sua pulseira Horus.',
  loginEmail: 'E-mail',
  loginEmailPh: 'seu@email.com',
  loginPassword: 'Senha',
  loginPasswordPh: '••••••••',
  loginForgot: 'Esqueceu sua senha?',
  loginBtn: 'Entrar',
  loginNoAccount: 'Não tem uma conta?',
  loginSignUp: 'Cadastre-se',
  loginErrorRequired: 'Digite seu e-mail e senha.',
  loginSuccess: 'Conta criada! Você já pode fazer login.',

  // Register
  registerTitle: 'Criar conta',
  registerSubtitle: 'Junte-se ao Horus e monitore sua saúde.',
  registerFirstName: 'Nome',
  registerLastName: 'Sobrenome',
  registerEmail: 'E-mail',
  registerPassword: 'Senha',
  registerConfirmPw: 'Confirmar senha',
  registerMedicalSection: 'Dados médicos (opcional)',
  registerDay: 'Dia',
  registerMonth: 'Mês',
  registerYear: 'Ano',
  registerGender: 'Gênero',
  registerBloodType: 'Tipo sanguíneo',
  registerIdType: 'Tipo de documento',
  registerIdNumber: 'Número do documento',
  registerIdNumberPh: 'Ex.: 1234567890',
  registerBtn: 'Criar conta',
  registerHasAccount: 'Já tem uma conta?',
  registerSignIn: 'Entrar',
  registerDob: 'Data de nascimento',
  registerTerms: 'Aceito os Termos e a Política de Privacidade do Horus.',
  registerErrorName: 'Digite seu nome e sobrenome.',
  registerErrorEmail: 'Digite um e-mail válido.',
  registerErrorPassword: 'A senha deve ter pelo menos 6 caracteres.',
  registerErrorMatch: 'As senhas não coincidem.',
  registerErrorTerms: 'Você deve aceitar os termos.',

  // Dashboard
  dashLive: 'Ao vivo',
  dashHelloIm: 'Olá, sou',
  dashMetrics: 'Suas métricas',
  dashWaitingSensor: 'Aguardando sensor',
  dashDevice: 'Dispositivo',
  dashBattery: 'Bateria',
  dashLastSync: 'Última sinc.',
  dashToday: 'hoje',
  dashNoData: 'sem dados',
  dashActivity: 'Atividade 24h',
  dashNoDataSensor: 'Sem dados',
  dashQuickActions: 'Ações rápidas',
  dashQrId: 'ID Médico',
  dashAI: 'IA',
  dashFiles: 'Arquivos',
  dashProfile: 'Perfil',
  dashAlerts: 'Alertas recentes',
  dashAllGood: 'Tudo em ordem',
  dashNoAlerts: 'Sem alertas do sistema',

  // Assistant
  chatSuggestion1: 'Como está minha atividade esta semana?',
  chatSuggestion2: 'Resumo de alertas de segurança',
  chatSuggestion3: 'Status da bateria e sincronização',
  chatWelcomeSub: 'Pergunte-me sobre sua atividade, alertas ou status do dispositivo.',
  chatPlaceholder: 'Digite uma mensagem…',
  chatOnline: 'Online',
  chatCanned: 'Ainda não estou recebendo dados do sensor da sua pulseira, então não posso mostrar métricas reais ainda. Assim que sincronizar, darei um resumo detalhado da sua atividade, alertas e bateria.',
  chatHorusAI: 'Horus AI',

  // QR Médico
  qrTitle: 'ID Médico',
  qrShare: 'Compartilhar QR',
  qrShareTitle: 'Meu ID Médico - Horus',
  qrPrivacyTitle: 'Privacidade do QR',
  qrAge: 'anos',
  qrBlood: 'Tipo sanguíneo',
  qrAllergies: 'Alergias',
  qrAllergiesDesc: 'Gravidade e reação',
  qrMeds: 'Medicamentos atuais',
  qrMedsDesc: 'Dose e frequência',
  qrConditions: 'Condições crônicas',
  qrConditionsDesc: 'Somente ativas',
  qrContacts: 'Contatos de emergência',
  qrContactsDesc: 'Nome e telefone',
  qrNotes: 'Notas médicas',
  qrNotesDesc: 'Informações adicionais',

  // Files
  filesTitle: 'Meus arquivos',
  filesStorage: 'de armazenamento usado',
  filesUpload: 'Enviar arquivo',
  filesNoFiles: 'Sem arquivos',
  filesDelete: 'Excluir',
  filesShare: 'Compartilhar',
  filesDeleteTitle: 'Excluir arquivo?',
  filesDeleteMsg: 'Tem certeza de que deseja excluir este arquivo?',
  filesDeleteConfirm: 'Excluir',

  // Profile
  profileTitle: 'Meu perfil',
  profileView: 'Ver perfil',
  profileEdit: 'Editar informações',
  profilePersonal: 'Dados pessoais',
  profileMedical: 'Dados médicos',
  profileId: 'Identificação',
  profileName: 'Nome',
  profileLastName: 'Sobrenome',
  profileEmail: 'E-mail',
  profileBloodType: 'Tipo sanguíneo',
  profileDob: 'Data de nascimento',
  profileGender: 'Gênero',
  profileIdType: 'Tipo de documento',
  profileIdNumber: 'Número do documento',
  profileNfc: 'NFC',
  profileNotProvided: 'Não informado',
  profileSave: 'Salvar alterações',
  profileClose: 'Fechar',
  profileDay: 'Dia',
  profileMonth: 'Mês',
  profileYear: 'Ano',

  // Settings
  settingsTitle: 'Configurações',
  settingsAppearance: 'Aparência',
  settingsTheme: 'Tema',
  settingsDark: 'Escuro',
  settingsLight: 'Claro',
  settingsLanguage: 'Língua',
  settingsLanguageTitle: 'Língua',
  settingsAssistant: 'Seu assistente',
  settingsAssistantSub: 'Escolha seu companheiro de saúde. Aparecerá na tela inicial e no chat com a IA.',
  settingsNotifications: 'Notificações',
  settingsPush: 'Notificações push',
  settingsPrivacy: 'Privacidade e segurança',
  settingsBiometric: 'Autenticação biométrica',
  settingsChangePassword: 'Alterar senha',
  settingsDevice: 'Dispositivo',
  settingsFirmware: 'Firmware',
  settingsGenerateCode: 'Gerar código do smartwatch',
  settingsDanger: 'Zona de perigo',
  settingsDeleteAccount: 'Excluir conta',
  settingsDeleteTitle: 'Excluir conta?',
  settingsDeleteSub: 'Esta ação é irreversível. Todos os seus dados serão perdidos.',
  settingsDeleteConfirm: 'Excluir',
  settingsCancel: 'Cancelar',
  settingsChangePasswordSoon: 'Em breve.',
  settingsLinkSmartwatch: 'Vincular smartwatch',
  settingsSmartwatchDesc: 'Digite este código no seu smartwatch Horus para vinculá-lo à sua conta. Expira em 2 minutos.',
  settingsCodeExpires: 'Expira em',
  settingsNewCode: 'Novo código',
  settingsGenerateCodeBtn: 'Gerar código',
  settingsConfirmAssistant: 'Mudar assistente?',
  settingsConfirmAssistantSub: 'Tem certeza de que deseja mudar para',
  settingsConfirmAssistantSub2: 'como seu companheiro de saúde?',
  settingsChangeBtn: 'Mudar',

  // Dashboard metrics
  dashMetricHeart: 'Freq. cardíaca',
  dashMetricSteps: 'Passos',
  dashMetricCalories: 'Calorias',
  dashMetricActivity: 'Atividade',
  dashMetricStepsUnit: 'passos',

  // QR additional
  qrSubtitle: 'Escaneável em emergências, sem app',
  qrSaved: 'Salvo',
  qrSaveBtn: 'Salvar',
  qrCompress: 'Recolher QR',
  qrGenerate: 'Gerar QR',
  qrWatchTitle: 'Coloque no seu relógio',
  qrWatchStep1: 'Salve o QR como imagem no seu celular',
  qrWatchStep2: 'Abra o app do smartwatch Horus Watch X',
  qrWatchStep3: 'Selecione Plano de fundo e escolha o QR',
  qrWatchStep4: 'Qualquer pessoa pode escaneá-lo em uma emergência',

  // Files additional
  filesSubtitle: 'Documentos e relatórios médicos',
  filesRecentTitle: 'Arquivos recentes',
  filesUploadSub: 'PDF, CSV, JSON, PNG · máx. 25 MB',
  filesUploadFirst: 'Envie seu primeiro documento',
  filesOf: 'de',

  // Profile additional
  profileHorusDevice: 'Minha pulseira Horus',
  profileLogout: 'Sair',
  profileLogoutTitle: 'Sair?',
  profileLogoutSub: 'Você precisará fazer login novamente.',
  profileEditTitle: 'Editar perfil',
  profileViewTitle: 'Informações do perfil',
  profileFullName: 'Nome completo',
  profileDocType: 'Tipo de documento',
  profileDocNumber: 'Número do documento',
  profileNfcId: 'ID da tag NFC',
  profileRequiredFields: 'Campos obrigatórios',
  profileRequiredMsg: 'Nome e sobrenome não podem estar vazios.',
  profileSaveError: 'Erro ao salvar',

  // Monitor
  monitorTitle: 'Monitor',
  monitorSubtitle: 'Localização e conectividade em tempo real',
  monitorLiveLocation: 'Localização ao vivo',
  monitorWaitingGps: 'Aguardando coordenadas GPS do dispositivo',
  monitorNfcTitle: 'Status NFC',
  monitorNfcSub: 'Tag registrada e ativa',
  monitorActive: 'Ativo',
  monitorProtocol: 'Protocolo',
  monitorFrequency: 'Frequência',
  monitorRange: 'Alcance',
  monitorTagId: 'ID da tag',
  monitorRecentNotifs: 'Notificações recentes',
  monitorNoNotifs: 'Sem notificações',
  monitorNoNotifsDesc: 'Sem alertas do dispositivo',
  monitorActiveProducts: 'Produtos ativos',
  monitorDeactivate: 'Deseja desativar este dispositivo?',
  monitorActivateDevice: 'Deseja ativar este dispositivo?',
  monitorDeactivateBtn: 'Desativar',
  monitorActivateBtn: 'Ativar',
  monitorActivateCardTitle: 'Vincular Cartão Horus',
  monitorActivateCardDesc: 'Ative seu cartão de emergência aproximando-o do celular',
  monitorActivateCardBtn: 'Vincular',
  nfcModalScanningTitle: 'Pronto para escanear',
  nfcModalScanningDesc: 'Aproxime seu cartão Horus da parte de trás do seu telefone.',
  nfcAlertSuccess: 'Vinculado e Ativo!',
  nfcAlertSuccessDesc: 'O cartão NFC foi vinculado com sucesso à sua conta.',
  // Navbar
  navHome: 'Início',
  navMonitor: 'Monitor',
  navId: 'ID',
  navAi: 'IA',
  navFiles: 'Arquivos',
  navProfile: 'Perfil',
};

const all = { es, en, pt };

// Called from AuthContext after fetching remote preferences
let _setLanguageGlobal: ((lang: Language) => void) | null = null;
export function hydrateLanguage(lang: string) {
  if ((lang === 'es' || lang === 'en' || lang === 'pt') && _setLanguageGlobal) {
    _setLanguageGlobal(lang as Language);
    setItem(LANG_KEY, lang).catch(() => {});
  }
}

// ── Context ────────────────────────────────────────────────────────────────
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: T;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: () => { },
  t: es,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    _setLanguageGlobal = setLanguageState;
    getItem(LANG_KEY).then(stored => {
      if (stored === 'es' || stored === 'en' || stored === 'pt') {
        setLanguageState(stored as Language);
      }
    });
    return () => { _setLanguageGlobal = null; };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setItem(LANG_KEY, lang);
    apiClient.put('/profile/preferences', { language: lang }).catch(() => {});
  };

  const value = useMemo<LanguageContextType>(
    () => ({ language, setLanguage, t: all[language] }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
