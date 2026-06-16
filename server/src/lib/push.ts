const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

export async function sendPushNotification(payload: PushPayload): Promise<void> {
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sound: 'default', ...payload }),
    });
    if (!res.ok) console.error('[Push] Expo API error:', await res.text());
  } catch (err) {
    console.error('[Push] send failed:', err);
  }
}
