// AUTO-GENERATED — Horus Icon registry. Do not hand-edit individual entries.
// Each entry holds the inner markup of a 24x24 icon drawn with currentColor.
// 'filled' icons paint with fill; the rest stroke at 1.75 on a 24px grid.

export type HorusIconName =
  | 'activity'
  | 'alert-circle'
  | 'alert-triangle'
  | 'arrow-left'
  | 'arrow-right'
  | 'assistant'
  | 'assistant-active'
  | 'battery'
  | 'battery-charging'
  | 'bell'
  | 'bell-active'
  | 'bell-off'
  | 'blood-drop'
  | 'calendar'
  | 'call'
  | 'calories'
  | 'camera'
  | 'check'
  | 'check-circle'
  | 'chevron-down'
  | 'chevron-right'
  | 'clock'
  | 'close'
  | 'cloud'
  | 'cloud-offline'
  | 'contact-emergency'
  | 'credential'
  | 'dashboard'
  | 'dashboard-active'
  | 'document'
  | 'download'
  | 'edit'
  | 'emergency'
  | 'emergency-active'
  | 'files'
  | 'files-active'
  | 'goal'
  | 'heart'
  | 'heart-active'
  | 'heartbeat'
  | 'help'
  | 'id-card'
  | 'info'
  | 'location'
  | 'lock'
  | 'lock-open'
  | 'logout'
  | 'mail'
  | 'medical-card'
  | 'medical-records'
  | 'monitor'
  | 'monitor-active'
  | 'moon'
  | 'nfc'
  | 'options'
  | 'oxygen'
  | 'pills'
  | 'plus'
  | 'profile'
  | 'profile-active'
  | 'progress'
  | 'pulse'
  | 'qr-medical'
  | 'qr-medical-active'
  | 'refresh'
  | 'scan'
  | 'search'
  | 'send'
  | 'settings'
  | 'share'
  | 'shield'
  | 'shield-check'
  | 'sos'
  | 'statistics'
  | 'steps'
  | 'sun'
  | 'sync'
  | 'temperature'
  | 'trash'
  | 'upload'
  | 'watch'
  | 'wifi';

export interface HorusIconDef { cat: string; filled: boolean; body: string; }

export const HORUS_ICONS: Record<HorusIconName, HorusIconDef> = {
  'activity': { cat: 'activity', filled: false, body: "<path d=\"M3.5 12h3.6l1.8-5.5 3.4 11 2-7 1.3 1.5H20.5\"></path>" },
  'alert-circle': { cat: 'system', filled: false, body: "<circle cx=\"12\" cy=\"12\" r=\"8.2\"></circle><path d=\"M12 8v4.4M12 15.6v.02\"></path>" },
  'alert-triangle': { cat: 'system', filled: false, body: "<path d=\"M12 4.2L21 19.5a1 1 0 0 1-.9 1.5H3.9a1 1 0 0 1-.9-1.5z\"></path><path d=\"M12 10v4.2M12 17.3v.02\"></path>" },
  'arrow-left': { cat: 'system', filled: false, body: "<path d=\"M19.5 12h-15M11 5.5L4.5 12l6.5 6.5\"></path>" },
  'arrow-right': { cat: 'system', filled: false, body: "<path d=\"M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5\"></path>" },
  'assistant': { cat: 'navigation', filled: false, body: "<path d=\"M12 3.5l1.7 5 5 1.7-5 1.7L12 17l-1.7-5-5-1.7 5-1.7z\"></path><path d=\"M18.5 4.2l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z\"></path>" },
  'assistant-active': { cat: 'navigation', filled: true, body: "<path d=\"M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z\"></path><path d=\"M18.8 3.8l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z\"></path>" },
  'battery': { cat: 'system', filled: false, body: "<rect x=\"3\" y=\"8\" width=\"15\" height=\"8\" rx=\"2.2\"></rect><path d=\"M21 11v2\"></path><rect x=\"5.2\" y=\"10.2\" width=\"6\" height=\"3.6\" rx=\"0.8\" fill=\"currentColor\" stroke=\"none\"></rect>" },
  'battery-charging': { cat: 'system', filled: false, body: "<path d=\"M9 8H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2M13 8h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1.5\"></path><path d=\"M21 11v2\"></path><path d=\"M11 6.5L8 12h3l-1 5 4-6h-3z\" fill=\"currentColor\" stroke=\"none\"></path>" },
  'bell': { cat: 'system', filled: false, body: "<path d=\"M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4.5 1.8 5.5 1.8 5.5H4.7s1.8-1 1.8-5.5z\"></path><path d=\"M10 18.5a2 2 0 0 0 4 0\"></path>" },
  'bell-active': { cat: 'system', filled: true, body: "<path d=\"M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4.5 1.8 5.5 1.8 5.5H4.7s1.8-1 1.8-5.5z\"></path><path d=\"M9.8 18.5a2.2 2.2 0 0 0 4.4 0z\"></path><circle cx=\"17.5\" cy=\"6\" r=\"2.6\"></circle>" },
  'bell-off': { cat: 'system', filled: false, body: "<path d=\"M9 5.4A5.5 5.5 0 0 1 17.5 9.5c0 2 .4 3.4.9 4.4M6.6 7.9A5.4 5.4 0 0 0 6.5 9.5c0 4.5-1.8 5.5-1.8 5.5h11.6\"></path><path d=\"M10 18.5a2 2 0 0 0 4 0\"></path><path d=\"M4 4l16 16\"></path>" },
  'blood-drop': { cat: 'health', filled: false, body: "<path d=\"M12 3.5s6 6.2 6 10.2a6 6 0 0 1-12 0c0-4 6-10.2 6-10.2z\"></path>" },
  'calendar': { cat: 'system', filled: false, body: "<rect x=\"4\" y=\"5.5\" width=\"16\" height=\"15\" rx=\"2.6\"></rect><path d=\"M4 9.7h16M8 3.5v4M16 3.5v4\"></path>" },
  'call': { cat: 'system', filled: false, body: "<path d=\"M6 3.8h3L10.4 8 8.2 9.6a11 11 0 0 0 5.2 5.2L15 12.6l4.2 1.4v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4 6a2 2 0 0 1 2-2.2z\"></path>" },
  'calories': { cat: 'activity', filled: false, body: "<path d=\"M12 3.2c2.2 3 5 4.8 5 8.8a5 5 0 0 1-10 0c0-1.6.7-2.9 1.6-4 .1 1.4 1.4 1.9 2.2 1.2C14 8 12.8 6 12 3.2z\"></path>" },
  'camera': { cat: 'system', filled: false, body: "<path d=\"M4 9A1.8 1.8 0 0 1 5.8 7.2h1.6L9 5h6l1.6 2.2h1.6A1.8 1.8 0 0 1 20 9v8a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 17z\"></path><circle cx=\"12\" cy=\"13\" r=\"3.2\"></circle>" },
  'check': { cat: 'system', filled: false, body: "<path d=\"M5 12.5l4.8 4.8L19 6.5\"></path>" },
  'check-circle': { cat: 'system', filled: false, body: "<circle cx=\"12\" cy=\"12\" r=\"8.2\"></circle><path d=\"M8.5 12.2l2.4 2.4 4.6-4.8\"></path>" },
  'chevron-down': { cat: 'system', filled: false, body: "<path d=\"M5.5 9.5l6.5 6.5 6.5-6.5\"></path>" },
  'chevron-right': { cat: 'system', filled: false, body: "<path d=\"M9.5 5.5l6.5 6.5-6.5 6.5\"></path>" },
  'clock': { cat: 'system', filled: false, body: "<circle cx=\"12\" cy=\"12\" r=\"8\"></circle><path d=\"M12 7.5V12l3 1.8\"></path>" },
  'close': { cat: 'system', filled: false, body: "<path d=\"M6 6l12 12M18 6L6 18\"></path>" },
  'cloud': { cat: 'system', filled: false, body: "<path d=\"M7.2 18a4 4 0 0 1-.4-8 5.4 5.4 0 0 1 10.4-1A3.8 3.8 0 0 1 17.3 18z\"></path>" },
  'cloud-offline': { cat: 'system', filled: false, body: "<path d=\"M7.5 18A4 4 0 0 1 7 10.1a5.4 5.4 0 0 1 8.4-2.6M18 11.2A3.8 3.8 0 0 1 17.5 18H11\"></path><path d=\"M4 4l16 16\"></path>" },
  'contact-emergency': { cat: 'emergency', filled: false, body: "<circle cx=\"10\" cy=\"8.5\" r=\"3.3\"></circle><path d=\"M4.3 19.5a5.7 5.7 0 0 1 11.4 0\"></path><path d=\"M18.5 6v5M16 8.5h5\"></path>" },
  'credential': { cat: 'health', filled: false, body: "<rect x=\"6\" y=\"3.5\" width=\"12\" height=\"17\" rx=\"2.4\"></rect><path d=\"M9.5 3.5v1.6a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V3.5\"></path><circle cx=\"12\" cy=\"11\" r=\"2\"></circle><path d=\"M9 16.5a3 3 0 0 1 6 0\"></path>" },
  'dashboard': { cat: 'navigation', filled: false, body: "<rect x=\"3.5\" y=\"3.5\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"13.5\" y=\"3.5\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"3.5\" y=\"13.5\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"13.5\" y=\"13.5\" width=\"7\" height=\"7\" rx=\"2\"></rect>" },
  'dashboard-active': { cat: 'navigation', filled: true, body: "<rect x=\"3.5\" y=\"3.5\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"13.5\" y=\"3.5\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"3.5\" y=\"13.5\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"13.5\" y=\"13.5\" width=\"7\" height=\"7\" rx=\"2\"></rect>" },
  'document': { cat: 'system', filled: false, body: "<path d=\"M7 3.5h6.5L19 9v9.5A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5V5A1.5 1.5 0 0 1 6.5 3.5z\"></path><path d=\"M13 3.5V9h5.5\"></path><path d=\"M8.5 13h7M8.5 16.5h4.5\"></path>" },
  'download': { cat: 'system', filled: false, body: "<path d=\"M12 4v10.5M8 11l4 4 4-4\"></path><path d=\"M5 19.5h14\"></path>" },
  'edit': { cat: 'system', filled: false, body: "<path d=\"M16.4 4.4a1.9 1.9 0 0 1 2.7 2.7L8 18.2l-4 1 1-4z\"></path><path d=\"M14.3 6.5l3.2 3.2\"></path>" },
  'emergency': { cat: 'emergency', filled: false, body: "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"4.5\"></rect><path d=\"M12 8v8M8 12h8\"></path>" },
  'emergency-active': { cat: 'emergency', filled: true, body: "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"4.5\"></rect><path d=\"M12 8v8M8 12h8\" stroke=\"#fff\" stroke-width=\"2.2\" stroke-linecap=\"round\"></path>" },
  'files': { cat: 'navigation', filled: false, body: "<path d=\"M4 7.5A2 2 0 0 1 6 5.5h3.2l2 2.4h6.8a2 2 0 0 1 2 2v6.6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z\"></path>" },
  'files-active': { cat: 'navigation', filled: true, body: "<path d=\"M4 7.5A2 2 0 0 1 6 5.5h3.2l2 2.4h6.8a2 2 0 0 1 2 2v6.6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z\"></path>" },
  'goal': { cat: 'activity', filled: false, body: "<circle cx=\"12\" cy=\"12\" r=\"8\"></circle><circle cx=\"12\" cy=\"12\" r=\"4.4\"></circle><circle cx=\"12\" cy=\"12\" r=\"1.3\" fill=\"currentColor\" stroke=\"none\"></circle>" },
  'heart': { cat: 'health', filled: false, body: "<path d=\"M12 20.3l-7.1-6.9a4.5 4.5 0 0 1 6.3-6.4l.8.8.8-.8a4.5 4.5 0 0 1 6.3 6.4z\"></path>" },
  'heart-active': { cat: 'health', filled: true, body: "<path d=\"M12 20.6l-7.4-7.2a4.7 4.7 0 0 1 6.6-6.7l.8.8.8-.8a4.7 4.7 0 0 1 6.6 6.7z\"></path>" },
  'heartbeat': { cat: 'health', filled: false, body: "<path d=\"M12 20.3l-7.1-6.9A4.5 4.5 0 0 1 4 10.5h3.2l1.3-2.6 2 5 1.4-3 .9 1.6H20\"></path>" },
  'help': { cat: 'system', filled: false, body: "<circle cx=\"12\" cy=\"12\" r=\"8.2\"></circle><path d=\"M9.6 9.6a2.5 2.5 0 0 1 4.6 1.4c0 1.6-2.2 1.9-2.2 3.3M12 17v.02\"></path>" },
  'id-card': { cat: 'health', filled: false, body: "<rect x=\"3.5\" y=\"5.5\" width=\"17\" height=\"13\" rx=\"2.6\"></rect><circle cx=\"8.5\" cy=\"11\" r=\"2.1\"></circle><path d=\"M5.6 16a3.1 3.1 0 0 1 5.8 0\"></path><path d=\"M14 10h4M14 13h3\"></path>" },
  'info': { cat: 'system', filled: false, body: "<circle cx=\"12\" cy=\"12\" r=\"8.2\"></circle><path d=\"M12 11v5M12 8v.02\"></path>" },
  'location': { cat: 'system', filled: false, body: "<path d=\"M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z\"></path><circle cx=\"12\" cy=\"10.5\" r=\"2.4\"></circle>" },
  'lock': { cat: 'system', filled: false, body: "<rect x=\"5\" y=\"10.5\" width=\"14\" height=\"9.5\" rx=\"2.4\"></rect><path d=\"M8 10.5V8a4 4 0 0 1 8 0v2.5\"></path><circle cx=\"12\" cy=\"15\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"></circle>" },
  'lock-open': { cat: 'system', filled: false, body: "<rect x=\"5\" y=\"10.5\" width=\"14\" height=\"9.5\" rx=\"2.4\"></rect><path d=\"M8 10.5V8a4 4 0 0 1 7.7-1.4\"></path><circle cx=\"12\" cy=\"15\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"></circle>" },
  'logout': { cat: 'system', filled: false, body: "<path d=\"M14.5 7.5V6A1.5 1.5 0 0 0 13 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H13a1.5 1.5 0 0 0 1.5-1.5v-1.5\"></path><path d=\"M9.5 12h10.5M17 9l3 3-3 3\"></path>" },
  'mail': { cat: 'system', filled: false, body: "<rect x=\"3.5\" y=\"5.5\" width=\"17\" height=\"13\" rx=\"2.6\"></rect><path d=\"M4.5 8l7.5 5 7.5-5\"></path>" },
  'medical-card': { cat: 'health', filled: false, body: "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"14\" rx=\"2.6\"></rect><path d=\"M12 9v5M9.5 11.5h5\"></path><path d=\"M3.5 16.5h17\"></path>" },
  'medical-records': { cat: 'health', filled: false, body: "<path d=\"M9 5.5h6M9 5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 5.5z\"></path><path d=\"M16 5.5h1.5A1.5 1.5 0 0 1 19 7v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V7a1.5 1.5 0 0 1 1.5-1.5H8\"></path><path d=\"M12 11v4M10 13h4\"></path>" },
  'monitor': { cat: 'navigation', filled: false, body: "<circle cx=\"12\" cy=\"12\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"></circle><path d=\"M8.5 15.5a5 5 0 0 1 0-7\"></path><path d=\"M15.5 8.5a5 5 0 0 1 0 7\"></path><path d=\"M5.7 18.3a9 9 0 0 1 0-12.6\"></path><path d=\"M18.3 5.7a9 9 0 0 1 0 12.6\"></path>" },
  'monitor-active': { cat: 'navigation', filled: true, body: "<circle cx=\"12\" cy=\"12\" r=\"2.4\"></circle><path d=\"M8.5 15.5a5 5 0 0 1 0-7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"></path><path d=\"M15.5 8.5a5 5 0 0 1 0 7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"></path>" },
  'moon': { cat: 'system', filled: false, body: "<path d=\"M20 14.4A8 8 0 0 1 9.6 4 8 8 0 1 0 20 14.4z\"></path>" },
  'nfc': { cat: 'system', filled: false, body: "<path d=\"M8.5 8.2c1.6 1 1.6 6.6 0 7.6\"></path><path d=\"M12 6c2.8 1.7 2.8 10.3 0 12\"></path><path d=\"M15.5 3.8c4 2.4 4 13.9 0 16.4\"></path>" },
  'options': { cat: 'system', filled: false, body: "<path d=\"M4 8h8M16.5 8H20M4 16h3.5M12 16h8\"></path><circle cx=\"14\" cy=\"8\" r=\"2.1\"></circle><circle cx=\"9.5\" cy=\"16\" r=\"2.1\"></circle>" },
  'oxygen': { cat: 'health', filled: false, body: "<path d=\"M9.5 5.5C7 8 5 11 5 14a4.5 4.5 0 0 0 9 0c0-1.2-.4-2.3-1-3.3\"></path><path d=\"M14.5 5.5C17 8 19 11 19 14a4.5 4.5 0 0 1-4.5 4.5\"></path>" },
  'pills': { cat: 'health', filled: false, body: "<path d=\"M4.6 13.4l8.8-8.8a4 4 0 0 1 5.7 5.7l-8.8 8.8a4 4 0 0 1-5.7-5.7z\"></path><path d=\"M9 9l5.7 5.7\"></path>" },
  'plus': { cat: 'system', filled: false, body: "<path d=\"M12 5v14M5 12h14\"></path>" },
  'profile': { cat: 'navigation', filled: false, body: "<circle cx=\"12\" cy=\"8.5\" r=\"3.5\"></circle><path d=\"M5.5 19.5a6.5 6.5 0 0 1 13 0\"></path>" },
  'profile-active': { cat: 'navigation', filled: true, body: "<circle cx=\"12\" cy=\"8\" r=\"3.8\"></circle><path d=\"M4.8 20a7.2 7.2 0 0 1 14.4 0z\"></path>" },
  'progress': { cat: 'activity', filled: false, body: "<path d=\"M4 15.5l5-5 3.5 3 6.5-7\"></path><path d=\"M15.5 6.5H19V10\"></path>" },
  'pulse': { cat: 'health', filled: false, body: "<path d=\"M3 12.5h3.4l1.8-4.2 3 8.4 2.1-5.4 1.3 2.6H21\"></path>" },
  'qr-medical': { cat: 'navigation', filled: false, body: "<rect x=\"4\" y=\"4\" width=\"6\" height=\"6\" rx=\"1.6\"></rect><rect x=\"14\" y=\"4\" width=\"6\" height=\"6\" rx=\"1.6\"></rect><rect x=\"4\" y=\"14\" width=\"6\" height=\"6\" rx=\"1.6\"></rect><path d=\"M14 14.5h2.5M19.5 14v2.5M14 20h.02M19.5 20h.02M16.7 17.3h.02\"></path>" },
  'qr-medical-active': { cat: 'navigation', filled: true, body: "<rect x=\"3.5\" y=\"3.5\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"13.5\" y=\"3.5\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"3.5\" y=\"13.5\" width=\"7\" height=\"7\" rx=\"2\"></rect><rect x=\"14.5\" y=\"14.5\" width=\"2.6\" height=\"2.6\" rx=\"0.6\"></rect><rect x=\"18.4\" y=\"18.4\" width=\"2\" height=\"2\" rx=\"0.5\"></rect><rect x=\"14.5\" y=\"18.4\" width=\"2\" height=\"2\" rx=\"0.5\"></rect><rect x=\"18.4\" y=\"14.5\" width=\"2\" height=\"2\" rx=\"0.5\"></rect>" },
  'refresh': { cat: 'system', filled: false, body: "<path d=\"M19.5 9.5A7.5 7.5 0 1 0 20 13\"></path><path d=\"M20 4.5v5h-5\"></path>" },
  'scan': { cat: 'system', filled: false, body: "<path d=\"M4 8.5V6.5A2.5 2.5 0 0 1 6.5 4h2M15.5 4h2A2.5 2.5 0 0 1 20 6.5v2M20 15.5v2a2.5 2.5 0 0 1-2.5 2.5h-2M8.5 20h-2A2.5 2.5 0 0 1 4 17.5v-2\"></path><path d=\"M4 12h16\"></path>" },
  'search': { cat: 'system', filled: false, body: "<circle cx=\"11\" cy=\"11\" r=\"6.2\"></circle><path d=\"M20 20l-4.6-4.6\"></path>" },
  'send': { cat: 'system', filled: false, body: "<path d=\"M20.5 3.5L3.6 11l6.4 2.4 2.4 6.4z\"></path><path d=\"M20.5 3.5L10 13.4\"></path>" },
  'settings': { cat: 'system', filled: false, body: "<circle cx=\"12\" cy=\"12\" r=\"3.2\"></circle><path d=\"M12 3.2v2.3M12 18.5v2.3M20.8 12h-2.3M5.5 12H3.2M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6M18.2 18.2l-1.6-1.6M7.4 7.4 5.8 5.8\"></path>" },
  'share': { cat: 'system', filled: false, body: "<circle cx=\"6\" cy=\"12\" r=\"2.4\"></circle><circle cx=\"17\" cy=\"6\" r=\"2.4\"></circle><circle cx=\"17\" cy=\"18\" r=\"2.4\"></circle><path d=\"M8.1 10.9l6.8-3.7M8.1 13.1l6.8 3.7\"></path>" },
  'shield': { cat: 'system', filled: false, body: "<path d=\"M12 3.3l7 2.9v5c0 5-3.5 8.4-7 9.5-3.5-1.1-7-4.5-7-9.5v-5z\"></path>" },
  'shield-check': { cat: 'system', filled: false, body: "<path d=\"M12 3.3l7 2.9v5c0 5-3.5 8.4-7 9.5-3.5-1.1-7-4.5-7-9.5v-5z\"></path><path d=\"M9 12l2.2 2.2L15.2 10\"></path>" },
  'sos': { cat: 'emergency', filled: false, body: "<path d=\"M12 3.2l8 3.4v5.2c0 5-3.4 8.4-8 9.8-4.6-1.4-8-4.8-8-9.8V6.6z\"></path><path d=\"M12 8.5v4M12 15.5v.02\"></path>" },
  'statistics': { cat: 'activity', filled: false, body: "<path d=\"M4.5 20.5h15\"></path><path d=\"M7 20V13.5M11.5 20V7.5M16 20v-4.5\"></path>" },
  'steps': { cat: 'activity', filled: false, body: "<path d=\"M7.5 4.2c1.3 0 2 1.6 2 3.8 0 1.4-.3 2.6-.3 3.6 0 1-.7 1.6-1.7 1.6s-1.7-.6-1.7-1.6c0-1-.3-2.2-.3-3.6 0-2.2.7-3.8 2-3.8z\"></path><path d=\"M5.8 15.4h3.4v1.4a1.7 1.7 0 0 1-3.4 0z\"></path><path d=\"M16.5 8.2c1.3 0 2 1.6 2 3.8 0 1.4-.3 2.6-.3 3.6 0 1-.7 1.6-1.7 1.6s-1.7-.6-1.7-1.6c0-1-.3-2.2-.3-3.6 0-2.2.7-3.8 2-3.8z\"></path><path d=\"M14.8 19.4h3.4v1.4a1.7 1.7 0 0 1-3.4 0z\"></path>" },
  'sun': { cat: 'system', filled: false, body: "<circle cx=\"12\" cy=\"12\" r=\"3.8\"></circle><path d=\"M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3\"></path>" },
  'sync': { cat: 'system', filled: false, body: "<path d=\"M19.5 12a7.5 7.5 0 1 1-2.2-5.3\"></path><path d=\"M19.7 4v4h-4\"></path>" },
  'temperature': { cat: 'health', filled: false, body: "<path d=\"M14 14.8V6a2 2 0 0 0-4 0v8.8a4 4 0 1 0 4 0z\"></path><path d=\"M12 8.5v6.5\"></path>" },
  'trash': { cat: 'system', filled: false, body: "<path d=\"M4.5 7h15M9.8 7V5.6a1.2 1.2 0 0 1 1.2-1.2h2a1.2 1.2 0 0 1 1.2 1.2V7\"></path><path d=\"M6.8 7l.9 11.6A1.6 1.6 0 0 0 9.3 20h5.4a1.6 1.6 0 0 0 1.6-1.4L17.2 7\"></path><path d=\"M10.5 10.5v6M13.5 10.5v6\"></path>" },
  'upload': { cat: 'system', filled: false, body: "<path d=\"M12 16V5.5M8 9l4-4 4 4\"></path><path d=\"M5 19.5h14\"></path>" },
  'watch': { cat: 'system', filled: false, body: "<rect x=\"7\" y=\"6.5\" width=\"10\" height=\"11\" rx=\"3\"></rect><path d=\"M8.8 6.5L9.4 3.5h5.2l.6 3M8.8 17.5l.6 3h5.2l.6-3\"></path><path d=\"M12 9.8v2.4l1.7 1\"></path>" },
  'wifi': { cat: 'system', filled: false, body: "<path d=\"M4.5 9.5a11 11 0 0 1 15 0\"></path><path d=\"M7.5 13a6.5 6.5 0 0 1 9 0\"></path><path d=\"M10.5 16.3a2.2 2.2 0 0 1 3 0\"></path><circle cx=\"12\" cy=\"19\" r=\"0.7\" fill=\"currentColor\" stroke=\"none\"></circle>" },
};

export const HORUS_ICON_NAMES = Object.keys(HORUS_ICONS) as HorusIconName[];
