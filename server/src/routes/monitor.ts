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

// POST /api/monitor/activate-card
// Body: { nfcTagId: string, deviceType?: 'CARD' | 'BRACELET' }
router.post('/activate-card', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nfcTagId, deviceType } = req.body;
    const userId = req.userId!;

    if (!nfcTagId) {
      res.status(400).json({ message: 'El ID del tag NFC es requerido.' });
      return;
    }

    const trimmedTagId = nfcTagId.trim();
    const type: 'CARD' | 'BRACELET' = deviceType === 'BRACELET' ? 'BRACELET' : 'CARD';

    // 1. Verificar si el tag ya está en uso por otro usuario
    const existingUser = await prisma.user.findFirst({
      where: { nfcTagId: trimmedTagId, NOT: { id: userId } },
    });
    if (existingUser) {
      res.status(409).json({ message: 'Este dispositivo ya está vinculado a otra cuenta.' });
      return;
    }

    // 2. Guardar nfcTagId en User (solo para tarjetas CARD — es el ID principal de acceso)
    if (type === 'CARD') {
      await prisma.user.update({ where: { id: userId }, data: { nfcTagId: trimmedTagId } });
    }

    // 3. Upsert UserDevice del tipo correspondiente
    const existingDevice = await prisma.userDevice.findFirst({ where: { userId, type } });

    if (existingDevice) {
      await prisma.userDevice.update({ where: { id: existingDevice.id }, data: { identifier: trimmedTagId } });
    } else {
      await prisma.userDevice.create({ data: { userId, type, identifier: trimmedTagId } });
    }

    const label = type === 'BRACELET' ? 'Manilla' : 'Tarjeta';
    res.json({ ok: true, message: `${label} vinculada y activada correctamente.` });
  } catch (err) {
    console.error('[monitor/activate-card]', err);
    res.status(500).json({ message: 'Error al activar el dispositivo NFC' });
  }
});

export default router;

