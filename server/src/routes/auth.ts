import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function generateAccessToken(userId: string, isDevice: boolean = false): string {
  const expiresIn = isDevice ? '30d' : '7d';
  return jwt.sign({ userId, isDevice }, process.env.JWT_ACCESS_SECRET!, { expiresIn });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

function formatUser(user: any, personalInfo: any) {
  return {
    id: user.id,
    email: user.email,
    firstName: personalInfo?.firstName ?? '',
    lastName: personalInfo?.lastName ?? '',
    nfcTagId: user.nfcTagId ?? undefined,
    dateOfBirth: personalInfo?.dateOfBirth?.toISOString().split('T')[0] ?? undefined,
    gender: personalInfo?.gender ?? undefined,
    bloodType: personalInfo?.bloodType ?? undefined,
    identificationNumber: personalInfo?.identificationNumber ?? undefined,
    identificationType: personalInfo?.identificationType ?? undefined,
    photoUrl: personalInfo?.photoUrl ?? undefined,
  };
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
    res.status(400).json({ message: 'Todos los campos son obligatorios' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ message: 'Las contraseñas no coinciden' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      res.status(409).json({ message: 'El correo electrónico ya está registrado' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        personalInfo: {
          create: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          },
        },
      },
    });

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Register error:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      message: 'Error al registrar el usuario',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { personalInfo: true },
    });

    if (!user) {
      res.status(401).json({ message: 'Credenciales incorrectas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'Credenciales incorrectas' });
      return;
    }

    if (user.accountStatus !== 'ACTIVE') {
      res.status(403).json({ message: 'Cuenta inactiva o suspendida' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const accessToken = generateAccessToken(user.id);

    res.json({
      user: formatUser(user, user.personalInfo),
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      message: 'Error al iniciar sesión',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ message: 'Sesión cerrada correctamente' });
});

// PUT /api/auth/change-password
router.put('/change-password', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Todos los campos son obligatorios' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'La contraseña actual es incorrecta' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash: newHash } });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Change password error:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      message: 'Error al cambiar la contraseña',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/auth/device-code/generate
router.post('/device-code/generate', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Generate a secure 6 digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    const codeHash = await bcrypt.hash(code, 10);

    // Delete existing codes for this user to ensure only one active code
    await prisma.deviceLoginCode.deleteMany({
      where: { userId: req.userId }
    });

    await prisma.deviceLoginCode.create({
      data: {
        codeHash,
        userId: req.userId!,
        expiresAt,
      }
    });

    await prisma.securityLog.create({
      data: {
        eventType: 'DEVICE_CODE_GENERATED',
        userId: req.userId,
        ipAddress: req.ip,
      }
    });

    res.json({ code, expiresAt });
  } catch (error) {
    console.error('Generate device code error:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      message: 'Error al generar código de dispositivo',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/auth/device-code/verify
router.post('/device-code/verify', async (req: Request, res: Response): Promise<void> => {
  const { code, deviceName, deviceModel, osVersion } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ message: 'El código es requerido' });
    return;
  }

  try {
    // Delete expired codes first to keep table clean
    await prisma.deviceLoginCode.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });

    // Find code by looking at all active codes for all users (in a real scenario we'd ask user for ID too, or just search all since it's a 6 digit code - rate limiting is crucial)
    // Rate limiting: check recent failed attempts from this IP
    const recentFailures = await prisma.securityLog.count({
      where: {
        ipAddress: req.ip,
        eventType: 'DEVICE_LINK_FAILED',
        createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } // last 15 mins
      }
    });

    if (recentFailures > 5) {
      res.status(429).json({ message: 'Demasiados intentos fallidos. Intenta más tarde.' });
      return;
    }

    // Since we only have the plaintext code, and it's hashed in DB, we must fetch all active codes and compare.
    // NOTE: For 6 digit codes this might be slow if many are active, but it's acceptable for now.
    // A better approach is having a short device identifier + OTP. But we will iterate active codes.
    const activeCodes = await prisma.deviceLoginCode.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: { user: { include: { personalInfo: true } } }
    });

    let matchedDeviceCode = null;
    for (const dc of activeCodes) {
      if (dc.attempts >= 3) continue; // Skip blocked codes
      
      const isValid = await bcrypt.compare(code, dc.codeHash);
      if (isValid) {
        matchedDeviceCode = dc;
        break;
      } else {
        // Increment attempt
        await prisma.deviceLoginCode.update({
          where: { id: dc.id },
          data: { attempts: { increment: 1 } }
        });
      }
    }

    if (!matchedDeviceCode) {
      await prisma.securityLog.create({
        data: { eventType: 'DEVICE_LINK_FAILED', ipAddress: req.ip, details: { attempt: code } }
      });
      res.status(401).json({ message: 'Código inválido o expirado' });
      return;
    }

    const { user } = matchedDeviceCode;

    if (user.accountStatus !== 'ACTIVE') {
      res.status(403).json({ message: 'Cuenta inactiva o suspendida' });
      return;
    }

    // Delete the code as it can only be used once
    await prisma.deviceLoginCode.delete({ where: { id: matchedDeviceCode.id } });

    // Create a device session
    const refreshToken = generateRefreshToken();
    const session = await prisma.deviceSession.create({
      data: {
        userId: user.id,
        deviceName: deviceName || 'Smartwatch',
        deviceModel: deviceModel || 'Unknown',
        osVersion: osVersion || 'Unknown',
        refreshToken,
      }
    });

    // Log success
    await prisma.securityLog.create({
      data: { 
        eventType: 'DEVICE_LINK_SUCCESS', 
        userId: user.id, 
        ipAddress: req.ip,
        details: { sessionId: session.id, deviceName } 
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const accessToken = generateAccessToken(user.id, true);

    res.json({
      message: 'Inicio de sesión exitoso',
      user: formatUser(user, user.personalInfo),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Verify device code error:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      message: 'Error al verificar código',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ message: 'Token requerido' });
    return;
  }

  try {
    const session = await prisma.deviceSession.findUnique({
      where: { refreshToken },
      include: { user: true }
    });

    if (!session || !session.isActive) {
      res.status(401).json({ message: 'Sesión inválida o revocada' });
      return;
    }

    if (session.user.accountStatus !== 'ACTIVE') {
      res.status(403).json({ message: 'Cuenta inactiva o suspendida' });
      return;
    }

    // Create new refresh token
    const newRefreshToken = generateRefreshToken();
    await prisma.deviceSession.update({
      where: { id: session.id },
      data: { refreshToken: newRefreshToken, lastActive: new Date() }
    });

    const accessToken = generateAccessToken(session.userId, true);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
});

export default router;
