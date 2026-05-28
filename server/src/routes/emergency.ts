import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

function bloodTypeLabel(bt?: string | null): string {
    if (!bt) return '—';
    return bt.replace('_POSITIVE', '+').replace('_NEGATIVE', '-').replace('A_', 'A').replace('B_', 'B').replace('O_', 'O').replace('AB_', 'AB');
}

function severityColor(s: string): string {
    switch (s?.toUpperCase()) {
        case 'LIFE_THREATENING': return '#EF233C';
        case 'SEVERE':           return '#FF5722';
        case 'MODERATE':         return '#FF9800';
        default:                 return '#4CAF50';
    }
}

function severityLabel(s: string): string {
    switch (s?.toUpperCase()) {
        case 'LIFE_THREATENING': return '⚠️ Riesgo vital';
        case 'SEVERE':           return 'Severa';
        case 'MODERATE':         return 'Moderada';
        default:                 return 'Leve';
    }
}

function ageFromDob(dob?: Date | null): string {
    if (!dob) return '';
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
    return `${age} años`;
}

// GET /emergency/:userId — público, sin auth, muestra ficha médica
router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                personalInfo:      true,
                medicalProfile:    true,
                allergies:         { where: { isActive: true } },
                chronicConditions: { where: { status: 'ACTIVE' } },
                medications:       { where: { isCurrent: true }, include: { medication: true } },
                emergencyContacts: { where: { isActive: true }, orderBy: { priorityOrder: 'asc' } },
                privacySettings:   true,
            },
        });

        if (!user) {
            res.status(404).send('<h1>Perfil no encontrado</h1>');
            return;
        }

        const priv = user.privacySettings;
        const p    = user.personalInfo;
        const m    = user.medicalProfile;

        const name  = priv?.showFullName !== false && p ? `${p.firstName} ${p.lastName}` : 'Paciente Horus';
        const age   = priv?.showAge !== false ? ageFromDob(p?.dateOfBirth) : '';
        const blood = priv?.showBloodType !== false ? bloodTypeLabel(p?.bloodType) : '';

        const allergies  = priv?.showAllergies !== false ? user.allergies : [];
        const meds       = priv?.showMedications !== false ? user.medications : [];
        const conditions = user.chronicConditions;
        const contacts   = priv?.showEmergencyContacts !== false ? user.emergencyContacts : [];

        const allergiesHtml = allergies.length > 0 ? `
      <div class="section">
        <div class="section-title">⚠️ ALERGIAS</div>
        ${allergies.map(a => `
          <div class="item allergy" style="border-left:4px solid ${severityColor(a.severity)}">
            <div class="item-row">
              <b>${a.allergenName}</b>
              <span class="badge" style="background:${severityColor(a.severity)}22;color:${severityColor(a.severity)}">${severityLabel(a.severity)}</span>
            </div>
            ${a.reactionDescription ? `<div class="sub">${a.reactionDescription}</div>` : ''}
          </div>`).join('')}
      </div>` : '';

        const medsHtml = meds.length > 0 ? `
      <div class="section">
        <div class="section-title">💊 MEDICAMENTOS ACTUALES</div>
        ${meds.map(med => {
            const medName = med.customMedicationName ?? med.medication?.genericName ?? '—';
            return `
          <div class="item">
            <div class="item-row"><b>${medName}</b>${med.dosage ? `<span class="badge">${med.dosage}</span>` : ''}</div>
            ${med.frequency ? `<div class="sub">${med.frequency}${med.route && med.route !== 'ORAL' ? ` · ${med.route.toLowerCase()}` : ''}</div>` : ''}
          </div>`;
        }).join('')}
      </div>` : '';

        const conditionsHtml = conditions.length > 0 ? `
      <div class="section">
        <div class="section-title">🏥 CONDICIONES CRÓNICAS</div>
        ${conditions.map(c => `
          <div class="item">
            <div class="item-row">
              <b>${c.conditionName}</b>
              ${c.severity ? `<span class="badge">${c.severity.toLowerCase()}</span>` : ''}
            </div>
            ${c.notes ? `<div class="sub">${c.notes}</div>` : ''}
          </div>`).join('')}
      </div>` : '';

        const contactsHtml = contacts.length > 0 ? `
      <div class="section">
        <div class="section-title">📞 CONTACTOS DE EMERGENCIA</div>
        ${contacts.map(c => `
          <div class="item contact">
            <div class="item-row"><b>${c.fullName}</b><span class="rel">${c.relationship}</span></div>
            <a href="tel:${c.phonePrimary}" class="phone">${c.phonePrimary}</a>
            ${c.phoneSecondary ? `<a href="tel:${c.phoneSecondary}" class="phone">${c.phoneSecondary}</a>` : ''}
          </div>`).join('')}
      </div>` : '';

        const extraItems = [
            m?.heightCm ? `📏 ${m.heightCm} cm` : null,
            m?.weightKg ? `⚖️ ${m.weightKg} kg` : null,
            m?.organDonor ? `<span class="donor">♥ Donante de órganos</span>` : null,
            m?.insuranceProvider ? `🏥 ${m.insuranceProvider}` : null,
        ].filter(Boolean);

        const extraHtml = extraItems.length > 0 ? `
      <div class="extra-row">${extraItems.map(i => `<span>${i}</span>`).join('')}</div>` : '';

        const notesHtml = m?.additionalNotes ? `
      <div class="section">
        <div class="section-title">📋 NOTAS MÉDICAS</div>
        <div class="item">${m.additionalNotes}</div>
      </div>` : '';

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ID Médico · ${name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f1a; color: #edf2f4;
      padding: 16px; max-width: 480px; margin: 0 auto;
    }
    .horus-bar {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px; padding-bottom: 16px;
      border-bottom: 1px solid #2d2f4a;
    }
    .horus-dot { width: 10px; height: 10px; border-radius: 50%; background: #ef233c; }
    .horus-label { color: #ef233c; font-size: 11px; font-weight: 700; letter-spacing: 2px; }
    .emergency-badge {
      margin-left: auto; background: rgba(239,35,60,0.15);
      border: 1px solid rgba(239,35,60,0.3); border-radius: 20px;
      padding: 4px 12px; font-size: 11px; font-weight: 700; color: #ef233c;
    }
    .card { background: #1a1b2e; border-radius: 16px; padding: 20px; margin-bottom: 12px; border: 1px solid #2d2f4a; }
    .name { font-size: 28px; font-weight: 800; color: #edf2f4; line-height: 1.2; margin-bottom: 4px; }
    .meta { font-size: 14px; color: #8d99ae; margin-bottom: 12px; }
    .blood-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(239,35,60,0.12); border: 1px solid rgba(239,35,60,0.3);
      border-radius: 20px; padding: 8px 16px;
      font-size: 20px; font-weight: 800; color: #ef233c;
    }
    .extra-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .extra-row span { background: #2d2f4a; border-radius: 8px; padding: 5px 12px; font-size: 13px; color: #8d99ae; }
    .donor { color: #4caf50 !important; }
    .section { margin-bottom: 4px; }
    .section-title { font-size: 10px; font-weight: 700; color: #8d99ae; letter-spacing: 1.5px; margin-bottom: 8px; }
    .item {
      background: #12131f; border: 1px solid #2d2f4a; border-radius: 12px;
      padding: 12px 14px; margin-bottom: 8px;
    }
    .allergy { padding-left: 10px; }
    .item-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .item-row b { font-size: 14px; color: #edf2f4; }
    .badge {
      font-size: 11px; font-weight: 700; padding: 3px 9px;
      border-radius: 6px; background: #2d2f4a; color: #8d99ae;
      white-space: nowrap;
    }
    .sub { font-size: 12px; color: #8d99ae; margin-top: 5px; line-height: 1.5; }
    .contact .item-row b { font-size: 15px; }
    .rel { font-size: 12px; color: #8d99ae; }
    .phone {
      display: block; color: #ef233c; text-decoration: none;
      font-size: 15px; font-weight: 600; margin-top: 6px;
    }
    .footer {
      text-align: center; font-size: 11px; color: #5c6480;
      margin-top: 20px; padding-top: 16px; border-top: 1px solid #2d2f4a;
      line-height: 1.8;
    }
    .call-112 {
      display: block; margin: 12px auto 0;
      background: #ef233c; color: #fff; text-decoration: none;
      font-size: 16px; font-weight: 800; padding: 12px 32px;
      border-radius: 12px; text-align: center; max-width: 200px;
    }
  </style>
</head>
<body>
  <div class="horus-bar">
    <div class="horus-dot"></div>
    <span class="horus-label">HORUS · ID MÉDICO</span>
    <span class="emergency-badge">EMERGENCIA</span>
  </div>

  <div class="card">
    <div class="name">${name}</div>
    <div class="meta">${[age, p?.gender === 'MALE' ? 'Masculino' : p?.gender === 'FEMALE' ? 'Femenino' : ''].filter(Boolean).join(' · ')}</div>
    ${blood && blood !== '—' ? `<div class="blood-pill">🩸 Tipo ${blood}</div>` : ''}
    ${extraHtml}
  </div>

  ${allergies.length || meds.length || conditions.length ? `
  <div class="card">
    ${allergiesHtml}
    ${medsHtml}
    ${conditionsHtml}
  </div>` : ''}

  ${contacts.length ? `<div class="card">${contactsHtml}</div>` : ''}
  ${m?.additionalNotes ? `<div class="card">${notesHtml}</div>` : ''}

  <a href="tel:123" class="call-112">📞 Llamar al 123</a>

  <div class="footer">
    Generado por Horus Medical ID<br>
    ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        console.error('Emergency page error:', error);
        res.status(500).send('<h1>Error al cargar el perfil</h1>');
    }
});

export default router;