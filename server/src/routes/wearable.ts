import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  saveHealthReadings, getHealthReadings,
  calculateScore, saveNotification, updateHourlyActivity,
} from '../services/healthScore';
import { sendPushNotification } from '../services/notification';

const router = Router();

// POST /api/wearable/readings — watch sends health data
router.post('/readings', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { heartRate, steps, calories, activityMinutes, battery } = req.body as {
      heartRate?: number; steps?: number; calories?: number;
      activityMinutes?: number; battery?: number;
    };

    const userId = req.userId!;
    const readings = { heartRate, steps, calories, activityMinutes, battery, timestamp: new Date().toISOString() };

    await saveHealthReadings(userId, readings);
    if (steps != null) updateHourlyActivity(userId, steps).catch(() => {}); // fire-and-forget
    const score = calculateScore(readings);

    // Health alerts
    if (heartRate != null && (heartRate > 110 || heartRate < 45)) {
      const alertBody = heartRate > 110
        ? `Frecuencia cardíaca elevada: ${heartRate} bpm`
        : `Frecuencia cardíaca baja: ${heartRate} bpm`;
      await saveNotification(userId, 'Alerta de salud', alertBody, 'health_alert');
      await sendPushNotification(userId, 'HORUS — Alerta', alertBody);
    }

    if (score != null && score < 40) {
      await saveNotification(userId, 'Actividad física baja', `Tu puntaje de salud es ${score}/100. Trata de moverte más.`, 'health_alert');
    }

    res.json({ score, timestamp: readings.timestamp });
  } catch (err) {
    console.error('[wearable/readings]', err);
    res.status(500).json({ message: 'Error guardando datos de salud' });
  }
});

// GET /api/wearable/latest — mobile polls current metrics
router.get('/latest', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const readings = await getHealthReadings(req.userId!);
    const score = readings ? calculateScore(readings) : null;
    res.json({ readings, score });
  } catch (err) {
    res.status(500).json({ message: 'Error obteniendo datos' });
  }
});

// POST /api/wearable/mock — inject simulated readings for testing (any env)
router.post('/mock', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const hr      = 60 + Math.floor(Math.random() * 25);        // 60-84
    const steps   = 2000 + Math.floor(Math.random() * 5000);    // 2000-7000
    const cal     = Math.round(steps * 0.04);
    const battery = 70 + Math.floor(Math.random() * 30);        // 70-99
    const readings = { heartRate: hr, steps, calories: cal, battery, timestamp: new Date().toISOString() };
    await saveHealthReadings(userId, readings);
    const score = calculateScore(readings);
    res.json({ ok: true, readings, score });
  } catch (err) {
    console.error('[wearable/mock]', err);
    res.status(500).json({ message: 'Error' });
  }
});

export default router;
