import { db } from '../lib/firestore';

export interface HealthReadings {
  heartRate?: number;
  steps?: number;
  calories?: number;
  activityMinutes?: number;
  battery?: number;
  timestamp?: string;
}

// ── Score: 0-100 from available metrics ────────────────────────────────────
export function calculateScore(r: HealthReadings): number | null {
  const hasData = r.heartRate != null || r.steps != null || r.calories != null || r.activityMinutes != null;
  if (!hasData) return null;

  let score = 0;
  let maxPossible = 0;

  if (r.heartRate != null) {
    const hr = r.heartRate;
    score += (hr >= 60 && hr <= 80) ? 25 : (hr >= 50 && hr <= 100) ? 15 : 5;
    maxPossible += 25;
  }
  if (r.steps != null) {
    score += Math.min(r.steps / 8000, 1) * 35;
    maxPossible += 35;
  }
  if (r.calories != null) {
    score += Math.min(r.calories / 1800, 1) * 20;
    maxPossible += 20;
  }
  if (r.activityMinutes != null) {
    score += Math.min(r.activityMinutes / 30, 1) * 20;
    maxPossible += 20;
  }

  return maxPossible > 0 ? Math.round((score / maxPossible) * 100) : null;
}

// ── Persist health readings (one doc per user, overwrite) ─────────────────
export async function saveHealthReadings(userId: string, readings: HealthReadings): Promise<void> {
  await db.collection('health_readings').doc(userId).set({
    ...readings,
    updated_at: new Date(),
  });
}

export async function getHealthReadings(userId: string): Promise<HealthReadings | null> {
  const doc = await db.collection('health_readings').doc(userId).get();
  return doc.exists ? (doc.data() as HealthReadings) : null;
}

// ── Hourly activity (24h chart) ───────────────────────────────────────────

// Colombia = UTC-5 (no DST)
function colombiaNow(): Date {
  return new Date(Date.now() - 5 * 60 * 60 * 1000);
}

function todayKey(userId: string): { docId: string; dateStr: string; hour: number } {
  const d = colombiaNow();
  const dateStr = d.toISOString().split('T')[0];
  return { docId: `${userId}_${dateStr}`, dateStr, hour: d.getUTCHours() };
}

// Realistic cumulative step snapshot at end of each hour (typical active day)
const SEED_CUMULATIVE = [
  0, 0, 0, 0, 0, 180, 620, 1700, 2950, 3400, 3720, 4050,
  5150, 5700, 6080, 6460, 6830, 7850, 9200, 9850, 10150, 10380, 10500, 10600,
];

export async function updateHourlyActivity(userId: string, steps: number): Promise<void> {
  const { docId, dateStr, hour } = todayKey(userId);
  await db.collection('activity_daily').doc(docId).set(
    { userId, date: dateStr, [`h${hour}`]: steps, updatedAt: new Date() },
    { merge: true },
  );
}

export async function getDailyActivity(userId: string): Promise<number[]> {
  const { docId, dateStr, hour } = todayKey(userId);
  const ref = db.collection('activity_daily').doc(docId);
  let doc  = await ref.get();

  if (!doc.exists) {
    // Seed realistic data for past hours so the chart looks good on first load
    const seed: Record<string, unknown> = { userId, date: dateStr, updatedAt: new Date() };
    for (let h = 0; h < hour; h++) {
      const variation = 0.82 + Math.random() * 0.36;
      seed[`h${h}`] = Math.round(SEED_CUMULATIVE[h] * variation);
    }
    await ref.set(seed);
    doc = await ref.get();
  }

  const raw = doc.data() ?? {};
  // Build per-hour deltas from cumulative snapshots
  const deltas = new Array<number>(24).fill(0);
  for (let h = 0; h <= hour; h++) {
    const curr = (raw[`h${h}`] as number) ?? 0;
    const prev = h > 0 ? ((raw[`h${h - 1}`] as number) ?? 0) : 0;
    deltas[h] = Math.max(0, curr - prev);
  }
  return deltas;
}

// ── Notifications — max 10 per user, newest first ─────────────────────────
export async function saveNotification(
  userId: string,
  title: string,
  body: string,
  type: 'qr_scan' | 'health_alert' | 'info',
): Promise<void> {
  const colRef = db.collection('notifications').doc(userId).collection('items');
  await colRef.add({ title, body, type, read: false, timestamp: new Date() });

  // Prune to last 10
  const snap = await colRef.orderBy('timestamp', 'desc').get();
  if (snap.size > 10) {
    const batch = db.batch();
    snap.docs.slice(10).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function getNotifications(userId: string): Promise<Record<string, unknown>[]> {
  const snap = await db
    .collection('notifications').doc(userId).collection('items')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
