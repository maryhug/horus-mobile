import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '7d' });
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

export default router;
