import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';

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

export function useAssistant() {
  const [assistantId, setAssistantIdState] = useState<AssistantId>('tinto');

  useEffect(() => {
    getItem(STORAGE_KEY).then(saved => {
      if (saved && saved in ASSISTANT_DATA) {
        setAssistantIdState(saved as AssistantId);
      }
    });
  }, []);

  const setAssistantId = useCallback(async (id: AssistantId) => {
    setAssistantIdState(id);
    await setItem(STORAGE_KEY, id);
  }, []);

  return {
    assistantId,
    setAssistantId,
    assistant: ASSISTANT_DATA[assistantId],
  };
}
