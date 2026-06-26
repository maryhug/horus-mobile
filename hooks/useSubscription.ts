import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '../services/api';

interface SubscriptionStatus {
  hasSubscription: boolean;
  types: string[]; // 'BRACELET' | 'CARD'
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const { data } = await apiClient.get<SubscriptionStatus>('/subscription/active');
          if (active) setStatus(data);
        } catch {
          if (active) setStatus({ hasSubscription: false, types: [] });
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  return { ...( status ?? { hasSubscription: false, types: [] }), loading };
}
