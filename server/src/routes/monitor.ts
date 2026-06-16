import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { db } from '../lib/firestore';

const router = Router();

// GET /api/monitor/devices
// Returns user's registered devices + smartwatch status from Firestore
router.get('/devices', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // Registered devices (CARD, BRACELET) from Postgres
    const devices = await prisma.userDevice.findMany({
      where: { userId },
      orderBy: { registeredAt: 'asc' },
    });

    // Smartwatch: active if health readings exist and are recent (< 30 min)
    let watchActive = false;
    try {
      const doc = await db.collection('health_readings').doc(userId).get();
      if (doc.exists) {
        const data = doc.data();
        const updatedAt: Date | undefined = data?.updated_at?.toDate?.();
        if (updatedAt) {
          const ageMs = Date.now() - updatedAt.getTime();
          watchActive = ageMs < 30 * 60 * 1000; // active if reading < 30 min ago
        }
      }
    } catch { /* ignore Firestore errors */ }

    res.json({
      devices: [
        ...devices.map(d => ({
          type: d.type,
          identifier: d.identifier,
          registeredAt: d.registeredAt.toISOString(),
          active: true, // registered = active
        })),
        ...(watchActive ? [{
          type: 'SMARTWATCH',
          identifier: null,
          registeredAt: null,
          active: true,
        }] : []),
      ],
    });
  } catch (err) {
    console.error('[monitor/devices]', err);
    res.status(500).json({ message: 'Error al obtener dispositivos' });
  }
});

export default router;
