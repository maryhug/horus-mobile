import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from '../lib/prisma';
import { messaging } from '../lib/firebase';
import { db } from '../lib/firestore';

const expo = new Expo();

// ── Watch FCM token (stored in Firestore, separate from phone Expo token) ────
export async function saveWatchToken(userId: string, fcmToken: string): Promise<void> {
  await db.collection('user_tokens').doc(userId).set({ watchFcmToken: fcmToken }, { merge: true });
}

export async function clearWatchToken(userId: string): Promise<void> {
  const { FieldValue } = await import('firebase-admin/firestore');
  await db.collection('user_tokens').doc(userId).set({ watchFcmToken: FieldValue.delete() }, { merge: true });
}

async function getWatchToken(userId: string): Promise<string | null> {
  const doc = await db.collection('user_tokens').doc(userId).get();
  return doc.exists ? (doc.data()?.watchFcmToken ?? null) : null;
}

// ── Send to a single FCM token ────────────────────────────────────────────────
async function sendFcm(token: string, title: string, body: string, data?: Record<string, string>) {
  try {
    await messaging.send({
      token,
      notification: { title, body },
      android: { priority: 'high' },
      ...(data ? { data } : {}),
    });
    console.log('[FCM] sent to', token.slice(0, 20) + '…');
  } catch (err: any) {
    console.error('[FCM] error:', err?.code ?? err?.message);
  }
}

// ── Send to a single Expo token ───────────────────────────────────────────────
async function sendExpo(token: string, title: string, body: string, data?: any) {
  if (!Expo.isExpoPushToken(token)) {
    console.error('[Expo] invalid token:', token);
    return;
  }
  const messages: ExpoPushMessage[] = [{ to: token, sound: 'default', title, body, data: data ?? {} }];
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      console.log('[Expo] sent:', tickets);
    } catch (err) {
      console.error('[Expo] error:', err);
    }
  }
}

// ── Main: send to phone (Expo) + watch (FCM) ─────────────────────────────────
export async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
  try {
    const [user, watchToken] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { pushToken: true } }),
      getWatchToken(userId).catch(() => null),
    ]);

    const extraData: Record<string, string> | undefined = data
      ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
      : undefined;

    // Phone
    if (user?.pushToken) {
      const isExpo = user.pushToken.startsWith('ExponentPushToken') || user.pushToken.startsWith('ExpoPushToken');
      if (isExpo) {
        await sendExpo(user.pushToken, title, body, data);
      } else {
        await sendFcm(user.pushToken, title, body, extraData);
      }
    } else {
      console.log(`[Push] user ${userId} has no phone push token`);
    }

    // Watch
    if (watchToken) {
      await sendFcm(watchToken, title, body, extraData);
    }
  } catch (err) {
    console.error('[Push] unexpected error:', err);
  }
}
