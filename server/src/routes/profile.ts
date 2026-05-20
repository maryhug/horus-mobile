import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function formatUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.personalInfo?.firstName ?? '',
    lastName: user.personalInfo?.lastName ?? '',
    nfcTagId: user.nfcTagId ?? undefined,
    dateOfBirth: user.personalInfo?.dateOfBirth?.toISOString().split('T')[0] ?? undefined,
    gender: user.personalInfo?.gender ?? undefined,
    bloodType: user.personalInfo?.bloodType ?? undefined,
    identificationNumber: user.personalInfo?.identificationNumber ?? undefined,
    identificationType: user.personalInfo?.identificationType ?? undefined,
    photoUrl: user.personalInfo?.photoUrl ?? undefined,
  };
}

// GET /api/profile
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { personalInfo: true },
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json(formatUser(user));
  } catch (error) {
    console.error('Profile GET error:', error);
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
});

// PUT /api/profile
router.put('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    bloodType,
    identificationNumber,
    identificationType,
  } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { personalInfo: true },
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const infoData: Record<string, any> = {};
    if (firstName !== undefined) infoData.firstName = firstName.trim();
    if (lastName !== undefined) infoData.lastName = lastName.trim();
    if (dateOfBirth !== undefined) infoData.dateOfBirth = new Date(dateOfBirth);
    if (gender !== undefined) infoData.gender = gender;
    if (bloodType !== undefined) infoData.bloodType = bloodType;
    if (identificationNumber !== undefined) infoData.identificationNumber = identificationNumber;
    if (identificationType !== undefined) infoData.identificationType = identificationType;

    if (user.personalInfo) {
      await prisma.personalInformation.update({
        where: { userId: req.userId },
        data: infoData,
      });
    } else {
      await prisma.personalInformation.create({
        data: {
          userId: req.userId!,
          firstName: firstName?.trim() ?? '',
          lastName: lastName?.trim() ?? '',
          ...infoData,
        },
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { personalInfo: true },
    });

    res.json(formatUser(updated));
  } catch (error) {
    console.error('Profile PUT error:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
});

export default router;
