import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import contactsRoutes from './routes/contacts';
import dashboardRoutes from './routes/dashboard';
import emergencyRoutes from './routes/emergency';
import chatRoutes from './routes/chat';
import wearableRoutes from './routes/wearable';
import monitorRoutes from './routes/monitor';
import notificationsRoutes from './routes/notifications';
import filesRoutes from './routes/files';
import { sendPushNotification } from './lib/push';
import { prisma } from './lib/prisma';
import { db } from './lib/firestore';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.set('trust proxy', 1);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/emergency', emergencyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/wearable', wearableRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/files', filesRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Health report scheduler (checks every minute, sends at user's preferred time) ─
// Colombia = UTC-5 (no DST)
function colombiaNow() { return new Date(Date.now() - 5 * 60 * 60 * 1000); }

const notifiedToday = new Set<string>();

async function checkAndSendHealthReports() {
  try {
    const now = colombiaNow();
    const h = now.getUTCHours();
    const m = now.getUTCMinutes();

    // Reset sent-set at midnight Colombia time
    if (h === 0 && m === 0) notifiedToday.clear();

    const users = await prisma.user.findMany({
      where: { pushToken: { not: null }, healthReportEnabled: true },
      select: { id: true, pushToken: true },
    });

    for (const user of users) {
      if (!user.pushToken || notifiedToday.has(user.id)) continue;

      const prefDoc = await db.collection('user_preferences').doc(user.id).get();
      const pref = prefDoc.data() ?? {};
      const scheduledH: number = pref.notificationHour   ?? 8;
      const scheduledM: number = pref.notificationMinute ?? 0;

      if (h === scheduledH && m === scheduledM) {
        await sendPushNotification({
          to: user.pushToken,
          title: '📊 Tu reporte de salud diario',
          body: 'HORUS preparó tu resumen de salud de hoy. Toca para verlo.',
          data: { type: 'health_report' },
        });
        notifiedToday.add(user.id);
        console.log(`[Notif] Health report sent to ${user.id} at ${h}:${String(m).padStart(2,'0')}`);
      }
    }
  } catch (err) {
    console.error('[Notif] Error in health report scheduler:', err);
  }
}

app.listen(PORT, () => {
  console.log(`Horus API corriendo en http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);

  // Check every minute if it's time to send a health report
  setInterval(checkAndSendHealthReports, 60 * 1000);
  console.log('[Notif] Health report scheduler started (checks every minute)');
});