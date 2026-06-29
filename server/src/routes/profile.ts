import { Router, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { db } from '../lib/firestore';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
    pushNotificationsEnabled: !!user.pushToken,
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

// POST /api/profile/push-token  — phone Expo token
router.post('/push-token', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) { res.status(400).json({ message: 'Push token es requerido' }); return; }
    await prisma.user.update({ where: { id: req.userId! }, data: { pushToken } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Push token update error:', error);
    res.status(500).json({ message: 'Error al actualizar push token' });
  }
});

// POST /api/profile/watch-token  — watch FCM token (stored in Firestore)
router.post('/watch-token', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) { res.status(400).json({ message: 'Watch token es requerido' }); return; }
    const { saveWatchToken } = await import('../services/notification');
    await saveWatchToken(req.userId!, pushToken);
    res.json({ ok: true });
  } catch (error) {
    console.error('Watch token update error:', error);
    res.status(500).json({ message: 'Error al actualizar watch token' });
  }
});

// DELETE /api/profile/watch-token  — logout: remove watch FCM token
router.delete('/watch-token', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clearWatchToken } = await import('../services/notification');
    await clearWatchToken(req.userId!);
    res.json({ ok: true });
  } catch (error) {
    console.error('Watch token clear error:', error);
    res.status(500).json({ message: 'Error al limpiar watch token' });
  }
});

// GET /api/profile/medical — allergies + conditions + medications + medicalProfile
router.get('/medical', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        medicalProfile:    true,
        allergies:         { orderBy: { createdAt: 'desc' } },
        chronicConditions: { orderBy: { createdAt: 'desc' } },
        medications:       { include: { medication: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) { res.status(404).json({ message: 'Usuario no encontrado' }); return; }
    res.json({
      medicalProfile: user.medicalProfile ? {
        heightCm:          user.medicalProfile.heightCm ? Number(user.medicalProfile.heightCm) : null,
        weightKg:          user.medicalProfile.weightKg ? Number(user.medicalProfile.weightKg) : null,
        organDonor:        user.medicalProfile.organDonor,
        insuranceProvider: user.medicalProfile.insuranceProvider,
      } : null,
      allergies: user.allergies.map(a => ({
        id: a.id, allergenName: a.allergenName, allergyType: a.allergyType,
        severity: a.severity, reactionDescription: a.reactionDescription, isActive: a.isActive,
      })),
      conditions: user.chronicConditions.map(c => ({
        id: c.id, conditionName: c.conditionName, severity: c.severity,
        status: c.status, notes: c.notes,
      })),
      medications: user.medications.map(m => ({
        id:        m.id,
        name:      m.customMedicationName ?? m.medication?.genericName ?? '',
        dosage:    m.dosage,
        frequency: m.frequency,
        isCurrent: m.isCurrent,
      })),
    });
  } catch (err) {
    console.error('[profile/medical GET]', err);
    res.status(500).json({ message: 'Error al obtener datos médicos' });
  }
});

// POST /api/profile/medications
router.post('/medications', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, dosage, frequency } = req.body;
    if (!name?.trim()) { res.status(400).json({ message: 'Nombre del medicamento requerido' }); return; }
    const m = await prisma.userMedication.create({
      data: {
        userId: req.userId!,
        customMedicationName: name.trim(),
        dosage:    dosage?.trim()    || null,
        frequency: frequency?.trim() || null,
        isCurrent: true,
      },
    });
    res.json({ id: m.id, name: m.customMedicationName ?? '', dosage: m.dosage, frequency: m.frequency, isCurrent: m.isCurrent });
  } catch (err) {
    console.error('[profile/medications POST]', err);
    res.status(500).json({ message: 'Error al agregar medicamento' });
  }
});

// PATCH /api/profile/medications/:id
router.patch('/medications/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, dosage, frequency, isCurrent } = req.body;
    const data: Record<string, any> = {};
    if (name      !== undefined) data.customMedicationName = name.trim();
    if (dosage    !== undefined) data.dosage    = dosage?.trim()    || null;
    if (frequency !== undefined) data.frequency = frequency?.trim() || null;
    if (isCurrent !== undefined) data.isCurrent = Boolean(isCurrent);
    const updated = await prisma.userMedication.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data,
    });
    if (updated.count === 0) { res.status(404).json({ message: 'Medicamento no encontrado' }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error('[profile/medications PATCH]', err);
    res.status(500).json({ message: 'Error al actualizar medicamento' });
  }
});

// DELETE /api/profile/medications/:id
router.delete('/medications/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await prisma.userMedication.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (deleted.count === 0) { res.status(404).json({ message: 'Medicamento no encontrado' }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error('[profile/medications DELETE]', err);
    res.status(500).json({ message: 'Error al eliminar medicamento' });
  }
});

// PUT /api/profile/medical
router.put('/medical', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { heightCm, weightKg, organDonor, insuranceProvider } = req.body;
    const data: Record<string, any> = {};
    if (heightCm !== undefined) {
      const h = heightCm ? parseFloat(heightCm) : null;
      if (h !== null && (isNaN(h) || h < 50 || h > 250)) {
        res.status(400).json({ message: 'La altura debe estar entre 50 y 250 cm.' }); return;
      }
      data.heightCm = h;
    }
    if (weightKg !== undefined) {
      const w = weightKg ? parseFloat(weightKg) : null;
      if (w !== null && (isNaN(w) || w < 10 || w > 500)) {
        res.status(400).json({ message: 'El peso debe estar entre 10 y 500 kg.' }); return;
      }
      data.weightKg = w;
    }
    if (organDonor       !== undefined) data.organDonor       = Boolean(organDonor);
    if (insuranceProvider !== undefined) data.insuranceProvider = insuranceProvider || null;
    await prisma.medicalProfile.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId!, ...data },
      update: data,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[profile/medical PUT]', err);
    res.status(500).json({ message: 'Error al actualizar perfil médico' });
  }
});

// POST /api/profile/allergies
router.post('/allergies', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { allergenName, allergyType, severity, reactionDescription } = req.body;
    if (!allergenName || !allergyType || !severity) {
      res.status(400).json({ message: 'Nombre, tipo y severidad son requeridos' }); return;
    }
    const a = await prisma.allergy.create({
      data: { userId: req.userId!, allergenName, allergyType, severity, reactionDescription: reactionDescription || null, isActive: true },
    });
    res.json({ id: a.id, allergenName: a.allergenName, allergyType: a.allergyType, severity: a.severity, reactionDescription: a.reactionDescription, isActive: a.isActive });
  } catch (err) {
    console.error('[profile/allergies POST]', err);
    res.status(500).json({ message: 'Error al agregar alergia' });
  }
});

// PATCH /api/profile/allergies/:id
router.patch('/allergies/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isActive, allergenName, allergyType, severity, reactionDescription } = req.body;
    const data: Record<string, any> = {};
    if (isActive          !== undefined) data.isActive          = Boolean(isActive);
    if (allergenName      !== undefined) data.allergenName      = allergenName;
    if (allergyType       !== undefined) data.allergyType       = allergyType;
    if (severity          !== undefined) data.severity          = severity;
    if (reactionDescription !== undefined) data.reactionDescription = reactionDescription || null;
    const a = await prisma.allergy.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data,
    });
    if (a.count === 0) { res.status(404).json({ message: 'Alergia no encontrada' }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error('[profile/allergies PATCH]', err);
    res.status(500).json({ message: 'Error al actualizar alergia' });
  }
});

// POST /api/profile/conditions
router.post('/conditions', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conditionName, severity, status, notes } = req.body;
    if (!conditionName) { res.status(400).json({ message: 'Nombre de condición requerido' }); return; }
    const c = await prisma.chronicCondition.create({
      data: { userId: req.userId!, conditionName, severity: severity || null, status: status || 'ACTIVE', notes: notes || null },
    });
    res.json({ id: c.id, conditionName: c.conditionName, severity: c.severity, status: c.status, notes: c.notes });
  } catch (err) {
    console.error('[profile/conditions POST]', err);
    res.status(500).json({ message: 'Error al agregar condición' });
  }
});

// PATCH /api/profile/conditions/:id
router.patch('/conditions/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, conditionName, severity, notes } = req.body;
    const data: Record<string, any> = {};
    if (status        !== undefined) data.status        = status;
    if (conditionName !== undefined) data.conditionName = conditionName;
    if (severity      !== undefined) data.severity      = severity || null;
    if (notes         !== undefined) data.notes         = notes || null;
    const c = await prisma.chronicCondition.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data,
    });
    if (c.count === 0) { res.status(404).json({ message: 'Condición no encontrada' }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error('[profile/conditions PATCH]', err);
    res.status(500).json({ message: 'Error al actualizar condición' });
  }
});

// PUT /api/profile/email
router.put('/email', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) { res.status(400).json({ message: 'Email inválido' }); return; }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.userId) { res.status(409).json({ message: 'Este correo ya está registrado' }); return; }
    await prisma.user.update({ where: { id: req.userId }, data: { email } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[profile/email PUT]', err);
    res.status(500).json({ message: 'Error al actualizar correo' });
  }
});

// GET /api/profile/preferences
router.get('/preferences', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await db.collection('user_preferences').doc(req.userId!).get();
    res.json(doc.exists ? doc.data() : {});
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener preferencias' });
  }
});

// PUT /api/profile/preferences
router.put('/preferences', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { language, voiceId, assistantId } = req.body;
    const prefs: Record<string, string> = {};
    if (language)    prefs.language    = language;
    if (voiceId)     prefs.voiceId     = voiceId;
    if (assistantId) prefs.assistantId = assistantId;
    await db.collection('user_preferences').doc(req.userId!).set(prefs, { merge: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Error al guardar preferencias' });
  }
});

// POST /api/profile/photo
router.post('/photo', requireAuth, upload.single('photo'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'No se recibió ninguna imagen' });
    return;
  }
  try {
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:         `profile-photos/${req.userId}`,
          public_id:      'avatar',
          overwrite:      true,
          resource_type:  'image',
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        },
        (err, result) => { if (err) reject(err); else resolve(result); }
      );
      stream.end(req.file!.buffer);
    });

    const photoUrl = result.secure_url;

    await prisma.personalInformation.update({
      where: { userId: req.userId },
      data:  { photoUrl },
    });

    res.json({ photoUrl });
  } catch (err) {
    console.error('[profile/photo]', err);
    res.status(500).json({ message: 'Error al subir la foto de perfil' });
  }
});

export default router;