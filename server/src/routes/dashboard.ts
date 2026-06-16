import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getHealthReadings, calculateScore, getNotifications, getDailyActivity } from '../services/healthScore';

const router = Router();

// GET /api/dashboard/info
router.get('/info', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const [user, readings, notifications, hourlyActivity] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { personalInfo: true },
      }),
      getHealthReadings(userId).catch(() => null),
      getNotifications(userId).catch(() => []),
      getDailyActivity(userId).catch(() => new Array(24).fill(0)),
    ]);

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const score = readings ? calculateScore(readings) : null;

    res.json({
      id: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
      health: readings ? {
        heartRate:       readings.heartRate       ?? null,
        steps:           readings.steps           ?? null,
        calories:        readings.calories        ?? null,
        activityMinutes: readings.activityMinutes ?? (readings.steps != null ? Math.floor(readings.steps / 100) : null),
        battery:         readings.battery         ?? null,
        score,
        updatedAt:       readings.timestamp       ?? null,
      } : null,
      notifications,
      hourlyActivity,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Error al obtener información del dashboard' });
  }
});

export default router;
