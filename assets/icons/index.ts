// Horus Icon System — central export. Import everything icon-related from here.
//
//   import { HorusIcon } from '@/assets/icons';
//   <HorusIcon name="heart" size={24} color={colors.accent} />

export { HorusIcon, default } from './HorusIcon';
export type { HorusIconProps } from './HorusIcon';
export { HORUS_ICONS, HORUS_ICON_NAMES } from './paths';
export type { HorusIconName, HorusIconDef } from './paths';

/** Icons grouped by category — handy for galleries, settings pickers, docs. */
export const HORUS_ICON_CATEGORIES = {
  activity: ['activity', 'calories', 'goal', 'progress', 'statistics', 'steps'],
  system: ['alert-circle', 'alert-triangle', 'arrow-left', 'arrow-right', 'battery', 'battery-charging', 'bell', 'bell-active', 'bell-off', 'calendar', 'call', 'camera', 'check', 'check-circle', 'chevron-down', 'chevron-right', 'clock', 'close', 'cloud', 'cloud-offline', 'document', 'download', 'edit', 'help', 'info', 'location', 'lock', 'lock-open', 'logout', 'mail', 'moon', 'nfc', 'options', 'plus', 'refresh', 'scan', 'search', 'send', 'settings', 'share', 'shield', 'shield-check', 'sun', 'sync', 'trash', 'upload', 'watch', 'wifi'],
  navigation: ['assistant', 'assistant-active', 'dashboard', 'dashboard-active', 'files', 'files-active', 'monitor', 'monitor-active', 'profile', 'profile-active', 'qr-medical', 'qr-medical-active'],
  health: ['blood-drop', 'credential', 'heart', 'heart-active', 'heartbeat', 'id-card', 'medical-card', 'medical-records', 'oxygen', 'pills', 'pulse', 'temperature'],
  emergency: ['contact-emergency', 'emergency', 'emergency-active', 'sos'],
} as const;
