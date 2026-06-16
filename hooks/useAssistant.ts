import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';
import { apiClient } from '../services/api';

const STORAGE_KEY = 'horus_assistant';

export type AssistantId = 'tinto' | 'oblea' | 'bocadillo';

export const ASSISTANT_DATA: Record<AssistantId, {
  name: string;
  tagline: string;
  image: ReturnType<typeof require>;
}> = {
  tinto:     { name: 'Tinto',     tagline: 'Siempre alegre, curioso y valiente.',  image: require('../assets/assistants/tinto.png')    },
  oblea:     { name: 'Oblea',     tagline: 'Siempre alegre, cercana y positiva.',  image: require('../assets/assistants/oblea.png')    },
  bocadillo: { name: 'Bocadillo', tagline: 'Siempre alegre, curiosa y valiente.', image: require('../assets/assistants/bocadillo.png') },
};

// ── Singleton shared state ─────────────────────────────────────────────────
let globalId: AssistantId = 'tinto';
let initialized = false;
const listeners = new Set<(id: AssistantId) => void>();

function broadcast(id: AssistantId) {
  globalId = id;
  listeners.forEach(fn => fn(id));
}

// Called from AuthContext after fetching remote preferences
export function hydrateAssistant(id: string) {
  if (id && id in ASSISTANT_DATA) {
    broadcast(id as AssistantId);
    setItem(STORAGE_KEY, id).catch(() => {});
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useAssistant() {
  const [assistantId, setAssistantIdState] = useState<AssistantId>(globalId);

  useEffect(() => {
    if (!initialized) {
      initialized = true;
      getItem(STORAGE_KEY).then(saved => {
        if (saved && saved in ASSISTANT_DATA) broadcast(saved as AssistantId);
      });
    }
    const listener = (id: AssistantId) => setAssistantIdState(id);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const setAssistantId = useCallback(async (id: AssistantId) => {
    broadcast(id);
    await setItem(STORAGE_KEY, id);
    apiClient.put('/profile/preferences', { assistantId: id }).catch(() => {});
  }, []);

  return {
    assistantId,
    setAssistantId,
    assistant: ASSISTANT_DATA[assistantId],
  };
}
