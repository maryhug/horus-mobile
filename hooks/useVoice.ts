import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';
import { apiClient } from '../services/api';

const STORAGE_KEY = 'horus_voice';

export type VoiceId = 'nbcvT3C2tyOd2OsRAtUf' | 'xf3Xv0R9rgFTExG0MVNo';

export const VOICE_DATA: Record<VoiceId, { name: string; desc: string }> = {
  'nbcvT3C2tyOd2OsRAtUf': { name: 'Voz 1', desc: 'Femenina · Clara y amigable' },
  'xf3Xv0R9rgFTExG0MVNo': { name: 'Voz 2', desc: 'Masculina · Cálida y cercana' },
};

export const VOICE_IDS = Object.keys(VOICE_DATA) as VoiceId[];

const PREVIEW_TEXT = 'Hola, soy tu asistente HORUS. ¿En qué puedo ayudarte hoy?';

// ── Singleton shared state ─────────────────────────────────────────────────
let globalVoiceId: VoiceId = 'nbcvT3C2tyOd2OsRAtUf';
let initialized = false;
const listeners = new Set<(id: VoiceId) => void>();

function broadcast(id: VoiceId) {
  globalVoiceId = id;
  listeners.forEach(fn => fn(id));
}

export { PREVIEW_TEXT };

// Called from AuthContext after fetching remote preferences
export function hydrateVoice(id: string) {
  if (id && id in VOICE_DATA) {
    broadcast(id as VoiceId);
    setItem(STORAGE_KEY, id).catch(() => {});
  }
}

export function useVoice() {
  const [voiceId, setVoiceIdState] = useState<VoiceId>(globalVoiceId);

  useEffect(() => {
    if (!initialized) {
      initialized = true;
      getItem(STORAGE_KEY).then(saved => {
        if (saved && saved in VOICE_DATA) broadcast(saved as VoiceId);
      });
    }
    const listener = (id: VoiceId) => setVoiceIdState(id);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const setVoiceId = useCallback(async (id: VoiceId) => {
    broadcast(id);
    await setItem(STORAGE_KEY, id);
    apiClient.put('/profile/preferences', { voiceId: id }).catch(() => {});
  }, []);

  return { voiceId, setVoiceId, voice: VOICE_DATA[voiceId] };
}
