import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { db } from '../lib/firestore';

const router = Router();

// POST /api/notifications/token  { token: string }
router.post('/token', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ message: 'Token requerido' });
    return;
  }
  await prisma.user.update({ where: { id: req.userId! }, data: { pushToken: token } });
  res.json({ ok: true });
});

// DELETE /api/notifications/token
router.delete('/token', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.user.update({ where: { id: req.userId! }, data: { pushToken: null } });
  res.json({ ok: true });
});

// PATCH /api/notifications/health-report  { enabled: boolean }
router.patch('/health-report', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { enabled } = req.body;
  await prisma.user.update({
    where: { id: req.userId! },
    data: { healthReportEnabled: !!enabled },
  });
  res.json({ ok: true });
});

// PATCH /api/notifications/health-report-time  { hour: number, minute: number }
router.patch('/health-report-time', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { hour, minute } = req.body;
  const h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
    res.status(400).json({ message: 'Hora inválida' });
    return;
  }
  await db.collection('user_preferences').doc(req.userId!).set(
    { notificationHour: h, notificationMinute: m },
    { merge: true },
  );
  res.json({ ok: true });
});

// GET /api/notifications/health-report-time
router.get('/health-report-time', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await db.collection('user_preferences').doc(req.userId!).get();
  const data = doc.data() ?? {};
  res.json({ hour: data.notificationHour ?? 8, minute: data.notificationMinute ?? 0 });
});

export default router;
