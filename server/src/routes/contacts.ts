import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/contacts
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contacts = await prisma.emergencyContact.findMany({
      where: { userId: req.userId, isActive: true },
      orderBy: { priorityOrder: 'asc' },
    });

    res.json(
      contacts.map(c => ({
        id: c.id,
        name: c.fullName,
        relation: c.relationship,
        phone: c.phonePrimary,
        email: c.email ?? undefined,
      }))
    );
  } catch (error) {
    console.error('Contacts GET error:', error);
    res.status(500).json({ message: 'Error al obtener los contactos' });
  }
});

// POST /api/contacts
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, relation } = req.body;

  if (!name?.trim() || !phone?.trim()) {
    res.status(400).json({ message: 'Nombre y teléfono son obligatorios' });
    return;
  }

  try {
    const count = await prisma.emergencyContact.count({
      where: { userId: req.userId, isActive: true },
    });

    const contact = await prisma.emergencyContact.create({
      data: {
        userId: req.userId!,
        fullName: name.trim(),
        phonePrimary: phone.trim(),
        relationship: relation?.trim() ?? 'Contacto',
        priorityOrder: count + 1,
      },
    });

    res.status(201).json({
      id: contact.id,
      name: contact.fullName,
      relation: contact.relationship,
      phone: contact.phonePrimary,
    });
  } catch (error) {
    console.error('Contacts POST error:', error);
    res.status(500).json({ message: 'Error al crear el contacto' });
  }
});

// PATCH /api/contacts/:id
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, relation, email } = req.body;

  if (!name?.trim() || !phone?.trim()) {
    res.status(400).json({ message: 'Nombre y teléfono son obligatorios' });
    return;
  }

  try {
    const contact = await prisma.emergencyContact.update({
      where: { id: req.params.id, userId: req.userId },
      data: {
        fullName: name.trim(),
        phonePrimary: phone.trim(),
        relationship: relation?.trim() ?? 'Contacto',
        email: email?.trim() || null,
      },
    });

    res.json({
      id: contact.id,
      name: contact.fullName,
      relation: contact.relationship,
      phone: contact.phonePrimary,
      email: contact.email ?? undefined,
    });
  } catch (error) {
    console.error('Contacts PATCH error:', error);
    res.status(500).json({ message: 'Error al actualizar el contacto' });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.emergencyContact.update({
      where: { id: req.params.id, userId: req.userId },
      data: { isActive: false },
    });
    res.json({ message: 'Contacto eliminado' });
  } catch (error) {
    console.error('Contacts DELETE error:', error);
    res.status(500).json({ message: 'Error al eliminar el contacto' });
  }
});

export default router;
