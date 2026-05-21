import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getItem, setItem } from '../utils/storage';

const LANG_KEY = 'horus_language';

export type Language = 'es' | 'en';

const es = {
  settings: {
    title: 'Configuración',
    appearance: 'APARIENCIA',
    theme: 'Tema',
    themeDesc: 'Elige entre oscuro y claro',
    dark: 'Oscuro',
    light: 'Claro',
    notifications: 'NOTIFICACIONES',
    securityAlerts: 'Alertas de seguridad',
    securityAlertsDesc: 'Geocercas, ritmo cardíaco, caídas',
    syncNotif: 'Sincronización',
    syncNotifDesc: 'Notificación al sincronizar',
    locationUpdates: 'Actualizaciones de ubicación',
    locationUpdatesDesc: 'Notificar cambios de ubicación',
    device: 'DISPOSITIVO',
    nfc: 'NFC',
    nfcDesc: 'Lectura y escritura NFC',
    gps: 'GPS',
    gpsDesc: 'Seguimiento de ubicación',
    autoSync: 'Sincronización automática',
    autoSyncDesc: 'Sincronizar cada 5 minutos',
    privacy: 'PRIVACIDAD Y CUENTA',
    changePassword: 'Cambiar contraseña',
    privacyData: 'Privacidad de datos',
    language: 'Idioma',
    about: 'ACERCA DE',
    appVersion: 'Versión de la app',
    appVersionDesc: 'Horus Mobile v1.0.0',
    terms: 'Términos y condiciones',
    help: 'Centro de ayuda',
    session: 'SESIÓN',
    logout: 'Cerrar sesión',
    logoutConfirmTitle: 'Cerrar sesión',
    logoutConfirmDesc: '¿Estás seguro que deseas cerrar sesión?',
    cancel: 'Cancelar',
    confirm: 'Cerrar sesión',
    changePasswordTitle: 'Cambiar contraseña',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar nueva contraseña',
    save: 'Guardar cambios',
    passwordMismatch: 'Las contraseñas nuevas no coinciden.',
    passwordRequired: 'Completa todos los campos.',
    languageTitle: 'Idioma',
    selectLanguage: 'Selecciona el idioma de la app',
    version: 'Horus Mobile © 2026 · v1.0.0',
  },
};

const en: typeof es = {
  settings: {
    title: 'Settings',
    appearance: 'APPEARANCE',
    theme: 'Theme',
    themeDesc: 'Choose between dark and light',
    dark: 'Dark',
    light: 'Light',
    notifications: 'NOTIFICATIONS',
    securityAlerts: 'Security alerts',
    securityAlertsDesc: 'Geofences, heart rate, falls',
    syncNotif: 'Synchronization',
    syncNotifDesc: 'Notify on sync',
    locationUpdates: 'Location updates',
    locationUpdatesDesc: 'Notify on location changes',
    device: 'DEVICE',
    nfc: 'NFC',
    nfcDesc: 'NFC reading and writing',
    gps: 'GPS',
    gpsDesc: 'Location tracking',
    autoSync: 'Auto sync',
    autoSyncDesc: 'Sync every 5 minutes',
    privacy: 'PRIVACY & ACCOUNT',
    changePassword: 'Change password',
    privacyData: 'Data privacy',
    language: 'Language',
    about: 'ABOUT',
    appVersion: 'App version',
    appVersionDesc: 'Horus Mobile v1.0.0',
    terms: 'Terms and conditions',
    help: 'Help center',
    session: 'SESSION',
    logout: 'Log out',
    logoutConfirmTitle: 'Log out',
    logoutConfirmDesc: 'Are you sure you want to log out?',
    cancel: 'Cancel',
    confirm: 'Log out',
    changePasswordTitle: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    save: 'Save changes',
    passwordMismatch: 'New passwords do not match.',
    passwordRequired: 'Please fill in all fields.',
    languageTitle: 'Language',
    selectLanguage: 'Select the app language',
    version: 'Horus Mobile © 2026 · v1.0.0',
  },
};

const translations = { es, en };

type Translations = typeof es;
type SettingsKeys = keyof typeof es.settings;

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: SettingsKeys) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: () => {},
  t: (key) => es.settings[key],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    getItem(LANG_KEY).then(stored => {
      if (stored === 'es' || stored === 'en') setLanguageState(stored);
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setItem(LANG_KEY, lang);
  };

  const t = useMemo(
    () => (key: SettingsKeys) => translations[language].settings[key],
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
