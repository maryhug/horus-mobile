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

// GET /api/profile/full — para el QR médico
router.get('/full', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        personalInfo:      true,
        medicalProfile:    true,
        allergies:         { where: { isActive: true } },
        chronicConditions: true,
        medications:       { where: { isCurrent: true }, include: { medication: true } },
        emergencyContacts: { where: { isActive: true }, orderBy: { priorityOrder: 'asc' } },
        privacySettings:   true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json({
      personalInfo: user.personalInfo ? {
        firstName:            user.personalInfo.firstName,
        lastName:             user.personalInfo.lastName,
        dateOfBirth:          user.personalInfo.dateOfBirth?.toISOString().split('T')[0],
        gender:               user.personalInfo.gender,
        bloodType:            user.personalInfo.bloodType,
        identificationNumber: user.personalInfo.identificationNumber,
        photoUrl:             user.personalInfo.photoUrl,
      } : null,
      medicalProfile: user.medicalProfile ? {
        heightCm:          Number(user.medicalProfile.heightCm),
        weightKg:          Number(user.medicalProfile.weightKg),
        organDonor:        user.medicalProfile.organDonor,
        insuranceProvider: user.medicalProfile.insuranceProvider,
        additionalNotes:   user.medicalProfile.additionalNotes,
      } : null,
      allergies: user.allergies.map(a => ({
        allergenName:        a.allergenName,
        allergyType:         a.allergyType,
        severity:            a.severity,
        reactionDescription: a.reactionDescription,
      })),
      chronicConditions: user.chronicConditions.map(c => ({
        conditionName: c.conditionName,
        severity:      c.severity,
        status:        c.status,
      })),
      medications: user.medications.map(m => ({
        customMedicationName: m.customMedicationName,
        medication:           m.medication ? { genericName: m.medication.genericName } : null,
        dosage:               m.dosage,
        frequency:            m.frequency,
        route:                m.route,
      })),
      emergencyContacts: user.emergencyContacts.map(c => ({
        fullName:       c.fullName,
        relationship:   c.relationship,
        phonePrimary:   c.phonePrimary,
        phoneSecondary: c.phoneSecondary,
      })),
      privacySettings: user.privacySettings ? {
        showFullName:          user.privacySettings.showFullName,
        showAge:               user.privacySettings.showAge,
        showBloodType:         user.privacySettings.showBloodType,
        showMedications:       user.privacySettings.showMedications,
        showAllergies:         user.privacySettings.showAllergies,
        showEmergencyContacts: user.privacySettings.showEmergencyContacts,
        showMedicalHistory:    user.privacySettings.showMedicalHistory,
        showChronicConditions: user.privacySettings.showChronicConditions,
      } : null,
    });
  } catch (error) {
    console.error('Profile full GET error:', error);
    res.status(500).json({ message: 'Error al obtener el perfil completo' });
  }
});

// PUT /api/profile/privacy
router.put('/privacy', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      showBloodType,
      showAllergies,
      showMedications,
      showMedicalHistory,
      showChronicConditions,
      showEmergencyContacts
    } = req.body;

    const privacySettings = await prisma.privacySettings.upsert({
      where: { userId: req.userId },
      update: {
        ...(showBloodType !== undefined && { showBloodType }),
        ...(showAllergies !== undefined && { showAllergies }),
        ...(showMedications !== undefined && { showMedications }),
        ...(showMedicalHistory !== undefined && { showMedicalHistory }),
        ...(showChronicConditions !== undefined && { showChronicConditions }),
        ...(showEmergencyContacts !== undefined && { showEmergencyContacts })
      },
      create: {
        userId: req.userId!,
        showBloodType: showBloodType ?? true,
        showAllergies: showAllergies ?? true,
        showMedications: showMedications ?? true,
        showMedicalHistory: showMedicalHistory ?? true,
        showChronicConditions: showChronicConditions ?? true,
        showEmergencyContacts: showEmergencyContacts ?? true,
      }
    });

    res.json(privacySettings);
  } catch (error) {
    console.error('Privacy update error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Error al actualizar configuración de privacidad', detail: msg });
  }
});

// POST /api/profile/push-token
router.post('/push-token', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pushToken } = req.body;
    
    if (!pushToken) {
      res.status(400).json({ message: 'Push token es requerido' });
      return;
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { pushToken }
    });

    res.json({ message: 'Push token actualizado correctamente' });
  } catch (error) {
    console.error('Push token update error:', error);
    res.status(500).json({ message: 'Error al actualizar push token' });
  }
});

export default router;